/**
 * ShipSense — sample releases for the local demo and tests (no Atlassian account needed).
 * Three scenarios: a No-Go, a Caution, and a clean Go.
 */

import { StatusCategory } from '../core/model.js';

const BASE = 'https://acme.atlassian.net';

function issue(key, summary, type, statusCategory, opts = {}) {
  return {
    key, summary, type, statusCategory,
    resolved: opts.resolved ?? false,
    priority: opts.priority ?? 'medium',
    flaggedBlocker: opts.flaggedBlocker ?? false,
    assignee: opts.assignee === undefined ? 'Sam Rivera' : opts.assignee,
    url: `${BASE}/browse/${key}`,
  };
}
function dep(key, summary, team, statusCategory, opts = {}) {
  return { key, summary, team, statusCategory, resolved: opts.resolved ?? false, url: `${BASE}/browse/${key}` };
}

/** @type {Record<string, import('../core/model.js').ReleaseContext>} */
export const scenarios = {
  'checkout-v3.2': {
    versionId: 'checkout-v3.2',
    name: 'Checkout v3.2',
    projectKey: 'CHK',
    dueDate: '2026-11-03',
    dataSources: { jira: true, teamworkGraph: true, incidents: true },
    issues: [
      issue('CHK-201', 'Guest checkout flow', 'story', StatusCategory.DONE, { resolved: true }),
      issue('CHK-202', 'Apple Pay button misaligned on iOS', 'bug', StatusCategory.INPROGRESS, { priority: 'high' }),
      issue('CHK-203', 'Add promo-code field', 'task', StatusCategory.TODO, { priority: 'medium' }),
      issue('CHK-204', 'Copy review for error states', 'task', StatusCategory.INPROGRESS, { priority: 'low' }),
    ],
    dependencies: [
      dep('PAY-55', 'New card tokenization API', 'Payments', StatusCategory.INPROGRESS),
    ],
    incidents: [],
  },

  'reports-v1.4': {
    versionId: 'reports-v1.4',
    name: 'Reports v1.4',
    projectKey: 'RPT',
    dueDate: '2026-12-01',
    dataSources: { jira: true, teamworkGraph: true, incidents: true },
    issues: [
      issue('RPT-11', 'CSV export', 'story', StatusCategory.DONE, { resolved: true }),
      issue('RPT-12', 'Timezone off by one in weekly view', 'bug', StatusCategory.TODO, { priority: 'low' }),
      issue('RPT-14', 'Chart legend overlaps on mobile', 'bug', StatusCategory.INPROGRESS, { priority: 'medium' }),
      issue('RPT-13', 'Empty-state illustration', 'task', StatusCategory.INPROGRESS, { priority: 'low' }),
      issue('RPT-15', 'Saved-view sharing', 'story', StatusCategory.TODO, { priority: 'medium' }),
      issue('RPT-16', 'Add CSV column picker', 'task', StatusCategory.TODO, { priority: 'low' }),
    ],
    dependencies: [
      dep('DATA-9', 'Nightly aggregation job', 'Data Platform', StatusCategory.DONE, { resolved: true }),
    ],
    incidents: [],
  },

  'search-v2.1': {
    versionId: 'search-v2.1',
    name: 'Search v2.1',
    projectKey: 'SRCH',
    dueDate: '2026-11-20',
    dataSources: { jira: true, teamworkGraph: true, incidents: true },
    issues: [
      issue('SRCH-30', 'Typo-tolerant matching', 'story', StatusCategory.DONE, { resolved: true }),
      issue('SRCH-31', 'Relevance tuning', 'task', StatusCategory.DONE, { resolved: true }),
      issue('SRCH-32', 'Search analytics dashboard', 'story', StatusCategory.DONE, { resolved: true }),
    ],
    dependencies: [
      dep('INFRA-7', 'Search cluster scale-up', 'Infrastructure', StatusCategory.DONE, { resolved: true }),
    ],
    incidents: [],
  },
};

/** @type {import('./provider.js').ContextProvider} */
export const mockProvider = {
  async getRelease(versionId) {
    return scenarios[versionId] ?? scenarios['checkout-v3.2'];
  },
  async listReleases() {
    return Object.values(scenarios).map((s) => ({ versionId: s.versionId, name: s.name }));
  },
};
