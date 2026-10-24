import React, { useState } from 'react';
import { getDocumentDiscrepancies } from '../data/documentEngine';
import { SEED_PROJECTS } from '../data/seedProjects';
import { ProjectItem } from '../types';
import { FileCheck, AlertTriangle, CheckCircle, FileText, ArrowRight, ShieldAlert, ExternalLink, ArrowUpRight } from 'lucide-react';

interface DocumentAiViewProps {
  onSelectProject?: (project: ProjectItem) => void;
}

export const DocumentAiView: React.FC<DocumentAiViewProps> = ({ onSelectProject }) => {
  const documents = getDocumentDiscrepancies();
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  if (!activeDoc) {
    return (
      <div className="p-6 text-slate-500">
        No documents available for verification.
      </div>
    );
  }

  const linkedProject = SEED_PROJECTS.find((p) => p.id === (activeDoc as any).projectId) || SEED_PROJECTS[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck size={22} className="text-blue-600" />
            <span>Document AI & Utilization Certificate Inspector (Phase 10)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            OCR extraction from GFR Form 12-C Utilization Certificates, 3-way discrepancy checks with treasury releases, and seal verification.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://pfms.nic.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            title="Open Public Financial Management System (PFMS)"
          >
            <ExternalLink size={13} />
            <span>PFMS Treasury Portal</span>
          </a>
          <a
            href="https://cag.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            title="Open Comptroller and Auditor General of India (CAG) Portal"
          >
            <ExternalLink size={13} />
            <span>CAG India</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Document Queue */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 font-semibold text-xs text-slate-700">
            GFR 12-C Document Submissions
          </div>

          <div className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                    <span className="truncate">{doc.projectTitle}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'discrepancy_detected'
                          ? 'bg-rose-100 text-rose-800'
                          : doc.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Doc ID: {doc.id} • Sanction: ₹{(doc.declaredSanctionAmount / 1e7).toFixed(2)} Cr
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Cross-Check Inspector Panel */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">GFR 12-C Examination</span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">{activeDoc.projectTitle}</h2>
              <p className="text-xs text-slate-500">Agency: {activeDoc.agencyName}</p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  activeDoc.status === 'discrepancy_detected'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {activeDoc.status === 'discrepancy_detected' ? 'Auditor Review Required' : 'Passed GFR Integrity'}
              </span>
            </div>
          </div>

          {/* 3-Way Cross-Check Financial Reconciliation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              3-Way Reconciliation Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="text-[11px] text-slate-500">Declared in UC Certificate</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  ₹{(activeDoc.declaredSanctionAmount / 1e7).toFixed(2)} Cr
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-blue-50/60">
                <div className="text-[11px] text-blue-700">Official Treasury Sanction</div>
                <div className="text-sm font-bold text-blue-900 mt-0.5">
                  ₹{(activeDoc.actualSanctionAmount / 1e7).toFixed(2)} Cr
                </div>
              </div>

              <div
                className={`border rounded-xl p-3 ${
                  activeDoc.discrepancyCr !== 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="text-[11px] font-medium">Reconciliation Variance</div>
                <div className="text-sm font-bold mt-0.5">
                  {activeDoc.discrepancyCr !== 0 ? `₹${activeDoc.discrepancyCr.toFixed(2)} Cr Mismatch` : '₹0.00 (Balanced)'}
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Discrepancies List */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-slate-700">Detected GFR Violations & OCR Findings:</h3>
            {activeDoc.findings.map((f, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  f.severity === 'critical'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : f.severity === 'warning'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {f.severity === 'critical' ? (
                  <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">{f.rule}</div>
                  <div className="text-[11px] mt-0.5 opacity-90">{f.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
            {actionNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center justify-between">
                <span>{actionNotice}</span>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionNotice(`Notice issued: Certificate ${activeDoc.id} sent back to ${activeDoc.agencyName} for rectification.`);
                  setTimeout(() => setActionNotice(null), 5000);
                }}
                className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Issue Notice to Agency
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionNotice(`Escalation flagged: Case ${activeDoc.id} referred to Comptroller and Auditor General (CAG) audit registry.`);
                  setTimeout(() => setActionNotice(null), 5000);
                }}
                className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Escalate to Auditor General
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
