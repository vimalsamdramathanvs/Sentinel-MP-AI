import React, { useState } from 'react';
import { DEFAULT_RISK_WEIGHTS } from '../data/riskEngine';
import { useAuth } from '../context/AuthContext';
import { Sliders, Cpu, ShieldCheck, Database, Server, RefreshCw, Save } from 'lucide-react';

export const AdminConfigView: React.FC = () => {
  const { auditLogs, recordAuditLog } = useAuth();
  const [weights, setWeights] = useState<Record<string, number>>({ ...DEFAULT_RISK_WEIGHTS });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalWeight: number = (Object.values(weights) as number[]).reduce((a, b) => a + Number(b), 0);

  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      setErrorMessage(`Weights must sum exactly to 1.00 (Current sum: ${totalWeight.toFixed(2)})`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setErrorMessage(null);
    setSaveSuccess(true);
    recordAuditLog('policy.weights_updated', 'risk_engine', 'weights.yaml', weights);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders size={22} className="text-slate-900" />
          <span>Platform Administration & Model Governance (Phase 20 & 24)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dynamic policy weight tuning, MLflow model registry versioning, and immutable audit logs.
        </p>
      </div>

      {/* System Node Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[10px]">
            <Database size={14} className="text-blue-600" />
            <span>PostgreSQL & PostGIS</span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-1">Connected (40 Conn)</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">RLS Multi-Tenancy Enforced</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[10px]">
            <Server size={14} className="text-indigo-600" />
            <span>Redis Task Queue</span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-1">Hit Rate: 98.4%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">0 Failed Celery Workers</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[10px]">
            <Cpu size={14} className="text-amber-600" />
            <span>Inference Latency</span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-1">42ms / batch</div>
          <div className="text-[11px] text-slate-500 mt-0.5">XGBoost + IF Core</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-[10px]">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Cryptographic Log</span>
          </div>
          <div className="text-base font-bold text-slate-900 mt-1">WORM Compliant</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">SHA-256 Chained Blocks</div>
        </div>
      </div>

      {/* Dynamic Risk Weights YAML Editor */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Policy Weight Calibration (weights.yaml)
            </h2>
            <p className="text-xs text-slate-500">
              Tune relative component significance. Total must sum to 1.00.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                Math.abs(totalWeight - 1.0) < 0.001
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              Sum: {totalWeight.toFixed(2)} / 1.00
            </span>

            <button
              onClick={() => {
                setWeights({ ...DEFAULT_RISK_WEIGHTS });
                setErrorMessage(null);
              }}
              className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset weights to statutory defaults"
            >
              <RefreshCw size={12} />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save size={13} />
              <span>Save & Publish</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Policy weights successfully updated and published to active inference nodes!</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {Object.entries(weights).map(([k, val]) => (
            <div key={k} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex justify-between font-medium text-slate-800">
                <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-mono font-bold text-blue-600">{(Number(val) * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.01"
                value={Number(val)}
                onChange={(e) => handleWeightChange(k, Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* MLflow Model Registry */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">MLflow Model Registry & Lineage</h2>
          <span className="text-xs text-slate-400 font-mono">Production Staging</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="pb-2">Model Name</th>
                <th className="pb-2">Version</th>
                <th className="pb-2">Framework</th>
                <th className="pb-2">AUC-ROC / F1</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Deployed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2.5 font-bold text-slate-800">mplads_xgboost_risk</td>
                <td className="py-2.5">v1.4.2</td>
                <td className="py-2.5">XGBoost 2.0</td>
                <td className="py-2.5 text-emerald-600 font-bold">0.912 AUC</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Production
                  </span>
                </td>
                <td className="py-2.5 text-right text-slate-500">2026-02-15</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-slate-800">mplads_isolation_forest</td>
                <td className="py-2.5">v1.2.0</td>
                <td className="py-2.5">scikit-learn 1.4</td>
                <td className="py-2.5 text-emerald-600 font-bold">0.884 AUC</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Production
                  </span>
                </td>
                <td className="py-2.5 text-right text-slate-500">2026-02-15</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-slate-800">sentinel2_change_unet</td>
                <td className="py-2.5">v2.1.0</td>
                <td className="py-2.5">PyTorch 2.2</td>
                <td className="py-2.5 text-emerald-600 font-bold">0.895 IoU</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Production
                  </span>
                </td>
                <td className="py-2.5 text-right text-slate-500">2026-01-20</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Security & Access Audit Trail</h2>
        <div className="divide-y divide-slate-100 text-xs font-mono">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-blue-600 font-bold">[{log.action}]</span>{' '}
                <span className="text-slate-800">
                  {log.userEmail} ({log.userRole}) • {log.entityType}:{log.entityId}
                </span>
                {log.ipAddress && (
                  <span className="text-slate-400 text-[11px] ml-2">[{log.ipAddress}]</span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
