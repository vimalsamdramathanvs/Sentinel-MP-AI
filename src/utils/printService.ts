import { PrintableDocumentPayload } from './pdfGenerator';
import { SEED_PROJECTS } from '../data/seedProjects';
import { INITIAL_ALERTS } from '../data/alertsEngine';
import { getStateRankings, getAgencyPerformances, getRootCauseFactors } from '../data/analyticsEngine';

type PrintListener = (payload: PrintableDocumentPayload) => void;

let activeListener: PrintListener | null = null;

export function subscribeToPrintPreview(listener: PrintListener): () => void {
  activeListener = listener;
  return () => {
    if (activeListener === listener) {
      activeListener = null;
    }
  };
}

export function openPrintPreview(payload: PrintableDocumentPayload): void {
  if (activeListener) {
    activeListener(payload);
  } else {
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch (_) {}
  }
}

/**
 * Builds a structured PrintableDocumentPayload for any active navigation tab in the app.
 */
export function buildActiveViewPrintPayload(activeTab: string, userRoleLabel = 'Ministry Oversight'): PrintableDocumentPayload {
  const totalProjects = SEED_PROJECTS.length;
  const delayedProjects = SEED_PROJECTS.filter((p) => p.status === 'delayed').length;
  const completedProjects = SEED_PROJECTS.filter((p) => p.status === 'completed').length;
  const totalSanctionedCr = SEED_PROJECTS.reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
  const totalUtilizedCr = SEED_PROJECTS.reduce((acc, p) => acc + p.utilizedAmount, 0) / 1e7;
  const utilPct = totalSanctionedCr > 0 ? Math.round((totalUtilizedCr / totalSanctionedCr) * 100) : 0;
  const highRiskProjects = SEED_PROJECTS.filter((p) => p.riskScore.compositeScore >= 70);
  const stateRankings = getStateRankings();
  const agencies = getAgencyPerformances();
  const rootCauses = getRootCauseFactors();

  const tabTitles: Record<string, string> = {
    dashboard: 'National MPLADS Intelligence Executive Overview',
    projects: 'National MPLADS Sanctioned Project Registry',
    gis: 'Geospatial Surveillance & DBSCAN Fraud Hotspot Report',
    fraud: 'ML Fraud Detection & Anomaly Investigation Register',
    risk: 'Composite 6-Factor Risk Scoring Matrix Report',
    analytics: 'Advanced Bayesian Analytics & Forecasting Dossier',
    satellite: 'ISRO Sentinel-2 Satellite Ground Truth Verification Log',
    documents: 'Document AI & GFR Form 12-C OCR Verification Report',
    alerts: 'Statutory Vigilance Alerts & Resolution Register',
    reports: 'MPLADS Statutory Reporting Hub Summary',
    copilot: 'Multi-Agent Vigilance Copilot Briefing Summary',
    mpledger: '18th Lok Sabha MP Constituency Allocation & Passbook Ledger',
    public: 'Citizen Transparency, Social Audit & RTI Portal Summary',
    admin: 'Platform Governance, Model Lineage & Security Audit Log',
  };

  const title = tabTitles[activeTab] || 'National MPLADS Sentinel Surveillance Report';

  return {
    title,
    subtitle: `Surveillance across 40 Representative Districts in 8 States • 18th Lok Sabha Active Tranche (${userRoleLabel})`,
    referenceId: `MPLADS-PRT-${activeTab.toUpperCase()}-${new Date().getFullYear()}`,
    badgeText: 'OFFICIAL PRINTOUT',
    fileNamePrefix: `MPLADS_Print_${activeTab.toUpperCase()}`,
    kpiCards: [
      {
        label: 'Monitored Projects',
        value: `${totalProjects} Works`,
        sub: `${completedProjects} Completed • ${delayedProjects} Delayed`,
      },
      {
        label: 'Sanctioned Outlay',
        value: `INR ${totalSanctionedCr.toFixed(2)} Cr`,
        sub: '18th Lok Sabha Tranche',
      },
      {
        label: 'Verified Utilized',
        value: `INR ${totalUtilizedCr.toFixed(2)} Cr`,
        sub: `${utilPct}% Expenditure Ratio`,
      },
      {
        label: 'High-Risk Flagged',
        value: `${highRiskProjects.length} Cases`,
        sub: `${INITIAL_ALERTS.filter((a) => a.status === 'open').length} Open Vigilance Alerts`,
      },
    ],
    metadataRows: [
      ['Active Module / View', title],
      ['Jurisdiction Scope', 'Republic of India — 8 States, 40 Operational Districts'],
      ['Oversight Authority', 'Ministry of Statistics & Programme Implementation (MoSPI) & CAG'],
      ['Statutory Compliance Standard', 'GFR 2017 Rule 238(1), Rule 151(iii) & MoSPI Guidelines 2023'],
    ],
    sections: [
      {
        heading: 'State-Wise Risk & Fund Utilization Summary',
        table: {
          headers: ['State', 'Works', 'Delayed', 'Sanctioned (Cr)', 'Utilized (Cr)', 'Util %', 'Mean Risk'],
          rows: stateRankings.map((st, idx) => [
            `${idx + 1}. ${st.stateName}`,
            String(st.totalProjects),
            String(st.delayedProjects),
            `INR ${(st.totalSanctioned / 1e7).toFixed(2)}`,
            `INR ${(st.totalUtilized / 1e7).toFixed(2)}`,
            `${st.utilizationRate}%`,
            `${st.avgRiskScore}/100`,
          ]),
        },
      },
      {
        heading: 'Priority High-Risk Surveillance Works Requiring Review',
        table: {
          headers: ['Project ID', 'Project Title', 'District / State', 'Agency', 'Sanctioned', 'Risk Score'],
          rows: highRiskProjects.slice(0, 12).map((p) => [
            p.id,
            p.title,
            `${p.districtName}, ${p.stateName}`,
            p.agencyName,
            `INR ${(p.sanctionedAmount / 1e7).toFixed(2)} Cr`,
            `${p.riskScore.compositeScore}/100`,
          ]),
        },
      },
      {
        heading: 'Implementing Agency Performance & Root-Cause Drivers',
        paragraphs: rootCauses.map(
          (rc) => `• ${rc.name} (Impact: ${rc.impactScore}/100, r = ${rc.correlation}): ${rc.description}`
        ),
        table: {
          headers: ['Implementing Agency', 'Type', 'Total Works', 'Delayed', 'Avg Risk', 'Status'],
          rows: agencies.slice(0, 8).map((ag) => [
            ag.name,
            ag.type,
            String(ag.totalProjects),
            String(ag.delayed),
            `${ag.avgRiskScore}/100`,
            ag.isBlacklisted ? 'DEBARRED' : 'Active',
          ]),
        },
      },
    ],
  };
}
