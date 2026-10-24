import React, { useState } from 'react';
import { ProjectItem, FieldInspectionRecord } from '../types';
import {
  AuditTimelineItem,
  PdfExportOptions,
  exportAndDownloadProjectAuditHistoryPdf,
} from '../utils/pdfGenerator';
import { openPrintPreview } from '../utils/printService';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Share2,
  Eye,
  Sliders,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem;
  auditTimeline: AuditTimelineItem[];
  fieldInspection: FieldInspectionRecord | null;
  dossierHash: string;
  qrDataUrl: string;
  onDownloadPdf: (options: PdfExportOptions) => void;
  isExporting: boolean;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  project,
  auditTimeline = [],
  fieldInspection = null,
  dossierHash = '',
  qrDataUrl = '',
  onDownloadPdf,
  isExporting = false,
}) => {
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeRisk, setIncludeRisk] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeInspection, setIncludeInspection] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [previewTab, setPreviewTab] = useState<'options' | 'preview'>('options');

  if (!isOpen) return null;

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const utilizationRate =
    project.releasedAmount > 0
      ? Math.round((project.utilizedAmount / project.releasedAmount) * 100)
      : 0;

  const handleDownload = () => {
    onDownloadPdf({
      includeFinancialBreakdown: includeFinancials,
      includeRiskAnalysis: includeRisk,
      includeAuditTimeline: includeTimeline,
      includeFieldInspection: includeInspection,
      dossierHash,
      qrDataUrl,
      fieldInspection,
    });
  };

  const handleCopySummary = () => {
    const summary = `=====================================================
GOVERNMENT OF INDIA • STATUTORY PROJECT AUDIT DOSSIER
Ministry of Statistics & Programme Implementation (MoSPI)
MPLADS Sentinel Vigilance Directorate
=====================================================
Project Title: ${project.title}
Sanction Ref: ${project.id}
Constituency: ${project.constituencyName} (${project.stateName})
Hon. MP: ${project.mpName || 'Lok Sabha Member'}

[FINANCIAL LEDGER]
Sanctioned Amount: ${formatCurrency(project.sanctionedAmount)}
Treasury Released: ${formatCurrency(project.releasedAmount)}
Utilized Amount:   ${formatCurrency(project.utilizedAmount)} (${utilizationRate}% Expenditure)
Executing Agency:  ${project.agencyName}
Awarded Vendor:    ${project.vendorName} ${project.vendorBlacklisted ? '[ALERT: BLACKLISTED]' : ''}

[STATUTORY COMPLIANCE & VIGILANCE]
Composite Risk Score: ${project.riskScore.compositeScore}/100
Status: ${project.status.replace('_', ' ').toUpperCase()}
Verification Status: ${project.verifiedStatus ? project.verifiedStatus.replace('_', ' ').toUpperCase() : 'ROUTINE MONITORING'}
GPS Coordinates: ${project.location.lat.toFixed(5)}° N, ${project.location.lng.toFixed(5)}° E

[DIGITAL CERTIFICATION]
Cryptographic SHA-256 Hash: ${dossierHash}
Certified under Section 65B of the Indian Evidence Act, 1872.
Verified via MoSPI MPLADS National Sentinel Platform.`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2500);
      }).catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between relative">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                Government of India • MoSPI Statutory Record
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Export Official Project PDF Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  .PDF
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate digitally certified documentation for official inter-departmental sharing, state vigilance, and parliamentary inquiries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-header Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewTab('options')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'options'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders size={13} />
              <span>Report Options</span>
            </button>
            <button
              onClick={() => setPreviewTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                previewTab === 'preview'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={13} />
              <span>Executive Brief Preview</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
              {project.id}
            </span>
            <RiskBadge score={project.riskScore.compositeScore} />
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed flex-1">
          {previewTab === 'options' ? (
            <>
              {/* Project Card Snapshot */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{project.title}</span>
                  <StatusBadge status={project.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Constituency:</span>
                    <div className="font-semibold text-slate-800">{project.constituencyName}, {project.stateName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Sanctioned Budget:</span>
                    <div className="font-semibold text-slate-800">{formatCurrency(project.sanctionedAmount)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Reported Utilization:</span>
                    <div className="font-semibold text-slate-800">{formatCurrency(project.utilizedAmount)} ({utilizationRate}%)</div>
                  </div>
                </div>
              </div>

              {/* Section Checkboxes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Select Report Modules to Include in PDF
                  </h4>
                  <span className="text-[10px] text-slate-500">All modules digitally signed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Module 1: Financial Ledger */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={includeFinancials}
                      onChange={(e) => setIncludeFinancials(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Financial Audit &amp; Ledger</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Sanctioned vs released tranches, unspent balance, executing agency and vendor debarment check.
                      </p>
                    </div>
                  </label>

                  {/* Module 2: AI Vigilance & Risk */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={includeRisk}
                      onChange={(e) => setIncludeRisk(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>AI Vigilance &amp; Satellite Truth</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Composite risk index (6-factor breakdown) and ISRO Sentinel-2 spectral verification data.
                      </p>
                    </div>
                  </label>

                  {/* Module 3: Chronological Audit Trail */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={includeTimeline}
                      onChange={(e) => setIncludeTimeline(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Statutory Audit Milestones</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chronological chain of administrative sanctions, PFMS tranches, and ground events ({auditTimeline.length} events).
                      </p>
                    </div>
                  </label>

                  {/* Module 4: Field Ground Inspection */}
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                    <input
                      type="checkbox"
                      checked={includeInspection}
                      onChange={(e) => setIncludeInspection(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>Field Ground Inspection (GI-4)</span>
                        {fieldInspection && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Logged
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Inspector credentials, physical progress %, geofenced findings, and quality directives.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Digital Verification & Legal Standards Notice */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start gap-3 text-xs">
                <div className="bg-white p-1 rounded border border-blue-200 shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Verification" className="w-12 h-12 object-contain" />
                  ) : (
                    <QrCode size={36} className="text-blue-700" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-700" />
                    <span className="font-bold text-blue-950">Statutory Digital Seal &amp; Cryptographic Hash</span>
                  </div>
                  <div className="font-mono text-[10px] text-blue-900 break-all bg-white/80 px-2 py-0.5 rounded border border-blue-200">
                    {dossierHash}
                  </div>
                  <p className="text-[10px] text-blue-800">
                    The exported PDF includes an embedded verification QR code and SHA-256 seal certified under Section 65B of the Indian Evidence Act, 1872.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Executive Briefing Text Preview */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  Official Executive Briefing Memo (Ready to Share)
                </span>
                <button
                  onClick={handleCopySummary}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedSummary ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedSummary ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                {`GOVERNMENT OF INDIA • STATUTORY PROJECT AUDIT DOSSIER
Ministry of Statistics & Programme Implementation (MoSPI)
MPLADS Sentinel Vigilance Directorate
-----------------------------------------------------
PROJECT: ${project.title}
SANCTION REF: ${project.id}
CONSTITUENCY: ${project.constituencyName} (${project.stateName})
HON. MP: ${project.mpName || 'Lok Sabha Member'}

FINANCIAL AUDIT:
• Sanctioned Amount: ${formatCurrency(project.sanctionedAmount)}
• Treasury Released: ${formatCurrency(project.releasedAmount)}
• Utilized Amount:   ${formatCurrency(project.utilizedAmount)} (${utilizationRate}% Expenditure)
• Executing Agency:  ${project.agencyName}
• Awarded Vendor:    ${project.vendorName} ${project.vendorBlacklisted ? '[BLACKLISTED]' : ''}

COMPLIANCE & VIGILANCE:
• Composite Risk Score: ${project.riskScore.compositeScore}/100
• Execution Status: ${project.status.toUpperCase()}
• GPS Coordinates: ${project.location.lat.toFixed(5)}° N, ${project.location.lng.toFixed(5)}° E
• Cryptographic Seal: ${dossierHash}

Certified for official distribution under Section 65B of Evidence Act.`}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                exportAndDownloadProjectAuditHistoryPdf(project, {
                  dossierHash,
                  qrDataUrl,
                  fieldInspection,
                  includeAiRiskBreakdown: true,
                  includeFinancialLedger: true,
                  includeSatelliteObservations: true,
                  includeFieldInspection: true,
                });
                onClose();
              }}
              className="px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Download complete chronological project audit history as a standalone PDF dossier (Form AT-8)"
            >
              <Download size={14} className="text-indigo-600" />
              <span>Full Audit History (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Copy formatted plain-text briefing summary for WhatsApp, Email, or official notes"
            >
              {copiedSummary ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copiedSummary ? 'Summary Copied!' : 'Copy Brief'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDownloadPdf({
                  includeFinancialBreakdown: includeFinancials,
                  includeRiskAnalysis: includeRisk,
                  includeAuditTimeline: includeTimeline,
                  includeFieldInspection: includeInspection,
                  dossierHash,
                  qrDataUrl,
                  fieldInspection,
                  autoPrint: true,
                });
                openPrintPreview({
                  title: `STATUTORY PROJECT AUDIT DOSSIER — ${project.id}`,
                  subtitle: `${project.title} • ${project.constituencyName}, ${project.stateName}`,
                  referenceId: `MPLADS-DOC-${project.id}-${new Date().getFullYear()}`,
                  badgeText: `RISK: ${project.riskScore.compositeScore}/100`,
                  fileNamePrefix: `MPLADS_Project_Print_${project.id}`,
                  kpiCards: [
                    { label: 'Sanctioned Outlay', value: formatCurrency(project.sanctionedAmount), sub: 'Approved Action Plan' },
                    { label: 'Treasury Released', value: formatCurrency(project.releasedAmount), sub: 'PFMS Tranche' },
                    { label: 'Reported Utilized', value: formatCurrency(project.utilizedAmount), sub: `${utilizationRate}% Expenditure` },
                    { label: 'Composite Risk', value: `${project.riskScore.compositeScore}/100`, sub: project.status.toUpperCase() },
                  ],
                  metadataRows: [
                    ['Project Title', project.title],
                    ['Sanction Reference', project.id],
                    ['Hon. Member of Parliament', project.mpName || 'Lok Sabha Member'],
                    ['Constituency / District', `${project.constituencyName} (${project.districtName}, ${project.stateName})`],
                    ['Executing Agency', project.agencyName],
                    ['Awarded Contractor', `${project.vendorName} ${project.vendorBlacklisted ? '[BLACKLISTED]' : ''}`],
                    ['GPS Coordinates', `${project.location.lat.toFixed(5)}° N, ${project.location.lng.toFixed(5)}° E`],
                  ],
                  sections: [
                    {
                      heading: 'Statutory Audit Milestones & Timeline',
                      table: {
                        headers: ['Milestone Event', 'Date', 'Authority / Actor', 'Detail'],
                        rows: auditTimeline.map((t) => [t.title, t.date, t.actor, t.detail]),
                      },
                    },
                  ],
                });
              }}
              className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Open print preview & download print-ready A4 PDF"
            >
              <Printer size={14} className="text-slate-600" />
              <span>Print System Dialog</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF Report (.pdf)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
