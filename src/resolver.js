/**
 * ShipSense — @forge/resolver backend for the Jira project-page UI Kit panel.
 * The frontend (src/frontend/index.jsx) calls these via invoke().
 */

import Resolver from '@forge/resolver';
import { assembleReleaseContext } from './lib/context.js';
import { assessReadiness } from './core/scoring.js';
import { getProjectVersions } from './lib/jira.js';

const resolver = new Resolver();

// Resolve the project the panel is on. Prefer whatever the frontend passed, but fall back to
// the resolver's own context (the reliable source for a jira:projectPage). Works with a key
// or a numeric id — the Jira versions/search endpoints accept either.
function projectRef(payload, context) {
  const p = context?.extension?.project ?? {};
  return payload?.projectKey || payload?.projectId || p.key || p.id;
}

resolver.define('listReleases', async ({ payload, context }) => {
  const idOrKey = projectRef(payload, context);
  console.log('ShipSense.listReleases', JSON.stringify({ payload, ext: context?.extension, idOrKey }));
  const versions = await getProjectVersions(idOrKey);
  return (Array.isArray(versions) ? versions : [])
    .filter((v) => !v.archived)
    .map((v) => ({ id: v.id, name: v.name, released: Boolean(v.released) }));
});

resolver.define('getReadiness', async ({ payload, context }) => {
  const idOrKey = projectRef(payload, context);
  const ctx = await assembleReleaseContext({ projectKey: idOrKey, versionName: payload?.versionName, accountId: context?.accountId });
  return assessReadiness(ctx);
});

export const handler = resolver.getDefinitions();
