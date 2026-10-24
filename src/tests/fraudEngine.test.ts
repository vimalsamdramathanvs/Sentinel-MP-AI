import test from 'node:test';
import assert from 'node:assert/strict';
import { runBenfordsLawAnalysis, findNearDuplicates, computeVendorConcentration } from '../data/fraudEngine.js';

test('Fraud Engine: Benfords law correctly analyzes first-digit frequencies', () => {
  const sampleAmounts = [
    1200000, 1450000, 1900000, 2100000, 2800000, 3100000, 4200000, 5600000, 8900000
  ];
  const result = runBenfordsLawAnalysis(sampleAmounts);

  assert.equal(result.distribution.length, 9);
  assert.ok(result.distribution[0].actualCount >= 2);
  assert.equal(typeof result.chiSquareStatistic, 'number');
  assert.equal(typeof result.isConformant, 'boolean');
});

test('Fraud Engine: Near duplicate detector flags co-located identical titles', () => {
  const duplicates = findNearDuplicates();
  assert.ok(Array.isArray(duplicates));
  assert.ok(duplicates.length > 0, 'Should find at least 1 near duplicate pair in seed data');
  assert.ok(duplicates[0].similarityScore > 0.6);
});

test('Fraud Engine: Vendor concentration calculates HHI and flags monopolistic capture', () => {
  const result = computeVendorConcentration();
  assert.ok(result.length > 0);
  assert.equal(typeof result[0].herfindahlIndex, 'number');
  assert.equal(typeof result[0].isFlaggedMonopoly, 'boolean');
});
