import React from 'react';
import { ProjectStatus } from '../types';

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  proposed: { label: 'Proposed', bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400', border: 'border-slate-200' },
  sanctioned: { label: 'Sanctioned', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  in_progress: { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  delayed: { label: 'Delayed', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400', border: 'border-zinc-200' },
};

export const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.proposed;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};
