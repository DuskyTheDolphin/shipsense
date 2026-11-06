/**
 * ShipSense — assembles a ReleaseContext (the input to the scoring engine) from live Jira data,
 * enriched with Teamwork Graph.
 *
 * Cross-team dependencies come from Jira "is blocked by" links to issues in OTHER projects
 * (a reliable baseline that works on any site). Teamwork Graph adds the organisation's active
 * goals/initiatives, so the release verdict is framed against what the work is for.
 */

import { resolveVersion, searchVersionIssuesRaw } from './jira.js';
import { normalizeJiraIssue, toStatusCategory } from '../context/provider.js';
import { getTeamworkGraphGoals } from './twg.js';
import { StatusCategory } from '../core/model.js';

/** @returns {Promise<import('../core/model.js').ReleaseContext>} */
export async function assembleReleaseContext({ projectKey, versionName, accountId }) {
  const version = await resolveVersion(projectKey, versionName);
  if (!version) {
    return {
      versionId: null, name: versionName ?? 'Unknown release', projectKey,
      dueDate: null, issues: [], dependencies: [], incidents: [], goals: [],
      dataSources: { jira: false, teamworkGraph: false, crossTeam: false, incidents: false },
    };
  }

  const raw = await searchVersionIssuesRaw(projectKey, version.id);
  const browseBase = raw[0]?.self ? safeOrigin(raw[0].self) : undefined;
  const issues = raw.map((r) => normalizeJiraIssue(r, { browseBase }));
  const dependencies = extractLinkDeps(raw, projectKey, browseBase);

  // Teamwork Graph: the org's active goals/initiatives this release ultimately serves.
  const tg = await getTeamworkGraphGoals({ accountId });

  return {
    versionId: version.id,
    name: version.name,
    projectKey,
    dueDate: version.releaseDate ?? null,
    issues,
    dependencies,
    incidents: [],
    goals: tg.goals,
    twgError: tg.available ? null : (tg.error ?? (accountId ? 'TWG returned no data' : 'no accountId in Forge context')),
    dataSources: { jira: true, teamworkGraph: tg.available === true, crossTeam: true, incidents: false },
  };
}

function safeOrigin(url) {
  try { return new URL(url).origin; } catch { return undefined; }
}

/** Derive cross-team dependencies from "is blocked by" links to issues in other projects. */
function extractLinkDeps(rawIssues, projectKey, browseBase) {
  const deps = [];
  const seen = new Set();
  for (const issue of rawIssues) {
    for (const link of issue.fields?.issuelinks ?? []) {
      const blocker = link.inwardIssue;
      const rel = (link.type?.inward ?? '').toLowerCase();
      if (!blocker || !/blocked by|depends on/.test(rel)) continue;
      const depKey = blocker.key;
      const depProject = depKey.split('-')[0];
      if (depProject === projectKey || seen.has(depKey)) continue;
      seen.add(depKey);
      const sc = toStatusCategory(blocker.fields?.status?.statusCategory?.key);
      deps.push({
        key: depKey,
        summary: blocker.fields?.summary ?? '',
        team: depProject,
        statusCategory: sc,
        resolved: sc === StatusCategory.DONE,
        url: browseBase ? `${browseBase}/browse/${depKey}` : undefined,
      });
    }
  }
  return deps;
}
