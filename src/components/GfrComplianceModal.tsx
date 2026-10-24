import React, { useState, useMemo } from 'react';
import { ProjectItem } from '../types';
import { SEED_PROJECTS } from '../data/seedProjects';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';
import { openPrintPreview } from '../utils/printService';
import {
  X,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  FileCheck,
  Scale,
  Building2,
  AlertTriangle,
  FileText,
  Clock,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface GfrComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (p: ProjectItem) => void;
}

interface ComplianceRule {
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  penalty: string;
}

const GFR_RULES: ComplianceRule[] = [
  {
    id: 'gfr-238',
    ruleCode: 'GFR 2017 Rule 238(1)',
    name: 'Form 12-C Utilization Certificate Overdue',
    description: 'Mandates submission of certified UC Form 12-C within 12 months of financial release before subsequent tranche drawdown.',
    penalty: 'Freezing of further financial disbursements to the executing agency.',
  },
  {
    id: 'gfr-151',
    ruleCode: 'GFR 2017 Rule 151(iii)',
    name: 'Debarred / Blacklisted Contractor Engagement',
    description: 'Prohibits award of public contracts to entities debarred by the Ministry of Finance or central/state vigilance portals.',
    penalty: 'Immediate contract termination and criminal reference to the Anti-Corruption Bureau.',
  },
  {
    id: 'gfr-149',
    ruleCode: 'GFR 2017 Rule 149',
    name: 'Non-GeM Civil Works & Materials Procurement Bypass',
    description: 'Bypassing Government e-Marketplace (GeM) for standardized civil supplies without technical justification.',
    penalty: 'Recovery of rate discrepancies against CPWD/PWD schedule of rates.',
  },
  {
    id: 'mospi-312',
    ruleCode: 'MoSPI Para 3.12',
    name: 'Mandatory Physical Citizen Signboard & QR Verification',
    description: 'Every completed asset must feature a standardized physical plaque displaying project cost, MP name, and scan QR code.',
    penalty: 'Withholding of final 10% retention money until signboard compliance.',
  },
];

export const GfrComplianceModal: React.FC<GfrComplianceModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<string>('all');
  const [activeShowCauseProject, setActiveShowCauseProject] = useState<ProjectItem | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Compute infractions across projects
  const infractions = useMemo(() => {
    const list: { project: ProjectItem; rule: ComplianceRule; severity: 'high' | 'critical' | 'medium'; rationale: string }[] = [];

    SEED_PROJECTS.forEach((p) => {
      // Rule 151: Debarred vendor
      if (p.vendorBlacklisted) {
        list.push({
          project: p,
          rule: GFR_RULES[1],
          severity: 'critical',
          rationale: `Contractor "${p.vendorName}" has an active debarment flag under Ministry of Finance Rule 151(iii).`,
        });
      }

      // Rule 238: High funds released but lagging without UC
      if (p.releasedAmount > 15000000 && p.utilizedAmount < p.releasedAmount * 0.4 && p.status === 'delayed') {
        list.push({
          project: p,
          rule: GFR_RULES[0],
          severity: 'high',
          rationale: `Unspent release balance of ₹${((p.releasedAmount - p.utilizedAmount) / 100000).toFixed(1)} Lakhs without Form 12-C clearance.`,
        });
      }

      // Rule 149 / Cost anomaly
      if (p.fraudFlag === 'cost_anomaly') {
        list.push({
          project: p,
          rule: GFR_RULES[2],
          severity: 'high',
          rationale: `Sanctioned unit cost exceeds CPWD Schedule of Rates by >40% without competitive GeM tender justification.`,
        });
      }

      // Ghost suspected / Para 3.12
      if (p.verifiedStatus === 'ghost_suspected') {
        list.push({
          project: p,
          rule: GFR_RULES[3],
          severity: 'critical',
          rationale: `100% financial disbursement recorded but zero structural footprint detected on Sentinel-2 optical imagery.`,
        });
      }
    });

    return list;
  }, []);

  const filteredInfractions = useMemo(() => {
    if (selectedRuleFilter === 'all') return infractions;
    return infractions.filter((inf) => inf.rule.id === selectedRuleFilter);
  }, [infractions, selectedRuleFilter]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handleCopyShowCause = () => {
    if (!activeShowCauseProject) return;
    const text = document.getElementById('show-cause-letter-content')?.innerText || '';
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (_) {}
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Statutory Oversight
                </span>
                <span className="text-xs text-slate-400 font-mono">GFR 2017 & MoSPI Compliance</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 tracking-tight">
                Public Procurement & General Financial Rules (GFR) Statutory Engine
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          {activeShowCauseProject ? (
            /* Show-Cause Notice Generator View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveShowCauseProject(null)}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Infractions Register
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyShowCause}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy Notice'}</span>
                  </button>
                  <button
                    onClick={() => {
                      openPrintPreview({
                        title: `STATUTORY SHOW-CAUSE NOTICE — ${activeShowCauseProject.id}`,
                        subtitle: `Office of the District Magistrate & Chief Vigilance Officer • ${activeShowCauseProject.districtName}, ${activeShowCauseProject.stateName}`,
                        referenceId: `VIG/MPLADS/SCN/${activeShowCauseProject.id}/2026`,
                        badgeText: 'SHOW-CAUSE NOTICE',
                        fileNamePrefix: `GFR_ShowCause_${activeShowCauseProject.id}`,
                        metadataRows: [
                          ['Project Title & ID', `${activeShowCauseProject.title} (${activeShowCauseProject.id})`],
                          ['Recipient Executing Agency', activeShowCauseProject.agencyName],
                          ['Awarded Contractor', `${activeShowCauseProject.vendorName} ${activeShowCauseProject.vendorBlacklisted ? '[BLACKLISTED]' : ''}`],
                          ['Sanctioned / Released / Utilized', `${formatCurrency(activeShowCauseProject.sanctionedAmount)} / ${formatCurrency(activeShowCauseProject.releasedAmount)} / ${formatCurrency(activeShowCauseProject.utilizedAmount)}`],
                          ['Composite Risk Score', `${activeShowCauseProject.riskScore.compositeScore}/100`],
                        ],
                        sections: [
                          {
                            heading: '1. Preamble & Sanction Particulars',
                            paragraphs: [
                              `Whereas the aforementioned public work ("${activeShowCauseProject.title}") was sanctioned for an outlay of ${formatCurrency(activeShowCauseProject.sanctionedAmount)} under the recommendation of the Hon'ble Member of Parliament, with ${formatCurrency(activeShowCauseProject.releasedAmount)} released from the Public Financial Management System (PFMS).`,
                            ],
                          },
                          {
                            heading: '2. Specific Statutory Contraventions Observed (GFR 2017)',
                            paragraphs: [
                              `• Recorded Anomaly Flag: ${activeShowCauseProject.fraudFlag ? activeShowCauseProject.fraudFlag.replace('_', ' ').toUpperCase() : 'STATUTORY SCHEDULE DEFAULT'}`,
                              `• Ground Verification Status: ${activeShowCauseProject.verifiedStatus || 'Unverified'}`,
                              `• Financial Utilization: ${formatCurrency(activeShowCauseProject.utilizedAmount)} utilized out of ${formatCurrency(activeShowCauseProject.releasedAmount)} released.`,
                              ...(activeShowCauseProject.vendorBlacklisted
                                ? ['• Severe Violation: Awarded contractor is flagged on Central Debarred List under GFR Rule 151(iii).']
                                : []),
                            ],
                          },
                          {
                            heading: '3. Statutory Directive & 14-Day Compliance Mandate',
                            paragraphs: [
                              'You are hereby directed to show cause in writing within fourteen (14) calendar days from the receipt of this notice as to why penal action under Section 151/238 of the General Financial Rules 2017 should not be initiated against your agency, including stoppage of subsequent tranches, encashment of Performance Bank Guarantees, and reference to the State Vigilance Commission for recovery.',
                              'In the event of failure to furnish a satisfactory explanation within the stipulated timeline, ex-parte administrative proceedings shall commence without further communication.',
                            ],
                          },
                        ],
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer size={14} />
                    <span>Print Notice</span>
                  </button>
                </div>
              </div>

              {/* Legal Letter Document */}
              <div
                id="show-cause-letter-content"
                className="border-2 border-slate-300 rounded-xl p-8 bg-slate-50/50 space-y-4 font-serif text-slate-900 leading-relaxed shadow-xs"
              >
                <div className="text-center space-y-1 pb-4 border-b border-slate-300">
                  <div className="text-[11px] font-bold uppercase tracking-wider font-sans text-slate-600">
                    OFFICE OF THE DISTRICT MAGISTRATE & CHIEF VIGILANCE OFFICER
                  </div>
                  <div className="text-sm font-extrabold uppercase font-sans">
                    DISTRICT COLLECTORATE • MPLADS VIGILANCE CELL
                  </div>
                  <div className="text-xs text-slate-600 font-sans">
                    {activeShowCauseProject.districtName} District, {activeShowCauseProject.stateName}
                  </div>
                </div>

                <div className="flex justify-between items-start font-sans text-xs">
                  <div>
                    <div><strong>Dispatch No:</strong> VIG/MPLADS/SCN/{activeShowCauseProject.id}/2026</div>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-sm bg-rose-600 text-white font-bold text-[10px] tracking-wider uppercase">
                      STATUTORY SHOW-CAUSE NOTICE
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs font-sans">
                  <div><strong>To:</strong></div>
                  <div>The Executive Engineer / Authorized In-Charge,</div>
                  <div>{activeShowCauseProject.agencyName}</div>
                  <div>Contractor: {activeShowCauseProject.vendorName}</div>
                </div>

                <div className="pt-2 text-xs font-sans">
                  <strong>SUBJECT:</strong> Show-Cause Notice under GFR 2017 & MPLADS Guidelines regarding non-compliance in respect of Project ID: <strong>{activeShowCauseProject.id}</strong> ("{activeShowCauseProject.title}").
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <p>
                    <strong>1. Preamble:</strong> Whereas the aforementioned public work was sanctioned for an outlay of <strong>{formatCurrency(activeShowCauseProject.sanctionedAmount)}</strong> under the recommendation of the Hon'ble Member of Parliament, with <strong>{formatCurrency(activeShowCauseProject.releasedAmount)}</strong> released from the Public Financial Management System (PFMS).
                  </p>

                  <p>
                    <strong>2. Specific Violation Observed:</strong> During statutory data reconciliation and automated Sentinel surveillance, the following contraventions of the General Financial Rules (GFR) 2017 have been recorded:
                  </p>

                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-sans text-[11px] space-y-1">
                    <div>• <strong>Recorded Flag:</strong> {activeShowCauseProject.fraudFlag ? activeShowCauseProject.fraudFlag.replace('_', ' ').toUpperCase() : 'STATUTORY SCHEDULE DEFAULT'}</div>
                    <div>• <strong>Verification Status:</strong> {activeShowCauseProject.verifiedStatus || 'Unverified'}</div>
                    <div>• <strong>Financial Status:</strong> {formatCurrency(activeShowCauseProject.utilizedAmount)} utilized out of {formatCurrency(activeShowCauseProject.releasedAmount)} released.</div>
                    {activeShowCauseProject.vendorBlacklisted && (
                      <div className="font-bold">• Severe Violation: Awarded contractor is flagged on Central Debarred List under GFR Rule 151(iii).</div>
                    )}
                  </div>

                  <p>
                    <strong>3. Statutory Directive:</strong> You are hereby directed to show cause in writing within <strong>fourteen (14) calendar days</strong> from the receipt of this notice as to why penal action under Section 151/238 of the General Financial Rules 2017 should not be initiated against your agency, including the stoppage of subsequent tranches, encashment of Performance Bank Guarantees, and reference to the state vigilance commission for recovery.
                  </p>

                  <p>
                    <strong>4. Default Clause:</strong> In the event of failure to furnish a satisfactory explanation within the stipulated timeline, it shall be presumed that you have no explanation to offer, and ex-parte administrative proceedings shall commence without further communication.
                  </p>
                </div>

                <div className="pt-8 border-t border-slate-300 flex justify-between font-sans text-xs">
                  <div className="text-[10px] text-slate-500">
                    Copy to: Principal Secretary (Planning), MoSPI MPLADS Division, New Delhi.
                  </div>
                  <div className="text-right">
                    <div className="font-bold">District Vigilance Officer</div>
                    <div className="text-slate-600">For District Magistrate & Collector</div>
                    <div className="text-slate-500 text-[10px]">{activeShowCauseProject.districtName}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Infractions Register Overview View */
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="text-slate-500 font-medium text-[11px]">Total Statutory Rules</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">4 Directives</div>
                  <div className="text-[10px] text-purple-600 font-medium mt-0.5">GFR 2017 + MoSPI 2023</div>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 shadow-2xs">
                  <div className="text-rose-700 font-medium text-[11px] flex items-center gap-1">
                    <ShieldAlert size={12} />
                    <span>Active Infractions</span>
                  </div>
                  <div className="text-lg font-bold text-rose-700 mt-1">{infractions.length} Flagged</div>
                  <div className="text-[10px] text-rose-600 font-medium mt-0.5">Requires Show-Cause Notice</div>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
                  <div className="text-amber-800 font-medium text-[11px]">Debarred Vendor Awards</div>
                  <div className="text-lg font-bold text-amber-800 mt-1">
                    {SEED_PROJECTS.filter((p) => p.vendorBlacklisted).length}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">Rule 151(iii) Non-Compliance</div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                  <div className="text-emerald-800 font-medium text-[11px]">Statutory Compliance</div>
                  <div className="text-lg font-bold text-emerald-800 mt-1">
                    {Math.round(((SEED_PROJECTS.length - infractions.length) / SEED_PROJECTS.length) * 100)}%
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Projects Fully Compliant</div>
                </div>
              </div>

              {/* Rule Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedRuleFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedRuleFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Infractions ({infractions.length})
                </button>
                {GFR_RULES.map((rule) => {
                  const count = infractions.filter((inf) => inf.rule.id === rule.id).length;
                  return (
                    <button
                      key={rule.id}
                      onClick={() => setSelectedRuleFilter(rule.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        selectedRuleFilter === rule.id
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{rule.ruleCode}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Infractions List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100">
                {filteredInfractions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <FileCheck size={28} className="mx-auto text-emerald-500 mb-1.5" />
                    <p className="font-semibold text-slate-800">No violations found under this rule category.</p>
                    <p className="text-[11px] text-slate-500">All evaluated works satisfy the statutory provisions.</p>
                  </div>
                ) : (
                  filteredInfractions.map((inf, idx) => (
                    <div key={`${inf.project.id}-${idx}`} className="p-4 hover:bg-slate-50/60 transition-colors flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            {inf.rule.ruleCode}
                          </span>
                          <span className="font-bold text-slate-900">{inf.project.title}</span>
                          <span className="text-slate-500 font-mono text-[10px]">[{inf.project.id}]</span>
                          <RiskBadge score={inf.project.riskScore.compositeScore} />
                        </div>
                        <p className="text-slate-700 text-[11px]">
                          <strong>Violation Detail:</strong> {inf.rationale}
                        </p>
                        <div className="text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                          <span><strong>District:</strong> {inf.project.districtName}</span>
                          <span><strong>Agency:</strong> {inf.project.agencyName}</span>
                          <span><strong>Contractor:</strong> {inf.project.vendorName}</span>
                          <span><strong>Outlay:</strong> {formatCurrency(inf.project.sanctionedAmount)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setActiveShowCauseProject(inf.project)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <FileText size={13} />
                          <span>Draft Show-Cause Notice</span>
                        </button>
                        {onSelectProject && (
                          <button
                            onClick={() => {
                              onSelectProject(inf.project);
                              onClose();
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Open Dossier"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Statutory Engine synchronized with Ministry of Finance GFR 2017 & MoSPI Guidelines
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close Engine
          </button>
        </div>
      </div>
    </div>
  );
};
