/**
 * ShipSense — local demo. Runs the readiness engine against three sample releases and prints
 * a report for each. No Atlassian account needed:  `node src/demo.js`
 */

import { assessReadiness } from './core/scoring.js';
import { scenarios } from './context/mock-provider.js';

const ICON = { GO: '[GO] ', CAUTION: '[~~] ', NO_GO: '[STOP]' };
const LABEL = { GO: 'GO', CAUTION: 'CAUTION', NO_GO: 'NO-GO' };

function printReport(result) {
  const line = '-'.repeat(64);
  console.log(line);
  console.log(`${ICON[result.verdict]}  ${LABEL[result.verdict].padEnd(8)} ${result.release.name}  (${result.release.projectKey})`);
  console.log(`         readiness ${result.score}/100 - confidence ${result.confidence}`);
  console.log(line);
  console.log(result.rationale);
  console.log('');
  console.log('Signals:');
  if (!result.signals.length) console.log('  (none - all clear)');
  for (const s of result.signals) {
    console.log(`  [${s.severity.toUpperCase().padEnd(5)}] ${s.label}  (-${s.impact})`);
    for (const it of s.items.slice(0, 4)) {
      console.log(`           - ${it.key}  ${it.summary ?? ''}`);
    }
  }
  console.log('');
}

const now = '2026-11-05T12:00:00Z';
for (const ctx of Object.values(scenarios)) {
  printReport(assessReadiness(ctx, { now }));
}
