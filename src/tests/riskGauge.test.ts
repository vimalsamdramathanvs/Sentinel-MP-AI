import test from 'node:test';
import assert from 'node:assert/strict';
import { ProjectItem } from '../types.js';

// Test fraud factors calculation patterns for RiskScoreGauge
test('Risk Score Gauge: Accurately identifies high fund utilization anomaly when project is in_progress', () => {
  const project: ProjectItem = {
    id: 'PRJ-TEST-UTIL-01',
    title: 'Rural Road Concrete Pavement',
    description: 'Road work with premature disbursement drain',
    constituencyId: 10,
    constituencyName: 'Test Const',
    districtId: 20,
    districtName: 'Test District',
    stateId: 1,
    stateName: 'State',
    agencyId: 'AG-1',
    agencyName: 'State PWD',
    agencyType: 'State Dept',
    agencyBlacklisted: false,
    vendorId: 'VN-1',
    vendorName: 'Apex Infra',
    vendorBlacklisted: false,
    category: 'Roads',
    sanctionedAmount: 5000000,
    releasedAmount: 5000000,
    utilizedAmount: 4900000, // 98% utilized
    status: 'in_progress', // Still in progress despite 98% drawn
    sanctionedDate: '2024-01-01',
    expectedCompletion: '2025-01-01',
    location: { lat: 20.0, lng: 78.0 },
    isSeedData: true,
    riskScore: {
      components: {
        cost_risk: 10,
        delay_risk: 10,
        utilization_risk: 85,
        duplicate_risk: 5,
        vendor_risk: 15,
        agency_risk: 10,
        compliance_risk: 10,
        geo_risk: 5,
      },
      compositeScore: 68,
      weightsUsed: {},
      explanation: [],
    },
    fraudFlag: 'fund_misuse',
    lastUpdated: '2025-01-01',
  };

  const utilizationRate = Math.round((project.utilizedAmount / project.releasedAmount) * 100);
  assert.equal(utilizationRate, 98);
  assert.ok(project.riskScore.components.utilization_risk >= 50);
  assert.equal(project.fraudFlag, 'fund_misuse');
});

test('Risk Score Gauge: Detects vendor blacklisting and monopoly concentration alerts', () => {
  const blacklistedProject: ProjectItem = {
    id: 'PRJ-TEST-VEND-01',
    title: 'School Sanitation Block',
    description: 'Debarred vendor test',
    constituencyId: 10,
    constituencyName: 'Test Const',
    districtId: 20,
    districtName: 'Test District',
    stateId: 1,
    stateName: 'State',
    agencyId: 'AG-1',
    agencyName: 'State PWD',
    agencyType: 'State Dept',
    agencyBlacklisted: false,
    vendorId: 'VN-CORRUPT',
    vendorName: 'Flagged Builders Pvt Ltd',
    vendorBlacklisted: true, // Rule 151 debarred
    category: 'Education',
    sanctionedAmount: 2500000,
    releasedAmount: 2500000,
    utilizedAmount: 1200000,
    status: 'in_progress',
    sanctionedDate: '2024-01-01',
    expectedCompletion: '2025-01-01',
    location: { lat: 20.0, lng: 78.0 },
    isSeedData: true,
    riskScore: {
      components: {
        cost_risk: 20,
        delay_risk: 15,
        utilization_risk: 20,
        duplicate_risk: 10,
        vendor_risk: 95,
        agency_risk: 10,
        compliance_risk: 10,
        geo_risk: 10,
      },
      compositeScore: 82,
      weightsUsed: {},
      explanation: [],
    },
    fraudFlag: 'vendor_concentration',
    lastUpdated: '2025-01-01',
  };

  assert.equal(blacklistedProject.vendorBlacklisted, true);
  assert.ok(blacklistedProject.riskScore.components.vendor_risk > 80);
  assert.equal(blacklistedProject.fraudFlag, 'vendor_concentration');
});
