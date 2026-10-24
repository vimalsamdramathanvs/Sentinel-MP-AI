import React, { useState, useMemo } from 'react';
import { ProjectItem } from '../types';
import { SEED_PROJECTS } from '../data/seedProjects';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';
import { openPrintPreview } from '../utils/printService';
import {
  X,
  Printer,
  Download,
  FileText,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Users,
  Award,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  Check,
  Share2
} from 'lucide-react';

interface DishaReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (project: ProjectItem) => void;
}

export const DishaReviewModal: React.FC<DishaReviewModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  // District selection for DISHA review
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');
  const [meetingDate, setMeetingDate] = useState<string>('2026-09-28');
  const [isCopied, setIsCopied] = useState(false);

  // Available districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    SEED_PROJECTS.forEach((p) => set.add(p.districtName));
    return Array.from(set).sort();
  }, []);

  // Filter projects by district
  const districtProjects = useMemo(() => {
    return SEED_PROJECTS.filter((p) => p.districtName === selectedDistrict);
  }, [selectedDistrict]);

  // Financial aggregates
  const totalSanctioned = districtProjects.reduce((acc, p) => acc + p.sanctionedAmount, 0);
  const totalReleased = districtProjects.reduce((acc, p) => acc + p.releasedAmount, 0);
  const totalUtilized = districtProjects.reduce((acc, p) => acc + p.utilizedAmount, 0);
  const utilizationRate = totalReleased > 0 ? Math.round((totalUtilized / totalReleased) * 100) : 0;

  // Lagging / delayed projects
  const laggingProjects = districtProjects.filter(
    (p) => p.status === 'delayed' || p.riskScore.compositeScore >= 70
  );

  // Completed projects
  const completedProjects = districtProjects.filter((p) => p.status === 'completed');

  // Contractor concentration
  const vendorBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalSanctioned: number; blacklisted: boolean }> = {};
    districtProjects.forEach((p) => {
      if (!map[p.vendorName]) {
        map[p.vendorName] = { count: 0, totalSanctioned: 0, blacklisted: p.vendorBlacklisted };
      }
      map[p.vendorName].count += 1;
      map[p.vendorName].totalSanctioned += p.sanctionedAmount;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalSanctioned - a.totalSanctioned);
  }, [districtProjects]);

  const topVendorShare =
    totalSanctioned > 0 && vendorBreakdown.length > 0
      ? Math.round((vendorBreakdown[0].totalSanctioned / totalSanctioned) * 100)
      : 0;

  if (!isOpen) return null;

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handlePrint = () => {
    openPrintPreview({
      title: `DISHA Monthly Review Agenda & Oversight Brief — ${selectedDistrict}`,
      subtitle: `Chaired by District Magistrate / Collector • Meeting Date: ${meetingDate} • MPLADS Guidelines 2023 Para 5.4`,
      referenceId: `DISHA-${selectedDistrict.toUpperCase().slice(0, 3)}-2026-M09`,
      badgeText: 'DISHA REVIEW PACK',
      fileNamePrefix: `DISHA_Review_Pack_${selectedDistrict}`,
      kpiCards: [
        {
          label: 'Total Monitored Works',
          value: `${districtProjects.length} Works`,
          sub: `${completedProjects.length} Completed`,
        },
        {
          label: 'Sanctioned Outlay',
          value: formatCurrency(totalSanctioned),
          sub: '18th Lok Sabha Action Plan',
        },
        {
          label: 'Fund Utilization',
          value: `${utilizationRate}%`,
          sub: `${formatCurrency(totalUtilized)} of ${formatCurrency(totalReleased)}`,
        },
        {
          label: 'Lagging / Flagged Works',
          value: `${laggingProjects.length} Cases`,
          sub: 'Collector Show-Cause Required',
        },
      ],
      metadataRows: [
        ['Target District', selectedDistrict],
        ['DISHA Committee Meeting Date', meetingDate],
        ['Top Contractor Concentration', `${vendorBreakdown[0]?.name || 'N/A'} (${topVendorShare}% of district outlay)`],
        ['Statutory Form Reference', 'Form DISHA-DM-01 (MoSPI Operational Guidelines Para 5.4)'],
      ],
      sections: [
        {
          heading: 'Critical Agenda: Stalled / High-Risk Works Requiring Collector Show-Cause',
          table: {
            headers: ['Project ID', 'Project Title', 'Executing Agency', 'Contractor', 'Sanctioned', 'Risk Score'],
            rows: laggingProjects.map((p) => [
              p.id,
              p.title,
              p.agencyName,
              p.vendorName,
              formatCurrency(p.sanctionedAmount),
              `${p.riskScore.compositeScore}/100`,
            ]),
          },
        },
        {
          heading: 'District Contractor Allocation & Debarment Audit',
          table: {
            headers: ['Awarded Contractor', 'Awarded Works', 'Total Sanctioned Outlay', 'Debarment Status'],
            rows: vendorBreakdown.map((v) => [
              v.name,
              `${v.count} works`,
              formatCurrency(v.totalSanctioned),
              v.blacklisted ? 'FLAGGED / BLACKLISTED' : 'Active / Clear',
            ]),
          },
        },
      ],
    });
  };

  const handleCopySummary = () => {
    const summary = `DISHA MONTHLY REVIEW BRIEFING PACK
District: ${selectedDistrict} | Meeting Date: ${meetingDate}
Monitored Works: ${districtProjects.length}
Total Sanctioned: ${formatCurrency(totalSanctioned)}
Total Released: ${formatCurrency(totalReleased)}
Total Utilized: ${formatCurrency(totalUtilized)} (${utilizationRate}%)
Critical / Lagging Works: ${laggingProjects.length}
Top Contractor Concentration: ${vendorBreakdown[0]?.name || 'N/A'} (${topVendorShare}% of district outlay)`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(summary).catch(() => {});
      }
    } catch (_) {}
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DISHA Review Pack
                </span>
                <span className="text-xs text-slate-400 font-mono">Form DISHA-DM-01</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 tracking-tight">
                District Development Coordination & Monitoring Committee Executive Brief
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter & Controls Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600">Select District:</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600">Meeting Date:</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              {isCopied ? <Check size={14} className="text-emerald-600" /> : <FileText size={14} />}
              <span>{isCopied ? 'Copied' : 'Copy Briefing'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Executive Dossier</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
          {/* Official Emblem Banner */}
          <div className="border border-slate-200 rounded-xl p-4 bg-linear-to-r from-slate-50 to-amber-50/30 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
              </div>
              <h1 className="text-base font-extrabold text-slate-900 mt-1">
                DISHA Monthly Review Agenda & Oversight Brief — {selectedDistrict}
              </h1>
              <p className="text-slate-600 mt-0.5">
                Chaired by District Magistrate / Collector • Reference: MPLADS Operational Guidelines 2023 Para 5.4
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              <div>Ref: DISHA/{selectedDistrict.toUpperCase().slice(0, 3)}/2026/M09</div>
              <div>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>

          {/* District KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="text-slate-500 font-medium text-[11px]">Total Monitored Works</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{districtProjects.length}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                {completedProjects.length} Completed ({Math.round((completedProjects.length / (districtProjects.length || 1)) * 100)}%)
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="text-slate-500 font-medium text-[11px]">Sanctioned Outlay</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(totalSanctioned)}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">18th Lok Sabha Action Plan</div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="text-slate-500 font-medium text-[11px]">Fund Utilization</div>
              <div className="text-lg font-bold text-blue-700 mt-1">{utilizationRate}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {formatCurrency(totalUtilized)} of {formatCurrency(totalReleased)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs">
              <div className="text-rose-700 font-medium text-[11px] flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>Lagging / Flagged Works</span>
              </div>
              <div className="text-lg font-bold text-rose-700 mt-1">{laggingProjects.length}</div>
              <div className="text-[10px] text-rose-600 font-medium mt-0.5">Immediate Collector Action Required</div>
            </div>
          </div>

          {/* Agenda Item 1: Critical Lagging Works */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                <span>Critical Agenda: Stalled / High-Risk Works Requiring Collector Show-Cause</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {laggingProjects.length} works flagged for explanation
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {laggingProjects.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                  <p className="font-semibold text-slate-700">No severely lagging or flagged projects in this district.</p>
                  <p className="text-[11px]">All active works are advancing within permissible schedule timelines.</p>
                </div>
              ) : (
                laggingProjects.map((p) => (
                  <div key={p.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">[{p.id}]</span>
                        <StatusBadge status={p.status} />
                        <RiskBadge score={p.riskScore.compositeScore} />
                      </div>
                      <div className="text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                        <span><strong>Agency:</strong> {p.agencyName}</span>
                        <span><strong>Contractor:</strong> {p.vendorName}</span>
                        <span><strong>Sanction:</strong> {formatCurrency(p.sanctionedAmount)}</span>
                        <span><strong>Utilized:</strong> {formatCurrency(p.utilizedAmount)}</span>
                      </div>
                      {p.fraudFlag && (
                        <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-0.5 text-[10px] inline-flex items-center gap-1 font-medium">
                          <ShieldAlert size={10} />
                          <span>Flag: {p.fraudFlag.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    {onSelectProject && (
                      <button
                        onClick={() => {
                          onSelectProject(p);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Audit Dossier</span>
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Agenda Item 2: Contractor Monopoly / Concentration Review */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                <span>Vendor Concentration & Bidding Competitiveness (GFR Rule 144)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Top vendor share: <strong className={topVendorShare > 35 ? 'text-rose-600' : 'text-slate-700'}>{topVendorShare}%</strong>
              </span>
            </div>

            <div className="p-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="pb-2">Executing Contractor</th>
                    <th className="pb-2 text-center">Awarded Works</th>
                    <th className="pb-2 text-right">Total Outlay</th>
                    <th className="pb-2 text-center">Vigilance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorBreakdown.slice(0, 5).map((v) => (
                    <tr key={v.name} className="py-2">
                      <td className="py-2 font-medium text-slate-800">{v.name}</td>
                      <td className="py-2 text-center">{v.count}</td>
                      <td className="py-2 text-right font-mono font-semibold">{formatCurrency(v.totalSanctioned)}</td>
                      <td className="py-2 text-center">
                        {v.blacklisted ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            DEBARRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Sign-off Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
            <div className="font-bold text-slate-900 text-xs">
              Statutory Directives & Committee Recording:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
              <div>
                <p className="text-slate-600">
                  <strong>1. Utilization Certificates (Form 12-C):</strong> Implementing agencies with delays exceeding 90 days are directed to submit physical ground expenditure reconciliations before next disbursement tranche.
                </p>
                <p className="text-slate-600 mt-2">
                  <strong>2. Geotagged Physical Inspections:</strong> District Vigilance Wing shall inspect 100% of works valued &gt; ₹25 Lakhs using Sentinel Mobile App Form GI-4.
                </p>
              </div>
              <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-white flex flex-col justify-between">
                <div className="text-[10px] text-slate-400 uppercase font-mono">
                  Official Endorsement & Seal
                </div>
                <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-[11px]">
                  <div>
                    <div className="font-bold text-slate-900">District Magistrate & Collector</div>
                    <div className="text-slate-500">{selectedDistrict} District</div>
                  </div>
                  <div className="text-right text-slate-400 font-mono text-[10px]">
                    Date: ___________
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            DISHA Executive Dossier • Generated from Verified PFMS & Sentinel Surveillance Ledger
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close Brief
          </button>
        </div>
      </div>
    </div>
  );
};
