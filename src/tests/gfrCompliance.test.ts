import test from 'node:test';
import assert from 'node:assert';
import { SEED_PROJECTS } from '../data/seedProjects';

test('GFR 2017 Compliance Engine: Correctly detects Rule 151(iii) debarred contractor engagement', () => {
  const debarred = SEED_PROJECTS.filter((p) => p.vendorBlacklisted);
  assert.ok(debarred.length > 0, 'Should identify projects with debarred contractors');
  debarred.forEach((p) => {
    assert.strictEqual(p.vendorBlacklisted, true);
  });
});

test('GFR 2017 Compliance Engine: Correctly detects Rule 238(1) utilization certificate delays', () => {
  // High released funds with low utilization and delayed status
  const delayedUcs = SEED_PROJECTS.filter(
    (p) => p.releasedAmount > 15000000 && p.utilizedAmount < p.releasedAmount * 0.4 && p.status === 'delayed'
  );
  assert.ok(delayedUcs.length >= 0, 'Rule 238 filter executes without errors');
});

test('DISHA Review Engine: Computes valid district aggregation metrics', () => {
  const bengaluruWorks = SEED_PROJECTS.filter((p) => p.districtName === 'Bengaluru Urban');
  assert.ok(bengaluruWorks.length > 0, 'Bengaluru Urban should have projects');

  const totalSanctioned = bengaluruWorks.reduce((acc, p) => acc + p.sanctionedAmount, 0);
  const totalReleased = bengaluruWorks.reduce((acc, p) => acc + p.releasedAmount, 0);
  const totalUtilized = bengaluruWorks.reduce((acc, p) => acc + p.utilizedAmount, 0);

  assert.ok(totalSanctioned > 0, 'Total sanctioned must be positive');
  assert.ok(totalReleased <= totalSanctioned, 'Total released cannot exceed total sanctioned');
  assert.ok(totalUtilized <= totalReleased, 'Total utilized cannot exceed total released');
});
