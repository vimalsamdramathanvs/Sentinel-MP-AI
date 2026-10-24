import React, { useState } from 'react';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { RoleType } from '../types';
import { Shield, Bell, ChevronDown, Check, UserCircle, Activity, Search, Satellite, RefreshCw, Mic, ExternalLink, Printer } from 'lucide-react';

interface NavbarProps {
  onOpenAlerts?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenVoiceCopilot?: () => void;
  onNavigateHome?: () => void;
  onPrintCurrentView?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAlerts, onOpenCommandPalette, onOpenVoiceCopilot, onNavigateHome, onPrintCurrentView }) => {
  const { user, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roleLabels: Record<RoleType, string> = {
    ministry_admin: 'Ministry Admin (National)',
    state_admin: 'State Admin (Karnataka)',
    district_officer: 'District Officer (Bengaluru)',
    mp_user: 'MP Office (Varanasi)',
    auditor: 'Auditor General (CAG)',
    public_user: 'Public Citizen (Transparency)',
    system_admin: 'System Admin (DevOps)',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 flex items-center justify-between px-4 lg:px-6 shadow-2xs">
      {/* Brand & Emblem */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onNavigateHome}
          className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Return to National Dashboard"
        >
          <Shield size={20} className="text-blue-400" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateHome}
              className="font-bold text-base tracking-tight text-slate-900 hover:text-blue-700 transition-colors cursor-pointer"
              title="Return to National Dashboard"
            >
              SENTINEL MP-AI
            </button>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            National MPLADS Risk Intelligence, Fraud Detection & Multi-Agent Oversight
          </p>
        </div>
      </div>

      {/* Center Search / Command Palette Bar */}
      <div className="flex items-center gap-3">
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 rounded-xl text-xs text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-2xs group w-48 sm:w-64 lg:w-72 justify-between"
            title="Press Cmd+K or Ctrl+K to search anything"
          >
            <span className="flex items-center gap-2 truncate">
              <Search size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              <span className="truncate font-medium">Search projects, MPs, alerts...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right User & Role Switcher */}
      <div className="flex items-center gap-2.5">
        {onPrintCurrentView && (
          <button
            type="button"
            onClick={onPrintCurrentView}
            title="Print Current View / A4 Statutory Print Preview (Ctrl+P)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Printer size={14} className="text-slate-600" />
            <span className="hidden sm:inline">Print</span>
          </button>
        )}

        {onOpenVoiceCopilot && (
          <button
            onClick={onOpenVoiceCopilot}
            title="Open Bhashini Voice Copilot (Indic Speech Engine)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs group"
          >
            <Mic size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Voice Copilot</span>
            <span className="text-[10px] bg-blue-200/70 text-blue-800 px-1 rounded font-mono hidden md:inline">Indic</span>
          </button>
        )}

        {onOpenAlerts && (
          <button
            onClick={onOpenAlerts}
            title="Open Alerts Center"
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full" />
          </button>
        )}

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
          >
            <UserCircle size={16} className="text-blue-600" />
            <div className="text-left hidden md:block">
              <div className="leading-tight font-bold">{user.fullName.split(',')[0]}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                {user.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              onClick={() => setShowRoleMenu(false)}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Switch Role Persona (Phase 4 RBAC)
              </div>
              {(Object.keys(PRESET_USERS) as RoleType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user.role === r ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div>{roleLabels[r]}</div>
                    <div className="text-[10px] text-slate-400">{PRESET_USERS[r].email}</div>
                  </div>
                  {user.role === r && <Check size={14} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
