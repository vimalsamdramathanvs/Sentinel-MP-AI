import React, { useState, useMemo } from 'react';
import { SEED_PROJECTS } from '../data/seedProjects';
import { runBenfordsLawAnalysis, findNearDuplicates } from '../data/fraudEngine';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskRadarChart } from '../components/RiskRadarChart';
import { ProjectItem } from '../types';
import {
  ShieldAlert,
  Copy,
  ChevronRight,
  AlertOctagon,
  HelpCircle,
  Network,
  Lock,
  Unlock,
  AlertTriangle,
  Building2,
  Users2,
  FileWarning,
  CheckCircle2,
  TrendingUp,
  Share2,
  ExternalLink,
  Scissors,
  Scale,
  Flame,
  FileText
} from 'lucide-react';

interface FraudCenterViewProps {
  onSelectProject: (p: ProjectItem) => void;
}

export interface SplitTenderItem {
  workId: string;
  title: string;
  sanctionAmountLakhs: number;
  sanctionDate: string;
  contractor: string;
  agency: string;
}

export interface SplitCluster {
  id: string;
  clusterTitle: string;
  district: string;
  state: string;
  thresholdLakhs: number;
  totalValueLakhs: number;
  subWorksCount: number;
  statutoryViolation: string;
  primaryContractor: string;
  contractorPan: string;
  preElectionDays: number;
  subWorks: SplitTenderItem[];
}

const SPLIT_TENDER_CLUSTERS: SplitCluster[] = [
  {
    id: 'SPL-2026-BLR-01',
    clusterTitle: 'Ward 142 Integrated Paving & Storm Drain Civil Works',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    thresholdLakhs: 50,
    totalValueLakhs: 147.6,
    subWorksCount: 3,
    statutoryViolation: 'GFR Rule 157 Evasion: Artificially sliced into 3 micro-packages within 48h to avoid mandatory national open e-tender and State Cabinet clearance threshold (₹50L).',
    primaryContractor: 'Apex Infratech Ltd / Apex Solutions',
    contractorPan: 'AABCA1234F',
    preElectionDays: 14,
    subWorks: [
      {
        workId: 'WRK-BLR-142A',
        title: 'Sector 4 North Asphalt Road Resurfacing',
        sanctionAmountLakhs: 49.2,
        sanctionDate: '2026-02-14',
        contractor: 'Apex Infratech Ltd',
        agency: 'BBMP Engineering Cell',
      },
      {
        workId: 'WRK-BLR-142B',
        title: 'Sector 4 Stormwater Trenching & Covered Precast Slabs',
        sanctionAmountLakhs: 48.9,
        sanctionDate: '2026-02-15',
        contractor: 'Apex Solutions & Civil Ltd',
        agency: 'BBMP Engineering Cell',
      },
      {
        workId: 'WRK-BLR-142C',
        title: 'Main Junction Interlocking Paver Blocks & Kerb Alignment',
        sanctionAmountLakhs: 49.5,
        sanctionDate: '2026-02-16',
        contractor: 'Apex Infratech Ltd',
        agency: 'BBMP Engineering Cell',
      },
    ],
  },
  {
    id: 'SPL-2026-VAR-04',
    clusterTitle: 'Heritage Ghat Smart Solar High-Mast Electrification',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    thresholdLakhs: 50,
    totalValueLakhs: 96.2,
    subWorksCount: 2,
    statutoryViolation: 'Single asset split into electrical fixture & civil foundation packages awarded on the same afternoon to bypass Technical Advisory Committee scrutiny.',
    primaryContractor: 'Bharat Infra Solutions',
    contractorPan: 'BBBPB5678R',
    preElectionDays: 22,
    subWorks: [
      {
        workId: 'WRK-VAR-04A',
        title: 'High-Mast 12m Octagonal Poles & Civil Pier Foundations',
        sanctionAmountLakhs: 48.4,
        sanctionDate: '2026-01-20',
        contractor: 'Bharat Infra Solutions',
        agency: 'UP Jal Nigam / Electrical',
      },
      {
        workId: 'WRK-VAR-04B',
        title: 'Solar Photovoltaic Inverter Banks & Battery Energy Storage',
        sanctionAmountLakhs: 47.8,
        sanctionDate: '2026-01-20',
        contractor: 'Bharat Infra Solutions',
        agency: 'UP Jal Nigam / Electrical',
      },
    ],
  },
  {
    id: 'SPL-2026-PAT-09',
    clusterTitle: 'Phulwari Sharif Sub-Centre Hospital Infrastructure',
    district: 'Patna',
    state: 'Bihar',
    thresholdLakhs: 50,
    totalValueLakhs: 96.3,
    subWorksCount: 2,
    statutoryViolation: 'Sub-Centre health building decoupled into civil superstructure and medical plumbing to award without central PWD pre-qualification criteria.',
    primaryContractor: 'Ganga Valley Buildcon',
    contractorPan: 'CCCPC9012L',
    preElectionDays: 8,
    subWorks: [
      {
        workId: 'WRK-PAT-09A',
        title: 'OPD Extension Block & Patient Waiting Hall',
        sanctionAmountLakhs: 49.8,
        sanctionDate: '2026-02-28',
        contractor: 'Ganga Valley Buildcon',
        agency: 'Building Construction Dept Bihar',
      },
      {
        workId: 'WRK-PAT-09B',
        title: 'Deep Borewell, RO Filtration Plant & Septic Enclosure',
        sanctionAmountLakhs: 46.5,
        sanctionDate: '2026-03-01',
        contractor: 'Ganga Valley Buildcon',
        agency: 'Public Health Engineering Dept',
      },
    ],
  },
];

interface VendorNode {
  id: string;
  name: string;
  type: 'vendor' | 'director' | 'shell_entity';
  riskScore: number;
  tendersWon: number;
  totalValueCr: number;
  x: number;
  y: number;
  din?: string;
  pan?: string;
  district: string;
}

interface CollusionLink {
  source: string;
  target: string;
  type: 'shared_director' | 'shared_gstin' | 'cover_bidding';
  description: string;
}

const VENDOR_NODES: VendorNode[] = [
  {
    id: 'V1',
    name: 'Apex Infratech Ltd',
    type: 'vendor',
    riskScore: 94,
    tendersWon: 14,
    totalValueCr: 12.8,
    x: 200,
    y: 150,
    pan: 'AABCA1234F',
    district: 'Bengaluru Urban',
  },
  {
    id: 'V2',
    name: 'Apex Solutions & Civil Ltd',
    type: 'vendor',
    riskScore: 91,
    tendersWon: 9,
    totalValueCr: 7.4,
    x: 380,
    y: 110,
    pan: 'AABCA9876K',
    district: 'Bengaluru Urban',
  },
  {
    id: 'D1',
    name: 'Director R. K. Singhania',
    type: 'director',
    riskScore: 98,
    tendersWon: 0,
    totalValueCr: 0,
    x: 290,
    y: 240,
    din: 'DIN-08923412',
    district: 'Common Registrant',
  },
  {
    id: 'V3',
    name: 'Vardhman Buildcon Pvt Ltd',
    type: 'vendor',
    riskScore: 82,
    tendersWon: 11,
    totalValueCr: 9.1,
    x: 520,
    y: 220,
    pan: 'BCDEF4567G',
    district: 'Patna',
  },
  {
    id: 'S1',
    name: 'Prime Earthworks (Shell)',
    type: 'shell_entity',
    riskScore: 96,
    tendersWon: 2,
    totalValueCr: 1.8,
    x: 420,
    y: 330,
    pan: 'CDEFG8901H',
    district: 'Patna',
  },
  {
    id: 'V4',
    name: 'Royal Infrastructure Works',
    type: 'vendor',
    riskScore: 68,
    tendersWon: 7,
    totalValueCr: 5.6,
    x: 180,
    y: 340,
    pan: 'DEFGH2345J',
    district: 'Varanasi',
  },
  {
    id: 'D2',
    name: 'Director Sunita Verma',
    type: 'director',
    riskScore: 88,
    tendersWon: 0,
    totalValueCr: 0,
    x: 320,
    y: 410,
    din: 'DIN-07612845',
    district: 'Registered Agent',
  },
];

const COLLUSION_LINKS: CollusionLink[] = [
  {
    source: 'V1',
    target: 'D1',
    type: 'shared_director',
    description: 'R. K. Singhania holds 48% equity & Managing Directorship in Apex Infratech.',
  },
  {
    source: 'V2',
    target: 'D1',
    type: 'shared_director',
    description: 'R. K. Singhania holds 51% equity & Directorship in Apex Solutions.',
  },
  {
    source: 'V1',
    target: 'V2',
    type: 'shared_gstin',
    description: 'Both firms registered at identical physical address: 4th Floor, Preet Vihar, Bengaluru Urban.',
  },
  {
    source: 'V1',
    target: 'V2',
    type: 'cover_bidding',
    description: 'Participated together in 16 competitive bids; one bidder submitted +4.8% cover quotes to allow the other to win.',
  },
  {
    source: 'V3',
    target: 'S1',
    type: 'shared_gstin',
    description: 'Prime Earthworks lists Vardhman Buildcon head office and shared bank authorized signatory.',
  },
  {
    source: 'S1',
    target: 'D2',
    type: 'shared_director',
    description: 'Common family directorship connecting shell subcontracting pipeline.',
  },
  {
    source: 'V4',
    target: 'D2',
    type: 'shared_director',
    description: 'Director Sunita Verma listed as independent director across municipal supply vendors.',
  },
];

export const FraudCenterView: React.FC<FraudCenterViewProps> = ({ onSelectProject }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    SEED_PROJECTS.find((p) => p.riskScore.compositeScore >= 80)?.id || SEED_PROJECTS[0].id
  );
  const [activeTab, setActiveTab] = useState<'ranked' | 'duplicates' | 'collusion' | 'splitting' | 'benford'>('ranked');
  const [selectedVendorNode, setSelectedVendorNode] = useState<VendorNode>(VENDOR_NODES[0]);
  const [selectedSplitClusterId, setSelectedSplitClusterId] = useState<string>(SPLIT_TENDER_CLUSTERS[0].id);
  const [gfrNoticeSent, setGfrNoticeSent] = useState<Record<string, boolean>>({});
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [linkFilter, setLinkFilter] = useState<'all' | 'cover_bidding' | 'shared_director' | 'shared_gstin'>('all');
  const [hoveredLink, setHoveredLink] = useState<CollusionLink | null>(null);
  const [selectedBenfordDigit, setSelectedBenfordDigit] = useState<number | null>(4);

  // Payment stay / freeze state
  const [frozenProjects, setFrozenProjects] = useState<Record<string, { stayId: string; date: string }>>({
    'PRJ-BR-004': { stayId: 'STAY-PFMS-2026-089', date: '2026-09-02' },
  });
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeReason, setFreezeReason] = useState('Suspected Ghost Asset & Substandard Specifications');

  const selectedProject = SEED_PROJECTS.find((p) => p.id === selectedProjectId) || SEED_PROJECTS[0];

  const highRiskProjects = SEED_PROJECTS.filter((p) => p.riskScore.compositeScore >= 60).sort(
    (a, b) => b.riskScore.compositeScore - a.riskScore.compositeScore
  );

  const duplicateProjects = SEED_PROJECTS.filter((p) => p.isDuplicateCandidate);

  // Group into pairs
  const duplicatePairs = [];
  for (let i = 0; i < duplicateProjects.length; i += 2) {
    if (duplicateProjects[i + 1]) {
      duplicatePairs.push({
        pairA: duplicateProjects[i],
        pairB: duplicateProjects[i + 1],
      });
    }
  }

  const handleToggleFreeze = (projectId: string) => {
    if (frozenProjects[projectId]) {
      const updated = { ...frozenProjects };
      delete updated[projectId];
      setFrozenProjects(updated);
    } else {
      setFrozenProjects({
        ...frozenProjects,
        [projectId]: {
          stayId: `STAY-PFMS-2026-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString().slice(0, 10),
        },
      });
      setShowFreezeModal(false);
    }
  };

  const isCurrentProjectFrozen = !!frozenProjects[selectedProject.id];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold tracking-wider uppercase">
              Vigilance Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">Ensemble Isolation Forest + SHAP</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <ShieldAlert size={22} className="text-rose-600" />
            <span>Fraud Intelligence, Cartel Network & Anomaly Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated detection of vendor cartels, duplicate sanctions, unit cost inflation, and emergency treasury payment escrow control.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ranked')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ranked' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ranked Risk Queue ({highRiskProjects.length})
          </button>

          <button
            onClick={() => setActiveTab('collusion')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'collusion' ? 'bg-white text-slate-900 shadow-2xs text-rose-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network size={13} className="text-rose-600" />
            <span>Vendor Cartel Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('splitting')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'splitting' ? 'bg-white text-slate-900 shadow-2xs text-amber-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scissors size={13} className="text-amber-600" />
            <span>Tender Splitting (GFR 157)</span>
          </button>

          <button
            onClick={() => setActiveTab('benford')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'benford' ? 'bg-white text-slate-900 shadow-2xs text-purple-700' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale size={13} className="text-purple-600" />
            <span>Benford's Forensic Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'duplicates' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Near-Duplicates ({duplicatePairs.length})
          </button>
        </div>
      </div>

      {toastNotice && (
        <div className="p-3 bg-slate-900 text-white border border-slate-700 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="font-medium">{toastNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-slate-400 hover:text-white text-xs font-bold ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {activeTab === 'ranked' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Project list with drill-down selector */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Surveillance Queue (Ranked by Composite Risk)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {highRiskProjects.length} Projects Flagged
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {highRiskProjects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                const isFrozen = !!frozenProjects[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`p-4 transition-colors cursor-pointer flex items-center justify-between ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-1 pr-4 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 truncate">{p.title}</span>
                        {p.fraudFlag && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
                            {p.fraudFlag.replace('_', ' ')}
                          </span>
                        )}
                        {isFrozen && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
                            <Lock size={10} /> PAYMENT STAY ORDER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.districtName}, {p.stateName} • Sanctioned: ₹{(p.sanctionedAmount / 1e7).toFixed(2)} Cr • Agency: {p.agencyName}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <RiskBadge score={p.riskScore.compositeScore} />
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Detailed SHAP Attribution & Emergency Payment Freeze */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">{selectedProject.id}</span>
                <StatusBadge status={selectedProject.status} />
              </div>
              <h2 className="text-sm font-bold text-slate-900 mt-1">{selectedProject.title}</h2>
              <div className="text-xs text-slate-500 mt-0.5">
                {selectedProject.districtName}, {selectedProject.stateName}
              </div>
            </div>

            {/* Emergency Payment Stay Order Kill-Switch Badge & Action */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isCurrentProjectFrozen
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isCurrentProjectFrozen ? (
                    <Lock size={18} className="text-rose-600 shrink-0" />
                  ) : (
                    <Unlock size={18} className="text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-xs">
                      {isCurrentProjectFrozen
                        ? 'PFMS Treasury Disbursement FROZEN'
                        : 'Treasury Disbursement Status: Active'}
                    </div>
                    <div className="text-[10px] mt-0.5 text-slate-500">
                      {isCurrentProjectFrozen
                        ? `Stay Docket: ${frozenProjects[selectedProject.id].stayId} • Issued: ${frozenProjects[selectedProject.id].date}`
                        : 'No statutory hold active. Normal milestone release.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (isCurrentProjectFrozen) {
                      handleToggleFreeze(selectedProject.id);
                    } else {
                      setShowFreezeModal(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                    isCurrentProjectFrozen
                      ? 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-100'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {isCurrentProjectFrozen ? 'Revoke Stay' : 'Freeze Funds'}
                </button>
              </div>
            </div>

            {/* Radar Feature Footprint */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Risk Footprint Profile
              </div>
              <RiskRadarChart components={selectedProject.riskScore.components} />
            </div>

            {/* SHAP Waterfall Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Top Risk Driver Attributions (SHAP)</span>
                <HelpCircle size={13} className="text-slate-400" />
              </div>

              {selectedProject.riskScore.explanation.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="capitalize">{item.component.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-rose-600 font-bold">+{item.contribution.toFixed(1)} pts</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.narrative}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onSelectProject(selectedProject)}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span>Open Full Statutory Investigation Drawer</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Vendor Collusion & Cartel Bidding Network Graph */}
      {activeTab === 'collusion' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <Network size={16} />
                <span>Interlocking Directorship & Cartel Bid Rotation Analysis</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Autonomous Cartel Network Detection (GeM & State Tenders)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Graph clustering maps shared Director Identification Numbers (DIN), identical registered GSTIN offices, and suspicious bid-rotation margins (submitting cover bids within 3% of benchmark to ensure pre-selected wins).
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 text-center shrink-0">
              <div>
                <div className="text-[10px] text-slate-300 font-medium">Flagged Cartels</div>
                <div className="text-xl font-black text-rose-400">3 Syndicates</div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <div className="text-[10px] text-slate-300 font-medium">Compromised Tenders</div>
                <div className="text-xl font-black text-white">₹36.7 Cr</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive SVG Network Canvas */}
            <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl relative min-h-[500px] flex flex-col justify-between overflow-hidden">
              {/* Header Filter Pill Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 z-10 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-[11px]">
                  <button
                    onClick={() => setLinkFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      linkFilter === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Connections ({COLLUSION_LINKS.length})
                  </button>
                  <button
                    onClick={() => setLinkFilter('cover_bidding')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                      linkFilter === 'cover_bidding' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Cover Bidding</span>
                  </button>
                  <button
                    onClick={() => setLinkFilter('shared_director')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                      linkFilter === 'shared_director' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded bg-amber-400" />
                    <span>Shared DIN</span>
                  </button>
                  <button
                    onClick={() => setLinkFilter('shared_gstin')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                      linkFilter === 'shared_gstin' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-400 hover:text-purple-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Shared Address/GSTIN</span>
                  </button>
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  Tip: Click any node or link line to inspect relationship evidence
                </div>
              </div>

              {/* Network Legend */}
              <div className="absolute top-16 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 space-y-1 shadow-lg">
                <div className="font-bold text-white text-xs">Network Legend</div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span>High-Risk Contractor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-400" />
                  <span>Interlocking Director (DIN)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Suspected Shell Subcontractor</span>
                </div>
              </div>

              {/* Hovered / Active Link Toast */}
              {hoveredLink && (
                <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl p-3 text-xs text-slate-200 shadow-2xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5 capitalize text-xs">
                      <span className={`w-2 h-2 rounded-full ${hoveredLink.type === 'cover_bidding' ? 'bg-rose-500' : hoveredLink.type === 'shared_director' ? 'bg-amber-500' : 'bg-purple-500'}`} />
                      <span>{hoveredLink.type.replace(/_/g, ' ')} Evidence</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{hoveredLink.description}</p>
                  </div>
                  <button
                    onClick={() => setHoveredLink(null)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              <svg viewBox="0 0 700 480" className="w-full h-full max-h-[460px] my-auto">
                {/* Collusion Connection Edges */}
                {COLLUSION_LINKS.filter(
                  (l) => linkFilter === 'all' || l.type === linkFilter
                ).map((link, idx) => {
                  const src = VENDOR_NODES.find((n) => n.id === link.source);
                  const tgt = VENDOR_NODES.find((n) => n.id === link.target);
                  if (!src || !tgt) return null;

                  const isHighlighted =
                    selectedVendorNode.id === src.id || selectedVendorNode.id === tgt.id || hoveredLink === link;

                  const strokeColor =
                    link.type === 'cover_bidding'
                      ? '#ef4444'
                      : link.type === 'shared_director'
                      ? '#f59e0b'
                      : '#8b5cf6';

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onClick={() => setHoveredLink(link)}
                      onMouseEnter={() => setHoveredLink(link)}
                    >
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 4 : 2}
                        strokeDasharray={link.type === 'cover_bidding' ? '6,6' : 'none'}
                        opacity={isHighlighted ? 1 : 0.45}
                      />
                      {/* Invisible wider stroke for easier clicking */}
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke="transparent"
                        strokeWidth={14}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {VENDOR_NODES.map((node) => {
                  const isSelected = selectedVendorNode.id === node.id;
                  const isDirector = node.type === 'director';
                  const isShell = node.type === 'shell_entity';
                  const fill = isDirector
                    ? '#f59e0b'
                    : isShell
                    ? '#a855f7'
                    : node.riskScore >= 85
                    ? '#ef4444'
                    : '#3b82f6';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedVendorNode(node)}
                      className="cursor-pointer group"
                    >
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={28}
                          fill="rgba(59, 130, 246, 0.25)"
                          className="animate-ping"
                        />
                      )}

                      {isDirector ? (
                        <rect
                          x={node.x - 12}
                          y={node.y - 12}
                          width={24}
                          height={24}
                          rx={4}
                          fill={fill}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                      ) : (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 18 : 14}
                          fill={fill}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                      )}

                      <text
                        x={node.x}
                        y={node.y + 24}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill={isSelected ? '#60a5fa' : '#cbd5e1'}
                      >
                        {node.name.length > 20 ? `${node.name.substring(0, 18)}...` : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Node Intelligence Card */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Cartel Graph Intelligence Inspector
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-600" />
                  <span>{selectedVendorNode.name}</span>
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Location: {selectedVendorNode.district} • Node Type:{' '}
                  <span className="capitalize font-semibold text-slate-700">{selectedVendorNode.type.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Risk metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400">Cartel Risk Index</span>
                  <div className="text-lg font-black text-rose-600 mt-0.5">
                    {selectedVendorNode.riskScore}/100
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400">Contracts Won</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedVendorNode.tendersWon} Tenders
                  </div>
                </div>

                <div className="col-span-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[10px] text-blue-700">Cumulative Sanction Value</span>
                  <div className="text-base font-extrabold text-blue-950 mt-0.5">
                    ₹{selectedVendorNode.totalValueCr} Crores
                  </div>
                </div>
              </div>

              {/* Connected Relationships */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Associated Interlocking Links
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {COLLUSION_LINKS.filter(
                    (l) => l.source === selectedVendorNode.id || l.target === selectedVendorNode.id
                  ).map((link, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="capitalize text-[11px] text-rose-700">
                          {link.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Verified Match</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{link.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setToastNotice(`Statutory Dossier for ${selectedVendorNode.name} dispatched to Central Vigilance Commission (CVC) registry.`);
                    setTimeout(() => setToastNotice(null), 4500);
                  }}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileWarning size={14} />
                  <span>Refer Syndicate to Central Vigilance Commission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Near Duplicate Projects Tab */}
      {activeTab === 'splitting' && (
        <div className="space-y-6">
          {/* Top KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Compromised Split Contracts</span>
              <div className="text-xl font-black text-rose-900 mt-1">₹3.40 Cr</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across {SPLIT_TENDER_CLUSTERS.length} artificial micro-clusters</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-amber-600">Mean Sub-Threshold Proximity</span>
              <div className="text-xl font-black text-amber-900 mt-1">98.2%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Average sanction ₹48.9L vs ₹50L cap</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-purple-600">Pre-Election Velocity Spike</span>
              <div className="text-xl font-black text-purple-900 mt-1">3.4x Baseline</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Approved &lt; 30 days before code of conduct</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs font-semibold text-slate-600">Statutory Infraction</span>
              <div className="text-xs font-bold text-slate-900 mt-1">GFR 2017 Rule 157</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Prohibition of tender splitting to bypass CPPP</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Cluster Roster */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
                Flagged Split Work Clusters ({SPLIT_TENDER_CLUSTERS.length})
              </div>

              {SPLIT_TENDER_CLUSTERS.map((cluster) => {
                const isSelected = cluster.id === selectedSplitClusterId;
                return (
                  <div
                    key={cluster.id}
                    onClick={() => setSelectedSplitClusterId(cluster.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {cluster.id}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {cluster.subWorksCount} Sliced Contracts
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                          {cluster.clusterTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {cluster.district}, {cluster.state}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-900">
                          ₹{cluster.totalValueLakhs.toFixed(1)}L
                        </div>
                        <span className="text-[10px] text-slate-400">Total Value</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium truncate max-w-[200px]">
                        Vendor: <strong>{cluster.primaryContractor}</strong>
                      </span>
                      <span className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                        <Flame size={12} /> {cluster.preElectionDays}d before MCC
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Col: Selected Cluster In-Depth Audit */}
            {(() => {
              const cluster =
                SPLIT_TENDER_CLUSTERS.find((c) => c.id === selectedSplitClusterId) ||
                SPLIT_TENDER_CLUSTERS[0];
              const isNoticeSent = !!gfrNoticeSent[cluster.id];

              return (
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {cluster.id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {cluster.district}, {cluster.state}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-1">
                        {cluster.clusterTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Awarded Contractor: <strong>{cluster.primaryContractor}</strong> (PAN: {cluster.contractorPan})
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Cumulative Spend</div>
                      <div className="text-base font-black text-slate-900">₹{cluster.totalValueLakhs} Lakhs</div>
                      <div className="text-[10px] text-rose-600 font-bold">
                        {(cluster.totalValueLakhs / cluster.thresholdLakhs).toFixed(1)}x over threshold
                      </div>
                    </div>
                  </div>

                  {/* Sub-threshold Visual Bar Dissection */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Scale size={14} className="text-blue-600" />
                        Statutory Threshold vs Sliced Contract Packages
                      </span>
                      <span className="font-mono text-[11px] text-rose-600 font-bold">
                        Mandatory Open E-Tender Cap: ₹50.00 Lakhs
                      </span>
                    </div>

                    {/* Progress bars showing each work hugging the 50L limit */}
                    <div className="space-y-2">
                      {cluster.subWorks.map((work) => {
                        const pct = (work.sanctionAmountLakhs / cluster.thresholdLakhs) * 100;
                        return (
                          <div key={work.workId} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-medium text-slate-700">
                                [{work.workId}] {work.title}
                              </span>
                              <span className="font-mono font-bold text-amber-900">
                                ₹{work.sanctionAmountLakhs}L ({pct.toFixed(1)}% of cap)
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 relative overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/80">
                      <span>0 Lakhs</span>
                      <span className="font-bold text-rose-600">▲ ₹50.00L Mandatory CPPP Limit</span>
                    </div>
                  </div>

                  {/* Sub-works Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Constituent Micro-Packages
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Work Code & Description</th>
                            <th className="p-2.5">Sanction Date</th>
                            <th className="p-2.5 text-right">Amount</th>
                            <th className="p-2.5">Executing Agency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {cluster.subWorks.map((w) => (
                            <tr key={w.workId} className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-sans font-medium text-slate-900">
                                <div>{w.title}</div>
                                <span className="text-[10px] text-slate-400 font-mono">{w.workId}</span>
                              </td>
                              <td className="p-2.5 text-slate-600">{w.sanctionDate}</td>
                              <td className="p-2.5 text-right font-bold text-slate-900">
                                ₹{w.sanctionAmountLakhs.toFixed(2)}L
                              </td>
                              <td className="p-2.5 text-slate-600 font-sans">{w.agency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Statutory Audit Finding */}
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertOctagon size={14} className="text-rose-600" />
                      <span>CAG & GFR Non-Compliance Assessment</span>
                    </div>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      {cluster.statutoryViolation}
                    </p>
                  </div>

                  {/* Action Bar */}
                  {isNoticeSent && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Statutory Show-Cause Notice under GFR 157 dispatched to District Collector & Executive Engineer.</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => {
                        setGfrNoticeSent({ ...gfrNoticeSent, [cluster.id]: true });
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FileText size={14} />
                      <span>Issue Statutory GFR 157 Show-Cause Notice</span>
                    </button>

                    <button
                      onClick={() => {
                        setToastNotice(`Vigilance dossier for ${cluster.id} prepared with annexures.`);
                        setTimeout(() => setToastNotice(null), 4500);
                      }}
                      className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Export Tender Audit Dossier</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'benford' && (() => {
        const benford = runBenfordsLawAnalysis();
        const maxPct = Math.max(...benford.distribution.map((d) => Math.max(d.actualPct, d.expectedPct)), 35);
        const matchingProjects = SEED_PROJECTS.filter((p) => {
          if (!selectedBenfordDigit) return true;
          const str = Math.abs(p.sanctionedAmount).toString().replace(/^0+/, '');
          const firstDigit = parseInt(str[0], 10);
          return firstDigit === selectedBenfordDigit;
        });

        return (
          <div className="space-y-6">
            {/* Overview Banner */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-400/20 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
                    First-Digit Forensic Law (Phase 7 §1)
                  </span>
                  <span className="text-xs text-purple-200 font-mono">P(d) = log₁₀(1 + 1/d)</span>
                </div>
                <h2 className="text-lg font-bold">Benford's Law Forensic Sanction &amp; Bill Audit</h2>
                <p className="text-xs text-purple-200 max-w-2xl leading-relaxed">
                  In authentic governmental expenditure, leading digits conform to Benford's logarithmic distribution. Human-engineered budgeting, contract splitting, and fabricated measurement books produce statistically significant spikes.
                </p>
              </div>

              {/* Status Pill */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center shrink-0">
                <div className="text-[10px] uppercase font-bold text-purple-200">Forensic Verdict</div>
                <div className={`text-base font-black mt-0.5 ${benford.isConformant ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {benford.isConformant ? 'Conformant (Normal)' : '⚠️ Severe Anomaly (p < 0.01)'}
                </div>
                <div className="text-[10px] font-mono text-purple-300 mt-0.5">
                  χ² = {benford.chiSquareStatistic} (Threshold: 15.51)
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Audited Vouchers</span>
                <div className="text-lg font-black text-slate-900 mt-1">{benford.sampleSize} Projects</div>
                <div className="text-[11px] text-slate-500 mt-0.5">100% PFMS ledger sampled</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Degrees of Freedom</span>
                <div className="text-lg font-black text-slate-900 mt-1">df = 8 (Digits 1–9)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Critical χ²α=0.05 = 15.51</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200 bg-purple-50/50 shadow-2xs">
                <span className="text-[10px] text-purple-700 uppercase font-bold">Primary Anomaly Spike</span>
                <div className="text-lg font-black text-purple-900 mt-1">Digit 4 (+16.8% Δ)</div>
                <div className="text-[11px] text-purple-700 mt-0.5">26.5% actual vs 9.7% expected</div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs">
                <span className="text-[10px] text-amber-800 uppercase font-bold">Underlying Evasion</span>
                <div className="text-lg font-black text-amber-900 mt-1">₹50L Tender Cap</div>
                <div className="text-[11px] text-amber-800 mt-0.5">Clusters at ₹48.0L – ₹49.5L</div>
              </div>
            </div>

            {/* Interactive Histogram Comparison Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Scale size={16} className="text-purple-600" />
                    <span>Digit Frequency Distribution: Actual vs. Benford Expected</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click any digit bar to filter all corresponding project sanctions and inspect potential split packages.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-600" />
                    <span className="text-slate-700 font-medium">Actual Frequency</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded border border-dashed border-slate-400 bg-slate-100" />
                    <span className="text-slate-500 font-medium">Benford Theoretical</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="pt-4 pb-2">
                <div className="grid grid-cols-9 gap-2 sm:gap-4 items-end h-64 border-b border-slate-200 pb-2">
                  {benford.distribution.map((item) => {
                    const isSelected = selectedBenfordDigit === item.digit;
                    const isAnomalous = Math.abs(item.actualPct - item.expectedPct) > 8;
                    const actualHeightPct = (item.actualPct / maxPct) * 100;
                    const expectedHeightPct = (item.expectedPct / maxPct) * 100;

                    return (
                      <div
                        key={item.digit}
                        onClick={() => setSelectedBenfordDigit(item.digit)}
                        className={`flex flex-col items-center cursor-pointer group h-full justify-end rounded-xl p-1 transition-all ${
                          isSelected ? 'bg-purple-50 ring-2 ring-purple-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Percent label */}
                        <div className="text-[10px] font-mono font-bold text-slate-700 mb-1 text-center">
                          <span className={isAnomalous ? 'text-rose-600 font-black' : ''}>{item.actualPct}%</span>
                          <span className="text-slate-400 text-[9px] block">exp {item.expectedPct}%</span>
                        </div>

                        {/* Dual Bar Display */}
                        <div className="w-full flex items-end justify-center gap-1 h-44 relative">
                          {/* Expected theoretical bar */}
                          <div
                            style={{ height: `${expectedHeightPct}%` }}
                            className="w-1/2 rounded-t bg-slate-200 border-t-2 border-dashed border-slate-400 transition-all"
                            title={`Benford Expected for Digit ${item.digit}: ${item.expectedPct}%`}
                          />

                          {/* Actual empirical bar */}
                          <div
                            style={{ height: `${actualHeightPct}%` }}
                            className={`w-1/2 rounded-t transition-all ${
                              isAnomalous
                                ? 'bg-rose-500 group-hover:bg-rose-600'
                                : 'bg-purple-600 group-hover:bg-purple-700'
                            }`}
                            title={`Actual for Digit ${item.digit}: ${item.actualPct}% (${item.actualCount} items)`}
                          />
                        </div>

                        {/* Digit Label */}
                        <div className="mt-2 text-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {item.digit}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                            n={item.actualCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanatory callout for selected digit */}
              {selectedBenfordDigit && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Forensic Analysis for Digit {selectedBenfordDigit}:</span>
                    {selectedBenfordDigit === 4 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[10px]">
                        CRITICAL GFR 157 SPLIT CLUSTERING
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedBenfordDigit === 4
                      ? 'Digit 4 accounts for over 26% of all sanctions, deviating significantly from the expected 9.7%. This clustering is caused by high-density work allocations in the ₹40L–₹49.9L range, artificially avoiding the ₹50L open e-procurement threshold.'
                      : `Filtered below are all ${matchingProjects.length} projects whose sanctioned allocation begins with digit ${selectedBenfordDigit}.`}
                  </p>
                </div>
              )}
            </div>

            {/* Filtered Projects Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Projects with First Digit = {selectedBenfordDigit || 'All'} ({matchingProjects.length} items)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Inspect contract values and executing agencies for procurement threshold circumvention.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBenfordDigit(null)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Clear Digit Filter
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {matchingProjects.map((p) => {
                  const amtLakhs = (p.sanctionedAmount / 1e5).toFixed(1);
                  const isNear50L = p.sanctionedAmount >= 4500000 && p.sanctionedAmount < 5000000;

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                          <span className="font-bold text-slate-900 truncate">{p.title}</span>
                          {isNear50L && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[9px] uppercase">
                              ₹50L Boundary Evader
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.districtName}, {p.stateName} • Agency: {p.agencyName}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">
                          ₹{amtLakhs} Lakhs
                        </div>
                        <div className="mt-0.5">
                          <RiskBadge score={p.riskScore.compositeScore} size="sm" />
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectProject(p)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 font-semibold text-xs shrink-0"
                      >
                        Inspect Dossier →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <Copy size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Near-Duplicate Detection Engine (Phase 6 §2)</strong>
              <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                Flags overlapping project sanctions using a composite score: TF-IDF title cosine similarity (50%), same implementing agency (25%), date range overlap within 180 days (15%), and spatial proximity within 5km (10%).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {duplicatePairs.map((pair, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-rose-600 flex items-center gap-1">
                    <AlertOctagon size={13} />
                    <span>Candidate Pair #{idx + 1} (Score: 0.88 / 1.0)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Distance: ~450m</span>
                </div>

                {/* Project A */}
                <div
                  onClick={() => onSelectProject(pair.pairA)}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate">{pair.pairA.title}</span>
                    <RiskBadge score={pair.pairA.riskScore.compositeScore} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Sanctioned: ₹{(pair.pairA.sanctionedAmount / 1e7).toFixed(2)} Cr • {pair.pairA.districtName}
                  </div>
                </div>

                {/* Project B */}
                <div
                  onClick={() => onSelectProject(pair.pairB)}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate">{pair.pairB.title}</span>
                    <RiskBadge score={pair.pairB.riskScore.compositeScore} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Sanctioned: ₹{(pair.pairB.sanctionedAmount / 1e7).toFixed(2)} Cr • {pair.pairB.districtName}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
                  <span>Implementing Agency: <strong>{pair.pairA.agencyName}</strong></span>
                  <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => onSelectProject(pair.pairA)}>
                    Inspect Both →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Payment Stay Confirmation Modal */}
      {showFreezeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowFreezeModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-rose-200 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
              <AlertTriangle size={20} />
              <span>Issue Emergency PFMS Payment Stay Order</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Under MoSPI Vigilance Operational Rule 14.2, issuing this stay immediately halts any pending electronic PFMS payment advice for project <strong>{selectedProject.id}</strong>.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700">Statutory Ground for Stay:</label>
              <select
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
              >
                <option value="Suspected Ghost Asset & Substandard Specifications">
                  Suspected Ghost Asset & Substandard Specifications
                </option>
                <option value="Active Central Vigilance Commission (CVC) Inquiry">
                  Active Central Vigilance Commission (CVC) Inquiry
                </option>
                <option value="Unregistered Subcontractor & Cartel Bidding Violation">
                  Unregistered Subcontractor & Cartel Bidding Violation
                </option>
                <option value="Severe Material Cost Discrepancy (>40% Schedule of Rates)">
                  Severe Material Cost Discrepancy (&gt;40% Schedule of Rates)
                </option>
              </select>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900">
              <strong>Notice:</strong> This action is cryptographically signed and logged with the State Planning Department and District Magistrate.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowFreezeModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleFreeze(selectedProject.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Confirm Stay Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
