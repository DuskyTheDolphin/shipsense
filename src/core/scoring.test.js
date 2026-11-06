import test from 'node:test';
import assert from 'node:assert/strict';
import { assessReadiness } from './scoring.js';
import { Verdict, StatusCategory } from './model.js';

const NOW = '2026-11-05T12:00:00Z';

function ctx(partial) {
  return {
    versionId: 'v', name: 'Test', projectKey: 'T',
    dueDate: null, issues: [], dependencies: [], incidents: [],
    dataSources: { jira: true, teamworkGraph: true, incidents: true },
    ...partial,
  };
}

const iss = (o) => ({
  key: 'X-1', summary: 's', type: 'task', statusCategory: StatusCategory.DONE,
  resolved: true, priority: 'medium', flaggedBlocker: false, assignee: 'A', ...o,
});

test('all done → GO at 100', () => {
  const r = assessReadiness(ctx({ issues: [iss({}), iss({ key: 'X-2' })] }), { now: NOW });
  assert.equal(r.verdict, Verdict.GO);
  assert.equal(r.score, 100);
});

test('incomplete cross-team dependency → NO_GO (hard stop)', () => {
  const r = assessReadiness(ctx({
    issues: [iss({})],
    dependencies: [{ key: 'PAY-1', summary: 'API', team: 'Payments', statusCategory: StatusCategory.INPROGRESS, resolved: false }],
  }), { now: NOW });
  assert.equal(r.verdict, Verdict.NO_GO);
  assert.ok(r.hardStops.includes('incompleteDependency'));
});

test('flagged blocker → NO_GO', () => {
  const r = assessReadiness(ctx({
    issues: [iss({ key: 'B-1', statusCategory: StatusCategory.INPROGRESS, resolved: false, flaggedBlocker: true })],
  }), { now: NOW });
  assert.equal(r.verdict, Verdict.NO_GO);
});

test('a few low/medium bugs + open scope → CAUTION, no hard stop', () => {
  const r = assessReadiness(ctx({
    issues: [
      iss({ key: 'C-1', type: 'bug', statusCategory: StatusCategory.TODO, resolved: false, priority: 'low' }),
      iss({ key: 'C-2', type: 'bug', statusCategory: StatusCategory.INPROGRESS, resolved: false, priority: 'medium' }),
      iss({ key: 'C-3', statusCategory: StatusCategory.TODO, resolved: false }),
      iss({ key: 'C-4', statusCategory: StatusCategory.TODO, resolved: false }),
      iss({ key: 'C-5', statusCategory: StatusCategory.INPROGRESS, resolved: false }),
    ],
  }), { now: NOW });
  assert.equal(r.hardStops.length, 0);
  assert.equal(r.verdict, Verdict.CAUTION);
});

test('score stays within 0..100 under heavy load', () => {
  const many = Array.from({ length: 30 }, (_, i) => iss({ key: `M-${i}`, type: 'bug', statusCategory: StatusCategory.TODO, resolved: false, priority: 'high' }));
  const r = assessReadiness(ctx({ issues: many }), { now: NOW });
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.equal(r.verdict, Verdict.NO_GO);
});

test('missing Teamwork Graph lowers confidence to medium', () => {
  const r = assessReadiness(ctx({ issues: [iss({})], dataSources: { jira: true, teamworkGraph: false } }), { now: NOW });
  assert.equal(r.confidence, 'medium');
});
