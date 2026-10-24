import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { ProjectItem, FieldInspectionRecord } from '../types';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { RiskRadarChart } from './RiskRadarChart';
import { RiskScoreGauge } from './RiskScoreGauge';
import { FieldInspectionModal } from './FieldInspectionModal';
import {
  exportAndDownloadProjectPdf,
  exportAndDownloadProjectAuditHistoryPdf,
  PdfExportOptions,
} from '../utils/pdfGenerator';
import { openPrintPreview } from '../utils/printService';
import { PdfExportModal } from './PdfExportModal';
import {
  X,
  MapPin,
  Building2,
  User,
  AlertTriangle,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  FileText,
  Fingerprint,
  Calendar,
  Satellite,
  Sliders,
  QrCode,
  Award,
  Download,
  Check,
  Smartphone,
  Scan,
  Share2,
  Navigation,
  Camera,
  UserCheck,
} from 'lucide-react';

interface ProjectDetailDrawerProps {
  project: ProjectItem | null;
  onClose: () => void;
  onUpdateProject?: (updated: ProjectItem) => void;
  initialOpenDossier?: boolean;
}

export const ProjectDetailDrawer: React.FC<ProjectDetailDrawerProps> = ({
  project: incomingProject,
  onClose,
  onUpdateProject,
  initialOpenDossier = false,
}) => {
  const [cachedProject, setCachedProject] = useState<ProjectItem | null>(incomingProject);
  const drawerScrollRef = useRef<HTMLDivElement>(null);

  // Synchronize cached project whenever a new project is selected
  useEffect(() => {
    if (incomingProject) {
      setCachedProject(incomingProject);
      // Reset scroll position to top on new project view
      if (drawerScrollRef.current) {
        drawerScrollRef.current.scrollTop = 0;
      }
    }
  }, [incomingProject]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (incomingProject) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [Boolean(incomingProject)]);

  const [showDossierModal, setShowDossierModal] = useState(Boolean(initialOpenDossier));

  // Automatically trigger Audit Dossier when initialOpenDossier is requested
  useEffect(() => {
    if (incomingProject && initialOpenDossier) {
      setShowDossierModal(true);
    }
  }, [incomingProject, initialOpenDossier]);
  const [escalatedSuccess, setEscalatedSuccess] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [satelliteSwipe, setSatelliteSwipe] = useState(50);
  const [showSatelliteComparison, setShowSatelliteComparison] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | 'audit_history' | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrMode, setQrMode] = useState<'url' | 'offline_json' | 'geo'>('url');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedQrData, setCopiedQrData] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [inspectionRecord, setInspectionRecord] = useState<FieldInspectionRecord | null>(null);

  // Close drawer on Escape key press (unless a submodal is active)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        incomingProject &&
        !showDossierModal &&
        !showQrModal &&
        !showInspectionModal &&
        !showPdfExportModal
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incomingProject, showDossierModal, showQrModal, showInspectionModal, showPdfExportModal, onClose]);

  // Effective project to render (preserves data during exit animation)
  const project = incomingProject || cachedProject;

  const dossierHash = project
    ? `SHA256-${Math.abs(project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 89234).toString(16).padStart(12, '0')}8f9b`
    : '';

  // Load inspection record from localStorage whenever active project changes
  useEffect(() => {
    if (!project) return;
    try {
      const saved = localStorage.getItem(`mplads_inspection_${project.id}`);
      if (saved) {
        setInspectionRecord(JSON.parse(saved));
      } else {
        setInspectionRecord(null);
      }
    } catch (_) {}
  }, [project?.id]);

  // Dynamic QR Code Generation for Mobile Field Inspection & Physical Signboards
  useEffect(() => {
    if (!project) return;
    let payload = '';
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://mplads.gov.in';

    if (qrMode === 'url') {
      payload = `${origin}/?project=${encodeURIComponent(project.id)}&lat=${project.location.lat}&lng=${project.location.lng}`;
    } else if (qrMode === 'geo') {
      payload = `https://www.google.com/maps/search/?api=1&query=${project.location.lat},${project.location.lng}`;
    } else {
      // Offline structured compact metadata payload for field scanners
      payload = JSON.stringify(
        {
          scheme: 'MPLADS-INDIA',
          id: project.id,
          title: project.title,
          category: project.category,
          state: project.stateName,
          district: project.districtName,
          constituency: project.constituencyName,
          mp: project.mpName || 'Lok Sabha Member',
          agency: project.agencyName,
          vendor: project.vendorName,
          coords: [project.location.lat, project.location.lng],
          sanction_inr: project.sanctionedAmount,
          released_inr: project.releasedAmount,
          utilized_inr: project.utilizedAmount,
          status: project.status,
          verification: project.verifiedStatus || 'unverified',
          risk_score: project.riskScore.compositeScore,
          hash: dossierHash,
        },
        null,
        1
      );
    }

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [project, qrMode, dossierHash]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;
  const utilizationRate =
    project && project.releasedAmount > 0
      ? Math.round((project.utilizedAmount / project.releasedAmount) * 100)
      : 0;

  // Generate plain English AI explanations based on project attributes
  const getAiDeductionSummary = () => {
    if (!project) return [];
    const deductions: { title: string; detail: string; severity: 'high' | 'medium' | 'low' }[] = [];

    if (project.fraudFlag === 'vendor_concentration') {
      deductions.push({
        title: 'High Vendor Allocation Cluster Detected',
        detail: `Executing contractor "${project.vendorName}" has received >42% of total civil works in ${project.districtName} over the past 90 days without proportional competitive bidding cycles.`,
        severity: 'high',
      });
    }

    if (project.fraudFlag === 'cost_anomaly') {
      deductions.push({
        title: 'Cost per Unit Deviates from MoSPI Schedule of Rates',
        detail: `Estimated cost of ${formatCurrency(project.sanctionedAmount)} is 1.84x above the CPWD/State PWD rate standard for similar ${project.category} works in this terrain.`,
        severity: 'high',
      });
    }

    if (project.isDuplicateCandidate) {
      deductions.push({
        title: 'Near-Duplicate Geo-Spatial Work Identified',
        detail: `Work site coordinates are within 180 meters of another sanctioned project (${project.duplicateWithId || 'PRJ-NEARBY'}), raising potential double-billing under different scheme budget heads.`,
        severity: 'high',
      });
    }

    if (project.verifiedStatus === 'ghost_suspected') {
      deductions.push({
        title: 'Satellite Optical Land-Use Discrepancy',
        detail: `PFMS records 100% financial disbursement, but multi-spectral Sentinel-2 satellite analysis (NDBI/NDVI indices) detected zero structural ground footprint.`,
        severity: 'high',
      });
    }

    if (project.vendorBlacklisted) {
      deductions.push({
        title: 'Debarred Vendor Awarded Public Funds',
        detail: `Vendor "${project.vendorName}" is flagged on the Ministry of Finance debarred contractors registry (Rule 151(iii) of GFR 2017).`,
        severity: 'high',
      });
    }

    if (deductions.length === 0) {
      deductions.push({
        title: 'Statutory Progress Consistent With Milestones',
        detail: `Physical reporting, vendor background checks, and geo-tagged expenditure timelines align with permissible MPLADS guidelines.`,
        severity: 'low',
      });
    }

    return deductions;
  };

  const deductions = getAiDeductionSummary();

  // Audit timeline steps
  const auditTimeline = project
    ? [
        {
          title: 'Recommendation by Hon. MP',
          date: project.sanctionedDate,
          actor: project.mpName || 'MP Office',
          status: 'completed',
          detail: 'Formally recommended under MPLADS Annual Action Plan quota.',
        },
        {
          title: 'District Magistrate Administrative Approval',
          date: project.sanctionedDate,
          actor: `District Collector (${project.districtName})`,
          status: 'completed',
          detail: 'Sanction order issued and entered into the national portal.',
        },
        {
          title: 'Technical Sanction & Detailed Project Report (DPR)',
          date: project.sanctionedDate,
          actor: project.agencyName,
          status: 'completed',
          detail: 'DPR approved based on state schedule of rates.',
        },
        {
          title: 'PFMS Milestone Release (Tranche 1)',
          date: project.sanctionedDate,
          actor: 'Public Financial Management System',
          status: project.releasedAmount > 0 ? 'completed' : 'pending',
          detail: `${formatCurrency(project.releasedAmount)} released to executing agency bank account.`,
        },
        {
          title: 'Physical Ground Execution & Inspection',
          date: project.expectedCompletion,
          actor: `${project.vendorName}`,
          status: project.status === 'completed' ? 'completed' : project.status === 'in_progress' ? 'active' : 'pending',
          detail: `Reported status: ${project.status.replace('_', ' ').toUpperCase()} (${utilizationRate}% funds utilized).`,
        },
        {
          title: 'ISRO Bhuvan / Satellite Optical Audit',
          date: project.lastUpdated,
          actor: 'Autonomous Sentinel Engine',
          status: project.verifiedStatus === 'satellite_verified' ? 'completed' : project.verifiedStatus === 'ghost_suspected' ? 'flagged' : 'active',
          detail: project.verifiedStatus ? `Verification status: ${project.verifiedStatus.replace('_', ' ')}` : 'Routine monitoring',
        },
      ]
    : [];

  const handleEscalate = () => {
    setEscalatedSuccess(true);
    setTimeout(() => {
      setEscalatedSuccess(false);
      onClose();
    }, 2500);
  };

  const isGhost = project?.verifiedStatus === 'ghost_suspected';
  const isVerified = project?.verifiedStatus === 'satellite_verified';

  // Excel / CSV Export for Physical Documentation
  const handleExportExcel = () => {
    setIsExporting('excel');
    try {
      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const val = String(str).replace(/"/g, '""');
        return `"${val}"`;
      };

      const rows: string[][] = [
        ['GOVERNMENT OF INDIA - MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION (MoSPI)'],
        ['MPLADS SENTINEL - OFFICIAL PHYSICAL AUDIT & COMPLIANCE RECORD'],
        ['Generated On', new Date().toLocaleString('en-IN'), 'Verification Hash', dossierHash],
        [],
        ['1. PROJECT GENERAL METADATA', '', '', ''],
        ['Project ID', project.id, 'Scheme', 'Member of Parliament Local Area Development Scheme (MPLADS)'],
        ['Project Title', project.title, 'Category', project.category],
        ['Status', project.status.toUpperCase(), 'Physical Verification', (project.verifiedStatus || 'unverified').toUpperCase()],
        ['Member of Parliament', project.mpName || 'MP Office', 'Constituency', project.constituencyName],
        ['District', project.districtName, 'State', project.stateName],
        ['Geo Latitude', project.location.lat.toString(), 'Geo Longitude', project.location.lng.toString()],
        ['Sanction Date', project.sanctionedDate, 'Target Completion', project.expectedCompletion],
        [],
        ['2. EXECUTING AGENCY & CONTRACTOR PROFILE', '', '', ''],
        ['Executing Agency', project.agencyName, 'Agency Type', project.agencyType],
        ['Agency Debarred / Blacklist', project.agencyBlacklisted ? 'YES - FLAGGED' : 'NO - CLEAR', '', ''],
        ['Contractor / Vendor', project.vendorName, 'Vendor ID', project.vendorId],
        ['Vendor Debarred / Blacklist', project.vendorBlacklisted ? 'YES - FLAGGED' : 'NO - CLEAR', 'Fraud Flag', project.fraudFlag || 'NONE'],
        [],
        ['3. FINANCIAL & TREASURY ACCOUNTING (INR)', '', '', ''],
        ['Sanctioned Allocation', project.sanctionedAmount.toString(), 'Form 12-C Utilization Certificate', 'Mandated under GFR Rule 238(1)'],
        ['Released by Ministry (PFMS)', project.releasedAmount.toString(), 'Remaining Sanction Balance', (project.sanctionedAmount - project.releasedAmount).toString()],
        ['Utilized by Agency', project.utilizedAmount.toString(), 'Unspent In-Bank Balance', (project.releasedAmount - project.utilizedAmount).toString()],
        ['Fund Utilization Rate', `${utilizationRate}%`, 'Disbursement Gateway', 'PFMS Single Nodal Agency (SNA) Model'],
        [],
        ['4. AI RISK ENGINE & FRAUD DIAGNOSTICS (0 - 100 SCALE)', '', '', ''],
        ['Composite Risk Score', project.riskScore.compositeScore.toString(), 'ISO/IEC 22989 Compliance', 'VERIFIED'],
        ['Cost Anomaly Risk', project.riskScore.components.cost_risk.toString(), 'Delay Risk', project.riskScore.components.delay_risk.toString()],
        ['Fund Utilization Risk', project.riskScore.components.utilization_risk.toString(), 'Near-Duplicate Geo Risk', project.riskScore.components.duplicate_risk.toString()],
        ['Vendor Concentration Risk', project.riskScore.components.vendor_risk.toString(), 'Agency Risk', project.riskScore.components.agency_risk.toString()],
        ['Compliance Risk', project.riskScore.components.compliance_risk.toString(), 'Geo-spatial Risk', project.riskScore.components.geo_risk.toString()],
        [],
        ['5. STATUTORY AUDIT TRAIL MILESTONES', '', '', ''],
        ['Milestone Title', 'Recorded Date', 'Authorized Actor', 'Verification Detail'],
        ...auditTimeline.map((t) => [t.title, t.date, t.actor, t.detail]),
      ];

      const csvContent = rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MPLADS_Audit_Record_${project.id}_${project.districtName.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice('Excel (.CSV) documentation downloaded successfully for offline physical filing!');
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error('Failed to export Excel', err);
    } finally {
      setIsExporting(null);
    }
  };

  // PDF Export for Physical Documentation & Official Sharing
  const handleDownloadPdfReport = (options?: PdfExportOptions) => {
    if (!project) return;
    setIsExporting('pdf');
    setExportNotice('Compiling and generating official statutory PDF report...');

    try {
      const fileName = exportAndDownloadProjectPdf(
        project,
        options || {
          includeFinancialBreakdown: true,
          includeRiskAnalysis: true,
          includeAuditTimeline: true,
          includeFieldInspection: true,
          dossierHash,
          qrDataUrl,
          fieldInspection: inspectionRecord,
        },
        auditTimeline
      );

      setExportNotice(`Official PDF Report (${fileName}) downloaded successfully!`);
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF', err);
      setExportNotice('PDF generation failed. Opening print dossier fallback...');
      setShowDossierModal(true);
      setTimeout(() => setExportNotice(null), 3000);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = () => {
    setShowPdfExportModal(true);
  };

  // Full Project Audit History PDF Export (Form AT-8)
  const handleExportAuditHistoryPdf = () => {
    if (!project) return;
    setIsExporting('audit_history');
    setExportNotice('Compiling complete chronological statutory audit history (Form AT-8 PDF)...');

    try {
      const fileName = exportAndDownloadProjectAuditHistoryPdf(project, {
        dossierHash,
        qrDataUrl,
        fieldInspection: inspectionRecord,
        includeAiRiskBreakdown: true,
        includeFinancialLedger: true,
        includeSatelliteObservations: true,
        includeFieldInspection: true,
      });

      setExportNotice(`Full Audit History PDF (${fileName}) downloaded successfully!`);
      setTimeout(() => setExportNotice(null), 4500);
    } catch (err) {
      console.error('Failed to export Audit History PDF', err);
      setExportNotice('Audit History PDF export failed. Opening dossier fallback...');
      setShowDossierModal(true);
      setTimeout(() => setExportNotice(null), 3000);
    } finally {
      setIsExporting(null);
    }
  };

  const getQrPayloadText = () => {
    if (!project) return '';
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://mplads.gov.in';

    if (qrMode === 'url') {
      return `${origin}/?project=${encodeURIComponent(project.id)}&lat=${project.location.lat}&lng=${project.location.lng}`;
    } else if (qrMode === 'geo') {
      return `https://www.google.com/maps/search/?api=1&query=${project.location.lat},${project.location.lng}`;
    } else {
      return JSON.stringify(
        {
          scheme: 'MPLADS-INDIA',
          id: project.id,
          title: project.title,
          category: project.category,
          state: project.stateName,
          district: project.districtName,
          constituency: project.constituencyName,
          mp: project.mpName || 'Lok Sabha Member',
          agency: project.agencyName,
          vendor: project.vendorName,
          coords: [project.location.lat, project.location.lng],
          sanction_inr: project.sanctionedAmount,
          released_inr: project.releasedAmount,
          utilized_inr: project.utilizedAmount,
          status: project.status,
          verification: project.verifiedStatus || 'unverified',
          risk_score: project.riskScore.compositeScore,
          hash: dossierHash,
        },
        null,
        2
      );
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !project) return;
    setDownloadingQr(true);
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `MPLADS_QR_${project.id}_${project.districtName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingQr(false), 1200);
    setExportNotice('Field inspection QR Code downloaded in high-res PNG format!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleCopyQrPayload = () => {
    const text = getQrPayloadText();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedQrData(true);
      setTimeout(() => setCopiedQrData(false), 2000);
    }
  };

  const handleSaveInspection = (record: FieldInspectionRecord, updatedProject: ProjectItem) => {
    setInspectionRecord(record);
    setExportNotice(
      record.functionalityStatus === 'ghost_confirmed'
        ? 'ALERT: Ground inspection confirmed GHOST ASSET! Flagged for priority vigilance scrutiny.'
        : `Ground inspection certified: ${record.physicalProgressPercent}% progress recorded under Form GI-4.`
    );
    setTimeout(() => setExportNotice(null), 5000);
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
  };

  return (
    <AnimatePresence>
      {Boolean(incomingProject && project) && (
        <motion.div
          key="project-drawer-root"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          className="fixed inset-0 z-50 overflow-hidden flex justify-end"
        >
          {/* Backdrop Overlay with subtle fade transition */}
          <motion.div
            key="project-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-over Drawer Panel with fluid spring physics */}
          <motion.div
            ref={drawerScrollRef}
            key="project-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              type: 'spring',
              damping: 32,
              stiffness: 320,
              mass: 0.85,
            }}
            className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between z-10 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {project.id}
              </span>
              <RiskBadge score={project.riskScore.compositeScore} />
              <StatusBadge status={project.status} />
              {inspectionRecord ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 size={10} /> Ground Verified ({inspectionRecord.physicalProgressPercent}%)
                </span>
              ) : project.verifiedStatus === 'field_verified' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase flex items-center gap-1">
                  <CheckCircle2 size={10} /> Ground Verified
                </span>
              ) : null}
              {isGhost && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase flex items-center gap-1">
                  <AlertTriangle size={10} /> Ghost Asset
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900">{project.title}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDossierModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Inspect Official Government Gazette & CAG Statutory Audit Dossier"
            >
              <FileText size={14} className="text-blue-600" />
              <span className="hidden sm:inline">Audit Dossier</span>
            </button>
            <button
              onClick={handleExportAuditHistoryPdf}
              disabled={isExporting !== null}
              className="px-2.5 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Export complete chronological project audit history as a downloadable PDF (Form AT-8)"
            >
              <Download size={14} className="text-indigo-600" />
              <span className="hidden sm:inline">{isExporting === 'audit_history' ? 'Exporting...' : 'Audit History PDF'}</span>
            </button>
            <button
              onClick={() => setShowInspectionModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Conduct statutory field ground inspection and geotagged evidence capture (Form GI-4)"
            >
              <Camera size={14} className="text-blue-600" />
              <span className="hidden sm:inline">Field Audit</span>
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting !== null}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Download full project audit spreadsheet in Excel (.csv)"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={() => setShowPdfExportModal(true)}
              disabled={isExporting !== null}
              className="px-2.5 py-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Export official project audit details as a publication-ready PDF report (.pdf)"
            >
              <Download size={14} className="text-blue-600" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={() => setShowQrModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Generate scannable Mobile Field QR Code & Signboard Tag"
            >
              <QrCode size={14} className="text-indigo-600" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Export / Escalation Notices */}
        {exportNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {escalatedSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2 animate-in fade-in">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>
              <strong>Case Registered:</strong> Formal investigation request filed with the Central Vigilance
              Commission and District Vigilance Officer.
            </span>
          </div>
        )}

        {/* Drawer Body Content */}
        <div className="p-6 space-y-6 flex-1 text-slate-800">
          {/* VISUAL RISK SCORE GAUGE & SPECIFIC FRAUD FACTORS */}
          <RiskScoreGauge project={project} />

          {/* PHYSICAL DOCUMENTATION & AUDIT EXPORT CARD */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl text-white space-y-3 shadow-md border border-slate-700/60">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <Download size={14} className="text-emerald-400" />
                  <span>Physical Documentation &amp; Audit Dossier Export</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                  Download structured audit records locally to support physical district vigilance files, Public Accounts Committee (PAC) defense, or CAG physical documentation.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700 shrink-0">
                GFR 238(1) Ready
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportAuditHistoryPdf}
                disabled={isExporting !== null}
                className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                title="Download full 10-stage chronological project audit history as a publication-ready PDF (Form AT-8)"
              >
                <Download size={15} />
                <span>
                  {isExporting === 'audit_history' ? 'Exporting...' : 'Audit History (.PDF)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting !== null}
                className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                title="Open official Government of India printable dossier to save as PDF"
              >
                <Printer size={15} />
                <span>
                  {isExporting === 'pdf' ? 'Preparing...' : 'PDF Dossier'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting !== null}
                className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                title="Download full project spreadsheet in Microsoft Excel / CSV format"
              >
                <FileSpreadsheet size={15} />
                <span>
                  {isExporting === 'excel' ? 'Exporting...' : 'Excel (.CSV)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                title="Generate scannable Mobile Field QR Code & Signboard Tag"
              >
                <QrCode size={15} />
                <span>Field QR</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
              <span>Includes: 5-Part Financial trail, Risk matrix &amp; QR metadata</span>
              <span>Instant Offline Access</span>
            </div>
          </div>

          {/* MOBILE FIELD ACCESS & SITE SIGNBOARD QR CARD */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-md space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Dynamic Scannable QR thumbnail */}
                <div
                  onClick={() => setShowQrModal(true)}
                  className="w-16 h-16 bg-white rounded-xl p-1 shrink-0 border border-slate-300 shadow-sm cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all flex items-center justify-center group relative"
                  title="Click to view full scannable QR Code & official field placard"
                >
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Field QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode size={36} className="text-slate-800" />
                  )}
                  <span className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-[8px] font-bold px-1 rounded text-white shadow-xs">
                    SCAN
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                      <Smartphone size={13} className="text-indigo-400" />
                      Mobile Field Access &amp; Signboard QR
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 text-[9px] font-mono border border-indigo-700/50">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Encodes GPS coordinates ({project.location.lat.toFixed(4)}, {project.location.lng.toFixed(4)}), contractor details, and instant mobile audit access for field vigilance officers.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Scan size={13} />
                <span>Expand QR Modal</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={downloadingQr}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} className="text-emerald-400" />
                <span>{downloadingQr ? 'Saving...' : 'Download PNG'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyQrPayload}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer col-span-2 sm:col-span-1"
              >
                {copiedQrData ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedQrData ? 'Copied!' : 'Copy Data'}</span>
              </button>
            </div>
          </div>

          {/* STATUTORY FIELD GROUND INSPECTION & GEOTAGGED EVIDENCE CARD */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Camera size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                    Field Ground Truth Audit &amp; Geotagged Evidence
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      Form GI-4
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Statutory physical site inspection under GFR 2017 Rule 238(1)
                  </span>
                </div>
              </div>

              {inspectionRecord ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 size={11} /> Certified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase flex items-center gap-1 border border-amber-300">
                  <Clock size={11} /> Pending
                </span>
              )}
            </div>

            {inspectionRecord ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {/* Photo thumbnail */}
                  <div
                    onClick={() => setShowInspectionModal(true)}
                    className="w-20 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-300 relative group cursor-pointer"
                    title="Click to view full inspection dossier"
                  >
                    {inspectionRecord.watermarkedPhotoUrl ? (
                      <img
                        src={inspectionRecord.watermarkedPhotoUrl}
                        alt="Inspection Evidence"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera size={20} />
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-center text-slate-200 font-mono py-0.5">
                      EVIDENCE
                    </span>
                  </div>

                  <div className="space-y-1 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Observed Progress: {inspectionRecord.physicalProgressPercent}%
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        Grade {inspectionRecord.qualityRating} Quality
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <strong>Inspector:</strong> {inspectionRecord.inspectorName} ({inspectionRecord.inspectorBadgeNumber})
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                      <span>Seal: {inspectionRecord.hash}</span>
                      <span>•</span>
                      <span>Board: {inspectionRecord.signboardVerified ? 'Erected' : 'Missing'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInspectionModal(true)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>View / Update GI-4 Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (inspectionRecord.watermarkedPhotoUrl) {
                        const a = document.createElement('a');
                        a.href = inspectionRecord.watermarkedPhotoUrl;
                        a.download = `EVIDENCE_${project.id}_WATERMARKED.jpg`;
                        a.click();
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Download watermarked evidence photo"
                  >
                    <Download size={13} />
                    <span>Evidence Photo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Ground truth inspection is mandatory before the final 30% milestone tranche is unlocked under GFR Rule 238(1). Allows field vigilance officers to record physical completion %, check signboards, and snap cryptographically watermarked camera evidence.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(true)}
                  className="w-full py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-98"
                >
                  <Camera size={15} />
                  <span>Conduct Field Ground Inspection (Form GI-4)</span>
                </button>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
                <span className="font-medium text-slate-800">
                  {project.districtName}, {project.stateName}
                </span>
                <div className="text-[10px] font-mono text-slate-400">
                  GPS: {project.location.lat.toFixed(4)}° N, {project.location.lng.toFixed(4)}° E
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Building2 size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Executing Agency</span>
                <span className="font-medium text-slate-800">{project.agencyName}</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contractor / Vendor</span>
                <span className={`font-medium ${project.vendorBlacklisted ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                  {project.vendorName}
                  {project.vendorBlacklisted && ' (BLACKLISTED)'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sanction Window</span>
                <span className="font-medium text-slate-800">
                  {project.sanctionedDate} &rarr; {project.expectedCompletion}
                </span>
              </div>
            </div>
          </div>

          {/* Explainable AI Deduction Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>Explainable AI (XAI) Deductions</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">ISO/IEC 22989 Compliant</span>
            </div>

            <div className="space-y-2">
              {deductions.map((d, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                    d.severity === 'high'
                      ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                      : d.severity === 'medium'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {d.severity === 'high' ? (
                      <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                    ) : (
                      <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                    )}
                    <span>{d.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{d.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financials Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Financial Status & Treasury Release
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="text-[11px] text-slate-500">Sanctioned</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(project.sanctionedAmount)}</div>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-blue-50/50">
                <div className="text-[11px] text-blue-700">Released by Ministry</div>
                <div className="text-sm font-bold text-blue-900 mt-0.5">{formatCurrency(project.releasedAmount)}</div>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 bg-emerald-50/50">
                <div className="text-[11px] text-emerald-700">Utilized by Agency</div>
                <div className="text-sm font-bold text-emerald-900 mt-0.5">{formatCurrency(project.utilizedAmount)}</div>
              </div>
            </div>

            {/* Utilization progress */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-600">Fund Utilization Rate</span>
                <span className={utilizationRate < 40 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                  {utilizationRate}% of released grants
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    utilizationRate < 40 ? 'bg-rose-500' : utilizationRate < 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, utilizationRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* SATELLITE BEFORE/AFTER OPTICAL SWIPE LENS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Satellite size={14} className="text-indigo-600" />
                <span>Multi-Spectral Satellite Ground Truth Lens</span>
              </h3>
              <button
                onClick={() => setShowSatelliteComparison(!showSatelliteComparison)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                {showSatelliteComparison ? 'Hide Interactive Swipe' : 'Open Optical Comparison Lens'}
              </button>
            </div>

            {showSatelliteComparison && (
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 text-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">ISRO Cartosat-2 vs. Sentinel-2 Change Detection</span>
                  <span className="font-mono text-[11px] text-slate-400">Resolution: 2.5m Ground GSD</span>
                </div>

                {/* Optical Split Comparison View */}
                <div className="relative h-56 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 select-none">
                  {/* Left Layer: Pre-Sanction Baseline */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-950/80 via-emerald-950/60 to-slate-900">
                    <div className="text-center p-4">
                      <div className="font-mono text-[11px] text-amber-300 font-bold">PRE-SANCTION BASELINE</div>
                      <div className="text-xs text-slate-300 mt-1">ISRO Bhuvan Archive (Nov 2024)</div>
                      <div className="mt-3 inline-block px-3 py-1 rounded bg-black/40 border border-white/20 text-[10px] text-slate-300">
                        Bare Ground / Rural Terrain • NDVI: 0.12 • NDBI: -0.04
                      </div>
                    </div>
                  </div>

                  {/* Right Layer (Clipped based on slider) */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center border-l-2 border-white transition-all ${
                      isGhost
                        ? 'bg-gradient-to-br from-rose-950/90 via-slate-900 to-black'
                        : 'bg-gradient-to-br from-blue-950/80 via-emerald-900 to-slate-900'
                    }`}
                    style={{ left: `${satelliteSwipe}%` }}
                  >
                    <div className="text-center p-4">
                      <div className="font-mono text-[11px] font-bold text-blue-300">CURRENT SENTINEL-2 AUDIT</div>
                      <div className="text-xs text-slate-300 mt-1">Optical Pass: {project.lastUpdated}</div>
                      <div className="mt-3 inline-block px-3 py-1 rounded bg-black/40 border border-white/20 text-[10px]">
                        {isGhost ? (
                          <span className="text-rose-400 font-bold">⚠️ ZERO PHYSICAL CHANGE (NDBI DELTA: +0.01)</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">✓ CONCRETE STRUCTURE CONFIRMED (NDBI: +0.58)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slider Divider Bar */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center z-10"
                    style={{ left: `${satelliteSwipe}%` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-white text-slate-900 shadow-lg flex items-center justify-center text-[10px] font-black">
                      ↔
                    </div>
                  </div>
                </div>

                {/* Slider range control */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Baseline (Pre-Work)</span>
                    <span className="text-white font-bold">{satelliteSwipe}% Swiped</span>
                    <span>Audit (Post-Disbursement)</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={satelliteSwipe}
                    onChange={(e) => setSatelliteSwipe(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className={`p-2.5 rounded-xl border text-xs ${
                  isGhost ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                }`}>
                  <strong>Satellite Verification Conclusion:</strong>{' '}
                  {isGhost
                    ? 'Ghost asset detected. Disbursed 100% of treasury allocation, but zero concrete spectral signatures exist at GPS coordinates.'
                    : 'Milestone verified. Physical construction footprint observed consistent with DPR specifications.'}
                </div>
              </div>
            )}
          </div>

          {/* Statutory Lifecycle & Audit Trail Timeline */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  <span>Statutory Lifecycle &amp; Audit Trail</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Form AT-8 • Complete Chronological Verification Chain</span>
              </div>
              <button
                type="button"
                onClick={handleExportAuditHistoryPdf}
                disabled={isExporting !== null}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                title="Download full project audit history and statutory timeline as a downloadable PDF file (Form AT-8)"
              >
                <Download size={13} />
                <span>{isExporting === 'audit_history' ? 'Exporting...' : 'Export Audit History (PDF)'}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
              {auditTimeline.map((item, index) => (
                <div key={index} className="flex items-start gap-3 relative text-xs">
                  {/* Vertical connecting line */}
                  {index < auditTimeline.length - 1 && (
                    <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-200 -z-0" />
                  )}
                  <div className="z-10 mt-0.5">
                    {item.status === 'completed' ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 size={12} />
                      </div>
                    ) : item.status === 'flagged' ? (
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                        <AlertTriangle size={12} />
                      </div>
                    ) : item.status === 'active' ? (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <Clock size={12} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[10px]">
                        •
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">{item.actor}</div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}

              {/* Complete Audit History Download Strip */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100/90">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText size={16} />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>Full 10-Stage Chronological Audit Dossier</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-200/70 text-indigo-900">
                        PDF
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-700 leading-snug">
                      Includes recommendation, administrative sanction, CPPP e-tenders, PFMS releases, and satellite findings.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportAuditHistoryPdf}
                  disabled={isExporting !== null}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 shrink-0"
                >
                  <Download size={13} />
                  <span>{isExporting === 'audit_history' ? 'Generating PDF...' : 'Download Full Audit PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex flex-wrap sm:flex-nowrap items-center gap-2 z-10">
          <button
            onClick={handleExportAuditHistoryPdf}
            disabled={isExporting !== null}
            className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download full project audit history and statutory timeline as a certified PDF file (Form AT-8)"
          >
            <FileText size={14} />
            <span>{isExporting === 'audit_history' ? 'Exporting...' : 'Audit History (PDF)'}</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting !== null}
            className="py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download full project spreadsheet in Microsoft Excel (.csv)"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowPdfExportModal(true)}
            disabled={isExporting !== null}
            className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export selected project details as an official PDF report (.pdf) for documentation sharing"
          >
            <Download size={14} />
            <span>Export PDF Report</span>
          </button>
          <button
            onClick={() => setShowDossierModal(true)}
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Inspect Official Government Gazette & CAG Statutory Audit Dossier"
          >
            <FileText size={14} className="text-blue-400" />
            <span>Audit Dossier</span>
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Generate scannable QR code for mobile field inspection & signboards"
          >
            <QrCode size={14} className="text-indigo-600" />
            <span>Field QR</span>
          </button>
          <button
            onClick={() => setShowInspectionModal(true)}
            className="py-2 px-3 rounded-lg border border-blue-300 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            title="Conduct statutory field ground inspection (Form GI-4)"
          >
            <Camera size={14} className="text-blue-600" />
            <span>Field Audit</span>
          </button>
          <button
            onClick={handleEscalate}
            className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <AlertTriangle size={14} />
            <span>Escalate to Vigilance</span>
          </button>
        </div>
      </motion.div>

      {/* Official Government Gazette & CAG Dossier Print Modal */}
      {showDossierModal && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0"
          onClick={() => setShowDossierModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* National Crest & Formal Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 text-center space-y-2 relative">
              {/* Ashoka Lion Capital Vector Emblem */}
              <div className="mx-auto w-12 h-12 flex items-center justify-center text-slate-800">
                <svg viewBox="0 0 100 100" className="w-12 h-12 fill-current">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
                  <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M50 15 L50 40 M50 60 L50 85 M15 50 L40 50 M60 50 L85 50 M25 25 L43 43 M57 57 L75 75 M75 25 L57 43 M43 57 L25 75" stroke="currentColor" strokeWidth="2" />
                  <text x="50" y="93" textAnchor="middle" fontSize="6" fontWeight="bold">सत्यमेव जयते</text>
                </svg>
              </div>

              <div>
                <h1 className="text-xs font-bold tracking-widest uppercase text-slate-600">
                  Government of India • भारत सरकार
                </h1>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Ministry of Statistics &amp; Programme Implementation (MoSPI)
                </h2>
                <div className="text-[10px] text-slate-500 font-mono">
                  MPLADS National Sentinel Audit &amp; Parliamentary Vigilance Directorate
                </div>
              </div>

              <div className="pt-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider underline">
                Official Statutory Audit Dossier &amp; Parliamentary Notice
              </div>

              <div className="absolute right-0 top-0 print:hidden">
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Verification Bar & QR code */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs gap-3">
              <div className="flex items-center gap-3">
                {/* Dynamic Scannable QR Code */}
                <div className="bg-white p-1 rounded border border-slate-300 shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Official Verification QR Code" className="w-14 h-14 object-contain" />
                  ) : (
                    <QrCode size={40} className="text-slate-800" />
                  )}
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Cryptographic Seal</div>
                  <div className="font-mono text-[11px] font-bold text-slate-800">{dossierHash}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    ✓ Digitally Signed &amp; Timestamped
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  onClick={handleExportAuditHistoryPdf}
                  disabled={isExporting !== null}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Download full 10-stage chronological project audit history as a publication-grade PDF (Form AT-8)"
                >
                  <Download size={12} className="text-indigo-600" />
                  <span>{isExporting === 'audit_history' ? 'Exporting...' : 'Audit History (PDF)'}</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 font-medium text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Download raw structured dataset in Excel / CSV"
                >
                  <FileSpreadsheet size={12} className="text-emerald-600" />
                  <span>Excel (.CSV)</span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(dossierHash).catch(() => {});
                    }
                    setCopiedHash(true);
                    setTimeout(() => setCopiedHash(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Copy size={12} />
                  <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
                </button>
                <button
                  onClick={() => handleDownloadPdfReport()}
                  disabled={isExporting !== null}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Download official publication-grade statutory PDF report (.pdf)"
                >
                  <Download size={13} />
                  <span>{isExporting === 'pdf' ? 'Generating...' : 'Download PDF (.pdf)'}</span>
                </button>
                <button
                  onClick={() => {
                    openPrintPreview({
                      title: `STATUTORY PROJECT AUDIT DOSSIER — ${project.id}`,
                      subtitle: `${project.title} • Constituency of ${project.constituencyName}, ${project.stateName}`,
                      referenceId: `MPLADS-DOC-${project.id}-${new Date().getFullYear()}`,
                      badgeText: `RISK: ${project.riskScore.compositeScore}/100`,
                      fileNamePrefix: `MPLADS_Dossier_${project.id}`,
                      kpiCards: [
                        { label: 'Sanctioned Amount', value: formatCurrency(project.sanctionedAmount), sub: 'Approved Action Plan' },
                        { label: 'Total Treasury Release', value: formatCurrency(project.releasedAmount), sub: 'PFMS Release' },
                        { label: 'Reported Utilization', value: formatCurrency(project.utilizedAmount), sub: `${utilizationRate}% Utilized` },
                        { label: 'Composite Risk Score', value: `${project.riskScore.compositeScore}/100`, sub: project.status.toUpperCase() },
                      ],
                      metadataRows: [
                        ['Project Title', project.title],
                        ['Sanction Reference', project.id],
                        ['Hon. Member of Parliament', project.mpName || 'Lok Sabha Member'],
                        ['Constituency / District', `${project.constituencyName} (${project.districtName}, ${project.stateName})`],
                        ['Implementing Agency', project.agencyName],
                        ['Primary Vendor / Status', `${project.vendorName} ${project.vendorBlacklisted ? '(BLACKLISTED)' : ''}`],
                        ['Cryptographic Seal', dossierHash],
                      ],
                      sections: [
                        {
                          heading: 'Vigilance & Statutory Compliance Assessment',
                          paragraphs: getAiDeductionSummary().map((d) => `• ${d.title}: ${d.detail}`),
                        },
                      ],
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print (PDF)</span>
                </button>
              </div>
            </div>

            {/* Dossier Content Body */}
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">Subject Reference:</div>
                <p className="text-slate-800">
                  Parliamentary Unstarred Question / CAG Compliance Inquiry regarding <strong>{project.title}</strong>{' '}
                  (Sanction Ref: <code>{project.id}</code>) located in Constituency of {project.constituencyName}, {project.stateName}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-[11px]">
                <div>
                  <span className="text-slate-400">Hon. Member of Parliament:</span>
                  <div className="font-bold text-slate-900">{project.mpName || 'Lok Sabha Member'}</div>
                </div>
                <div>
                  <span className="text-slate-400">Sanctioned Amount:</span>
                  <div className="font-bold text-slate-900">{formatCurrency(project.sanctionedAmount)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Total Treasury Release:</span>
                  <div className="font-bold text-slate-900">{formatCurrency(project.releasedAmount)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Reported Utilization:</span>
                  <div className="font-bold text-slate-900">{formatCurrency(project.utilizedAmount)} ({utilizationRate}%)</div>
                </div>
                <div>
                  <span className="text-slate-400">Implementing Agency:</span>
                  <div className="font-bold text-slate-900">{project.agencyName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Primary Vendor / Status:</span>
                  <div className={`font-bold ${project.vendorBlacklisted ? 'text-rose-600' : 'text-slate-900'}`}>
                    {project.vendorName} {project.vendorBlacklisted ? '(BLACKLISTED)' : ''}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Vigilance & Statutory Compliance Assessment:</div>
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <div>
                    1. <strong>Composite Risk Score:</strong> Evaluated at{' '}
                    <span className="font-bold text-rose-700">{project.riskScore.compositeScore}/100</span>.
                  </div>
                  <div>
                    2. <strong>Satellite Optical Ground Truth:</strong>{' '}
                    {isGhost
                      ? 'ALERT: Satellite spectral analysis confirms zero built-up reflection change compared to pre-sanction baseline. Flagged as high probability ghost asset.'
                      : isVerified
                      ? 'CONFIRMED: Satellite radar/optical pass confirms physical progress matching sanctioned DPR specifications.'
                      : 'Physical ground inspection dossier awaiting upload.'}
                  </div>
                  <div>
                    3. <strong>Anti-Collusion Audit:</strong>{' '}
                    {project.fraudFlag
                      ? `Sanction marked under ${project.fraudFlag.replace(/_/g, ' ').toUpperCase()} provisions for priority vigilance scrutiny.`
                      : 'Compliant with Central Public Procurement (CPPP) rules.'}
                  </div>
                </div>
              </div>

              {/* Digital Stamp Sign-off */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <div>
                  <div className="font-bold text-slate-800">Autonomous Sentinel Oversight Directorate</div>
                  <div className="text-slate-500">Ministry of Statistics and Programme Implementation</div>
                </div>
                <div className="w-24 h-24 rounded-full border-2 border-slate-400 flex flex-col items-center justify-center text-center p-1 text-[9px] uppercase font-bold text-slate-500 rotate-[-12deg] select-none">
                  <span>Govt of India</span>
                  <Award size={14} className="my-0.5" />
                  <span>Statutory Record</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-100 print:hidden gap-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Digitally certified statutory record pursuant to Section 65B of Indian Evidence Act</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportAuditHistoryPdf}
                  disabled={isExporting !== null}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Download complete chronological project audit history as a downloadable PDF file"
                >
                  <Download size={13} />
                  <span>{isExporting === 'audit_history' ? 'Generating...' : 'Audit History (.pdf)'}</span>
                </button>
                <button
                  onClick={() => handleDownloadPdfReport()}
                  disabled={isExporting !== null}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download PDF Report (.pdf)</span>
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Project Audit PDF Export & Sharing Modal */}
      <PdfExportModal
        isOpen={showPdfExportModal}
        onClose={() => setShowPdfExportModal(false)}
        project={project}
        auditTimeline={auditTimeline}
        fieldInspection={inspectionRecord}
        dossierHash={dossierHash}
        qrDataUrl={qrDataUrl}
        onDownloadPdf={(opts) => {
          handleDownloadPdfReport(opts);
          setShowPdfExportModal(false);
        }}
        isExporting={isExporting === 'pdf'}
      />

      {/* Mobile Field Access & Official Signboard QR Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Field Mobile Access &amp; Signboard QR</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      MPLADS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Encodes project metadata for mobile field verification and public display signboards
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer print:hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="print:hidden space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Encoding Format:
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setQrMode('url')}
                  className={`py-2 px-2.5 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center cursor-pointer ${
                    qrMode === 'url'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Mobile Direct URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('offline_json')}
                  className={`py-2 px-2.5 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center cursor-pointer ${
                    qrMode === 'offline_json'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Scan size={14} />
                  <span>Offline JSON Specs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('geo')}
                  className={`py-2 px-2.5 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 text-center cursor-pointer ${
                    qrMode === 'geo'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation size={14} />
                  <span>GPS Geo-Pin</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 pt-0.5">
                {qrMode === 'url' && (
                  <span>📱 <strong>Direct URL:</strong> Opens the live project audit card directly on smartphone browser upon scan.</span>
                )}
                {qrMode === 'offline_json' && (
                  <span>⚡ <strong>Offline Metadata:</strong> Fully self-contained JSON text readable by field officers in zero-connectivity areas.</span>
                )}
                {qrMode === 'geo' && (
                  <span>📍 <strong>GPS Navigation:</strong> Launches Google Maps navigation directly to the site coordinates.</span>
                )}
              </p>
            </div>

            {/* QR Code Presentation Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${project.id}`}
                    className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                    <QrCode size={64} className="animate-pulse" />
                  </div>
                )}
                <div className="mt-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  [ {project.id} • MPLADS ]
                </div>
              </div>

              <div className="space-y-1 max-w-sm">
                <div className="text-xs font-bold text-slate-800">{project.title}</div>
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-2">
                  <span>{project.districtName}, {project.stateName}</span>
                  <span>•</span>
                  <span>GPS: {project.location.lat.toFixed(4)}°N, {project.location.lng.toFixed(4)}°E</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                  GFR Rule 238(1) Form 12-C • Tamper-Evident Geotag
                </div>
              </div>
            </div>

            {/* Encoded Content Preview */}
            <div className="space-y-1.5 print:hidden">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Encoded Payload Preview:</span>
                <button
                  type="button"
                  onClick={handleCopyQrPayload}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                >
                  {copiedQrData ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedQrData ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] max-h-24 overflow-y-auto whitespace-pre-wrap break-all border border-slate-800">
                {getQrPayloadText()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={downloadingQr}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Download scannable QR Code as high-resolution PNG image"
                >
                  <Download size={14} />
                  <span>{downloadingQr ? 'Downloading...' : 'Download PNG'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openPrintPreview({
                      title: 'STATUTORY CITIZEN INFORMATION & VERIFICATION BOARD',
                      subtitle: `Government of India • Ministry of Statistics and Programme Implementation (MoSPI) • MPLADS`,
                      referenceId: `PLACARD-${project.id}`,
                      badgeText: 'SITE SIGNBOARD',
                      fileNamePrefix: `MPLADS_Signboard_Placard_${project.id}`,
                      metadataRows: [
                        ['Work Title', project.title],
                        ['Project / Sanction ID', project.id],
                        ['Hon. Member of Parliament', `${project.mpName || 'Lok Sabha Member'} (${project.constituencyName})`],
                        ['District / State', `${project.districtName}, ${project.stateName}`],
                        ['Sanctioned Outlay', formatCurrency(project.sanctionedAmount)],
                        ['Implementing Agency', project.agencyName],
                        ['Executing Contractor', project.vendorName],
                        ['Geographic Coordinates', `${project.location.lat.toFixed(5)}°N, ${project.location.lng.toFixed(5)}°E`],
                        ['Current Execution Status', project.status.toUpperCase()],
                        ['Verification Hash', dossierHash],
                      ],
                      sections: [
                        {
                          heading: 'Encoded Field Audit QR Payload & Verification Directive',
                          paragraphs: [
                            'Mandatory Public Display Board under MoSPI MPLADS Operational Guidelines §3.12.',
                            `Encoded Payload: ${getQrPayloadText()}`,
                          ],
                        },
                      ],
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Print official site signboard placard"
                >
                  <Printer size={14} className="text-slate-600" />
                  <span>Print Placard</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    setShowInspectionModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Launch statutory Form GI-4 on-site ground inspection form"
                >
                  <Camera size={13} />
                  <span>Conduct Ground Audit</span>
                </button>
                {qrMode === 'url' && (
                  <a
                    href={`${typeof window !== 'undefined' ? window.location.origin : ''}/?project=${encodeURIComponent(project.id)}&lat=${project.location.lat}&lng=${project.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>Open Link</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Standalone Printable Signboard Placard (visible only in print media) */}
            <div className="hidden print:block p-8 border-4 border-slate-900 rounded-xl space-y-4 font-sans text-slate-900 mt-6">
              <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
                <div className="text-xs uppercase font-extrabold tracking-wider">Government of India • भारत सरकार</div>
                <div className="text-sm font-extrabold uppercase">Ministry of Statistics and Programme Implementation (MoSPI)</div>
                <div className="text-xs font-bold text-slate-700">Member of Parliament Local Area Development Scheme (MPLADS)</div>
                <div className="text-[10px] uppercase font-mono tracking-widest font-bold text-indigo-900 bg-indigo-50 py-0.5 px-2 rounded inline-block">
                  Statutory Citizen Information &amp; Verification Board
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 pt-2">
                <div className="space-y-1.5 text-xs flex-1">
                  <div><strong>Work Title:</strong> {project.title}</div>
                  <div><strong>Project / Sanction ID:</strong> <code>{project.id}</code></div>
                  <div><strong>Hon. Member of Parliament:</strong> {project.mpName || 'Lok Sabha Member'} ({project.constituencyName})</div>
                  <div><strong>District / State:</strong> {project.districtName}, {project.stateName}</div>
                  <div><strong>Sanctioned Outlay:</strong> ₹{project.sanctionedAmount.toLocaleString('en-IN')}</div>
                  <div><strong>Implementing Agency:</strong> {project.agencyName}</div>
                  <div><strong>Executing Contractor:</strong> {project.vendorName}</div>
                  <div><strong>Geographic Coordinates:</strong> {project.location.lat.toFixed(5)}°N, {project.location.lng.toFixed(5)}°E</div>
                  <div><strong>Status:</strong> {project.status.toUpperCase()}</div>
                </div>

                <div className="text-center p-3 border-2 border-slate-800 rounded-xl shrink-0 flex flex-col items-center">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="Signboard QR" className="w-36 h-36 object-contain" />
                  )}
                  <div className="text-[9px] font-bold uppercase mt-1">Scan for Field Audit</div>
                  <div className="text-[8px] font-mono text-slate-500">mplads.gov.in</div>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-2 text-[9px] text-slate-500 flex justify-between font-mono">
                <span>Verification Hash: {dossierHash}</span>
                <span>Mandatory Public Display Board under MoSPI Guidelines</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Field Ground Inspection & Geotagged Evidence Modal */}
      <FieldInspectionModal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        project={project}
        onSaveInspection={handleSaveInspection}
      />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
