/**
 * ShipSense — Jira data access via @forge/api.
 *
 * Uses the enhanced JQL search endpoint (/rest/api/3/search/jql) — the classic /search was
 * removed in 2025. Returns raw issues so context.js can both normalize them and mine their
 * issue links for cross-team dependencies.
 */

import api, { route } from '@forge/api';
import { normalizeJiraIssue } from '../context/provider.js';

const ISSUE_FIELDS = 'summary,status,priority,issuetype,resolution,assignee,issuelinks';

async function jiraGet(pathOrRoute) {
  const res = await api.asApp().requestJira(pathOrRoute, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Jira ${res.status}: ${await res.text()}`);
  return res.json();
}

/** All versions (releases) for a project. */
export async function getProjectVersions(projectKey) {
  return jiraGet(route`/rest/api/3/project/${projectKey}/versions`);
}

/** Resolve a version by name, or fall back to the latest unreleased one. */
export async function resolveVersion(projectKey, versionName) {
  const versions = await getProjectVersions(projectKey);
  if (!Array.isArray(versions) || versions.length === 0) return null;
  if (versionName) {
    const match = versions.find((v) => (v.name ?? '').toLowerCase() === versionName.toLowerCase());
    if (match) return match;
  }
  const open = versions.filter((v) => !v.released && !v.archived);
  return open[open.length - 1] ?? versions[versions.length - 1];
}

/** All issues assigned to a version (fixVersion), paginated via nextPageToken. */
export async function searchVersionIssuesRaw(projectKey, versionId) {
  const jql = `project = "${projectKey}" AND fixVersion = ${versionId} ORDER BY priority DESC`;
  const out = [];
  let nextPageToken;
  do {
    // Forge requires requestJira paths to be built with the `route` tagged template; it
    // encodes each interpolated value, so pass raw values (not a pre-encoded query string).
    const path = nextPageToken
      ? route`/rest/api/3/search/jql?jql=${jql}&fields=${ISSUE_FIELDS}&maxResults=100&nextPageToken=${nextPageToken}`
      : route`/rest/api/3/search/jql?jql=${jql}&fields=${ISSUE_FIELDS}&maxResults=100`;
    const page = await jiraGet(path);
    out.push(...(page.issues ?? []));
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);
  return out;
}

export { normalizeJiraIssue };
