import React, { useState, useMemo } from 'react';
import { SEED_PROJECTS } from '../data/seedProjects';
import { INITIAL_ALERTS } from '../data/alertsEngine';
import { getStateRankings } from '../data/analyticsEngine';
import { getFraudHotspotClusters } from '../data/gisEngine';
import { STATES_MAP } from '../data/geography';
import { KpiCard } from '../components/KpiCard';
import { TrendChart } from '../components/TrendChart';
import { FundFlowSankey } from '../components/FundFlowSankey';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardGisMap } from '../components/DashboardGisMap';
import { ProjectItem } from '../types';
import {
  FolderKanban,
  Clock,
  AlertTriangle,
  IndianRupee,
  ShieldCheck,
  ArrowUpRight,
  MapPin,
  Compass,
  Flame,
  Layers,
  ChevronRight,
  ExternalLink,
  Navigation,
  Briefcase,
  Scale
} from 'lucide-react';

interface DashboardViewProps {
  onSelectProject: (p: ProjectItem, openDossier?: boolean) => void;
  onNavigate: (tab: any) => void;
  onOpenDisha?: () => void;
  onOpenGfr?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectProject,
  onNavigate,
  onOpenDisha,
  onOpenGfr,
}) => {
  // Load all projects including any custom/locally created ones
  const allProjects = useMemo(() => {
    let customProjects: ProjectItem[] = [];
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('mplads_custom_projects');
        if (saved) customProjects = JSON.parse(saved);
      }
    } catch (_) {}
    return [...customProjects, ...SEED_PROJECTS];
  }, []);

  const totalProjects = allProjects.length;
  const delayedProjects = allProjects.filter((p) => p.status === 'delayed').length;
  const totalSanctioned = allProjects.reduce((acc, p) => acc + p.sanctionedAmount, 0);
  const totalUtilized = allProjects.reduce((acc, p) => acc + p.utilizedAmount, 0);
  const openCriticalAlerts = INITIAL_ALERTS.filter((a) => a.severity === 'critical' && a.status === 'open').length;

  const stateRankings = getStateRankings();
  const hotspotClusters = useMemo(() => getFraudHotspotClusters(), []);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  const utilizationTrend = [
    { label: 'Jan 25', value: 0.52 },
    { label: 'Mar 25', value: 0.72 },
    { label: 'May 25', value: 0.61 },
    { label: 'Jul 25', value: 0.59 },
    { label: 'Sep 25', value: 0.62 },
    { label: 'Nov 25', value: 0.69 },
    { label: 'Jan 26', value: 0.71, isForecast: true, lower: 0.65, upper: 0.77 },
    { label: 'Mar 26', value: 0.84, isForecast: true, lower: 0.76, upper: 0.91 },
  ];

  const categoryFlows = [
    { name: 'road', sanctioned: 320000000, released: 280000000, utilized: 235000000 },
    { name: 'water', sanctioned: 240000000, released: 210000000, utilized: 135000000 },
    { name: 'health', sanctioned: 180000000, released: 145000000, utilized: 118000000 },
    { name: 'education', sanctioned: 160000000, released: 140000000, utilized: 122000000 },
    { name: 'drainage', sanctioned: 95000000, released: 78000000, utilized: 59000000 },
  ];

  const topCriticalProjects = allProjects.filter((p) => p.riskScore.compositeScore >= 80).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            National MPLADS Intelligence Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance across 40 Representative Districts in 8 States • 18th Lok Sabha Active Tranche
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenDisha && (
            <button
              onClick={onOpenDisha}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Open District Development Coordination & Monitoring Committee Executive Pack"
            >
              <Briefcase size={14} className="text-amber-700" />
              <span>DISHA Review Pack</span>
            </button>
          )}
          {onOpenGfr && (
            <button
              onClick={onOpenGfr}
              className="px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-900 text-xs font-semibold hover:bg-purple-100 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Open GFR 2017 & MoSPI Statutory Rule Engine & Show-Cause Generator"
            >
              <Scale size={14} className="text-purple-700" />
              <span>GFR Compliance</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('gis')}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Compass size={14} className="text-blue-600" />
            <span>GIS Map</span>
          </button>
          <button
            onClick={() => onNavigate('copilot')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ask AI</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Monitored Projects"
          value={totalProjects.toLocaleString()}
          subValue="40 Operational Districts"
          icon={<FolderKanban size={18} />}
          onClick={() => onNavigate('projects')}
        />
        <KpiCard
          label="Delayed Projects"
          value={delayedProjects.toLocaleString()}
          subValue={`${Math.round((delayedProjects / totalProjects) * 100)}% of active works`}
          tone={delayedProjects / totalProjects > 0.15 ? 'warning' : 'neutral'}
          trend={{ direction: 'up', label: '+4.2% this quarter' }}
          icon={<Clock size={18} />}
          onClick={() => onNavigate('projects')}
        />
        <KpiCard
          label="Sanctioned Value"
          value={`₹${(totalSanctioned / 1e7).toFixed(1)} Cr`}
          subValue={`Utilized: ₹${(totalUtilized / 1e7).toFixed(1)} Cr`}
          tone="neutral"
          icon={<IndianRupee size={18} />}
          onClick={() => onNavigate('mpledger')}
        />
        <KpiCard
          label="Open Critical Alerts"
          value={openCriticalAlerts}
          subValue="Flagged by ML Ensemble"
          tone={openCriticalAlerts > 0 ? 'critical' : 'positive'}
          trend={{ direction: 'down', label: '-2 resolved this week' }}
          icon={<AlertTriangle size={18} />}
          onClick={() => onNavigate('alerts')}
        />
      </div>

      {/* Mid Section: Trends & Critical Alerts Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenditure Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                National Fund Utilization Curve & Prophet Horizon
              </h2>
              <p className="text-xs text-slate-500">
                Monthly cumulative expenditure ratio with 80% Bayesian forecast corridor
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Model: Prophet-v2
            </span>
          </div>

          <TrendChart data={utilizationTrend} height={210} lineColor="#2563eb" />
        </div>

        {/* Highest Risk State Rankings */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Highest-Risk States</h2>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
            >
              All Rankings →
            </button>
          </div>

          <div className="space-y-2.5 divide-y divide-slate-100">
            {stateRankings.slice(0, 5).map((st, i) => (
              <div key={st.stateId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">
                    {i + 1}. {st.stateName}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {st.totalProjects} works • {st.delayedProjects} delayed
                  </div>
                </div>
                <div className="text-right">
                  <RiskBadge score={st.avgRiskScore} size="sm" />
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Util: {st.utilizationRate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GIS Spatial Map & Geo-Radar Surveillance Module in Dashboard */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wider uppercase">
                Geospatial Surveillance
              </span>
              <span className="text-xs text-slate-500 font-mono">EPSG:4326 WGS84</span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Compass size={18} className="text-blue-600" />
              <span>National GIS Spatial Map & DBSCAN Fraud Radar</span>
            </h2>
            <p className="text-xs text-slate-500">
              Live geographic surveillance across 40 operational districts in 8 key states with spatial clumping alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('gis')}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Full GIS Spatial Map</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Spatial KPI Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
          <div>
            <span className="text-[11px] text-slate-500 font-medium">Monitored Coordinates</span>
            <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
              {allProjects.length} Points
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">100% Geofenced WGS-84</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium">DBSCAN Fraud Hotspots</span>
            <div className="text-base font-bold text-rose-600 mt-0.5 font-mono">
              5 Active Clusters
            </div>
            <span className="text-[10px] text-rose-600 font-semibold">27 Concentrated Works</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium">Co-Located Duplicate Sanctions</span>
            <div className="text-base font-bold text-purple-600 mt-0.5 font-mono">
              10 Pairs (20 Works)
            </div>
            <span className="text-[10px] text-purple-600 font-semibold">Zero Spatial Displacement</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 font-medium">Satellite Audit Coverage</span>
            <div className="text-base font-bold text-blue-600 mt-0.5 font-mono">
              Sentinel-2 & Bhuvan
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">Multi-spectral Verification</span>
          </div>
        </div>

        {/* Embedded Interactive Live GIS Spatial Radar Map */}
        <DashboardGisMap
          projects={allProjects}
          clusters={hotspotClusters}
          selectedClusterId={selectedClusterId}
          onSelectProject={onSelectProject}
          onSelectCluster={(cluster) => setSelectedClusterId(cluster ? cluster.clusterId : null)}
          onLaunchFullMap={() => onNavigate('gis')}
        />

        {/* Active DBSCAN Hotspot Radar Cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={14} className="text-rose-500" />
              <span>High-Density DBSCAN Hotspot Clusters</span>
            </h3>
            <span className="text-[11px] text-slate-400">Click any cluster to focus radar map</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {hotspotClusters.map((cluster) => {
              const isSelected = selectedClusterId === cluster.clusterId;
              return (
                <div
                  key={cluster.clusterId}
                  onClick={() => setSelectedClusterId(cluster.clusterId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group space-y-1.5 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/40 shadow-xs ring-1 ring-rose-300'
                      : 'border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                      Cluster #{cluster.clusterId}
                    </span>
                    <RiskBadge score={cluster.avgRiskScore} size="sm" />
                  </div>

                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cluster.districtName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {cluster.stateName} • {cluster.projectCount} Works
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                    {cluster.topPattern}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-rose-600' : 'text-slate-500'}`}>
                      {isSelected ? '● Focused on Radar' : 'Focus Radar'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('gis');
                      }}
                      className="text-[10px] text-blue-600 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      <span>Full GIS</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fund Flow Sankey Diagram */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              MPLADS Fund Flow Lifecycle (Phase 18 Sankey)
            </h2>
            <p className="text-xs text-slate-500">
              Sanctioned allocations to category disbursements and verified on-ground expenditures
            </p>
          </div>
        </div>
        <FundFlowSankey categories={categoryFlows} />
      </div>

      {/* Bottom Priority Table: Top Flagged Projects for Immediate Vigilance */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Critical Surveillance Projects Requiring Review
            </h2>
            <p className="text-xs text-slate-500">
              High composite risk scores (≥80/100) or verified fraud pattern triggers
            </p>
          </div>
          <button
            onClick={() => onNavigate('fraud')}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Open Fraud Center →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <th className="pb-2">Project Title</th>
                <th className="pb-2">District / State</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Sanctioned</th>
                <th className="pb-2">Anomaly Trigger</th>
                <th className="pb-2 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topCriticalProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectProject(p, false)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 font-semibold text-slate-800 max-w-xs truncate">
                    {p.title}
                  </td>
                  <td className="py-2.5 text-slate-600 whitespace-nowrap">
                    {p.districtName}, {p.stateName}
                  </td>
                  <td className="py-2.5 capitalize text-slate-600">{p.category.replace('_', ' ')}</td>
                  <td className="py-2.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-2.5 font-mono text-slate-800">
                    ₹{(p.sanctionedAmount / 1e7).toFixed(2)} Cr
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                      {p.fraudFlag?.replace('_', ' ') || 'High Variance'}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <RiskBadge score={p.riskScore.compositeScore} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
