import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  ShieldAlert,
  Gauge,
  BarChart3,
  Satellite,
  FileCheck,
  BellRing,
  FileText,
  Bot,
  Users,
  Globe,
  Sliders,
  Briefcase,
  Scale,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'projects'
  | 'gis'
  | 'fraud'
  | 'risk'
  | 'analytics'
  | 'satellite'
  | 'documents'
  | 'alerts'
  | 'reports'
  | 'copilot'
  | 'mpledger'
  | 'public'
  | 'admin';

export type WorkspaceFilter = 'all' | 'executive' | 'audit' | 'citizen';

interface SidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  openAlertCount?: number;
  onOpenDisha?: () => void;
  onOpenGfr?: () => void;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission: string | null;
  badge?: number;
  workspace: 'executive' | 'audit' | 'citizen';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  openAlertCount = 0,
  onOpenDisha,
  onOpenGfr,
}) => {
  const { hasPermission, user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceFilter>('all');

  const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'National Dashboard', icon: LayoutDashboard, permission: 'project.read', workspace: 'executive' },
    { id: 'projects', label: 'Project Registry', icon: FolderKanban, permission: 'project.read', workspace: 'executive' },
    { id: 'gis', label: 'GIS Spatial Map', icon: MapPin, permission: 'project.read', workspace: 'executive' },
    { id: 'analytics', label: 'Analytics & Forecast', icon: BarChart3, permission: 'analytics.read', workspace: 'executive' },
    { id: 'mpledger', label: 'MP Allocation Ledger', icon: Users, permission: null, workspace: 'executive' },

    { id: 'fraud', label: 'Fraud Center (ML)', icon: ShieldAlert, permission: 'fraud.read', workspace: 'audit' },
    { id: 'risk', label: 'Risk Scoring Engine', icon: Gauge, permission: 'risk.read', workspace: 'audit' },
    { id: 'satellite', label: 'Satellite & Vision', icon: Satellite, permission: 'project.read', workspace: 'audit' },
    { id: 'documents', label: 'Document AI', icon: FileCheck, permission: 'project.read', workspace: 'audit' },
    { id: 'alerts', label: 'Alerts & Resolution', icon: BellRing, permission: 'alert.read', badge: openAlertCount, workspace: 'audit' },
    { id: 'reports', label: 'Reporting Hub', icon: FileText, permission: 'report.generate', workspace: 'audit' },

    { id: 'copilot', label: 'Multi-Agent Copilot', icon: Bot, permission: 'project.read', workspace: 'citizen' },
    { id: 'public', label: 'Citizen Transparency & RTI', icon: Globe, permission: null, workspace: 'citizen' },
    { id: 'admin', label: 'Admin & Risk Weights', icon: Sliders, permission: 'user.manage', workspace: 'citizen' },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => {
    const hasPerm = item.permission === null || hasPermission(item.permission);
    if (!hasPerm) return false;
    if (workspace === 'all') return true;
    return item.workspace === workspace;
  });

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Scope banner */}
      <div className="p-3.5 border-b border-slate-800 text-xs">
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
          Authorization Scope
        </div>
        <div className="font-semibold text-white mt-0.5 truncate">
          {user.role === 'ministry_admin'
            ? 'Republic of India (All States)'
            : user.role === 'state_admin'
            ? 'Karnataka State Directorate'
            : user.role === 'district_officer'
            ? 'Bengaluru Urban District'
            : user.role === 'mp_user'
            ? `Varanasi — ${user.mpName || 'MP Office'}`
            : user.role === 'auditor'
            ? 'CAG Audit Oversight'
            : user.role === 'public_user'
            ? 'Open Transparency Portal'
            : 'Sentinel Platform Systems'}
        </div>
      </div>

      {/* Workspace Persona Filter Tabs */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 px-1 flex items-center justify-between">
          <span>Workspace Persona</span>
          <span className="text-[9px] text-slate-400 font-mono">
            {workspace === 'all' ? '14 Tools' : `${visibleItems.length} Tools`}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-slate-800/80 text-[10px]">
          <button
            onClick={() => setWorkspace('all')}
            className={`py-1 rounded-md font-semibold transition-all cursor-pointer text-center ${
              workspace === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setWorkspace('executive');
              const execItems = NAV_ITEMS.filter((i) => i.workspace === 'executive' && (i.permission === null || hasPermission(i.permission)));
              if (execItems.length > 0 && !execItems.some((i) => i.id === activeTab)) {
                onTabChange(execItems[0].id);
              }
            }}
            className={`py-1 rounded-md font-semibold transition-all cursor-pointer text-center ${
              workspace === 'executive' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
            title="District Collector & MP Executive Views"
          >
            Exec
          </button>
          <button
            onClick={() => {
              setWorkspace('audit');
              const auditItems = NAV_ITEMS.filter((i) => i.workspace === 'audit' && (i.permission === null || hasPermission(i.permission)));
              if (auditItems.length > 0 && !auditItems.some((i) => i.id === activeTab)) {
                onTabChange(auditItems[0].id);
              }
            }}
            className={`py-1 rounded-md font-semibold transition-all cursor-pointer text-center ${
              workspace === 'audit' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Vigilance & Audit Oversight"
          >
            Audit
          </button>
          <button
            onClick={() => {
              setWorkspace('citizen');
              const citizenItems = NAV_ITEMS.filter((i) => i.workspace === 'citizen' && (i.permission === null || hasPermission(i.permission)));
              if (citizenItems.length > 0 && !citizenItems.some((i) => i.id === activeTab)) {
                onTabChange('public');
              }
            }}
            className={`py-1 rounded-md font-semibold transition-all cursor-pointer text-center ${
              workspace === 'citizen' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Citizen Transparency & AI"
          >
            Public
          </button>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Statutory Actions Section */}
        <div className="pt-3 mt-2 border-t border-slate-800/80 px-1 space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2">
            Statutory Toolkits
          </div>
          {onOpenDisha && (
            <button
              onClick={onOpenDisha}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-950/40 border border-amber-500/30 transition-colors cursor-pointer"
            >
              <Briefcase size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">DISHA Review Pack</span>
            </button>
          )}
          {onOpenGfr && (
            <button
              onClick={onOpenGfr}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-300 hover:bg-purple-950/40 border border-purple-500/30 transition-colors cursor-pointer"
            >
              <Scale size={14} className="text-purple-400 shrink-0" />
              <span className="truncate">GFR 2017 Compliance</span>
            </button>
          )}
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>SENTINEL MP-AI v1.5</span>
        <span className="text-emerald-400 font-mono text-[10px]">● Online</span>
      </div>
    </aside>
  );
};
