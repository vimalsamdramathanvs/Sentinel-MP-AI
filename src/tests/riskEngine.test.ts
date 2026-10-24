import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompositeRisk, DEFAULT_RISK_WEIGHTS } from '../data/riskEngine.js';

test('Composite Risk: Baseline clean inputs result in low risk score (<30)', () => {
  const result = calculateCompositeRisk({
    costZScore: 0.1,
    daysOverdue: 0,
    utilizationRatio: 0.85,
    releaseRatio: 0.85,
    vendorBlacklisted: false,
    agencyBlacklisted: false,
    missingDocuments: 0,
    satelliteNoChange: false,
  });

  assert.ok(result.compositeScore < 30, `Expected score < 30, got ${result.compositeScore}`);
  assert.ok(result.explanation.length > 0);
  assert.ok(result.explanation[0].component);
});

test('Composite Risk: Severe fraud factors result in high/critical risk score (>=70)', () => {
  const result = calculateCompositeRisk({
    costZScore: 3.5,
    daysOverdue: 420,
    utilizationRatio: 0.05,
    releaseRatio: 1.0,
    vendorBlacklisted: true,
    agencyBlacklisted: true,
    missingDocuments: 3,
    mismatchedAmounts: 2,
    maxDuplicateScore: 0.88,
    maxPaymentRatio: 0.95,
    satelliteNoChange: true,
    locationMismatch: true,
  });

  assert.ok(result.compositeScore >= 70, `Expected score >= 70, got ${result.compositeScore}`);
  assert.ok(result.explanation.length === 8);
});

test('Risk Weights: Policy weights sum to 1.00', () => {
  const sum = Object.values(DEFAULT_RISK_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected weights sum ~1.00, got ${sum}`);
});
