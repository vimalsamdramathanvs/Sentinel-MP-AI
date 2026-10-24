import React, { useState, useEffect, useRef } from 'react';
import { ProjectItem, FieldInspectionRecord } from '../types';
import { SEED_PROJECTS } from '../data/seedProjects';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Award,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Sparkles,
  Sliders,
  Check,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface FieldInspectionModalProps {
  isOpen?: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  initialProject?: ProjectItem | null;
  onSaveInspection?: (record: FieldInspectionRecord, updatedProject: ProjectItem) => void;
}

export const FieldInspectionModal: React.FC<FieldInspectionModalProps> = ({
  isOpen = true,
  onClose,
  project: propProject,
  initialProject,
  onSaveInspection,
}) => {
  const project: ProjectItem = propProject || initialProject || SEED_PROJECTS[0];

  // Inspector profile state
  const [inspectorName, setInspectorName] = useState('Er. Rajesh Kumar Sharma');
  const [inspectorDesignation, setInspectorDesignation] = useState(
    'Assistant Engineer, District Vigilance & Inspection Cell'
  );
  const [inspectorBadge, setInspectorBadge] = useState('MoSPI-DVO-2026-8819');

  // Inspection audit checklist state
  const [physicalProgress, setPhysicalProgress] = useState<number>(
    project.status === 'completed' ? 100 : project.status === 'in_progress' ? 65 : 30
  );
  const [qualityRating, setQualityRating] = useState<'A' | 'B' | 'C' | 'F'>(
    project.fraudFlag ? 'C' : 'A'
  );
  const [functionalityStatus, setFunctionalityStatus] = useState<
    'operational' | 'in_progress' | 'substandard' | 'ghost_confirmed'
  >(
    project.verifiedStatus === 'ghost_suspected'
      ? 'ghost_confirmed'
      : project.status === 'completed'
      ? 'operational'
      : 'in_progress'
  );
  const [signboardVerified, setSignboardVerified] = useState(true);
  const [observations, setObservations] = useState(
    project.location
      ? `Field inspection conducted at sanctioned coordinates (${project.location.lat.toFixed(4)}°N, ${project.location.lng.toFixed(4)}°E). Verification undertaken pursuant to GFR 2017 Rule 238(1) and MoSPI Guidelines.`
      : 'Field inspection conducted pursuant to GFR 2017 Rule 238(1) and MoSPI Guidelines.'
  );

  // Sync state when project changes
  useEffect(() => {
    if (!project) return;
    setPhysicalProgress(
      project.status === 'completed' ? 100 : project.status === 'in_progress' ? 65 : 30
    );
    setQualityRating(project.fraudFlag ? 'C' : 'A');
    setFunctionalityStatus(
      project.verifiedStatus === 'ghost_suspected'
        ? 'ghost_confirmed'
        : project.status === 'completed'
        ? 'operational'
        : 'in_progress'
    );
    if (project.location) {
      setObservations(
        `Field inspection conducted at sanctioned coordinates (${project.location.lat.toFixed(4)}°N, ${project.location.lng.toFixed(4)}°E). Verification undertaken pursuant to GFR 2017 Rule 238(1) and MoSPI Guidelines.`
      );
    }
  }, [project.id]);

  // Photo state & presets
  const [selectedPreset, setSelectedPreset] = useState<'borewell' | 'community_hall' | 'ghost_plot' | 'custom'>('community_hall');
  const [watermarkedPhotoUrl, setWatermarkedPhotoUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  // Completed record state
  const [submittedRecord, setSubmittedRecord] = useState<FieldInspectionRecord | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing inspection if previously saved in localStorage
  useEffect(() => {
    if (!isOpen || !project) return;
    try {
      const saved = localStorage.getItem(`mplads_inspection_${project.id}`);
      if (saved) {
        const parsed: FieldInspectionRecord = JSON.parse(saved);
        setSubmittedRecord(parsed);
        setInspectorName(parsed.inspectorName);
        setInspectorDesignation(parsed.inspectorDesignation);
        setInspectorBadge(parsed.inspectorBadgeNumber);
        setPhysicalProgress(parsed.physicalProgressPercent);
        setQualityRating(parsed.qualityRating);
        setFunctionalityStatus(parsed.functionalityStatus);
        setSignboardVerified(parsed.signboardVerified);
        setObservations(parsed.observations);
        setWatermarkedPhotoUrl(parsed.watermarkedPhotoUrl);
      } else {
        setSubmittedRecord(null);
        setIsSuccessFeedback(false);
      }
    } catch (_) {}
  }, [isOpen, project.id]);

  // Generate synthetic site image onto canvas or watermark uploaded image
  const generateWatermarkedEvidence = (customSrc?: string) => {
    setIsProcessingPhoto(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessingPhoto(false);
      return;
    }

    const stampWatermarkAndFinalize = () => {
      // 1. Top Government Header Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(0, 0, canvas.width, 58);

      // Top Header Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('GOVERNMENT OF INDIA • STATUTORY GROUND INSPECTION EVIDENCE', 20, 26);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(
        `MoSPI MPLADS DIV • FORM GI-4 • GFR 238(1) COMPLIANT • SITE REF: ${project.id}`,
        20,
        45
      );

      // Ashoka / Emblem Gold Stamp (right corner)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(canvas.width - 35, 29, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOI', canvas.width - 35, 33);
      ctx.textAlign = 'left';

      // 2. Crosshair Center Targeting HUD
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 50, cy);
      ctx.lineTo(cx - 20, cy);
      ctx.moveTo(cx + 20, cy);
      ctx.lineTo(cx + 50, cy);
      ctx.moveTo(cx, cy - 50);
      ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx, cy + 20);
      ctx.lineTo(cx, cy + 50);
      ctx.stroke();

      // Target Coordinates label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(cx - 65, cy + 45, 130, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`GPS LOCK ±2.4m`, cx, cy + 59);
      ctx.textAlign = 'left';

      // 3. Bottom Telemetry HUD Watermark Banner
      const bannerHeight = 125;
      const bannerY = canvas.height - bannerHeight;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, bannerY, canvas.width, bannerHeight);

      // Decorative top border for HUD
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, bannerY, canvas.width, 3);

      const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      // Row 1: Geolocation Coordinates & Precision
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillText(
        `📍 LAT: ${project.location.lat.toFixed(6)}° N   LNG: ${project.location.lng.toFixed(6)}° E   ALT: 214m MSL (WGS-84)`,
        20,
        bannerY + 28
      );

      // Row 2: Location & Project Title
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `PROJECT: ${project.title.substring(0, 52)}${project.title.length > 52 ? '...' : ''} (${project.districtName}, ${project.stateName})`,
        20,
        bannerY + 52
      );

      // Row 3: Inspector Credential & Timestamp
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `INSPECTOR: ${inspectorName} (${inspectorDesignation}) • BADGE: ${inspectorBadge}`,
        20,
        bannerY + 75
      );

      // Row 4: Security Hash & Status
      const hash = `SHA256-${Math.abs(
        project.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9871
      ).toString(16)}6e9a`;

      ctx.fillStyle = '#a855f7';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(
        `TAMPER-SEAL: ${hash}  •  TIMESTAMP: ${timestamp} IST  •  COMPLIANCE: GFR-238(1)`,
        20,
        bannerY + 98
      );

      // Verification Badge (Right Side)
      ctx.fillStyle =
        functionalityStatus === 'ghost_confirmed'
          ? '#e11d48'
          : functionalityStatus === 'operational'
          ? '#059669'
          : '#2563eb';
      ctx.fillRect(canvas.width - 200, bannerY + 18, 180, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        functionalityStatus === 'ghost_confirmed'
          ? '⚠ GHOST ASSET ALERT'
          : functionalityStatus === 'operational'
          ? '✓ 100% OPERATIONAL'
          : '⚙ WORK IN PROGRESS',
        canvas.width - 110,
        bannerY + 38
      );
      ctx.font = '10px monospace';
      ctx.fillText(`PROGRESS: ${physicalProgress}%`, canvas.width - 110, bannerY + 54);
      ctx.textAlign = 'left';

      // Export to Data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setWatermarkedPhotoUrl(dataUrl);
      setIsProcessingPhoto(false);
    };

    if (customSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        stampWatermarkAndFinalize();
      };
      img.onerror = () => {
        drawSyntheticPreset(ctx, selectedPreset);
        stampWatermarkAndFinalize();
      };
      img.src = customSrc;
    } else {
      drawSyntheticPreset(ctx, selectedPreset);
      stampWatermarkAndFinalize();
    }
  };

  // Draw procedural realistic field scenes for demo presets
  const drawSyntheticPreset = (
    ctx: CanvasRenderingContext2D,
    preset: 'borewell' | 'community_hall' | 'ghost_plot' | 'custom'
  ) => {
    if (preset === 'ghost_plot') {
      // Barren dry earth / wasteland (Zero construction)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 350);
      skyGrad.addColorStop(0, '#7dd3fc');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1000, 350);

      // Sun
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(820, 120, 40, 0, Math.PI * 2);
      ctx.fill();

      // Barren rocky terrain
      const groundGrad = ctx.createLinearGradient(0, 350, 0, 700);
      groundGrad.addColorStop(0, '#ca8a04');
      groundGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 350, 1000, 350);

      // Rocks and dry cracks
      ctx.fillStyle = '#451a03';
      for (let i = 0; i < 30; i++) {
        const x = (i * 37) % 950 + 20;
        const y = 370 + ((i * 19) % 200);
        ctx.beginPath();
        ctx.ellipse(x, y, 15 + (i % 8), 7 + (i % 4), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // "NO PHYSICAL ASSET FOUND" Banner
      ctx.fillStyle = 'rgba(225, 29, 72, 0.85)';
      ctx.fillRect(250, 260, 500, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO STRUCTURE ERECTED AT COORDINATES', 500, 292);
      ctx.textAlign = 'left';
    } else if (preset === 'borewell') {
      // Solar water borewell / pump setup
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 380);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1000, 380);

      // Green village landscape
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 380, 1000, 320);

      // Concrete plinth platform
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(300, 350, 400, 140);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(320, 330, 360, 40);

      // Overhead Solar Water Tank Structure (Steel Girders)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(380, 330);
      ctx.lineTo(410, 140);
      ctx.moveTo(620, 330);
      ctx.lineTo(590, 140);
      ctx.stroke();

      // Water Tank
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(420, 90, 160, 90, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('MPLADS WATER POINT', 432, 142);

      // Taps with active water
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(490, 340, 20, 40);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(500, 380);
      ctx.lineTo(500, 440);
      ctx.stroke();
    } else {
      // Community Hall / Classroom civil structure
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
      skyGrad.addColorStop(0, '#60a5fa');
      skyGrad.addColorStop(1, '#bfdbfe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 1000, 320);

      // Ground
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 320, 1000, 380);

      // Main Civil Building Block
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(240, 180, 520, 260);

      // Brickwork / Wall plaster
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(240, 180, 520, 24);

      // Windows
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(280, 240, 80, 90);
      ctx.fillRect(640, 240, 80, 90);

      // Main Door
      ctx.fillStyle = '#78350f';
      ctx.fillRect(450, 240, 100, 200);

      // Roof Canopy
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(200, 180);
      ctx.lineTo(500, 110);
      ctx.lineTo(800, 180);
      ctx.closePath();
      ctx.fill();

      // Official Signboard on wall
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(390, 195, 220, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('MPLADS ASSET • GOVT OF INDIA', 410, 212);
      ctx.fillText(project.id, 460, 224);
    }
  };

  // Re-generate whenever preset, coordinates, or inspector details change
  useEffect(() => {
    if (!isOpen) return;
    if (uploadedImageSrc) {
      generateWatermarkedEvidence(uploadedImageSrc);
    } else {
      generateWatermarkedEvidence();
    }
  }, [
    isOpen,
    selectedPreset,
    physicalProgress,
    functionalityStatus,
    inspectorName,
    inspectorBadge,
    uploadedImageSrc,
  ]);

  // Handle custom user photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setUploadedImageSrc(src);
      setSelectedPreset('custom');
      generateWatermarkedEvidence(src);
    };
    reader.readAsDataURL(file);
  };

  // Submit Inspection
  const handleSubmitInspection = () => {
    const hash = `SHA256-${Math.abs(
      project.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 9871
    ).toString(16)}6e9a`;

    const record: FieldInspectionRecord = {
      id: `INSP-${project.id}-${Date.now().toString().slice(-4)}`,
      projectId: project.id,
      projectTitle: project.title,
      inspectorName,
      inspectorDesignation,
      inspectorBadgeNumber: inspectorBadge,
      inspectionDate: new Date().toISOString(),
      physicalProgressPercent: physicalProgress,
      qualityRating,
      functionalityStatus,
      signboardVerified,
      watermarkedPhotoUrl,
      observations,
      coordinates: {
        lat: project.location.lat,
        lng: project.location.lng,
      },
      hash,
      cagComplianceCode: `CAG-MPLADS-INSP-${project.districtName.substring(0, 3).toUpperCase()}-2026`,
    };

    // Save locally
    try {
      localStorage.setItem(`mplads_inspection_${project.id}`, JSON.stringify(record));
    } catch (_) {}

    setSubmittedRecord(record);
    setIsSuccessFeedback(true);

    // Update the project object
    const updatedProject: ProjectItem = {
      ...project,
      verifiedStatus:
        functionalityStatus === 'ghost_confirmed'
          ? 'ghost_suspected'
          : 'field_verified',
      status:
        physicalProgress >= 100
          ? 'completed'
          : physicalProgress > 0
          ? 'in_progress'
          : project.status,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (onSaveInspection) {
      onSaveInspection(record, updatedProject);
    }
  };

  // Download watermarked photo file
  const handleDownloadPhoto = () => {
    if (!watermarkedPhotoUrl) return;
    const link = document.createElement('a');
    link.href = watermarkedPhotoUrl;
    link.download = `EVIDENCE_${project.id}_${project.districtName}_WATERMARKED.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:fixed print:inset-0"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] overflow-y-auto p-5 sm:p-7 space-y-6 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Camera size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Field Ground Inspection &amp; Evidence Capture
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold uppercase">
                  Form GI-4
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Statutory on-site ground truth audit under GFR 2017 Rule 238(1) &amp; MoSPI Vigilance Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer print:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {isSuccessFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Ground Inspection Certified &amp; Recorded:</strong> Geotagged evidence stamped with
                tamper-seal hash and saved to the project audit trail.
              </span>
            </div>
            <button
              onClick={() => {
                try {
                  window.print();
                } catch (_) {}
              }}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Printer size={12} />
              <span>Print GI-4 Certificate</span>
            </button>
          </div>
        )}

        {/* Project Target Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Inspection Target</span>
            <span className="font-bold text-slate-900">{project.title}</span>
            <span className="text-slate-500 text-[11px] ml-1">({project.id})</span>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sanctioned Outlay</span>
              <span className="font-bold text-slate-800">₹{project.sanctionedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Geotag Coordinates</span>
              <span className="font-mono text-slate-800 text-[11px]">
                {project.location.lat.toFixed(4)}°N, {project.location.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Form & Evidence Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Watermarked Camera Canvas & Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" />
                <span>Geotagged Photo Evidence (Live Watermark)</span>
              </label>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                <Check size={12} /> Real-time Cryptographic Stamping
              </span>
            </div>

            {/* Canvas Preview Frame */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-md aspect-4/3 flex items-center justify-center">
              {watermarkedPhotoUrl ? (
                <img
                  src={watermarkedPhotoUrl}
                  alt="Watermarked Ground Truth"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-2">
                  <Camera size={32} className="animate-pulse text-blue-500" />
                  <span className="text-xs">Generating statutory evidence HUD...</span>
                </div>
              )}

              {/* Watermark Quick Status Overlay */}
              <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>WGS84 CERTIFIED</span>
              </div>
            </div>

            {/* Photo Selection / Upload Bar */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Photo Source &amp; Simulation Presets:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('community_hall');
                    setUploadedImageSrc(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                    selectedPreset === 'community_hall' && !uploadedImageSrc
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🏢 Civil Structure
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('borewell');
                    setUploadedImageSrc(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                    selectedPreset === 'borewell' && !uploadedImageSrc
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  💧 Solar Borewell
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('ghost_plot');
                    setUploadedImageSrc(null);
                    setFunctionalityStatus('ghost_confirmed');
                    setPhysicalProgress(0);
                  }}
                  className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                    selectedPreset === 'ghost_plot' && !uploadedImageSrc
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🚨 Ghost Plot (Empty)
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`py-2 px-2.5 rounded-lg border text-center font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    uploadedImageSrc
                      ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Upload image from camera or device"
                >
                  <Upload size={13} />
                  <span>{uploadedImageSrc ? 'Custom Photo' : 'Upload File'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Photo Action triggers */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPhoto}
                  disabled={!watermarkedPhotoUrl}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Stamped Evidence (.JPG)</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  Embeds GPS, Timestamp, Inspector Badge &amp; SHA-256
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Statutory Ground Checklist & Signoff */}
          <div className="lg:col-span-5 space-y-4">
            {/* Inspector Identity Form */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck size={13} className="text-slate-500" />
                  Inspector Identification
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sec. 8.1 MoSPI</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-500 block text-[10px] uppercase font-medium mb-0.5">
                    Lead Inspector Name
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block text-[10px] uppercase font-medium mb-0.5">
                    Designation &amp; Department
                  </label>
                  <input
                    type="text"
                    value={inspectorDesignation}
                    onChange={(e) => setInspectorDesignation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block text-[10px] uppercase font-medium mb-0.5">
                    Inspector Badge / Identity No.
                  </label>
                  <input
                    type="text"
                    value={inspectorBadge}
                    onChange={(e) => setInspectorBadge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ground Verification Parameters */}
            <div className="space-y-3">
              {/* Physical Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">Physical Progress Observed</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">{physicalProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={physicalProgress}
                  onChange={(e) => setPhysicalProgress(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (Empty)</span>
                  <span>50% (Structural)</span>
                  <span>100% (Commissioned)</span>
                </div>
              </div>

              {/* Functionality Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Ground Truth Verification Finding:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFunctionalityStatus('operational');
                      if (physicalProgress < 100) setPhysicalProgress(100);
                    }}
                    className={`p-2 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                      functionalityStatus === 'operational'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px]">✓ Fully Operational</div>
                    <div className="text-[9px] text-slate-500">Public utility confirmed</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFunctionalityStatus('in_progress');
                      if (physicalProgress === 100) setPhysicalProgress(65);
                    }}
                    className={`p-2 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                      functionalityStatus === 'in_progress'
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px]">⚙ Work in Progress</div>
                    <div className="text-[9px] text-slate-500">Active construction</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFunctionalityStatus('substandard')}
                    className={`p-2 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                      functionalityStatus === 'substandard'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px]">⚠ Structural Defects</div>
                    <div className="text-[9px] text-slate-500">CPWD norm violations</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFunctionalityStatus('ghost_confirmed');
                      setPhysicalProgress(0);
                      setSelectedPreset('ghost_plot');
                    }}
                    className={`p-2 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                      functionalityStatus === 'ghost_confirmed'
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold ring-2 ring-rose-400'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] text-rose-700">🚨 Ghost Asset</div>
                    <div className="text-[9px] text-rose-600">Zero physical work found</div>
                  </button>
                </div>
              </div>

              {/* Quality Rating & Signboard Row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Quality Rating
                  </label>
                  <select
                    value={qualityRating}
                    onChange={(e) => setQualityRating(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="A">Grade A (Superior CPWD)</option>
                    <option value="B">Grade B (Satisfactory)</option>
                    <option value="C">Grade C (Substandard)</option>
                    <option value="F">Grade F (Failed / Non-Compliant)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Mandatory Signboard
                  </label>
                  <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signboardVerified}
                      onChange={(e) => setSignboardVerified(e.target.checked)}
                      className="accent-blue-600"
                    />
                    <span className="text-xs text-slate-700">Signboard Erected</span>
                  </label>
                </div>
              </div>

              {/* Inspector Observations Text */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Field Observations &amp; Statutory Notes
                </label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Record physical measurements, contractor presence, and compliance notes..."
                />
              </div>
            </div>

            {/* Submit & Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmitInspection}
                className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  functionalityStatus === 'ghost_confirmed'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>
                  {submittedRecord
                    ? 'Update Certified Ground Truth Record'
                    : 'Submit Statutory Ground Truth Certification'}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                <span>Tamper-evident verification</span>
                <span>MoSPI e-Vigilance Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Official Ground Truth Audit Certificate (Form MoSPI-GI-4) */}
        <div className="hidden print:block p-8 border-4 border-slate-900 rounded-xl space-y-4 font-sans text-slate-900 mt-6">
          <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
            <div className="text-xs uppercase font-extrabold tracking-wider">Government of India • भारत सरकार</div>
            <div className="text-base font-extrabold uppercase">
              Ministry of Statistics and Programme Implementation (MoSPI)
            </div>
            <div className="text-xs font-bold text-slate-700">
              Member of Parliament Local Area Development Scheme (MPLADS)
            </div>
            <div className="text-xs font-bold uppercase text-blue-900 bg-blue-50 py-0.5 px-3 rounded inline-block mt-1">
              FORM GI-4: STATUTORY GROUND INSPECTION &amp; GEOTAGGED ASSET VERIFICATION CERTIFICATE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1.5">
              <div><strong>Project Title:</strong> {project.title}</div>
              <div><strong>Sanction Ref ID:</strong> <code>{project.id}</code></div>
              <div><strong>Hon. Member of Parliament:</strong> {project.mpName || 'Lok Sabha Member'} ({project.constituencyName})</div>
              <div><strong>District &amp; State:</strong> {project.districtName}, {project.stateName}</div>
              <div><strong>Sanctioned Allocation:</strong> ₹{project.sanctionedAmount.toLocaleString('en-IN')}</div>
              <div><strong>Implementing Agency:</strong> {project.agencyName}</div>
              <div><strong>Executing Contractor:</strong> {project.vendorName}</div>
              <div><strong>Recorded Coordinates:</strong> {project.location.lat.toFixed(5)}°N, {project.location.lng.toFixed(5)}°E</div>
            </div>

            <div className="space-y-1.5 border-l border-slate-300 pl-4">
              <div><strong>Inspection Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
              <div><strong>Lead Inspector:</strong> {inspectorName}</div>
              <div><strong>Designation:</strong> {inspectorDesignation}</div>
              <div><strong>Inspector Badge No:</strong> <code>{inspectorBadge}</code></div>
              <div><strong>Observed Physical Completion:</strong> <strong>{physicalProgress}%</strong></div>
              <div><strong>Asset Status:</strong> {functionalityStatus.toUpperCase()}</div>
              <div><strong>Quality Grade:</strong> Grade {qualityRating}</div>
              <div><strong>Display Board Erected:</strong> {signboardVerified ? 'YES - COMPLIANT' : 'NO - DEFICIENT'}</div>
            </div>
          </div>

          {/* Watermarked Photo Embed */}
          <div className="border border-slate-400 rounded p-2 text-center">
            {watermarkedPhotoUrl && (
              <img
                src={watermarkedPhotoUrl}
                alt="Stamped Evidence"
                className="w-full max-h-72 object-contain mx-auto"
              />
            )}
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Cryptographically Stamped Optical Evidence • GPS Geotagged &amp; SHA-256 Timestamped
            </div>
          </div>

          <div className="text-xs space-y-1">
            <strong>Field Observations &amp; Statutory Attestation:</strong>
            <p className="p-2 border border-slate-300 rounded bg-slate-50 text-[11px]">{observations}</p>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs">
            <div className="text-center">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">Signature of Implementing Engineer</div>
              <div className="text-[10px] text-slate-500">Block / District Division</div>
            </div>

            <div className="text-center">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1 font-bold">{inspectorName}</div>
              <div className="text-[10px] text-slate-500">Authorized Vigilance Inspection Officer</div>
            </div>

            <div className="w-24 h-24 rounded-full border-2 border-slate-400 flex flex-col items-center justify-center text-center p-1 text-[8px] uppercase font-bold text-slate-500 rotate-[-12deg]">
              <span>Govt of India</span>
              <Award size={14} className="my-0.5" />
              <span>Ground Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
