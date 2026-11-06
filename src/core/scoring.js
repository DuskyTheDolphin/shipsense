/**
 * ShipSense — release-readiness engine.
 *
 * Deterministic, explainable scoring. Takes a ReleaseContext (see model.js) and returns a
 * ReadinessResult: a Go / Caution / No-Go verdict, a 0..100 score, the signals that drove it
 * (each with its source items), and a plain-English rationale the Rovo agent can surface and
 * elaborate on. No LLM is required for the verdict itself — that keeps the call reproducible
 * and auditable; the agent adds the conversation on top.
 */

import { Verdict, Severity, StatusCategory, Priority } from './model.js';

/** Point penalties. Tunable in one place so the scoring stays transparent. */
export const WEIGHTS = Object.freeze({
  flaggedBlocker: 40,
  criticalBug: 15,
  normalBug: 6,
  openScopeIssue: 4,
  openScopeCap: 24,
  incompleteDependency: 25,
  incidentSev12: 50,
  incidentSev3: 12,
  pastDue: 10,
  unassignedCritical: 3,
});

const SEV_ORDER = { block: 0, warn: 1, info: 2 };

const rank = (p) => Priority[p] ?? Priority.medium;
const isOpen = (x) => !x.resolved && x.statusCategory !== StatusCategory.DONE;
const plural = (n) => (n === 1 ? '' : 's');

/**
 * Assess release readiness.
 * @param {import('./model.js').ReleaseContext} ctx
 * @param {{now?: string|number|Date}} [opts]
 * @returns {import('./model.js').ReadinessResult}
 */
export function assessReadiness(ctx, opts = {}) {
  const now = opts.now ? new Date(opts.now) : new Date();
  const issues = ctx.issues ?? [];
  const deps = ctx.dependencies ?? [];
  const incidents = ctx.incidents ?? [];

  /** @type {import('./model.js').Signal[]} */
  const signals = [];
  const hardStops = [];

  // 1 — Explicitly flagged blockers.
  const blockers = issues.filter((i) => i.flaggedBlocker && isOpen(i));
  if (blockers.length) {
    hardStops.push('flaggedBlocker');
    signals.push(signal('flagged-blockers', `${blockers.length} unresolved blocker${plural(blockers.length)}`,
      Severity.BLOCK, WEIGHTS.flaggedBlocker * blockers.length, 'Explicitly flagged as blocking the release.', blockers));
  }

  // 2 — Open bugs, split by priority.
  const openBugs = issues.filter((i) => i.type === 'bug' && isOpen(i));
  const criticalBugs = openBugs.filter((i) => rank(i.priority) >= Priority.high);
  const normalBugs = openBugs.filter((i) => rank(i.priority) < Priority.high);
  if (criticalBugs.length) {
    signals.push(signal('critical-bugs', `${criticalBugs.length} high-priority bug${plural(criticalBugs.length)} open`,
      Severity.BLOCK, WEIGHTS.criticalBug * criticalBugs.length, 'High/Highest priority bugs are still unresolved.', criticalBugs));
  }
  if (normalBugs.length) {
    signals.push(signal('open-bugs', `${normalBugs.length} other bug${plural(normalBugs.length)} open`,
      Severity.WARN, WEIGHTS.normalBug * normalBugs.length, 'Lower-priority bugs are still unresolved.', normalBugs));
  }

  // 3 — Incomplete scope (non-bug, non-blocker issues that aren't Done).
  const openScope = issues.filter((i) => i.type !== 'bug' && !i.flaggedBlocker && isOpen(i));
  if (openScope.length) {
    const impact = Math.min(WEIGHTS.openScopeIssue * openScope.length, WEIGHTS.openScopeCap);
    signals.push(signal('open-scope', `${openScope.length} issue${plural(openScope.length)} still open in this release`,
      Severity.WARN, impact, 'Planned work is not yet marked Done.', openScope));
  }

  // 4 — Incomplete cross-team dependencies (Teamwork Graph). The differentiator.
  const openDeps = deps.filter(isOpen);
  if (openDeps.length) {
    hardStops.push('incompleteDependency');
    const teams = [...new Set(openDeps.map((d) => d.team).filter(Boolean))];
    signals.push(signal('cross-team-deps',
      `${openDeps.length} cross-team dependenc${openDeps.length === 1 ? 'y' : 'ies'} incomplete${teams.length ? ` (${teams.join(', ')})` : ''}`,
      Severity.BLOCK, WEIGHTS.incompleteDependency * openDeps.length,
      'Work owned by another team that this release depends on is not Done.', openDeps));
  }

  // 5 — Open linked incidents.
  const openIncidents = incidents.filter((x) => {
    const s = (x.status ?? 'open').toLowerCase();
    return s !== 'resolved' && s !== 'closed' && s !== 'done';
  });
  const sev12 = openIncidents.filter((x) => x.severity === 'sev1' || x.severity === 'sev2');
  const sev3 = openIncidents.filter((x) => !(x.severity === 'sev1' || x.severity === 'sev2'));
  if (sev12.length) {
    hardStops.push('incidentSev12');
    signals.push(signal('critical-incidents', `${sev12.length} open Sev1/Sev2 incident${plural(sev12.length)}`,
      Severity.BLOCK, WEIGHTS.incidentSev12 * sev12.length, 'Active high-severity incidents are linked to this work.', sev12));
  }
  if (sev3.length) {
    signals.push(signal('incidents', `${sev3.length} open incident${plural(sev3.length)}`,
      Severity.WARN, WEIGHTS.incidentSev3 * sev3.length, 'Active incidents are linked to this work.', sev3));
  }

  // 6 — Past due with open work.
  const anyOpen = issues.some(isOpen) || openDeps.length > 0;
  if (ctx.dueDate && anyOpen && new Date(ctx.dueDate) < now) {
    signals.push(signal('past-due', `Past its due date (${ctx.dueDate}) with open work`,
      Severity.WARN, WEIGHTS.pastDue, 'The scheduled date has passed but work remains.', []));
  }

  // 7 — Critical in-progress work with no owner.
  const unowned = issues.filter((i) => i.statusCategory === StatusCategory.INPROGRESS && rank(i.priority) >= Priority.high && !i.assignee);
  if (unowned.length) {
    signals.push(signal('unassigned-critical', `${unowned.length} high-priority issue${plural(unowned.length)} in progress with no assignee`,
      Severity.INFO, WEIGHTS.unassignedCritical * unowned.length, 'Nobody is on the hook for critical in-flight work.', unowned));
  }

  const penalty = signals.reduce((sum, s) => sum + s.impact, 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const verdict = decideVerdict(score, hardStops.length > 0);
  const confidence = decideConfidence(ctx.dataSources);
  signals.sort((a, b) => (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || (b.impact - a.impact));
  const { headline, rationale } = narrate(verdict, score, signals, ctx);

  return {
    verdict, score, confidence, signals, headline, rationale, hardStops,
    goals: ctx.goals ?? [],
    twgError: ctx.twgError ?? null,
    dataSources: ctx.dataSources ?? {},
    release: { versionId: ctx.versionId, name: ctx.name, projectKey: ctx.projectKey },
    generatedAt: now.toISOString(),
  };
}

function signal(id, label, severity, impact, detail, items) {
  return {
    id, label, severity, impact: Math.round(impact), detail,
    count: items.length,
    items: items.map((x) => ({ key: x.key, summary: x.summary, url: x.url })),
  };
}

function decideVerdict(score, hasHardStop) {
  if (hasHardStop) return Verdict.NO_GO;
  if (score >= 80) return Verdict.GO;
  if (score >= 55) return Verdict.CAUTION;
  return Verdict.NO_GO;
}

function decideConfidence(ds) {
  if (!ds) return 'medium';
  if (ds.jira === false) return 'low';
  if (ds.teamworkGraph === false) return 'medium';
  return 'high';
}

function narrate(verdict, score, signals, ctx) {
  const name = ctx.name ?? 'this release';
  const blocks = signals.filter((s) => s.severity === Severity.BLOCK);
  const warns = signals.filter((s) => s.severity === Severity.WARN);
  const label = verdict === Verdict.GO ? 'Go' : verdict === Verdict.CAUTION ? 'Caution' : 'No-Go';
  const top = blocks[0] ?? warns[0] ?? null;
  const headline = verdict === Verdict.GO ? `Go — ${name} looks ready` : `${label} — ${top ? top.label : 'review needed'}`;

  const parts = [`${label} on ${name} (readiness ${score}/100).`];
  if (blocks.length) parts.push(`Ship-stoppers: ${blocks.map((s) => s.label).join('; ')}.`);
  if (warns.length) parts.push(`${blocks.length ? 'Also' : 'Worth a look'}: ${warns.map((s) => s.label).join('; ')}.`);
  if (verdict === Verdict.GO) parts.push('No blockers, high-priority bugs, incidents, or incomplete cross-team dependencies are outstanding.');
  if ((ctx.dataSources ?? {}).crossTeam === false) {
    parts.push('Heads up: cross-team dependencies could not be checked, so cross-team risk is unknown.');
  }
  return { headline, rationale: parts.join(' ') };
}
