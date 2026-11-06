/**
 * ShipSense — Rovo action handlers.
 *
 * Plain exported functions with signature (payload, context). Each assembles the release context
 * from Jira + Teamwork Graph and runs the shared readiness engine. Inputs are LLM-supplied — never
 * trust them for authorization; the viewing user comes from context.accountId.
 */

import { assembleReleaseContext } from './lib/context.js';
import { assessReadiness } from './core/scoring.js';

function contextFor(payload, context) {
  return assembleReleaseContext({
    projectKey: payload?.projectKey,
    versionName: payload?.versionName,
    accountId: context?.accountId ?? payload?.context?.accountId,
  });
}

export async function scoreReadiness(payload, context) {
  const ctx = await contextFor(payload, context);
  const r = assessReadiness(ctx);
  return {
    release: r.release.name,
    verdict: r.verdict,
    score: r.score,
    confidence: r.confidence,
    summary: r.rationale,
    topSignals: r.signals.slice(0, 6).map((s) => ({
      severity: s.severity,
      label: s.label,
      issues: s.items.map((i) => i.key),
    })),
    initiatives: (r.goals ?? []).slice(0, 5).map((g) => g.name),
  };
}

export async function listVersionBlockers(payload, context) {
  const ctx = await contextFor(payload, context);
  const r = assessReadiness(ctx);
  const blocking = r.signals.filter((s) => s.severity !== 'info');
  return {
    release: r.release.name,
    verdict: r.verdict,
    blockers: blocking.flatMap((s) =>
      s.items.map((i) => ({ key: i.key, summary: i.summary, reason: s.label }))),
    note: blocking.length ? undefined : 'No blockers, bugs, or incomplete work remain.',
  };
}

export async function getCrossTeamDeps(payload, context) {
  const ctx = await contextFor(payload, context);
  return {
    release: ctx.name,
    teamworkGraphUsed: ctx.dataSources?.teamworkGraph ?? false,
    dependencies: (ctx.dependencies ?? []).map((d) => ({
      key: d.key,
      summary: d.summary,
      team: d.team,
      done: d.resolved,
    })),
    initiatives: (ctx.goals ?? []).map((g) => ({ name: g.name, dueDate: g.dueDate })),
  };
}
