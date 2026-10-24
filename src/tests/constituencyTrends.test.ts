import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONSTITUENCY_TREND_SERIES,
  TREND_MONTHS_LABELS,
  NATIONAL_BENCHMARK_RATES,
} from '../data/constituencyTrendsData.js';

test('Constituency Trends: Series covers exactly 12 months with valid progression', () => {
  assert.equal(TREND_MONTHS_LABELS.length, 12);
  assert.equal(NATIONAL_BENCHMARK_RATES.length, 12);
  assert.ok(CONSTITUENCY_TREND_SERIES.length >= 8);

  CONSTITUENCY_TREND_SERIES.forEach((series) => {
    assert.equal(series.monthlyData.length, 12, `${series.name} must have 12 monthly data points`);
    assert.ok(series.totalSanctionedCr > 0);
    assert.ok(series.currentUtilizationRate >= 0 && series.currentUtilizationRate <= 100);

    // Verify monotonically non-decreasing or realistic cumulative utilization
    for (let i = 1; i < series.monthlyData.length; i++) {
      const prev = series.monthlyData[i - 1];
      const curr = series.monthlyData[i];
      assert.ok(
        curr.cumulativeUtilizedCr >= prev.cumulativeUtilizedCr,
        `${series.name} cumulative expenditure must not decrease at month ${i}`
      );
      assert.ok(
        curr.utilizationRate >= prev.utilizationRate,
        `${series.name} utilization rate must not decrease over time`
      );
    }
  });
});

test('Constituency Trends: Performance categories and statuses correctly assigned', () => {
  const varanasi = CONSTITUENCY_TREND_SERIES.find((s) => s.id === 'varanasi');
  assert.ok(varanasi);
  assert.equal(varanasi.performanceStatus, 'accelerating');
  assert.ok(varanasi.currentUtilizationRate > 80);

  const kolkata = CONSTITUENCY_TREND_SERIES.find((s) => s.id === 'kolkata-north');
  assert.ok(kolkata);
  assert.ok(kolkata.currentUtilizationRate < 60);
});
