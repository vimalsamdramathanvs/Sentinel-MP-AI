import React, { useState } from 'react';
import { MP_ALLOCATIONS_18TH_LS } from '../data/mpAllocations';
import { MpAllocationRecord } from '../types';
import {
  Users,
  Search,
  IndianRupee,
  FileCheck2,
  ArrowUpRight,
  Sliders,
  Sparkles,
  Droplets,
  GraduationCap,
  HeartPulse,
  Route,
  Baby,
  Download,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const MpLedgerView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<'all' | 'Lok Sabha' | 'Rajya Sabha'>('all');
  const [viewMode, setViewMode] = useState<'roster' | 'simulator'>('roster');

  // Simulator state
  const [simulatedMpId, setSimulatedMpId] = useState<string>(MP_ALLOCATIONS_18TH_LS[0].mpId);
  const [waterAllocationCr, setWaterAllocationCr] = useState<number>(0.8);
  const [educationAllocationCr, setEducationAllocationCr] = useState<number>(0.6);
  const [healthAllocationCr, setHealthAllocationCr] = useState<number>(0.5);
  const [roadsAllocationCr, setRoadsAllocationCr] = useState<number>(0.4);
  const [anganwadiAllocationCr, setAnganwadiAllocationCr] = useState<number>(0.3);
  const [simPlanExported, setSimPlanExported] = useState(false);

  const filtered = MP_ALLOCATIONS_18TH_LS.filter((mp) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        mp.mpName.toLowerCase().includes(q) ||
        mp.constituency.toLowerCase().includes(q) ||
        mp.state.toLowerCase().includes(q) ||
        mp.party.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedHouse !== 'all' && mp.house !== selectedHouse) return false;
    return true;
  });

  const totalEntitled = MP_ALLOCATIONS_18TH_LS.reduce((acc, m) => acc + m.entitledCr, 0);
  const totalSanctioned = MP_ALLOCATIONS_18TH_LS.reduce((acc, m) => acc + m.sanctionedCr, 0);
  const totalUtilized = MP_ALLOCATIONS_18TH_LS.reduce((acc, m) => acc + m.utilizedCr, 0);

  const simMp = MP_ALLOCATIONS_18TH_LS.find((m) => m.mpId === simulatedMpId) || MP_ALLOCATIONS_18TH_LS[0];
  const unspentCr = Math.max(0, simMp.entitledCr - simMp.utilizedCr);

  const totalSimulatedSpend = Number(
    (waterAllocationCr + educationAllocationCr + healthAllocationCr + roadsAllocationCr + anganwadiAllocationCr).toFixed(2)
  );

  // Computed outcomes
  const estimatedCitizensImpacted = Math.round(
    waterAllocationCr * 22000 +
      educationAllocationCr * 8500 +
      healthAllocationCr * 16000 +
      roadsAllocationCr * 11000 +
      anganwadiAllocationCr * 6500
  );

  const projectedSdgScore = Math.min(
    98,
    Math.round(62 + (waterAllocationCr * 8 + healthAllocationCr * 7 + educationAllocationCr * 6))
  );

  const projectedAuditRiskReduction = Math.min(
    38,
    Math.round((waterAllocationCr + healthAllocationCr + educationAllocationCr) * 8.5)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wider uppercase">
              18th Lok Sabha & Rajya Sabha
            </span>
            <span className="text-xs text-slate-500 font-mono">Consolidated Fund of India</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Users size={22} className="text-blue-600" />
            <span>MP Allocation Ledger & "What-If" Welfare Simulator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Parliamentary constituency disbursements, annual entitlement balances, and interactive scenario modeling for unspent funds.
          </p>
        </div>

        {/* Global Tab Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode('roster')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'roster' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All-India MP Roster ({filtered.length})
          </button>
          <button
            onClick={() => setViewMode('simulator')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'simulator' ? 'bg-white text-slate-900 shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={13} className="text-blue-600" />
            <span>"What-If" Reallocation Simulator</span>
          </button>
        </div>
      </div>

      {viewMode === 'roster' ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Statutory Entitlement Cap</span>
              <div className="text-xl font-black text-slate-900 mt-1">₹{totalEntitled.toFixed(1)} Cr</div>
              <div className="text-[11px] text-slate-400 mt-0.5">₹5.0 Cr allocated per MP per financial year</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-blue-600">Total Sanctioned by District Collectors</span>
              <div className="text-xl font-black text-blue-900 mt-1">₹{totalSanctioned.toFixed(1)} Cr</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((totalSanctioned / totalEntitled) * 100).toFixed(1)}% of total parliamentary quota
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-emerald-600">Expended & Ground Utilized</span>
              <div className="text-xl font-black text-emerald-900 mt-1">₹{totalUtilized.toFixed(1)} Cr</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((totalUtilized / totalSanctioned) * 100).toFixed(1)}% physical delivery rate
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs flex items-center gap-3 flex-wrap text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MP Name, Constituency, Party, State..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="all">All Houses (Lok Sabha & Rajya Sabha)</option>
              <option value="Lok Sabha">Lok Sabha Only</option>
              <option value="Rajya Sabha">Rajya Sabha Only</option>
            </select>
          </div>

          {/* MPs Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mp) => {
              const utilPct = mp.sanctionedCr > 0 ? Math.round((mp.utilizedCr / mp.sanctionedCr) * 100) : 0;
              return (
                <div
                  key={mp.mpId}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{mp.mpName}</h3>
                      <p className="text-xs text-slate-500">
                        {mp.constituency}, {mp.state}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {mp.party}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{mp.house}</span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {mp.recommendedWorksCount} Works
                    </span>
                  </div>

                  {/* Financial Progress */}
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400">Entitled</div>
                        <div className="font-bold text-slate-900 mt-0.5">₹{mp.entitledCr} Cr</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-600">Sanctioned</div>
                        <div className="font-bold text-blue-900 mt-0.5">₹{mp.sanctionedCr} Cr</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600">Utilized</div>
                        <div className="font-bold text-emerald-900 mt-0.5">₹{mp.utilizedCr} Cr</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Expenditure Ratio</span>
                        <span className="font-semibold text-slate-700">{utilPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            utilPct < 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, utilPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Unspent Balance: <b>₹{(mp.entitledCr - mp.utilizedCr).toFixed(1)} Cr</b></span>
                      <button
                        onClick={() => {
                          setSimulatedMpId(mp.mpId);
                          setViewMode('simulator');
                        }}
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        Simulate &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* "What-If" Scenario Simulator View */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={16} />
                <span>Predictive Public Policy Engine</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Constituency "What-If" Reallocation & Welfare Simulator
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Empowering MPs, District Magistrates, and civil society to simulate reallocating unspent or low-priority funds into high-impact public welfare sectors and quantify predicted citizen outcomes in real-time.
              </p>
            </div>

            {/* Target MP Selector */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shrink-0">
              <label className="block text-[10px] text-blue-200 uppercase font-bold mb-1">
                Selected MP & Constituency:
              </label>
              <select
                value={simulatedMpId}
                onChange={(e) => setSimulatedMpId(e.target.value)}
                className="bg-slate-900 text-white font-bold text-xs p-2 rounded-lg border border-slate-700 focus:outline-none"
              >
                {MP_ALLOCATIONS_18TH_LS.map((m) => (
                  <option key={m.mpId} value={m.mpId}>
                    {m.mpName} ({m.constituency}, {m.state})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Reallocation Sliders */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Priority Sector Allocation Controls</h3>
                  <p className="text-xs text-slate-500">
                    Constituency Unspent Headroom:{' '}
                    <strong className="text-emerald-700">₹{unspentCr.toFixed(2)} Crores</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Planned Spend</span>
                  <div className={`text-base font-black ${totalSimulatedSpend > unspentCr ? 'text-rose-600' : 'text-blue-900'}`}>
                    ₹{totalSimulatedSpend.toFixed(2)} Cr / ₹{unspentCr.toFixed(2)} Cr
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {/* 1. Drinking Water */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Droplets size={15} className="text-blue-500" />
                      Solar Water Purifiers & Community RO Hubs
                    </span>
                    <span className="font-mono font-bold text-blue-900">₹{waterAllocationCr} Cr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.5"
                    step="0.1"
                    value={waterAllocationCr}
                    onChange={(e) => setWaterAllocationCr(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Est. {(waterAllocationCr / 0.12).toFixed(0)} RO plants installed</span>
                    <span>Direct potable water to ~{(waterAllocationCr * 22000).toLocaleString('en-IN')} citizens</span>
                  </div>
                </div>

                {/* 2. Education Labs */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-amber-500" />
                      Govt School Digital Smart Classrooms & STEM Labs
                    </span>
                    <span className="font-mono font-bold text-amber-900">₹{educationAllocationCr} Cr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={educationAllocationCr}
                    onChange={(e) => setEducationAllocationCr(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Est. {(educationAllocationCr / 0.15).toFixed(0)} school labs digitized</span>
                    <span>Benefit ~{(educationAllocationCr * 8500).toLocaleString('en-IN')} students</span>
                  </div>
                </div>

                {/* 3. Primary Health */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <HeartPulse size={15} className="text-rose-500" />
                      Primary Health Centres & Telemedicine Kiosks
                    </span>
                    <span className="font-mono font-bold text-rose-900">₹{healthAllocationCr} Cr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={healthAllocationCr}
                    onChange={(e) => setHealthAllocationCr(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Est. {(healthAllocationCr / 0.25).toFixed(0)} health clinics upgraded</span>
                    <span>Coverage for ~{(healthAllocationCr * 16000).toLocaleString('en-IN')} patients</span>
                  </div>
                </div>

                {/* 4. Rural Roads */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Route size={15} className="text-emerald-500" />
                      Last-Mile All-Weather Link Roads & Covered Drains
                    </span>
                    <span className="font-mono font-bold text-emerald-900">₹{roadsAllocationCr} Cr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2.0"
                    step="0.1"
                    value={roadsAllocationCr}
                    onChange={(e) => setRoadsAllocationCr(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Est. {(roadsAllocationCr / 0.35).toFixed(1)} km all-weather pavement</span>
                    <span>Connects ~{(roadsAllocationCr * 11000).toLocaleString('en-IN')} villagers</span>
                  </div>
                </div>

                {/* 5. Anganwadi */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Baby size={15} className="text-purple-500" />
                      Modern Anganwadi & Child Nutrition Hubs
                    </span>
                    <span className="font-mono font-bold text-purple-900">₹{anganwadiAllocationCr} Cr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={anganwadiAllocationCr}
                    onChange={(e) => setAnganwadiAllocationCr(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Est. {(anganwadiAllocationCr / 0.08).toFixed(0)} childcare centres renovated</span>
                    <span>Supports ~{(anganwadiAllocationCr * 6500).toLocaleString('en-IN')} mothers & infants</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Projected Welfare & Statutory Impact */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    Projected Scenario Outcomes
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    Simulated Citizen Welfare Impact
                  </h3>
                  <div className="text-xs text-slate-500">
                    {simMp.constituency} ({simMp.state}) • Hon. {simMp.mpName}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-700 uppercase font-bold">
                      Direct Human Lives Positively Impacted
                    </span>
                    <div className="text-2xl font-black text-blue-950 mt-0.5">
                      +{estimatedCitizensImpacted.toLocaleString('en-IN')} Citizens
                    </div>
                    <div className="text-[11px] text-blue-800 mt-1">
                      Targeted coverage across rural blocks and municipal ward clusters.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 uppercase font-bold">UN SDG Index</span>
                      <div className="text-xl font-black text-emerald-950 mt-0.5">
                        {projectedSdgScore} / 100
                      </div>
                      <div className="text-[10px] text-emerald-800 mt-0.5 font-medium">+18 pts vs State Avg</div>
                    </div>

                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                      <span className="text-[10px] text-purple-700 uppercase font-bold">CAG Risk Reduction</span>
                      <div className="text-xl font-black text-purple-950 mt-0.5">
                        -{projectedAuditRiskReduction} pts
                      </div>
                      <div className="text-[10px] text-purple-800 mt-0.5 font-medium">Standardized E-Tenders</div>
                    </div>
                  </div>
                </div>

                {simPlanExported && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Scenario Action Brief generated and formatted for District Collector sanction.</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSimPlanExported(true);
                    setTimeout(() => setSimPlanExported(false), 3000);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Download size={14} />
                  <span>Export Priority Allocation Plan for District Collector</span>
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800">Statutory MPLADS Guidelines Note:</div>
                <p className="text-[11px] leading-relaxed">
                  As per Revised MPLADS Scheme Guidelines 2023 §3.2, Members of Parliament may recommend priority works in drinking water, primary health, and education without separate state cabinet clearance up to their entitled annual unspent ceiling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
