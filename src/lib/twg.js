/**
 * ShipSense — Teamwork Graph integration.
 *
 * Pulls the viewer's active goals/initiatives from Atlassian's Teamwork Graph so the release
 * verdict is framed against the organisation's goals — "what this release is for". Uses the
 * Forge-wrapped TWG GraphQL API (api.asUser().requestTeamworkGraph), which sets the site
 * query-context header automatically. Operation names must match [company>=3]_[operation>=4].
 *
 * Fail-safe: any error, or a missing read:graph:* scope (TWG returns HTTP 200 with empty data),
 * yields { available:false, goals:[] } so ShipSense still produces a verdict from Jira alone.
 */

import api from '@forge/api';

const OPERATION = 'shipsense_goals';

/**
 * @param {{accountId?: string}} args  the viewing user's Atlassian accountId (from Forge context)
 * @returns {Promise<{available:boolean, goals:Array<{name:string,key?:string,url?:string,dueDate?:string}>, error?:string}>}
 */
export async function getTeamworkGraphGoals({ accountId }) {
  if (!accountId) return { available: false, goals: [] };
  try {
    const userId = `ari:cloud:identity::user/${accountId}`;
    const query = `query ${OPERATION}($userId: ID!, $first: Int) {
      atlassianUserGoalsAndProjects(userId: $userId, first: $first) {
        edges { node { ... on AtlassianGoal { name key url dueDateEndedAt archived } } }
      }
    }`;
    const res = await api.asUser().requestTeamworkGraph(query, { userId, first: 10 }, OPERATION);
    const body = await res.json();
    if (body?.errors?.length) return { available: false, goals: [], error: body.errors[0]?.message };
    const edges = body?.data?.atlassianUserGoalsAndProjects?.edges ?? [];
    const goals = edges
      .map((e) => e?.node)
      .filter((n) => n && n.name && !n.archived)
      .map((n) => ({
        name: n.name,
        key: n.key,
        url: n.url ?? undefined,
        dueDate: n.dueDateEndedAt ? String(n.dueDateEndedAt).slice(0, 10) : undefined,
      }));
    return { available: true, goals };
  } catch (e) {
    return { available: false, goals: [], error: String(e?.message ?? e) };
  }
}
