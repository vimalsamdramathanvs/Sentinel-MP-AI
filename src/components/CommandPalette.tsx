import React, { useState, useEffect, useRef } from 'react';
import { SEED_PROJECTS } from '../data/seedProjects';
import { MP_ALLOCATIONS_DATA } from '../data/mpAllocations';
import { INITIAL_ALERTS } from '../data/alertsEngine';
import { ProjectItem } from '../types';
import { NavTabId } from './Sidebar';
import {
  Search,
  FolderKanban,
  User,
  BellRing,
  MapPin,
  Command,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  Satellite,
  FileCheck,
  BarChart3,
  Globe,
  Sliders,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTabId) => void;
  onSelectProject: (project: ProjectItem) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectProject,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          setQuery('');
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();

  // Navigation commands
  const NAV_COMMANDS: { id: NavTabId; label: string; icon: any; category: string }[] = [
    { id: 'dashboard', label: 'National Executive Dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'projects', label: 'Project Registry & Filter Explorer', icon: FolderKanban, category: 'Navigation' },
    { id: 'gis', label: 'GIS Geospatial Map & Boundaries', icon: MapPin, category: 'Navigation' },
    { id: 'fraud', label: 'Machine Learning Fraud Detection Center', icon: ShieldAlert, category: 'Navigation' },
    { id: 'satellite', label: 'ISRO / Sentinel Satellite Ground Truth', icon: Satellite, category: 'Navigation' },
    { id: 'documents', label: 'Document AI & OCR Integrity Verification', icon: FileCheck, category: 'Navigation' },
    { id: 'analytics', label: 'Predictive Analytics & Forecasting Hub', icon: BarChart3, category: 'Navigation' },
    { id: 'alerts', label: 'Real-time Alert Resolution Hub', icon: BellRing, category: 'Navigation' },
    { id: 'public', label: 'Public Citizen Portal & Grievance Lodging', icon: Globe, category: 'Navigation' },
    { id: 'admin', label: 'System Weights & Algorithm Calibration', icon: Sliders, category: 'Navigation' },
  ];

  // Matched Views
  const matchedNav = NAV_COMMANDS.filter((n) =>
    normalizedQuery ? n.label.toLowerCase().includes(normalizedQuery) || n.id.includes(normalizedQuery) : true
  ).slice(0, 4);

  // Matched Projects
  const matchedProjects = SEED_PROJECTS.filter((p) => {
    if (!normalizedQuery) return false;
    return (
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.id.toLowerCase().includes(normalizedQuery) ||
      p.districtName.toLowerCase().includes(normalizedQuery) ||
      p.stateName.toLowerCase().includes(normalizedQuery) ||
      p.vendorName.toLowerCase().includes(normalizedQuery) ||
      (p.mpName && p.mpName.toLowerCase().includes(normalizedQuery))
    );
  }).slice(0, 5);

  // Matched MPs
  const matchedMPs = MP_ALLOCATIONS_DATA.filter((mp) => {
    if (!normalizedQuery) return false;
    return (
      mp.mpName.toLowerCase().includes(normalizedQuery) ||
      mp.constituency.toLowerCase().includes(normalizedQuery) ||
      mp.state.toLowerCase().includes(normalizedQuery)
    );
  }).slice(0, 4);

  // Matched Alerts
  const matchedAlerts = INITIAL_ALERTS.filter((a) => {
    if (!normalizedQuery) return false;
    return (
      a.message.toLowerCase().includes(normalizedQuery) ||
      a.projectTitle.toLowerCase().includes(normalizedQuery) ||
      a.districtName.toLowerCase().includes(normalizedQuery)
    );
  }).slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search projects, MPs, constituencies, vendors, alerts, or jump to view..."
            className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs divide-y divide-slate-100">
          {/* If no query, show helpful shortcuts */}
          {!normalizedQuery && (
            <div className="space-y-2 pt-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" />
                <span>Quick View Switcher</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {NAV_COMMANDS.slice(0, 6).map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        onNavigate(cmd.id);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-left text-slate-700 transition-colors"
                    >
                      <Icon size={16} className="text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Projects */}
          {matchedProjects.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Projects ({matchedProjects.length})</span>
                <span className="text-[10px] text-slate-400">Click to inspect in detail drawer</span>
              </div>
              {matchedProjects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left transition-colors group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <FolderKanban size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 truncate">
                        {proj.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                        <span>{proj.districtName}, {proj.stateName}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{proj.id}</span>
                        <span>•</span>
                        <span className="capitalize">{proj.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-right">
                    <span className="font-bold text-slate-800">
                      ₹{(proj.sanctionedAmount / 1e7).toFixed(2)} Cr
                    </span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Matched MPs & Constituencies */}
          {matchedMPs.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hon'ble MPs & Constituencies ({matchedMPs.length})
              </div>
              {matchedMPs.map((mp) => (
                <button
                  key={`${mp.srNo}-${mp.mpName}`}
                  onClick={() => {
                    onNavigate('mpledger');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User size={16} className="text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                        {mp.mpName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {mp.constituency} • {mp.state}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-700 shrink-0 font-mono">
                    ₹{(mp.allocatedAmount / 1e7).toFixed(2)} Cr Allocation
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Matched Navigation Commands when searching */}
          {normalizedQuery && matchedNav.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System Views
              </div>
              {matchedNav.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      onNavigate(cmd.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={15} className="text-slate-600" />
                      <span className="font-semibold text-slate-800">{cmd.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Jump</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Matched Alerts */}
          {matchedAlerts.length > 0 && (
            <div className="space-y-1 pt-3">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Active Sentinel Alerts ({matchedAlerts.length})
              </div>
              {matchedAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => {
                    onNavigate('alerts');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <BellRing size={15} className="text-rose-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 group-hover:text-rose-900 truncate">
                        {alert.message}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {alert.districtName}, {alert.stateName} • Severity: {alert.severity}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-rose-700 px-1.5 py-0.5 rounded bg-rose-100/70 shrink-0">
                    {alert.severity}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Empty search state */}
          {normalizedQuery &&
            matchedProjects.length === 0 &&
            matchedMPs.length === 0 &&
            matchedNav.length === 0 &&
            matchedAlerts.length === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <Search size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-600">No matching records found</p>
                <p className="text-[11px]">Try searching by district name, MP name, work title, or ID.</p>
              </div>
            )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">⌘K</kbd>
              <span>to toggle anytime</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">ESC</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="text-slate-400">SENTINEL MP-AI Unified Index</span>
        </div>
      </div>
    </div>
  );
};
