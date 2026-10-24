/**
 * MPLADS Sentinel AI — Auth Context & Role-Based Access Control (Phase 4 & Phase 17)
 * Implements client-side RBAC mirroring Phase 4's ROLE_PERMISSIONS matrix,
 * with fast role-switching for audit, oversight, and public demonstration.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { RoleType, UserSession, AuditLogEntry } from '../types';

export const ROLE_PERMISSIONS_MAP: Record<RoleType, Set<string>> = {
  system_admin: new Set(['*']),
  ministry_admin: new Set([
    'project.read', 'project.write', 'fraud.read', 'fraud.override',
    'risk.read', 'report.generate', 'alert.read', 'alert.resolve',
    'user.manage', 'audit.read', 'analytics.read',
  ]),
  state_admin: new Set([
    'project.read', 'project.write', 'fraud.read', 'risk.read',
    'report.generate', 'alert.read', 'alert.resolve', 'analytics.read',
  ]),
  district_officer: new Set([
    'project.read', 'project.write', 'fraud.read', 'risk.read',
    'report.generate', 'alert.read', 'alert.resolve', 'analytics.read',
  ]),
  mp_user: new Set([
    'project.read', 'risk.read', 'alert.read', 'report.generate', 'analytics.read',
  ]),
  auditor: new Set([
    'project.read', 'fraud.read', 'risk.read', 'audit.read', 'report.generate', 'analytics.read', 'alert.read',
  ]),
  public_user: new Set([
    'project.read', 'project.read.public', 'report.read.public', 'grievance.submit', 'analytics.read', 'report.generate',
  ]),
};

export const PRESET_USERS: Record<RoleType, UserSession> = {
  ministry_admin: {
    id: 'usr-min-01',
    email: 'director.general@mplads.gov.in',
    fullName: 'Rajeshwar Sharma, IAS',
    role: 'ministry_admin',
    mfaEnabled: true,
  },
  state_admin: {
    id: 'usr-state-01',
    email: 'state.commissioner.ka@gov.in',
    fullName: 'Dr. Ananya Rao, IAS',
    role: 'state_admin',
    stateId: 1, // Karnataka
    mfaEnabled: true,
  },
  district_officer: {
    id: 'usr-dist-01',
    email: 'collector.bengaluru@karnataka.gov.in',
    fullName: 'K. S. Narayanan, KAS',
    role: 'district_officer',
    stateId: 1,
    districtId: 200,
    mfaEnabled: false,
  },
  mp_user: {
    id: 'usr-mp-01',
    email: 'mp.office.varanasi@sansad.nic.in',
    fullName: 'Hon. Member of Parliament Secretariat',
    role: 'mp_user',
    stateId: 3,
    constituencyId: 457,
    mpName: 'Shri Narendra Modi',
    mfaEnabled: true,
  },
  auditor: {
    id: 'usr-aud-01',
    email: 'principal.director@cag.gov.in',
    fullName: 'S. K. Verma (Comptroller & Auditor General)',
    role: 'auditor',
    mfaEnabled: true,
  },
  public_user: {
    id: 'usr-pub-anon',
    email: 'citizen@public.transparency.in',
    fullName: 'Public Citizen (Anonymous)',
    role: 'public_user',
    mfaEnabled: false,
  },
  system_admin: {
    id: 'usr-sys-01',
    email: 'admin.platform@sentinel.gov.in',
    fullName: 'DevOps Lead Engineer',
    role: 'system_admin',
    mfaEnabled: true,
  },
};

interface AuthContextType {
  user: UserSession;
  switchRole: (role: RoleType) => void;
  hasPermission: (permission: string) => boolean;
  auditLogs: AuditLogEntry[];
  recordAuditLog: (action: string, entityType: string, entityId: string, details?: Record<string, any>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('sentinel_role');
        if (saved && PRESET_USERS[saved as RoleType]) {
          return PRESET_USERS[saved as RoleType];
        }
      }
    } catch (_) {}
    return PRESET_USERS.ministry_admin;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'aud-001',
      action: 'auth.login_success',
      userEmail: 'director.general@mplads.gov.in',
      userRole: 'ministry_admin',
      entityType: 'session',
      entityId: 'sess-84920',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: '10.24.18.91 (NIC-GovNet)',
    },
  ]);

  const switchRole = (role: RoleType) => {
    const newUser = PRESET_USERS[role];
    setUser(newUser);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('sentinel_role', role);
      }
    } catch (_) {}

    recordAuditLog('auth.role_switch', 'user_session', newUser.id, { newRole: role });
  };

  const hasPermission = (permission: string): boolean => {
    const permissions = ROLE_PERMISSIONS_MAP[user.role];
    if (!permissions) return false;
    return permissions.has('*') || permissions.has(permission);
  };

  const recordAuditLog = (
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>
  ) => {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      action,
      userEmail: user.email,
      userRole: user.role,
      entityType,
      entityId,
      afterState: details,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1 (Local Verified)',
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  return (
    <AuthContext.Provider value={{ user, switchRole, hasPermission, auditLogs, recordAuditLog }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
