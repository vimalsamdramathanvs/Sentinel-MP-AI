import React, { useState } from 'react';
import { INITIAL_ALERTS } from '../data/alertsEngine';
import { SEED_PROJECTS } from '../data/seedProjects';
import { AlertItem, AlertSeverity, AlertStatus, ProjectItem } from '../types';
import { BellRing, CheckCircle, AlertTriangle, ShieldAlert, ArrowRight, Check, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AlertsHubViewProps {
  onSelectProject?: (project: ProjectItem) => void;
}

export const AlertsHubView: React.FC<AlertsHubViewProps> = ({ onSelectProject }) => {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(alerts[0] || null);

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const activeAlert = filtered.find((a) => a.id === selectedAlert?.id) || filtered[0] || null;

  const handleUpdateStatus = (id: string, newStatus: AlertStatus, resolutionNote?: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus, resolutionNotes: resolutionNote } : a))
    );
    if (selectedAlert?.id === id) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: newStatus, resolutionNotes: resolutionNote } : null));
    }
  };

  const getSeverityPill = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">MEDIUM</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">LOW</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing size={22} className="text-rose-600" />
            <span>Alerts & Incident Resolution Center (Phase 16)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated anomaly dispatching, SLA routing matrix, and active learning ground-truth feedback loop.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed (False Positive)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Alert List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 font-semibold text-xs text-slate-700 flex justify-between">
            <span>Incident Queue ({filtered.length})</span>
            <span className="text-slate-400 font-normal">SLA Thresholds Active</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map((alert) => {
              const isSelected = alert.id === activeAlert?.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400 text-[10px]">{alert.id}</span>
                    <div className="flex items-center gap-1.5">
                      {getSeverityPill(alert.severity)}
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {(alert.status || 'open').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {alert.title || alert.projectTitle || 'Flagged Risk Anomaly'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Assigned: {(alert.routedToRole || 'district_officer').replace(/_/g, ' ')} • {alert.createdAt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Incident Resolution & Feedback Loop Panel */}
        {activeAlert ? (
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{activeAlert.id}</span>
                  {getSeverityPill(activeAlert.severity)}
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {activeAlert.title || activeAlert.projectTitle || 'Flagged Risk Anomaly'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onSelectProject && (
                  <button
                    onClick={() => {
                      const proj =
                        SEED_PROJECTS.find((p) => p.id === activeAlert.projectId) || SEED_PROJECTS[0];
                      if (proj) onSelectProject(proj);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Project Dossier</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  SLA: {activeAlert.slaHours || (activeAlert.severity === 'critical' ? 24 : activeAlert.severity === 'high' ? 48 : 72)}h Response
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold text-slate-900 mb-1">Incident Description & ML Rationale:</div>
              {activeAlert.description || activeAlert.message || 'Anomaly flagged by Sentinel automated risk audit.'}
            </div>

            {/* Routing details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-medium">Auto-Routed To:</span>
                <div className="font-bold text-slate-800 capitalize mt-0.5">
                  {(activeAlert.routedToRole || 'district_officer').replace(/_/g, ' ')}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-medium">Incident Status:</span>
                <div className="font-bold text-slate-800 uppercase mt-0.5">
                  {(activeAlert.status || 'open').replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            {activeAlert.resolutionNotes && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <div className="font-bold">Resolution Notes Recorded:</div>
                <div className="mt-0.5">{activeAlert.resolutionNotes}</div>
              </div>
            )}

            {/* Ground Truth Active Learning Actions (Phase 16 §5) */}
            {hasPermission('alert.resolve') && activeAlert.status !== 'resolved' && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800">
                  Officer Action & Model Feedback:
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(activeAlert.id, 'acknowledged')}
                    className="py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Acknowledge
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        activeAlert.id,
                        'resolved',
                        'Field inspection magistrate confirmed anomaly. Corrective recovery initiated.'
                      )
                    }
                    className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1"
                  >
                    <Check size={14} />
                    <span>Confirm & Resolve</span>
                  </button>

                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        activeAlert.id,
                        'dismissed',
                        'Special geographical terrain justification verified by District Collector.'
                      )
                    }
                    className="py-2 px-3 border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50"
                  >
                    False Positive (Dismiss)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-7 flex items-center justify-center text-slate-400 text-xs h-64 bg-white rounded-xl border border-slate-200">
            Select an alert from the queue to inspect details
          </div>
        )}
      </div>
    </div>
  );
};
