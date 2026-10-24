import React, { useState } from 'react';
import {
  generateProphetForecast,
  getRootCauseFactors,
  getStateRankings,
  getAgencyPerformances,
  runWhatIfScenario,
} from '../data/analyticsEngine';
import { TrendChart } from '../components/TrendChart';
import { AgencyBubbleChart } from '../components/AgencyBubbleChart';
import { HeatmapGrid } from '../components/HeatmapGrid';
import { RiskBadge } from '../components/RiskBadge';
import { ConstituencyUtilizationD3Chart } from '../components/ConstituencyUtilizationD3Chart';
import { BarChart3, HelpCircle, ArrowRight, Play } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [selectedHorizon, setSelectedHorizon] = useState<3 | 6 | 12>(6);
  const forecast = generateProphetForecast(selectedHorizon);
  const rootCauses = getRootCauseFactors();
  const stateRankings = getStateRankings();
  const agencyPerformances = getAgencyPerformances();

  // What-If Simulation State
  const [vendorRiskShift, setVendorRiskShift] = useState(0);
  const [delayShift, setDelayShift] = useState(0);
  const [agencyCap, setAgencyCap] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleRunSimulation = () => {
    const res = runWhatIfScenario({
      vendorDebarmentEnforced: agencyCap,
      delayDaysOffset: delayShift,
      costInflationMultiplier: 1 + vendorRiskShift / 100,
    });
    setSimulationResult(res);
  };

  // Mock Heatmap Data for top 6 districts across last 6 months
  const heatmapDistricts = ['Bengaluru Urban', 'Varanasi', 'Patna', 'Pune', 'Ernakulam', 'Jaipur'];
  const heatmapMonths = ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26'];
  const heatmapData: Record<string, number | null> = {
    'Bengaluru Urban|Oct 25': 42,
    'Bengaluru Urban|Nov 25': 48,
    'Bengaluru Urban|Dec 25': 55,
    'Bengaluru Urban|Jan 26': 61,
    'Bengaluru Urban|Feb 26': 72,
    'Bengaluru Urban|Mar 26': 84,

    'Varanasi|Oct 25': 28,
    'Varanasi|Nov 25': 32,
    'Varanasi|Dec 25': 38,
    'Varanasi|Jan 26': 45,
    'Varanasi|Feb 26': 52,
    'Varanasi|Mar 26': 59,

    'Patna|Oct 25': 68,
    'Patna|Nov 25': 74,
    'Patna|Dec 25': 81,
    'Patna|Jan 26': 88,
    'Patna|Feb 26': 91,
    'Patna|Mar 26': 94,

    'Pune|Oct 25': 22,
    'Pune|Nov 25': 25,
    'Pune|Dec 25': 27,
    'Pune|Jan 26': 29,
    'Pune|Feb 26': 34,
    'Pune|Mar 26': 36,

    'Ernakulam|Oct 25': 18,
    'Ernakulam|Nov 25': 19,
    'Ernakulam|Dec 25': 21,
    'Ernakulam|Jan 26': 24,
    'Ernakulam|Feb 26': 28,
    'Ernakulam|Mar 26': 31,

    'Jaipur|Oct 25': 54,
    'Jaipur|Nov 25': 58,
    'Jaipur|Dec 25': 62,
    'Jaipur|Jan 26': 66,
    'Jaipur|Feb 26': 73,
    'Jaipur|Mar 26': 79,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 size={22} className="text-indigo-600" />
          <span>Advanced Analytics & Predictive Engine (Phase 14)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Bayesian trend forecasting (Prophet), multivariate causal drivers, agency capacity frontiers, and policy scenario simulator.
        </p>
      </div>

      {/* D3.JS HISTORICAL FUND UTILIZATION TRENDS (12-MONTH TRAJECTORY ACROSS CONSTITUENCIES) */}
      <ConstituencyUtilizationD3Chart />

      {/* Prophet Time Series Forecast Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              National Expenditure Rate: Bayesian Horizon
            </h2>
            <p className="text-xs text-slate-500">
              Historical actuals combined with 80% credible interval bounds
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <span className="text-[11px] text-slate-500 px-2">Horizon:</span>
            {[3, 6, 12].map((h) => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h as any)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedHorizon === h ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                +{h} Months
              </button>
            ))}
          </div>
        </div>

        <TrendChart data={forecast} height={240} lineColor="#4f46e5" />
      </div>

      {/* Two Column Grid: Root Cause Drivers & What-If Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistical Root Cause Drivers */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Root-Cause Association Drivers</h2>
            <span className="text-[11px] font-mono text-slate-400">p &lt; 0.01 Significance</span>
          </div>
          <p className="text-xs text-slate-500">
            Multivariate regression isolating top statistical correlates with delay and fund lapses.
          </p>

          <div className="space-y-3 pt-2">
            {rootCauses.map((rc) => (
              <div key={rc.name} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{rc.name}</span>
                  <span className="font-mono text-indigo-600">Impact Score: {rc.impactScore}/100</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">{rc.description}</p>
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Correlation: r = {rc.correlation.toFixed(2)}</span>
                  <span className="text-emerald-700 font-medium">Mitigation: {rc.remediation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive What-If Policy Simulator */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">What-If Policy Simulator (Phase 14 §4)</h2>
            <p className="text-xs text-slate-500">
              Simulate systemic interventions before altering ministry guidelines.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Contractor Unit Cost Inflation: {vendorRiskShift}%</span>
              </div>
              <input
                type="range"
                min="-20"
                max="40"
                value={vendorRiskShift}
                onChange={(e) => setVendorRiskShift(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700">
                <span>Average Milestone Delay Offset: {delayShift} days</span>
              </div>
              <input
                type="range"
                min="-60"
                max="120"
                value={delayShift}
                onChange={(e) => setDelayShift(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer mt-1"
              />
            </div>

            <label className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={agencyCap}
                onChange={(e) => setAgencyCap(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span className="text-slate-700 font-medium">
                Mandate strict central debarment enforcement (auto-freeze blacklisted vendors)
              </span>
            </label>

            <button
              onClick={handleRunSimulation}
              className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-xs"
            >
              <Play size={13} />
              <span>Simulate Portfolio Impact</span>
            </button>

            {simulationResult && (
              <div className="mt-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1.5 animate-in fade-in duration-200">
                <div className="font-bold text-indigo-900 flex items-center justify-between">
                  <span>Simulation Outcome:</span>
                  <span className="font-mono">
                    Baseline: {simulationResult.baselineRisk} → Projected: {simulationResult.simulatedRisk}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  {simulationResult.summary}
                </p>
                <div className="text-[11px] font-semibold text-emerald-800">
                  Estimated Fund Savings: ₹{simulationResult.estimatedSavingsCr} Crore
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agency Performance Bubble Frontier (Phase 18 §8) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Implementing Agency Performance Frontier (Phase 18 §8)
          </h2>
          <p className="text-xs text-slate-500">
            Bubble size = Total Works Allocated • X-Axis = Delayed Works • Y-Axis = Mean Composite Risk
          </p>
        </div>
        <AgencyBubbleChart agencies={agencyPerformances} />
      </div>

      {/* Calendar Heatmap Grid (Phase 18 §4) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            District Monthly Risk Severity Heatmap (Phase 18 §4)
          </h2>
          <p className="text-xs text-slate-500">
            Aggregated monthly severity indices across representative high-volume districts
          </p>
        </div>
        <HeatmapGrid districts={heatmapDistricts} months={heatmapMonths} dataMatrix={heatmapData} />
      </div>
    </div>
  );
};
