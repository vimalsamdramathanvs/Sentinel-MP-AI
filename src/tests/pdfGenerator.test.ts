import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProjectPdf, generateAnalyticalSummaryPdf } from '../utils/pdfGenerator.js';
import {
  getStateRankings,
  getAgencyPerformances,
  generateProphetForecast,
  getRootCauseFactors,
} from '../data/analyticsEngine.js';
import { generateMinistryExecutiveReport } from '../data/reportsEngine.js';
import { ProjectItem } from '../types.js';

const mockProject: ProjectItem = {
  id: 'PRJ-MH-PUN-001',
  title: 'Construction of Community Health Center & Solar Micro-grid',
  description: 'Sanctioned under MPLADS community infrastructure head.',
  constituencyId: 104,
  constituencyName: 'Pune',
  districtId: 201,
  districtName: 'Pune',
  stateId: 12,
  stateName: 'Maharashtra',
  mpName: 'Hon. Member of Parliament',
  agencyId: 'AG-PWD-01',
  agencyName: 'Public Works Department (Civil)',
  agencyType: 'State Department',
  agencyBlacklisted: false,
  vendorId: 'VN-BUILD-99',
  vendorName: 'Sahyadri Infra Projects Ltd',
  vendorBlacklisted: false,
  category: 'Healthcare & Energy',
  sanctionedAmount: 7500000,
  releasedAmount: 7500000,
  utilizedAmount: 6200000,
  status: 'in_progress',
  sanctionedDate: '2024-03-15',
  expectedCompletion: '2025-06-30',
  location: { lat: 18.5204, lng: 73.8567 },
  isSeedData: true,
  riskScore: {
    components: {
      cost_risk: 25,
      delay_risk: 30,
      utilization_risk: 15,
      duplicate_risk: 10,
      vendor_risk: 20,
      agency_risk: 15,
      compliance_risk: 10,
      geo_risk: 12,
    },
    compositeScore: 22,
    weightsUsed: {},
    explanation: [],
  },
  verifiedStatus: 'satellite_verified',
  lastUpdated: '2025-01-10',
};

test('PDF Generator: Successfully generates valid jsPDF document with headers and metadata', () => {
  const doc = generateProjectPdf(
    mockProject,
    {
      includeFinancialBreakdown: true,
      includeRiskAnalysis: true,
      includeAuditTimeline: true,
      includeFieldInspection: true,
      dossierHash: 'SHA256-TEST-HASH-998877665544',
    },
    [
      {
        title: 'Recommendation by Hon. MP',
        date: '2024-03-15',
        actor: 'MP Office',
        status: 'completed',
        detail: 'Formally recommended under Action Plan quota.',
      },
      {
        title: 'PFMS Milestone Release',
        date: '2024-04-01',
        actor: 'Treasury',
        status: 'completed',
        detail: '₹75 Lakh released.',
      },
    ]
  );

  assert.ok(doc, 'PDF doc instance should be returned');
  const pageCount = doc.getNumberOfPages();
  assert.ok(pageCount >= 1, `Expected at least 1 page, got ${pageCount}`);

  // Test outputting binary/base64 string without error
  const dataUri = doc.output('datauristring');
  assert.ok(dataUri.startsWith('data:application/pdf'), 'Document should render valid PDF data URI');
});

test('PDF Generator: Supports custom section toggles (excluding risk or financials)', () => {
  const doc = generateProjectPdf(mockProject, {
    includeFinancialBreakdown: false,
    includeRiskAnalysis: false,
    includeAuditTimeline: false,
  });

  assert.ok(doc);
  const pageCount = doc.getNumberOfPages();
  assert.equal(pageCount, 1, 'Should fit on a single page when sub-sections are excluded');
});

test('PDF Generator: Successfully generates formatted Analytical Data PDF Summary for ReportsView', () => {
  const doc = generateAnalyticalSummaryPdf({
    reportType: 'executive',
    generatedReport: generateMinistryExecutiveReport(),
    includeExecutiveKpis: true,
    includeStateRankings: true,
    includeAgencyPerformance: true,
    includeForecast: true,
    includeRootCause: true,
    includeActiveReport: true,
    stateRankings: getStateRankings(),
    agencyPerformances: getAgencyPerformances(),
    forecastPoints: generateProphetForecast(6),
    rootCauses: getRootCauseFactors(),
    overallMetrics: {
      totalProjects: 40,
      delayedProjects: 12,
      completedProjects: 18,
      totalSanctionedCr: 42.5,
      totalUtilizedCr: 31.8,
      utilizationRatePct: 75,
      highRiskCount: 8,
      meanRiskScore: 54,
    },
  });

  assert.ok(doc, 'Analytical summary PDF doc should be returned');
  assert.ok(doc.getNumberOfPages() >= 1, 'Expected at least 1 page');
  const dataUri = doc.output('datauristring');
  assert.ok(dataUri.startsWith('data:application/pdf'), 'Should output valid PDF data URI');
});
