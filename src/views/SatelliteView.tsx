import React, { useState } from 'react';
import { SEED_PROJECTS } from '../data/seedProjects';
import { getSatelliteObservations, runPhotoForensicCheck } from '../data/visionEngine';
import { Satellite, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Sliders, Image, ExternalLink, ArrowUpRight } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { ProjectItem } from '../types';

interface SatelliteViewProps {
  onSelectProject?: (project: ProjectItem) => void;
}

export const SatelliteView: React.FC<SatelliteViewProps> = ({ onSelectProject }) => {
  const [selectedObsId, setSelectedObsId] = useState<string>('SAT-001');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [forensicTestResult, setForensicTestResult] = useState<any>(null);

  const observations = getSatelliteObservations();
  const activeObs = observations.find((o) => o.id === selectedObsId) || observations[0];

  const handleTestForensics = (caseType: 'clean' | 'duplicate_phash' | 'tampered_ela') => {
    const res = runPhotoForensicCheck(caseType);
    setForensicTestResult(res);
  };

  if (!activeObs) {
    return (
      <div className="p-6 text-slate-500">
        No satellite observations available.
      </div>
    );
  }

  const linkedProject = SEED_PROJECTS.find((p) => p.id === (activeObs as any).projectId) || SEED_PROJECTS[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Satellite size={22} className="text-emerald-600" />
            <span>Satellite & Computer Vision Forensics (Phase 9 & 11)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-spectral Sentinel-2 change detection, spectral index tracking (NDVI/NDBI), and forensic photograph integrity audits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://bhuvan.nrsc.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            title="Open Official ISRO Bhuvan Geospatial Portal"
          >
            <ExternalLink size={13} />
            <span>ISRO Bhuvan Geo-Portal</span>
          </a>
          {onSelectProject && linkedProject && (
            <button
              onClick={() => onSelectProject(linkedProject)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Project Dossier</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Observation Selector & Split Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Observation Queue */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 font-semibold text-xs text-slate-700">
            Satellite Tasking & Acquisition Passes
          </div>

          <div className="divide-y divide-slate-100">
            {observations.map((obs) => {
              const isSelected = obs.id === selectedObsId;
              return (
                <div
                  key={obs.id}
                  onClick={() => {
                    setSelectedObsId(obs.id);
                    setForensicTestResult(null);
                  }}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate">{obs.projectTitle}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        obs.status === 'ghost_suspected'
                          ? 'bg-rose-100 text-rose-800'
                          : obs.status === 'verified_change'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {obs.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Pass: {obs.postPassDate} • NDVI Δ: {obs.spectralDelta.ndvi > 0 ? `+${obs.spectralDelta.ndvi}` : obs.spectralDelta.ndvi}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Interactive Before / After Split Slider & Spectral Stats */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Georeference</span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">{activeObs.projectTitle}</h2>
              <p className="text-xs text-slate-500 font-mono">
                Lat: {activeObs.location.lat.toFixed(4)}, Lng: {activeObs.location.lng.toFixed(4)} • Cloud Cover: {activeObs.cloudCover}%
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700">Sentinel-2 MSI Level-2A</span>
              <div className="text-[11px] text-slate-400 font-mono">10m GSD Resolution</div>
            </div>
          </div>

          {/* Interactive Split Image Canvas */}
          <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200 select-none bg-slate-900">
            {/* Background: Post-Milestone (After) */}
            <div
              className="absolute inset-0 flex items-center justify-center text-white"
              style={{
                backgroundColor: activeObs.status === 'ghost_suspected' ? '#1c1917' : '#064e3b',
              }}
            >
              <div className="text-center p-4 space-y-2">
                <div className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">
                  POST-SANCTION PASS ({activeObs.postPassDate})
                </div>
                <div className="text-sm font-semibold max-w-xs text-slate-200">
                  {activeObs.status === 'ghost_suspected'
                    ? '⚠️ Multi-Spectral Reflection Unchanged: Barren Ground / Fallow Fields (NDBI = 0.04)'
                    : '✅ Concrete & Built-up Reflectance Detected: Built Infrastructure Footprint Verified'}
                </div>
              </div>
            </div>

            {/* Foreground: Pre-Sanction (Before) with Clip Path Slider */}
            <div
              className="absolute inset-0 flex items-center justify-center text-white border-r-2 border-white shadow-2xl"
              style={{
                backgroundColor: '#292524',
                clipPath: `polygon(0% 0%, ${sliderPos}% 0%, ${sliderPos}% 100%, 0% 100%)`,
              }}
            >
              <div className="text-center p-4 space-y-2">
                <div className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400">
                  BASELINE PASS ({activeObs.baselinePassDate})
                </div>
                <div className="text-sm font-semibold max-w-xs text-slate-200">
                  Pre-construction ground topography.
                </div>
              </div>
            </div>

            {/* Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg text-[10px] font-bold">
                ↔
              </div>
            </div>

            {/* Range slider input on top */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize z-10 w-full h-full"
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>← Baseline Ground Condition</span>
            <span>Drag slider to inspect optical change</span>
            <span>Current Satellite Pass →</span>
          </div>

          {/* Spectral Delta Indicators */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500">NDVI (Vegetation Index)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {activeObs.spectralDelta.ndvi > 0 ? `+${activeObs.spectralDelta.ndvi}` : activeObs.spectralDelta.ndvi}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500">NDBI (Built-Up Index)</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {activeObs.spectralDelta.ndbi > 0 ? `+${activeObs.spectralDelta.ndbi}` : activeObs.spectralDelta.ndbi}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500">Confidence Score</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {Math.round(activeObs.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Photograph Integrity Inspector (Phase 11) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Image size={16} className="text-blue-600" />
              <span>Inspection Photo Forensics Engine (Phase 11)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Perceptual Hash (pHash) near-duplicate detection, Error Level Analysis (ELA) for image splicing, and EXIF timestamp audit.
            </p>
          </div>

          {/* Quick Simulation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestForensics('clean')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Simulate Genuine Photo
            </button>
            <button
              onClick={() => handleTestForensics('duplicate_phash')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            >
              Simulate Recycled Photo (pHash)
            </button>
            <button
              onClick={() => handleTestForensics('tampered_ela')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100"
            >
              Simulate Spliced Photo (ELA)
            </button>
          </div>
        </div>

        {forensicTestResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-200 ${
              forensicTestResult.passed
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-1.5">
                {forensicTestResult.passed ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <ShieldAlert size={16} className="text-rose-600" />
                )}
                {forensicTestResult.summary}
              </span>
              <span className="font-mono text-xs">
                Score: {forensicTestResult.authenticityScore} / 100
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1 text-slate-700">
              <div className="p-2 bg-white/70 rounded-lg border border-slate-200">
                <span className="font-semibold text-[10px] uppercase text-slate-400">pHash Duplicate Check</span>
                <div className="font-bold text-xs mt-0.5">{forensicTestResult.details.phashMatch}</div>
              </div>
              <div className="p-2 bg-white/70 rounded-lg border border-slate-200">
                <span className="font-semibold text-[10px] uppercase text-slate-400">ELA Splicing Deviation</span>
                <div className="font-bold text-xs mt-0.5">{forensicTestResult.details.elaVariance}</div>
              </div>
              <div className="p-2 bg-white/70 rounded-lg border border-slate-200">
                <span className="font-semibold text-[10px] uppercase text-slate-400">EXIF Geotag Integrity</span>
                <div className="font-bold text-xs mt-0.5">{forensicTestResult.details.exifStatus}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
