/**
 * ShipSense — context provider contract + Jira normalizers.
 *
 * The scoring engine depends only on the ReleaseContext shape (see model.js), not on Jira or
 * Forge. A ContextProvider is anything that can produce a ReleaseContext for a given release.
 * The Forge build supplies a provider backed by requestJira + Teamwork Graph; tests and the
 * local demo supply a mock provider.
 *
 * @typedef {Object} ContextProvider
 * @property {(versionId: string) => Promise<import('../core/model.js').ReleaseContext>} getRelease
 * @property {(projectKey: string) => Promise<{versionId:string,name:string}[]>} [listReleases]
 */

import { StatusCategory } from '../core/model.js';

/** Map a Jira Cloud REST v3 statusCategory key to our StatusCategory. */
export function toStatusCategory(jiraStatusCategoryKey) {
  switch (jiraStatusCategoryKey) {
    case 'done': return StatusCategory.DONE;
    case 'indeterminate': return StatusCategory.INPROGRESS;
    case 'new':
    default: return StatusCategory.TODO;
  }
}

/**
 * Normalize a Jira Cloud REST v3 issue object into our Issue shape.
 * Field paths follow the standard /rest/api/3/search response.
 * @param {object} issue
 * @param {{browseBase?: string, flaggedFieldId?: string}} [opts]
 * @returns {import('../core/model.js').Issue}
 */
export function normalizeJiraIssue(issue, opts = {}) {
  const f = issue.fields ?? {};
  const priorityName = (f.priority?.name ?? '').toLowerCase().replace(/\s+/g, '');
  const priorityMap = { highest: 'highest', high: 'high', medium: 'medium', low: 'low', lowest: 'lowest' };
  return {
    key: issue.key,
    summary: f.summary ?? '',
    type: (f.issuetype?.name ?? '').toLowerCase(),
    statusCategory: toStatusCategory(f.status?.statusCategory?.key),
    resolved: Boolean(f.resolution),
    priority: priorityMap[priorityName] ?? 'medium',
    flaggedBlocker: detectFlagged(f, opts.flaggedFieldId),
    assignee: f.assignee?.displayName ?? null,
    url: opts.browseBase ? `${opts.browseBase}/browse/${issue.key}` : undefined,
  };
}

/**
 * Jira's "Flagged" marker is a custom field whose id varies per site. If the Forge provider
 * knows the id it passes it in; otherwise we defensively scan custom fields for a Flagged /
 * Impediment value.
 */
function detectFlagged(fields, flaggedFieldId) {
  if (flaggedFieldId && Array.isArray(fields[flaggedFieldId])) {
    return fields[flaggedFieldId].length > 0;
  }
  for (const [k, v] of Object.entries(fields)) {
    if (!k.startsWith('customfield_') || !Array.isArray(v)) continue;
    if (v.some((o) => ['impediment', 'flagged'].includes((o?.value ?? '').toLowerCase()))) return true;
  }
  return false;
}
