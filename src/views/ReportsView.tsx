import React, { useState, useMemo } from 'react';
import {
  generateDistrictReportData,
  generateMinistryExecutiveReport,
  generateParliamentaryQuestionData,
  generateCagComplianceData,
  assembleReportData,
  generateCsvExport,
} from '../data/reportsEngine';
import {
  getStateRankings,
  getAgencyPerformances,
  generateProphetForecast,
  getRootCauseFactors,
} from '../data/analyticsEngine';
import { SEED_PROJECTS } from '../data/seedProjects';
import { DISTRICTS_DATA } from '../data/geography';
import { exportAndDownloadAnalyticalSummaryPdf } from '../utils/pdfGenerator';
import { openPrintPreview } from '../utils/printService';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Shield,
  Landmark,
  Scale,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'district' | 'executive' | 'parliamentary' | 'cag_compliance'>('district');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');
  const [generatedReport, setGeneratedReport] = useState<any>(() =>
    generateDistrictReportData('Bengaluru Urban')
  );

  // Analytical PDF Summary section toggles
  const [includeExecutiveKpis, setIncludeExecutiveKpis] = useState(true);
  const [includeStateRankings, setIncludeStateRankings] = useState(true);
  const [includeAgencyPerformance, setIncludeAgencyPerformance] = useState(true);
  const [includeForecast, setIncludeForecast] = useState(true);
  const [includeRootCause, setIncludeRootCause] = useState(true);
  const [includeActiveReport, setIncludeActiveReport] = useState(true);
  const [pdfExportNotice, setPdfExportNotice] = useState<string | null>(null);

  // Live analytical datasets
  const stateRankings = useMemo(() => getStateRankings(), []);
  const agencyPerformances = useMemo(() => getAgencyPerformances(), []);
  const forecastPoints = useMemo(() => generateProphetForecast(6), []);
  const rootCauses = useMemo(() => getRootCauseFactors(), []);

  // Scoped or National analytical summary metrics
  const overallMetrics = useMemo(() => {
    const scopedProjects =
      reportType === 'district'
        ? SEED_PROJECTS.filter((p) => p.districtName.toLowerCase() === selectedDistrict.toLowerCase())
        : SEED_PROJECTS;
    const list = scopedProjects.length > 0 ? scopedProjects : SEED_PROJECTS;
    const totalProjects = list.length;
    const delayedProjects = list.filter((p) => p.status === 'delayed').length;
    const completedProjects = list.filter((p) => p.status === 'completed').length;
    const totalSanctionedCr = list.reduce((acc, p) => acc + p.sanctionedAmount, 0) / 1e7;
    const totalUtilizedCr = list.reduce((acc, p) => acc + p.utilizedAmount, 0) / 1e7;
    const utilizationRatePct =
      totalSanctionedCr > 0 ? Math.round((totalUtilizedCr / totalSanctionedCr) * 100) : 0;
    const highRiskCount = list.filter((p) => p.riskScore.compositeScore >= 70).length;
    const meanRiskScore =
      totalProjects > 0
        ? Math.round(list.reduce((acc, p) => acc + p.riskScore.compositeScore, 0) / totalProjects)
        : 0;

    return {
      totalProjects,
      delayedProjects,
      completedProjects,
      totalSanctionedCr,
      totalUtilizedCr,
      utilizationRatePct,
      highRiskCount,
      meanRiskScore,
    };
  }, [reportType, selectedDistrict]);

  const computeReportForState = (
    type: 'district' | 'executive' | 'parliamentary' | 'cag_compliance',
    district: string
  ) => {
    if (type === 'district') return generateDistrictReportData(district);
    if (type === 'executive') return generateMinistryExecutiveReport();
    if (type === 'parliamentary') return generateParliamentaryQuestionData();
    return generateCagComplianceData();
  };

  const handleGenerate = () => {
    const data = computeReportForState(reportType, selectedDistrict);
    setGeneratedReport(data);
  };

  const handleExportAnalyticalPdf = () => {
    const activeReportData = generatedReport || computeReportForState(reportType, selectedDistrict);
    if (!generatedReport) {
      setGeneratedReport(activeReportData);
    }

    const fileName = exportAndDownloadAnalyticalSummaryPdf({
      reportType,
      selectedDistrict,
      generatedReport: activeReportData,
      includeExecutiveKpis,
      includeStateRankings,
      includeAgencyPerformance,
      includeForecast,
      includeRootCause,
      includeActiveReport,
      stateRankings,
      agencyPerformances,
      forecastPoints,
      rootCauses,
      overallMetrics,
    });

    setPdfExportNotice(`Formatted Analytical PDF Summary exported: ${fileName}`);
    setTimeout(() => setPdfExportNotice(null), 6000);
  };

  const handleExportCsv = () => {
    const assembled = assembleReportData(
      reportType === 'district' ? 'district' : 'executive',
      reportType === 'district' ? selectedDistrict : undefined
    );
    const csvContent = generateCsvExport(assembled);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MPLADS_Analytical_Data_${reportType === 'district' ? selectedDistrict.replace(/\s+/g, '_') : 'National'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const activeRep = generatedReport || computeReportForState(reportType, selectedDistrict);
    const sections: any[] = [];

    if (activeRep.reportCategory === 'parliamentary') {
      sections.push({
        heading: `${activeRep.house} — ${activeRep.questionType}`,
        paragraphs: [
          `Subject: ${activeRep.subject} | Answered on: ${activeRep.answeringDate} | Asked by: ${activeRep.askedBy}`,
          ...(activeRep.questions || []).map((q: any) => `${q.part} ${q.text} — ANSWER: ${q.answer}`),
        ],
        table: {
          headers: ['State / UT', 'Constituency', 'Entitled (Cr)', 'Sanctioned (Cr)', 'Utilized (Cr)', 'Completed', 'Pending UC'],
          rows: (activeRep.annexureRows || []).map((r: any) => [
            r.state,
            r.constituency,
            r.entitledCr.toFixed(1),
            r.sanctionedCr.toFixed(1),
            r.utilizedCr.toFixed(1),
            String(r.completedCount),
            r.pendingUcCr.toFixed(1),
          ]),
        },
      });
    } else if (activeRep.reportCategory === 'cag_compliance') {
      sections.push({
        heading: `${activeRep.title} (${activeRep.auditParaNumber})`,
        paragraphs: (activeRep.auditObservations || []).map(
          (obs: any, i: number) => `${i + 1}. ${obs.title} [${obs.gfrCitation}]: ${obs.finding}`
        ),
      });
      sections.push({
        heading: 'Statutory Recommendations for Public Accounts Committee (PAC)',
        paragraphs: activeRep.recommendations || [],
      });
    } else {
      sections.push({
        heading: activeRep.title || 'Statutory Vigilance Dossier',
        paragraphs: [activeRep.summary || ''],
        table: activeRep.criticalProjects
          ? {
              headers: ['Project Title', 'Executing Agency', 'Sanctioned', 'Composite Risk'],
              rows: activeRep.criticalProjects.map((p: any) => [
                p.title,
                p.agencyName,
                `INR ${(p.sanctionedAmount / 1e7).toFixed(2)} Cr`,
                `${p.riskScore.compositeScore}/100`,
              ]),
            }
          : undefined,
      });
    }

    if (includeStateRankings) {
      sections.push({
        heading: 'State-Wise Risk & Utilization Rankings',
        table: {
          headers: ['Rank & State', 'Works', 'Delayed', 'Sanctioned (Cr)', 'Utilized (Cr)', 'Util %', 'Mean Risk'],
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
      });
    }

    openPrintPreview({
      title: activeRep.title || activeRep.subject || 'MPLADS Statutory Analytical Report',
      subtitle:
        reportType === 'district'
          ? `District Vigilance Dossier — ${selectedDistrict} District`
          : 'National All-India Jurisdiction (18th Lok Sabha)',
      referenceId: activeRep.referenceId || activeRep.docketNumber || `MPLADS-RPT-${reportType.toUpperCase()}`,
      badgeText: 'STATUTORY REPORT',
      fileNamePrefix: `MPLADS_Report_${reportType.toUpperCase()}`,
      kpiCards: [
        {
          label: 'Active Scope Works',
          value: `${overallMetrics.totalProjects} Projects`,
          sub: `${overallMetrics.completedProjects} completed • ${overallMetrics.delayedProjects} delayed`,
        },
        {
          label: 'Total Sanctioned',
          value: `INR ${overallMetrics.totalSanctionedCr.toFixed(2)} Cr`,
          sub: '18th Lok Sabha Tranche',
        },
        {
          label: 'Verified Utilized',
          value: `INR ${overallMetrics.totalUtilizedCr.toFixed(2)} Cr`,
          sub: `${overallMetrics.utilizationRatePct}% Utilized`,
        },
        {
          label: 'Mean Composite Risk',
          value: `${overallMetrics.meanRiskScore} / 100`,
          sub: `${overallMetrics.highRiskCount} high-risk anomalies`,
        },
      ],
      sections,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={22} className="text-blue-600" />
            <span>Reporting Hub & Analytical PDF Dossiers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated statutory templates and formatted analytical PDF summaries for Parliament Secretariat, CAG, and District Magistrates.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAnalyticalPdf}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Download formatted multi-section PDF summary of current analytical data"
          >
            <Download size={14} />
            <span>Export Analytical PDF Summary</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export underlying project & risk table as CSV"
          >
            <FileSpreadsheet size={14} className="text-slate-600" />
            <span>Export CSV</span>
          </button>

          {generatedReport && (
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print View</span>
            </button>
          )}

          <button
            onClick={handleGenerate}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Export Confirmation Notice */}
      {pdfExportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{pdfExportNotice}</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
              SHA-256 Sealed • A4 Multi-Section PDF
            </span>
          </div>
          <button
            onClick={() => setPdfExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Generator Configuration Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700">Report Template</label>
          <select
            value={reportType}
            onChange={(e) => {
              const nextType = e.target.value as 'district' | 'executive' | 'parliamentary' | 'cag_compliance';
              setReportType(nextType);
              setGeneratedReport(computeReportForState(nextType, selectedDistrict));
            }}
            className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-medium"
          >
            <option value="district">District Vigilance Dossier (DM/DC)</option>
            <option value="executive">Ministry Quarterly Executive Summary (MoSPI)</option>
            <option value="parliamentary">Lok Sabha Starred Question (PQ) Response Annexure</option>
            <option value="cag_compliance">CAG Statutory Audit Para & GFR 238(1) Violation Register</option>
          </select>
        </div>

        {reportType === 'district' ? (
          <div>
            <label className="font-semibold text-slate-700">Select Target District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                const nextDist = e.target.value;
                setSelectedDistrict(nextDist);
                setGeneratedReport(computeReportForState('district', nextDist));
              }}
              className="w-full mt-1.5 px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
            >
              {DISTRICTS_DATA.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}, {d.stateName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="font-semibold text-slate-700">Jurisdiction Scope</label>
            <div className="mt-2 text-slate-600 font-medium text-xs flex items-center gap-1.5">
              <Landmark size={14} className="text-slate-500" />
              <span>National All-India Jurisdiction (18th Lok Sabha)</span>
            </div>
          </div>
        )}

        <div>
          <label className="font-semibold text-slate-700">Statutory Integrity Seal</label>
          <div className="mt-2 text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-600" />
            <span>Cryptographic Hash SHA-256 Enabled</span>
          </div>
        </div>
      </div>

      {/* Analytical PDF Summary Builder & Live Telemetry Snapshot */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Analytical Data PDF Summary Builder
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                jsPDF Vector Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize which analytical intelligence modules are compiled into your formatted A4 PDF summary document.
            </p>
          </div>

          <button
            onClick={handleExportAnalyticalPdf}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Download Formatted PDF Summary</span>
          </button>
        </div>

        {/* Live Analytical Snapshot Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Active Scope Works</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
              {overallMetrics.totalProjects} Projects
            </div>
            <div className="text-[10px] text-slate-500">
              {overallMetrics.completedProjects} completed • {overallMetrics.delayedProjects} delayed
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Sanctioned / Utilized</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
              ₹{overallMetrics.totalSanctionedCr.toFixed(2)} Cr
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">
              ₹{overallMetrics.totalUtilizedCr.toFixed(2)} Cr ({overallMetrics.utilizationRatePct}% Utilized)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Mean Composite Risk</div>
            <div className="text-sm font-bold text-rose-600 mt-0.5 font-mono">
              {overallMetrics.meanRiskScore} / 100
            </div>
            <div className="text-[10px] text-slate-500">
              {overallMetrics.highRiskCount} high-risk anomalies (≥70)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Prophet 6M Horizon</div>
            <div className="text-sm font-bold text-blue-700 mt-0.5 font-mono">
              {Math.round((forecastPoints[forecastPoints.length - 1]?.value || 0.78) * 100)}% Projected
            </div>
            <div className="text-[10px] text-slate-500">80% Bayesian CI Band</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Top Root-Cause Factor</div>
            <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
              {rootCauses[0]?.name || 'Agency Load Concentration'}
            </div>
            <div className="text-[10px] text-amber-700 font-semibold">
              Impact Score: {rootCauses[0]?.impactScore || 84}/100
            </div>
          </div>
        </div>

        {/* Section Checkboxes */}
        <div className="pt-1">
          <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <SlidersHorizontal size={12} className="text-slate-400" />
            <span>Included PDF Analytical Sections:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeExecutiveKpis}
                onChange={(e) => setIncludeExecutiveKpis(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-800">I. Executive KPI & Financial Telemetry</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeActiveReport}
                onChange={(e) => setIncludeActiveReport(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-800">II. Active Statutory Report Findings</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStateRankings}
                onChange={(e) => setIncludeStateRankings(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-800">III. State-Wise Risk & Utilization Table</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAgencyPerformance}
                onChange={(e) => setIncludeAgencyPerformance(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-800">IV. Executing Agency & Debarment Matrix</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeForecast}
                onChange={(e) => setIncludeForecast(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-800">V. Prophet Forecast Horizon (80% CI)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRootCause}
                onChange={(e) => setIncludeRootCause(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-slate-800">VI. Statistical Root-Cause Associations</span>
            </label>
          </div>
        </div>
      </div>

      {/* Report Canvas Preview */}
      {generatedReport ? (
        <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-md max-w-4xl mx-auto space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none">
          {/* 1. Parliamentary Question Layout */}
          {generatedReport.reportCategory === 'parliamentary' && (
            <div className="space-y-6">
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <div className="text-xs uppercase font-extrabold tracking-widest text-slate-600">
                  GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
                </div>
                <div className="text-sm font-black text-slate-900 tracking-wider">
                  {generatedReport.house}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {generatedReport.session}
                </div>
                <div className="text-sm font-black text-rose-700 pt-1">
                  {generatedReport.questionType}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  TO BE ANSWERED ON: <strong>{generatedReport.answeringDate}</strong>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">SUBJECT:</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{generatedReport.subject}</div>
                  <div className="text-slate-600 mt-2">
                    ASKED BY: <strong>{generatedReport.askedBy}</strong>
                  </div>
                  <div className="text-slate-600">
                    ANSWERED BY: <strong>{generatedReport.minister}</strong>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="font-bold uppercase text-[11px] tracking-wider text-slate-700 border-b pb-1">
                    QUESTION & STATEMENT LAID ON THE TABLE OF THE HOUSE
                  </div>
                  {generatedReport.questions.map((q: any) => (
                    <div key={q.part} className="space-y-1 pl-2 border-l-2 border-slate-300">
                      <div className="font-semibold text-slate-900">
                        {q.part} {q.text}
                      </div>
                      <div className="text-slate-700 font-serif text-[13px] bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                        <strong>ANSWER:</strong> {q.answer}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Annexure I Table */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
                      ANNEXURE-I: STATEMENT REFERRED TO IN REPLY TO PART (B) OF LOK SABHA STARRED QUESTION NO. *248
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">(₹ in Crores)</span>
                  </div>

                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead className="bg-slate-100 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2">State / UT</th>
                        <th className="p-2">Constituency</th>
                        <th className="p-2 text-right">Entitled</th>
                        <th className="p-2 text-right">Sanctioned</th>
                        <th className="p-2 text-right">Utilized</th>
                        <th className="p-2 text-center">Completed Assets</th>
                        <th className="p-2 text-right">Pending UC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {generatedReport.annexureRows.map((r: any) => (
                        <tr key={r.constituency} className="hover:bg-slate-50">
                          <td className="p-2 font-sans font-medium text-slate-900">{r.state}</td>
                          <td className="p-2 font-sans text-slate-700">{r.constituency}</td>
                          <td className="p-2 text-right">{r.entitledCr.toFixed(1)}</td>
                          <td className="p-2 text-right">{r.sanctionedCr.toFixed(1)}</td>
                          <td className="p-2 text-right text-emerald-700 font-bold">{r.utilizedCr.toFixed(1)}</td>
                          <td className="p-2 text-center font-bold text-slate-900">{r.completedCount}</td>
                          <td className="p-2 text-right text-rose-600 font-bold">{r.pendingUcCr.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Secretariat Signoff */}
              <div className="pt-6 border-t-2 border-slate-900 flex justify-between text-xs text-slate-600">
                <div>
                  <div>New Delhi;</div>
                  <div>Dated: {generatedReport.answeringDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">SECRETARY GENERAL</div>
                  <div className="text-[11px] text-slate-500">Lok Sabha Secretariat, Parliament House</div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CAG Compliance Audit Layout */}
          {generatedReport.reportCategory === 'cag_compliance' && (
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-xs uppercase font-extrabold tracking-widest text-slate-600 flex items-center gap-1.5">
                    <Scale size={14} className="text-slate-800" />
                    <span>OFFICE OF THE COMPTROLLER & AUDITOR GENERAL OF INDIA</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900">{generatedReport.title}</h2>
                  <div className="text-xs font-bold text-rose-700">
                    {generatedReport.auditParaNumber}
                  </div>
                  <div className="text-xs text-slate-600">
                    Subject: <strong>{generatedReport.subject}</strong>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-900 text-white">
                    CAG STATUTORY AUDIT
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {generatedReport.docketNumber}
                  </div>
                </div>
              </div>

              {/* Audit Observations */}
              <div className="space-y-4 text-xs">
                <div className="font-bold uppercase text-[11px] tracking-wider text-slate-800">
                  Detailed Audit Findings & Statutory Violations
                </div>

                {generatedReport.auditObservations.map((obs: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {obs.title}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                        {obs.gfrCitation}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[12px]">
                      {obs.finding}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recommendations for PAC */}
              <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-bold uppercase text-[11px] tracking-wider text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Statutory Recommendations for Public Accounts Committee (PAC)</span>
                </div>
                <ul className="space-y-1.5 text-slate-700 list-disc pl-5">
                  {generatedReport.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="leading-relaxed">{rec}</li>
                  ))}
                </ul>
              </div>

              {/* CAG Sign-off */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-xs text-slate-600">
                <div>
                  <div>Audit Reference: <span className="font-mono text-[10px]">CAG-IND-MPLADS-2026-VIG</span></div>
                  <div>Certified via Digital Audit Infrastructure (OIOS)</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">PRINCIPAL DIRECTOR OF AUDIT (CENTRAL EXPENDITURE)</div>
                  <div className="text-[11px] text-slate-400 mt-3">Deen Dayal Upadhyaya Marg, New Delhi</div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Standard District & Ministry Reports */}
          {!generatedReport.reportCategory && (
            <div className="space-y-6">
              {/* Official Document Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-xs uppercase font-bold tracking-widest text-slate-500">
                    GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{generatedReport.title}</h2>
                  <div className="text-xs text-slate-600">
                    Period: <strong>{generatedReport.period}</strong> • Generated on:{' '}
                    <strong>{generatedReport.generatedDate}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    CONFIDENTIAL / STATUTORY
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Ref: {generatedReport.referenceId || 'MPLADS-SENTINEL-RPT'}
                  </div>
                </div>
              </div>

              {/* Key Metric Blocks */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[11px] text-slate-500">Sanctioned Value</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    ₹{(generatedReport.sanctionedCr || 0).toFixed(2)} Cr
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[11px] text-slate-500">Total Monitored Works</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {generatedReport.totalWorks || 0}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[11px] text-slate-500">Mean Composite Risk</div>
                  <div className="text-lg font-bold text-rose-700 mt-0.5">
                    {generatedReport.meanRiskScore || 0}/100
                  </div>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Executive Observations & AI Diagnostic
                </h3>
                <p>{generatedReport.summary}</p>
              </div>

              {/* Flagged Projects Section */}
              {generatedReport.criticalProjects && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    High-Priority Vigilance Cases for District Magistrate
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 font-semibold border-b border-slate-200">
                        <th className="p-2">Project ID & Title</th>
                        <th className="p-2">Executing Agency</th>
                        <th className="p-2">Sanctioned</th>
                        <th className="p-2 text-right">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {generatedReport.criticalProjects.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2 font-medium">{p.title}</td>
                          <td className="p-2 text-slate-600">{p.agencyName}</td>
                          <td className="p-2 font-mono">₹{(p.sanctionedAmount / 1e7).toFixed(2)} Cr</td>
                          <td className="p-2 text-right font-mono font-bold text-rose-600">
                            {p.riskScore.compositeScore}/100
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Formal Certification / Footer Signoff */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-xs text-slate-600">
                <div>
                  <div>System Audit Hash: <span className="font-mono text-[10px]">a7f98c4d21e0b...</span></div>
                  <div>Certified by: MPLADS Sentinel Autonomous Oversight Node</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800">For District Vigilance & Monitoring Committee</div>
                  <div className="text-[11px] text-slate-400 mt-4">Authorized Signature & Office Seal</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
          Select parameters and click "Generate Report" to compile statutory document.
        </div>
      )}
    </div>
  );
};

