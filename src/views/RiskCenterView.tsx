import React, { useState } from 'react';
import { calculateCompositeRisk, DEFAULT_RISK_WEIGHTS } from '../data/riskEngine';
import { RiskRadarChart } from '../components/RiskRadarChart';
import { RiskBadge } from '../components/RiskBadge';
import { SEED_PROJECTS } from '../data/seedProjects';
import { Gauge, Sliders, CheckCircle2, ShieldAlert } from 'lucide-react';

export const RiskCenterView: React.FC = () => {
  // Live calculator inputs
  const [costZ, setCostZ] = useState(1.5);
  const [daysOverdue, setDaysOverdue] = useState(60);
  const [utilRatio, setUtilRatio] = useState(0.5);
  const [relRatio, setRelRatio] = useState(0.9);
  const [dupScore, setDupScore] = useState(0.1);
  const [vendorBlacklisted, setVendorBlacklisted] = useState(false);
  const [agencyBlacklisted, setAgencyBlacklisted] = useState(false);
  const [missingDocs, setMissingDocs] = useState(1);
  const [satelliteNoChange, setSatelliteNoChange] = useState(false);

  const calculated = calculateCompositeRisk({
    costZScore: costZ,
    daysOverdue,
    utilizationRatio: utilRatio,
    releaseRatio: relRatio,
    maxDuplicateScore: dupScore,
    vendorBlacklisted,
    agencyBlacklisted,
    missingDocuments: missingDocs,
    satelliteNoChange,
  });

  // Severity tiers distribution in repo
  const distribution = {
    critical: SEED_PROJECTS.filter((p) => p.riskScore.compositeScore >= 85).length,
    high: SEED_PROJECTS.filter((p) => p.riskScore.compositeScore >= 70 && p.riskScore.compositeScore < 85).length,
    medium: SEED_PROJECTS.filter((p) => p.riskScore.compositeScore >= 40 && p.riskScore.compositeScore < 70).length,
    low: SEED_PROJECTS.filter((p) => p.riskScore.compositeScore < 40).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Gauge size={22} className="text-blue-600" />
          <span>Explainable 8-Component Risk Engine (Phase 7)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Linear, mathematically auditable formula with transparent policy weights. Zero black-box opacity.
        </p>
      </div>

      {/* Overview Metric Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="text-rose-700 font-bold uppercase tracking-wider text-[10px]">Critical Risk (≥85)</div>
          <div className="text-2xl font-bold text-rose-900 mt-1">{distribution.critical}</div>
          <div className="text-rose-600/80 mt-1">Automatic alert dispatch</div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-orange-700 font-bold uppercase tracking-wider text-[10px]">High Risk (70–84)</div>
          <div className="text-2xl font-bold text-orange-900 mt-1">{distribution.high}</div>
          <div className="text-orange-600/80 mt-1">State surveillance queue</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-amber-700 font-bold uppercase tracking-wider text-[10px]">Medium Risk (40–69)</div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{distribution.medium}</div>
          <div className="text-amber-600/80 mt-1">Inspection reminders</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="text-emerald-700 font-bold uppercase tracking-wider text-[10px]">Low Risk (&lt;40)</div>
          <div className="text-2xl font-bold text-emerald-900 mt-1">{distribution.low}</div>
          <div className="text-emerald-600/80 mt-1">Normal milestone trajectory</div>
        </div>
      </div>

      {/* Formula & Live Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Controls */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Interactive Formula Laboratory</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Recalculation</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Cost Z-score slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-slate-700">
                <span>Unit Cost Peer Deviation (Z-Score): {costZ.toFixed(1)}σ</span>
                <span className="font-mono text-slate-500">Component: {calculated.components.cost_risk.toFixed(1)}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={costZ}
                onChange={(e) => setCostZ(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Delay Overdue slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-medium text-slate-700">
                <span>Days Overdue past Expected Completion: {daysOverdue} days</span>
                <span className="font-mono text-slate-500">Component: {calculated.components.delay_risk.toFixed(1)}/100</span>
              </div>
              <input
                type="range"
                min="0"
                max="365"
                step="5"
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Utilization Gap */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Released Ratio: {Math.round(relRatio * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={relRatio}
                  onChange={(e) => setRelRatio(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Utilized Ratio: {Math.round(utilRatio * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={utilRatio}
                  onChange={(e) => setUtilRatio(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={vendorBlacklisted}
                  onChange={(e) => setVendorBlacklisted(e.target.checked)}
                  className="accent-rose-600 rounded"
                />
                <span className="text-slate-700 font-medium">Contractor on Central Debarment List</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={satelliteNoChange}
                  onChange={(e) => setSatelliteNoChange(e.target.checked)}
                  className="accent-rose-600 rounded"
                />
                <span className="text-slate-700 font-medium">Satellite Detects Zero Physical Change</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={agencyBlacklisted}
                  onChange={(e) => setAgencyBlacklisted(e.target.checked)}
                  className="accent-rose-600 rounded"
                />
                <span className="text-slate-700 font-medium">Executing Agency Debarred</span>
              </label>

              <div className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Missing Document Count:</span>
                <select
                  value={missingDocs}
                  onChange={(e) => setMissingDocs(Number(e.target.value))}
                  className="border rounded px-2 py-1 bg-white font-mono"
                >
                  <option value="0">0 (All clean)</option>
                  <option value="1">1 missing</option>
                  <option value="2">2 missing</option>
                  <option value="3">3+ critical missing</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Real-time Output Radar & Contributions */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Formula Output</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                <span>{calculated.compositeScore.toFixed(1)} / 100</span>
                <RiskBadge score={calculated.compositeScore} showScore={false} />
              </div>
            </div>
          </div>

          <div className="flex justify-center p-2 bg-slate-50 rounded-xl">
            <RiskRadarChart components={calculated.components} size={250} />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-slate-700">Mathematical Sum of Contributions:</div>
            {calculated.explanation.slice(0, 4).map((exp) => (
              <div key={exp.component} className="flex justify-between items-center py-1 border-b border-slate-100 text-[11px]">
                <span className="capitalize text-slate-600">{exp.component.replace(/_/g, ' ')} (wt: {exp.weight * 100}%)</span>
                <span className="font-mono font-bold text-slate-900">+{exp.contribution.toFixed(1)} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
