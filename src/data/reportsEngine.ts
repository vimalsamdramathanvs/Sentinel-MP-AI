/**
 * MPLADS Sentinel AI — Reporting Engine (Phase 15)
 * Single source of truth Data Assembly for District, State, and Executive reports
 * with multi-format rendering (PDF, Excel, CSV).
 */

import { SEED_PROJECTS } from './seedProjects';
import { INITIAL_ALERTS } from './alertsEngine';
import { STATES_MAP } from './geography';
import { ReportJob } from '../types';

export interface AssembledReportData {
  reportType: 'district' | 'state' | 'executive';
  title: string;
  generatedAt: string;
  scopeDescription: string;
  summaryMetrics: {
    totalProjects: number;
    delayedProjects: number;
    completedProjects: number;
    totalSanctioned: number;
    totalUtilized: number;
    utilizationRatePct: number;
    highRiskCount: number;
  };
  projectTable: {
    title: string;
    category: string;
    status: string;
    sanctionedAmount: number;
    utilizedAmount: number;
    compositeScore: number;
  }[];
  alertTable: {
    projectTitle: string;
    alertType: string;
    severity: string;
    message: string;
  }[];
}

export function assembleReportData(reportType: 'district' | 'state' | 'executive', scopeId?: string): AssembledReportData {
  const now = new Date().toISOString().slice(0, 10);

  let filteredProjects = SEED_PROJECTS;
  let scopeDescription = 'All India National Territory';
  let title = 'MPLADS Sentinel AI — National Executive Summary';

  if (reportType === 'district' && scopeId) {
    filteredProjects = SEED_PROJECTS.filter((p) => p.districtName.toLowerCase() === scopeId.toLowerCase());
    scopeDescription = `${scopeId} District`;
    title = `MPLADS District Monitoring Report — ${scopeId}`;
  } else if (reportType === 'state' && scopeId) {
    const sId = Number(scopeId);
    filteredProjects = SEED_PROJECTS.filter((p) => p.stateId === sId);
    const sName = STATES_MAP[sId]?.name || 'State';
    scopeDescription = `${sName} (All Districts)`;
    title = `MPLADS State Intelligence Report — ${sName}`;
  }

  const totalSanctioned = filteredProjects.reduce((acc, p) => acc + p.sanctionedAmount, 0);
  const totalUtilized = filteredProjects.reduce((acc, p) => acc + p.utilizedAmount, 0);
  const delayed = filteredProjects.filter((p) => p.status === 'delayed').length;
  const completed = filteredProjects.filter((p) => p.status === 'completed').length;
  const highRisk = filteredProjects.filter((p) => p.riskScore.compositeScore >= 70).length;

  const projectTable = filteredProjects.slice(0, 50).map((p) => ({
    title: p.title,
    category: p.category,
    status: p.status,
    sanctionedAmount: p.sanctionedAmount,
    utilizedAmount: p.utilizedAmount,
    compositeScore: p.riskScore.compositeScore,
  }));

  const alertTable = INITIAL_ALERTS.filter((a) => filteredProjects.some((p) => p.id === a.projectId)).map((a) => ({
    projectTitle: a.projectTitle,
    alertType: a.alertType,
    severity: a.severity,
    message: a.message,
  }));

  return {
    reportType,
    title,
    generatedAt: now,
    scopeDescription,
    summaryMetrics: {
      totalProjects: filteredProjects.length,
      delayedProjects: delayed,
      completedProjects: completed,
      totalSanctioned,
      totalUtilized,
      utilizationRatePct: totalSanctioned > 0 ? Math.round((totalUtilized / totalSanctioned) * 100) : 0,
      highRiskCount: highRisk,
    },
    projectTable,
    alertTable,
  };
}

export function generateCsvExport(data: AssembledReportData): string {
  const headers = ['Title', 'Category', 'Status', 'Sanctioned Amount (INR)', 'Utilized Amount (INR)', 'Risk Score'];
  const rows = data.projectTable.map((p) =>
    `"${p.title.replace(/"/g, '""')}","${p.category}","${p.status}",${p.sanctionedAmount},${p.utilizedAmount},${p.compositeScore}`
  );
  return [headers.join(','), ...rows].join('\n');
}

export const INITIAL_REPORT_JOBS: ReportJob[] = [
  {
    id: 'rep-job-001',
    reportType: 'executive',
    scopeId: 'national',
    scopeName: 'All India',
    format: 'pdf',
    status: 'ready',
    generatedAt: '2026-09-10T10:00:00Z',
    downloadUrl: '#',
    summaryMetrics: { totalProjects: 100, sanctionedCr: 84.5 },
  },
  {
    id: 'rep-job-002',
    reportType: 'state',
    scopeId: '1',
    scopeName: 'Karnataka',
    format: 'xlsx',
    status: 'ready',
    generatedAt: '2026-09-11T12:30:00Z',
    downloadUrl: '#',
    summaryMetrics: { totalProjects: 15, sanctionedCr: 12.8 },
  },
  {
    id: 'rep-job-003',
    reportType: 'district',
    scopeId: 'Varanasi',
    scopeName: 'Varanasi (UP)',
    format: 'pdf',
    status: 'ready',
    generatedAt: '2026-09-12T15:45:00Z',
    downloadUrl: '#',
    summaryMetrics: { totalProjects: 8, sanctionedCr: 9.4 },
  },
];

export function generateDistrictReportData(districtName: string) {
  const matchingProjects = SEED_PROJECTS.filter(
    (p) => p.districtName.toLowerCase() === districtName.toLowerCase()
  );
  const totalWorks = matchingProjects.length;
  const sanctionedCr = matchingProjects.reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
  const meanRisk =
    totalWorks > 0
      ? Math.round(
          matchingProjects.reduce((acc, p) => acc + p.riskScore.compositeScore, 0) / totalWorks
        )
      : 45;

  const criticalProjects = matchingProjects
    .filter((p) => p.riskScore.compositeScore >= 60)
    .slice(0, 5);

  return {
    title: `DISTRICT VIGILANCE & MONITORING DOSSIER: ${districtName.toUpperCase()}`,
    period: 'Q3 FY 2025-26',
    generatedDate: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    referenceId: `MoSPI/MPLADS/DVM/${districtName.substring(0, 3).toUpperCase()}/2026/089`,
    sanctionedCr,
    totalWorks,
    meanRiskScore: meanRisk,
    summary: `Comprehensive evaluation of ongoing MPLADS recommendations across ${districtName}. Automated anomaly detection engines flagged ${criticalProjects.length} works for immediate physical inspection due to vendor debarment or GFR Form 12-C financial discrepancies.`,
    criticalProjects,
  };
}

export function generateMinistryExecutiveReport() {
  const totalWorks = SEED_PROJECTS.length;
  const sanctionedCr = SEED_PROJECTS.reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
  const meanRisk = Math.round(
    SEED_PROJECTS.reduce((acc, p) => acc + p.riskScore.compositeScore, 0) / totalWorks
  );
  const criticalProjects = SEED_PROJECTS.filter((p) => p.riskScore.compositeScore >= 75).slice(0, 6);

  return {
    title: 'CENTRAL MINISTRY EXECUTIVE MPLADS AUDIT & RISK INTELLIGENCE DOSSIER',
    period: 'All-India National Comprehensive • FY 2025-26',
    generatedDate: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    referenceId: 'MoSPI/MPLADS-SENTINEL/NAT/2026/001',
    sanctionedCr,
    totalWorks,
    meanRiskScore: meanRisk,
    summary:
      'Executive risk briefing across 18th Lok Sabha recommended infrastructure portfolios. Multi-spectral satellite verification detected 3 potential ghost assets with zero ground disturbance, and network graphs flagged 1 vendor collusion ring.',
    criticalProjects,
  };
}

export function generateParliamentaryQuestionData() {
  const totalWorks = SEED_PROJECTS.length;
  const sanctionedCr = SEED_PROJECTS.reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
  const utilizedCr = SEED_PROJECTS.reduce((acc, p) => acc + p.utilizedAmount, 0) / 1e7;
  const unspentCr = sanctionedCr - utilizedCr;

  return {
    reportCategory: 'parliamentary',
    house: 'LOK SABHA',
    session: 'EIGHTEENTH LOK SABHA — SEVENTH SESSION',
    questionType: 'STARRED QUESTION NO. *248',
    answeringDate: 'Wednesday, March 18, 2026 / Phalguna 27, 1947 (Saka)',
    subject: 'UTILIZATION OF MPLADS FUNDS, PHYSICAL ASSET COMPLETION & UNSPENT BALANCES',
    askedBy: 'SHRI RAJESH KUMAR VERMA, M.P. & SMT. ANURADHA HEGDE, M.P.',
    minister: 'MINISTER OF STATE (INDEPENDENT CHARGE) OF THE MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION',
    questions: [
      {
        part: '(a)',
        text: 'Whether the Government has taken cognizance of unspent balances and delayed project completions under the Member of Parliament Local Area Development Scheme (MPLADS) during FY 2024-25 and FY 2025-26;',
        answer: 'Yes, Sir. As per the centralized MPLADS Sentinel portal, comprehensive real-time digital monitoring and multi-spectral satellite auditing have been operationalized across all parliamentary constituencies.'
      },
      {
        part: '(b)',
        text: 'The state-wise details of funds entitled, released, ground expenditures incurred, and physical works completed by District Authorities;',
        answer: 'A detailed State-wise and District-wise statement showing funds entitled, releases made, utilization percentages, and physical completion certificates is laid on the Table of the House as Annexure-I.'
      },
      {
        part: '(c)',
        text: 'Whether any cases of single-vendor contractor concentration, tender splitting, or non-existent assets have been identified by automated audit systems; and',
        answer: 'Through automated satellite change detection and CPPP e-procurement audit algorithms, 7 anomalous vendor clusters and 3 unverified assets have been placed under temporary disbursement freeze pending field verification under GFR Rule 157.'
      },
      {
        part: '(d)',
        text: 'The remedial steps taken to enforce timely submission of Utilization Certificates (UCs) by District Collectors?',
        answer: 'Subsequent installment releases from the Consolidated Fund of India are strictly contingent upon submission of provisional UCs and geo-tagged physical milestone certificates as per Revised MPLADS Guidelines 2023 §4.1.'
      }
    ],
    annexureRows: [
      { state: 'Karnataka', constituency: 'Bengaluru Urban', entitledCr: 25.0, sanctionedCr: 21.4, utilizedCr: 17.8, completedCount: 41, pendingUcCr: 3.6 },
      { state: 'Uttar Pradesh', constituency: 'Varanasi', entitledCr: 30.0, sanctionedCr: 28.5, utilizedCr: 26.2, completedCount: 68, pendingUcCr: 2.3 },
      { state: 'Bihar', constituency: 'Patna', entitledCr: 25.0, sanctionedCr: 19.8, utilizedCr: 14.2, completedCount: 34, pendingUcCr: 5.6 },
      { state: 'Maharashtra', constituency: 'Pune', entitledCr: 25.0, sanctionedCr: 22.1, utilizedCr: 18.9, completedCount: 39, pendingUcCr: 3.2 },
      { state: 'Kerala', constituency: 'Ernakulam', entitledCr: 20.0, sanctionedCr: 18.9, utilizedCr: 17.1, completedCount: 44, pendingUcCr: 1.8 }
    ],
    totalSanctionedCr: sanctionedCr,
    totalUtilizedCr: utilizedCr,
    totalUnspentCr: unspentCr
  };
}

export function generateCagComplianceData() {
  const matchingProjects = SEED_PROJECTS;
  const totalSanctionedCr = matchingProjects.reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
  const totalDelayedCr = matchingProjects.filter(p => p.status === 'delayed').reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
  const ghostAssetsCr = matchingProjects.filter(p => p.riskScore.compositeScore >= 85).reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;

  return {
    reportCategory: 'cag_compliance',
    title: 'COMPTROLLER & AUDITOR GENERAL OF INDIA (CAG) — COMPLIANCE AUDIT OBSERVATIONS',
    auditParaNumber: 'PARA 4.7 — SCHEME MONITORING & GENERAL FINANCIAL RULES (GFR) ENFORCEMENT',
    subject: 'Unadjusted Advances, Idle Parking of Funds & Violation of GFR Rule 238(1) in MPLADS Executions',
    date: 'September 2026',
    docketNumber: 'CAG/REP/CENTRAL/AUDIT-2026/04-MPLADS',
    auditObservations: [
      {
        title: 'Idle Parking of Funds with District Authorities without Utilization Certificates',
        gfrCitation: 'GFR 2017 Rule 238(1)',
        finding: `Funds amounting to ₹${totalDelayedCr.toFixed(2)} Crores remained unutilized with district authorities beyond the statutory 18-month ceiling without receipt of Form GFR 12-C certificates. Interest accrued in commercial bank accounts was not remitted back to the Consolidated Fund of India.`
      },
      {
        title: 'Splitting of Tenders to Evade Open E-Procurement Thresholds',
        gfrCitation: 'GFR 2017 Rule 157 & CPPP Guidelines',
        finding: 'District execution cells deliberately split contiguous infrastructure works into sub-packages under ₹50 Lakhs each, thereby avoiding open e-tendering and pre-qualification vetting.'
      },
      {
        title: 'Disbursement of 100% Milestone Payments for Non-Existent Physical Assets',
        gfrCitation: 'GFR 2017 Rule 242(2)',
        finding: `Payments totaling ₹${ghostAssetsCr.toFixed(2)} Crores were disbursed based on manually declared completion without corresponding multi-spectral satellite optical confirmation (NDBI < 0.05).`
      }
    ],
    recommendations: [
      'Immediate recovery and remittance of idle unspent funds exceeding 24 months to the Consolidated Fund of India.',
      'Institution of departmental disciplinary proceedings against executing engineers who sanctioned micro-split packages under GFR 157.',
      'Mandatory integration of Public Financial Management System (PFMS) with ISRO Bhuvan satellite GIS coordinate validation prior to tranche 3 releases.'
    ]
  };
}


