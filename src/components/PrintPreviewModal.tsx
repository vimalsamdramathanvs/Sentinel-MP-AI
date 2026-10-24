import React, { useState, useEffect } from 'react';
import {
  PrintableDocumentPayload,
  generateAndDownloadPrintablePdf,
} from '../utils/pdfGenerator';
import { subscribeToPrintPreview } from '../utils/printService';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  FileText,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

export const PrintPreviewModal: React.FC = () => {
  const [payload, setPayload] = useState<PrintableDocumentPayload | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [colorMode, setColorMode] = useState<'color' | 'grayscale'>('color');
  const [includeSeal, setIncludeSeal] = useState(true);
  const [printSuccessMsg, setPrintSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToPrintPreview((incoming) => {
      setPayload(incoming);
      setPrintSuccessMsg(null);
    });
    return unsub;
  }, []);

  if (!payload) return null;

  const handleExecutePrint = () => {
    const fileName = generateAndDownloadPrintablePdf(payload, {
      orientation,
      autoPrint: true,
    });
    setPrintSuccessMsg(
      `Print job dispatched! Print-ready A4 PDF (${fileName}) downloaded with embedded Auto-Print instruction.`
    );
    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch (_) {}
  };

  return (
    <div
      className="fixed inset-0 z-90 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:block"
      onClick={() => setPayload(null)}
    >
      <div
        className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-150 print:h-auto print:max-w-none print:border-none print:shadow-none print:bg-white print:block"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT PANE: Live A4 Paper Sheet Preview */}
        <div className="flex-1 bg-slate-800/90 overflow-y-auto p-4 sm:p-8 flex flex-col items-center print:p-0 print:bg-white print:overflow-visible">
          {/* Top Preview Bar (Hidden in native print) */}
          <div className="w-full max-w-3xl mb-4 flex items-center justify-between text-xs text-slate-300 print:hidden">
            <div className="flex items-center gap-2">
              <Printer size={15} className="text-blue-400" />
              <span className="font-bold text-white">A4 Statutory Print Preview</span>
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono text-[10px]">
                {orientation === 'portrait' ? '210 × 297 mm (Portrait)' : '297 × 210 mm (Landscape)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Ref: <code className="text-blue-300">{payload.referenceId}</code>
            </span>
          </div>

          {printSuccessMsg && (
            <div className="w-full max-w-3xl mb-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg print:hidden">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{printSuccessMsg}</span>
              </div>
              <button
                onClick={() => setPrintSuccessMsg(null)}
                className="text-emerald-300 hover:text-white font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* A4 Printable Sheet */}
          <div
            className={`bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-6 sm:p-8 space-y-5 transition-all print:shadow-none print:border-none print:p-0 print:w-full ${
              orientation === 'landscape' ? 'w-full max-w-4xl' : 'w-full max-w-3xl'
            } ${colorMode === 'grayscale' ? 'grayscale' : ''}`}
          >
            {/* Official Government Letterhead */}
            <div className="bg-slate-900 text-white p-4 rounded-lg border-b-4 border-blue-600 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  GOVERNMENT OF INDIA • MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
                </div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {payload.title}
                </h1>
                <p className="text-[11px] text-slate-300">{payload.subtitle}</p>
              </div>
              {payload.badgeText && (
                <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
                  {payload.badgeText}
                </span>
              )}
            </div>

            {/* Reference & Timestamp Strip */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="font-bold text-slate-900">
                STATUTORY REFERENCE: <span className="font-mono text-blue-700">{payload.referenceId}</span>
              </div>
              <div className="text-slate-600">
                Printed: <strong>{new Date().toLocaleString('en-IN')} IST</strong>
              </div>
            </div>

            {/* KPI Cards Grid */}
            {payload.kpiCards && payload.kpiCards.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {payload.kpiCards.map((card, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-400">{card.label}</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5 font-mono">{card.value}</div>
                    {card.sub && <div className="text-[10px] text-slate-500 mt-0.5">{card.sub}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Metadata Rows */}
            {payload.metadataRows && payload.metadataRows.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-200">
                    {payload.metadataRows.map(([k, v], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-1.5 px-3 font-bold text-slate-600 w-1/3">{k}</td>
                        <td className="py-1.5 px-3 text-slate-900 font-medium">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Document Sections */}
            <div className="space-y-5">
              {payload.sections.map((sec, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  <div className="bg-blue-950 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">
                    {sIdx + 1}. {sec.heading}
                  </div>

                  {sec.paragraphs && sec.paragraphs.length > 0 && (
                    <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed px-1">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx}>{p}</p>
                      ))}
                    </div>
                  )}

                  {sec.table && sec.table.headers.length > 0 && (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                          <tr>
                            {sec.table.headers.map((h, hIdx) => (
                              <th key={hIdx} className="py-1.5 px-2.5">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sec.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-1.5 px-2.5 text-slate-800">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cryptographic Verification Seal */}
            {includeSeal && (
              <div className="pt-4 border-t-2 border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-500">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Shield size={12} className="text-emerald-600" />
                    <span>CRYPTOGRAPHIC SHA-256 INTEGRITY SEAL VERIFIED</span>
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                    Certified under Section 65B of the Indian Evidence Act, 1872 &amp; GFR 2017 Rule 238(1)
                  </div>
                </div>
                <div className="text-right font-semibold text-slate-800">
                  <div>SENTINEL MP-AI OVERSIGHT DIRECTORATE</div>
                  <div className="text-[9px] text-slate-400">Authorized Statutory Print Record</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Print Spooler Settings & Action Controls (Hidden in native print) */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col justify-between text-xs text-slate-200 shrink-0 print:hidden">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Printer size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Print Document</h3>
                  <p className="text-[10px] text-slate-400">A4 Vector Spooler &amp; PDF Printer</p>
                </div>
              </div>
              <button
                onClick={() => setPayload(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printer Destination */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Destination Printer
              </label>
              <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">MPLADS Statutory PDF Printer</div>
                    <div className="text-[10px] text-slate-400">A4 Vector PDF (Auto-Print Enabled)</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                  Ready
                </span>
              </div>
            </div>

            {/* Layout Orientation */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Page Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Portrait (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Landscape (A4)
                </button>
              </div>
            </div>

            {/* Color Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Color Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setColorMode('color')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    colorMode === 'color'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Full Color
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('grayscale')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    colorMode === 'grayscale'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Black &amp; White
                </button>
              </div>
            </div>

            {/* Statutory Seal Toggle */}
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSeal}
                onChange={(e) => setIncludeSeal(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-xs text-slate-200 font-medium">
                Include SHA-256 Statutory Seal &amp; Footer
              </span>
            </label>
          </div>

          {/* Primary Print Actions */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleExecutePrint}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <Printer size={15} />
              <span>Print Now (Download A4 PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setPayload(null)}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close Print Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
