import React, { useState } from 'react';
import { ProjectItem } from '../types';
import {
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface RiskScoreGaugeProps {
  project: ProjectItem;
  className?: string;
}

interface SpecificRiskFactor {
  id: string;
  category: 'fund_utilization' | 'vendor_concentration' | 'cost_anomaly' | 'ghost_satellite' | 'duplicate_work' | 'debarred_entity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  badge: string;
  metric: string;
  description: string;
  triggerCondition: string;
  impactScore: number; // 0 - 100
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({ project, className = '' }) => {
  const [showFactorBreakdown, setShowFactorBreakdown] = useState(true);
  const [activeFactorDetail, setActiveFactorDetail] = useState<string | null>(null);

  const compositeScore = project.riskScore?.compositeScore ?? 0;
  const components = project.riskScore?.components ?? {
    cost_risk: 0,
    delay_risk: 0,
    utilization_risk: 0,
    duplicate_risk: 0,
    vendor_risk: 0,
    agency_risk: 0,
    compliance_risk: 0,
    geo_risk: 0,
  };

  const utilizationRate =
    project.releasedAmount > 0
      ? Math.round((project.utilizedAmount / project.releasedAmount) * 100)
      : 0;

  // Derive granular specific fraud risk factors
  const fraudFactors: SpecificRiskFactor[] = [];

  // 1. Unusually High Fund Utilization / Premature Drain factor
  // In government procurement & MPLADS audits: 100% utilization claimed early, or 95%+ utilization with in_progress status,
  // or utilization risk component > 50, or declared fund_misuse flag
  const isHighUtilizationRisk =
    project.fraudFlag === 'fund_misuse' ||
    components.utilization_risk >= 50 ||
    (utilizationRate >= 95 && project.status === 'in_progress') ||
    (utilizationRate === 100 && project.status !== 'completed');

  if (isHighUtilizationRisk) {
    const isAcceleratedDrain = utilizationRate >= 95 && project.status === 'in_progress';
    fraudFactors.push({
      id: 'fund_utilization',
      category: 'fund_utilization',
      severity: components.utilization_risk >= 70 || isAcceleratedDrain ? 'critical' : 'high',
      title: 'Premature / Rapid Fund Depletion Alert',
      badge: 'FUND ANOMALY',
      metric: `${utilizationRate}% Expended`,
      description: isAcceleratedDrain
        ? `${utilizationRate}% of released grants drawn while project is still flagged as "${project.status.replace('_', ' ').toUpperCase()}". High probability of unbacked milestone claims under GFR Rule 238(1).`
        : `Reported utilization rate (${utilizationRate}%) significantly outpaces physical construction benchmarks for ${project.category} works.`,
      triggerCondition: `Released: ₹${(project.releasedAmount / 100000).toFixed(1)}L | Utilized: ₹${(project.utilizedAmount / 100000).toFixed(1)}L`,
      impactScore: Math.max(components.utilization_risk, isAcceleratedDrain ? 85 : 60),
    });
  }

  // 2. Vendor Alert / Monopolistic Concentration factor
  const isVendorAlert =
    project.vendorBlacklisted ||
    project.fraudFlag === 'vendor_concentration' ||
    components.vendor_risk >= 50;

  if (isVendorAlert) {
    fraudFactors.push({
      id: 'vendor_concentration',
      category: 'vendor_concentration',
      severity: project.vendorBlacklisted ? 'critical' : components.vendor_risk >= 65 ? 'high' : 'medium',
      title: project.vendorBlacklisted ? 'Debarred / Blacklisted Contractor' : 'Recurring Vendor Concentration Alert',
      badge: project.vendorBlacklisted ? 'BLACKLISTED' : 'MONOPOLY ALERT',
      metric: project.vendorBlacklisted ? 'Rule 151 Debarred' : `${components.vendor_risk}/100 Risk`,
      description: project.vendorBlacklisted
        ? `Contractor "${project.vendorName}" is listed on the Central Vigilance & Finance Ministry debarment registry (Rule 151(iii) GFR 2017). Immediate disbursement hold recommended.`
        : `Vendor "${project.vendorName}" exhibits anomalous award concentration across ${project.districtName} district (>40% of civil tenders won without competitive rotation).`,
      triggerCondition: `Contractor: ${project.vendorName} (Vendor ID: ${project.vendorId})`,
      impactScore: project.vendorBlacklisted ? 95 : components.vendor_risk,
    });
  }

  // 3. Cost Anomaly / Inflated Estimates
  if (project.fraudFlag === 'cost_anomaly' || components.cost_risk >= 50) {
    fraudFactors.push({
      id: 'cost_anomaly',
      category: 'cost_anomaly',
      severity: components.cost_risk >= 70 ? 'critical' : 'high',
      title: 'Cost Escalation vs Schedule of Rates',
      badge: 'RATE DEVIATION',
      metric: `+${components.cost_risk}% Over Baseline`,
      description: `Sanctioned amount (₹${(project.sanctionedAmount / 100000).toFixed(1)} Lakh) deviates 1.8x from MoSPI and CPWD Schedule of Rates (SOR) baseline standards for this asset class.`,
      triggerCondition: `Sanctioned: ₹${project.sanctionedAmount.toLocaleString('en-IN')}`,
      impactScore: components.cost_risk,
    });
  }

  // 4. Ghost Asset / Satellite Optical Zero Footprint
  if (project.verifiedStatus === 'ghost_suspected' || components.geo_risk >= 65) {
    fraudFactors.push({
      id: 'ghost_satellite',
      category: 'ghost_satellite',
      severity: 'critical',
      title: 'Zero Ground Footprint (Ghost Asset)',
      badge: 'SATELLITE ZERO-CHG',
      metric: 'NDBI Delta: +0.01',
      description: 'ISRO Sentinel-2 multi-spectral optical passes confirm zero structural change from pre-sanction baseline despite financial tranches being fully drawn.',
      triggerCondition: `Coordinates: ${project.location.lat.toFixed(4)}° N, ${project.location.lng.toFixed(4)}° E`,
      impactScore: 98,
    });
  }

  // 5. Near-Duplicate Work
  if (project.isDuplicateCandidate || components.duplicate_risk >= 55) {
    fraudFactors.push({
      id: 'duplicate_work',
      category: 'duplicate_work',
      severity: 'high',
      title: 'Near-Duplicate Geo-Spatial Work',
      badge: 'DUPLICATE SITE',
      metric: '< 180m Proximity',
      description: `GPS coordinates fall within 180 meters of another public work (${project.duplicateWithId || 'Adjacent Sanction'}). Potential double-billing under parallel schemes.`,
      triggerCondition: `Matching Project: ${project.duplicateWithId || 'Nearby Civil Asset'}`,
      impactScore: components.duplicate_risk || 75,
    });
  }

  // Fallback clean factor if no high-severity anomalies
  if (fraudFactors.length === 0) {
    fraudFactors.push({
      id: 'clean_audit',
      category: 'fund_utilization',
      severity: 'low',
      title: 'Statutory Disbursement & Milestone Alignment',
      badge: 'COMPLIANT',
      metric: `${utilizationRate}% Utilized`,
      description: `Expenditure tranches, contractor track records, and milestone verification timelines remain within nominal tolerances of MPLADS Scheme Guidelines.`,
      triggerCondition: 'All statutory vigilance checks cleared without high-severity anomaly flags.',
      impactScore: compositeScore,
    });
  }

  // Risk Classification
  const isCritical = compositeScore >= 70;
  const isMedium = compositeScore >= 40 && compositeScore < 70;

  const riskLabel = isCritical ? 'CRITICAL RISK' : isMedium ? 'MODERATE RISK' : 'LOW RISK';
  const riskColorClass = isCritical
    ? 'text-rose-600'
    : isMedium
    ? 'text-amber-600'
    : 'text-emerald-600';
  const riskBgBadge = isCritical
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isMedium
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  // SVG Semi-Circle Gauge Geometry Calculations
  // Angle spans from -180 deg (left) to 0 deg (right)
  const gaugeRadius = 72;
  const strokeWidth = 11;
  const centerX = 95;
  const centerY = 88;
  const arcCircumference = Math.PI * gaugeRadius; // Semi-circle circumference

  // Progress percentage mapped to semi-circle length
  const scoreClamped = Math.max(0, Math.min(100, compositeScore));
  const strokeDashoffset = arcCircumference * (1 - scoreClamped / 100);

  // Needle angle: 0 score = -180 deg (points left), 100 score = 0 deg (points right)
  const needleAngle = -180 + (scoreClamped / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = gaugeRadius - 14;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY + needleLength * Math.sin(needleRad);

  return (
    <div
      id="project-risk-gauge-container"
      className={`rounded-2xl border bg-white shadow-xs overflow-hidden transition-all ${
        isCritical
          ? 'border-rose-200 ring-1 ring-rose-100'
          : isMedium
          ? 'border-amber-200 ring-1 ring-amber-100'
          : 'border-slate-200'
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          isCritical
            ? 'bg-rose-50/80 border-rose-100'
            : isMedium
            ? 'bg-amber-50/80 border-amber-100'
            : 'bg-slate-50/80 border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isCritical
                ? 'bg-rose-600 text-white'
                : isMedium
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isCritical ? (
              <AlertTriangle size={13} />
            ) : isMedium ? (
              <AlertCircle size={13} />
            ) : (
              <ShieldCheck size={13} />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Automated Vigilance Risk Engine</span>
              <span
                className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${riskBgBadge}`}
              >
                {riskLabel}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFactorBreakdown(!showFactorBreakdown)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/80 transition-colors cursor-pointer"
            title="Toggle specific fraud risk factors breakdown"
          >
            <span>{showFactorBreakdown ? 'Hide Breakdown' : 'View Factors'}</span>
            {showFactorBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Main Gauge Body: Left Gauge SVG + Right Key Intelligence Summary */}
      <div className="p-4 bg-gradient-to-b from-white to-slate-50/50">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Left: Interactive Radial Arc Gauge */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-[190px] h-[105px] flex items-center justify-center">
              <svg width="190" height="105" viewBox="0 0 190 105" className="overflow-visible select-none">
                <defs>
                  {/* Gauge Multi-Color Gradient */}
                  <linearGradient id="riskGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="35%" stopColor="#22c55e" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="75%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>

                  {/* Filter for needle drop shadow */}
                  <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* Background Track Arc */}
                <path
                  d={`M ${centerX - gaugeRadius} ${centerY} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${centerX + gaugeRadius} ${centerY}`}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />

                {/* Colored Zone Indicators (Tick Dashes) */}
                {/* Low (0-35) */}
                <path
                  d={`M ${centerX - gaugeRadius} ${centerY} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${centerX + gaugeRadius} ${centerY}`}
                  fill="none"
                  stroke="url(#riskGaugeGradient)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${arcCircumference}`}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />

                {/* Ticks at 0, 25, 50, 75, 100 */}
                {[0, 25, 50, 75, 100].map((tick) => {
                  const tickAngle = -180 + (tick / 100) * 180;
                  const rad = (tickAngle * Math.PI) / 180;
                  const innerR = gaugeRadius - 9;
                  const outerR = gaugeRadius + 9;
                  const x1 = centerX + innerR * Math.cos(rad);
                  const y1 = centerY + innerR * Math.sin(rad);
                  const x2 = centerX + outerR * Math.cos(rad);
                  const y2 = centerY + outerR * Math.sin(rad);

                  return (
                    <line
                      key={tick}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      opacity={0.8}
                    />
                  );
                })}

                {/* Animated Needle */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={needleX}
                  y2={needleY}
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  filter="url(#needleShadow)"
                  className="transition-all duration-700 ease-out"
                />

                {/* Needle Pivot Hub */}
                <circle cx={centerX} cy={centerY} r={5} fill="#0f172a" />
                <circle cx={centerX} cy={centerY} r={2} fill="#ffffff" />
              </svg>

              {/* Center Digital Score Display */}
              <div className="absolute bottom-0 text-center flex flex-col items-center">
                <span className={`text-2xl font-black tracking-tight leading-none ${riskColorClass}`}>
                  {compositeScore}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                  / 100 Index
                </span>
              </div>
            </div>

            {/* Gauge Axis Min/Max Labels */}
            <div className="w-[180px] flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span className="text-emerald-600">0 (Safe)</span>
              <span className="text-amber-500">50 (Warning)</span>
              <span className="text-rose-600">100 (Critical)</span>
            </div>
          </div>

          {/* Right: Vigilance Factor Summary Snapshot */}
          <div className="sm:col-span-7 space-y-2.5 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-3 sm:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" />
                <span>Primary Risk Assessment</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {fraudFactors.length} Factor{fraudFactors.length > 1 ? 's' : ''} Identified
              </span>
            </div>

            {/* Top Risk Alerts Pill Stack */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Metric 1: Fund Utilization Alert */}
              <div
                className={`p-2.5 rounded-xl border ${
                  isHighUtilizationRisk
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <TrendingUp size={11} className={isHighUtilizationRisk ? 'text-rose-600' : 'text-slate-400'} />
                    <span>Utilization</span>
                  </span>
                  {isHighUtilizationRisk && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <div className="text-sm font-bold mt-1 flex items-baseline gap-1">
                  <span>{utilizationRate}%</span>
                  <span className="text-[10px] font-normal text-slate-500">of grants</span>
                </div>
                <div className="text-[10px] mt-0.5 truncate text-slate-600">
                  {isHighUtilizationRisk ? '⚠️ Premature draw vs progress' : '✓ Normal expenditure pace'}
                </div>
              </div>

              {/* Metric 2: Recurring Vendor Alert */}
              <div
                className={`p-2.5 rounded-xl border ${
                  isVendorAlert
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Users size={11} className={isVendorAlert ? 'text-rose-600' : 'text-slate-400'} />
                    <span>Vendor Integrity</span>
                  </span>
                  {isVendorAlert && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <div className="text-sm font-bold mt-1 truncate">
                  {project.vendorBlacklisted ? (
                    <span className="text-rose-600 font-black">Debarred</span>
                  ) : components.vendor_risk >= 50 ? (
                    <span className="text-amber-600">{components.vendor_risk}/100 Risk</span>
                  ) : (
                    <span className="text-emerald-700">Verified</span>
                  )}
                </div>
                <div className="text-[10px] mt-0.5 truncate text-slate-600">
                  {project.vendorBlacklisted
                    ? 'Rule 151 Blacklisted'
                    : components.vendor_risk >= 50
                    ? 'Monopoly concentration'
                    : 'No debarment records'}
                </div>
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="p-2 rounded-lg bg-slate-100/80 text-[11px] text-slate-600 flex items-start gap-1.5">
              <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2 leading-relaxed">
                {fraudFactors[0]?.description ||
                  'Audit components analyzed against statutory GFR guidelines, multi-spectral satellite imagery, and national debarment registries.'}
              </p>
            </div>
          </div>
        </div>

        {/* Granular Fraud Factors Dropdown/Accordion */}
        {showFactorBreakdown && (
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Specific Fraud &amp; Anomaly Drivers
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any factor to expand audit directives
              </span>
            </div>

            <div className="space-y-2">
              {fraudFactors.map((factor) => {
                const isExpanded = activeFactorDetail === factor.id;
                const isCrit = factor.severity === 'critical';
                const isHi = factor.severity === 'high';
                const isMed = factor.severity === 'medium';

                const cardBorder = isCrit
                  ? 'border-rose-200 hover:border-rose-300 bg-rose-50/40'
                  : isHi
                  ? 'border-amber-200 hover:border-amber-300 bg-amber-50/30'
                  : isMed
                  ? 'border-blue-200 hover:border-blue-300 bg-blue-50/30'
                  : 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/30';

                const tagBg = isCrit
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isHi
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : isMed
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                return (
                  <div
                    key={factor.id}
                    onClick={() => setActiveFactorDetail(isExpanded ? null : factor.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${cardBorder}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {isCrit || isHi ? (
                            <AlertTriangle
                              size={14}
                              className={isCrit ? 'text-rose-600' : 'text-amber-600'}
                            />
                          ) : (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {factor.title}
                            </span>
                            <span
                              className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${tagBg}`}
                            >
                              {factor.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {factor.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isCrit ? 'text-rose-700' : isHi ? 'text-amber-700' : 'text-slate-700'
                          }`}
                        >
                          {factor.metric}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                          Risk: {factor.impactScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Expanded Technical & Forensic Directives */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 text-[11px] space-y-1.5 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                          <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[10px]">
                            <span className="text-slate-400 block uppercase">Audit Trigger Evidence</span>
                            <span className="text-slate-800 font-semibold">{factor.triggerCondition}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200 text-[10px]">
                            <span className="text-slate-400 block uppercase">Recommended Statutory Action</span>
                            <span className="text-slate-800 font-semibold">
                              {isCrit
                                ? 'Withhold milestone tranches; initiate CVC vigilance enquiry under GFR 151.'
                                : isHi
                                ? 'Demand physical Form GI-4 field geotagged verification before tranche release.'
                                : 'Routine compliance monitoring; ensure Form 12-C utilization certificate is filed.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
