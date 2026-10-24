import React from 'react';
import { STATES_MAP, PROJECT_CATEGORIES } from '../data/geography';
import { ProjectStatus } from '../types';
import { Search, RotateCcw, MapPin, Layers, Activity, ShieldAlert, X } from 'lucide-react';

export interface FilterValues {
  search?: string;
  stateId?: number | null;
  category?: string | null;
  status?: ProjectStatus | null;
  minRisk?: number | null;
}

interface FilterBarProps {
  filters: FilterValues;
  onChange: (next: FilterValues) => void;
  onReset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, onReset }) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.stateId !== null && filters.stateId !== undefined ||
      filters.category ||
      filters.status ||
      filters.minRisk
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-3">
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by ID, title, district, MP, agency, or vendor..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* State select */}
        <div className="relative inline-flex items-center">
          <MapPin size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.stateId ?? ''}
            onChange={(e) =>
              onChange({ ...filters, stateId: e.target.value ? Number(e.target.value) : null })
            }
            className={`pl-7 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
              filters.stateId ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-medium' : 'bg-slate-50/80 border-slate-200 text-slate-700'
            }`}
          >
            <option value="">All States / UTs</option>
            {Object.entries(STATES_MAP).map(([id, s]) => (
              <option key={id} value={id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Category select */}
        <div className="relative inline-flex items-center">
          <Layers size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.category ?? ''}
            onChange={(e) => onChange({ ...filters, category: e.target.value || null })}
            className={`pl-7 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize transition-colors ${
              filters.category ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-medium' : 'bg-slate-50/80 border-slate-200 text-slate-700'
            }`}
          >
            <option value="">All Categories</option>
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Status select */}
        <div className="relative inline-flex items-center">
          <Activity size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.status ?? ''}
            onChange={(e) => onChange({ ...filters, status: (e.target.value as ProjectStatus) || null })}
            className={`pl-7 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize transition-colors ${
              filters.status ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-medium' : 'bg-slate-50/80 border-slate-200 text-slate-700'
            }`}
          >
            <option value="">All Statuses</option>
            <option value="proposed">Proposed</option>
            <option value="sanctioned">Sanctioned</option>
            <option value="in_progress">In Progress</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Min Risk Score filter */}
        <div className="relative inline-flex items-center">
          <ShieldAlert size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <select
            value={filters.minRisk ?? ''}
            onChange={(e) =>
              onChange({ ...filters, minRisk: e.target.value ? Number(e.target.value) : null })
            }
            className={`pl-7 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
              filters.minRisk ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-medium' : 'bg-slate-50/80 border-slate-200 text-slate-700'
            }`}
          >
            <option value="">Any Risk Level</option>
            <option value="40">Medium Risk (≥40)</option>
            <option value="70">High Risk (≥70)</option>
            <option value="85">Critical Risk (≥85)</option>
          </select>
        </div>

        {/* Reset button */}
        {onReset && (
          <button
            onClick={onReset}
            disabled={!hasActiveFilters}
            title="Reset Filters"
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${
              hasActiveFilters
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs font-medium cursor-pointer'
                : 'border-transparent text-slate-300 cursor-default'
            }`}
          >
            <RotateCcw size={13} className={hasActiveFilters ? 'text-blue-600' : ''} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Quick filter presets */}
      <div className="flex items-center gap-2 text-xs flex-wrap pt-1 border-t border-slate-100">
        <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Presets:</span>

        <button
          onClick={() =>
            onChange({
              search: '',
              stateId: null,
              category: null,
              status: null,
              minRisk: null,
            })
          }
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
            !hasActiveFilters
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Schemes
        </button>

        <button
          onClick={() =>
            onChange({
              ...filters,
              minRisk: 70,
              status: null,
            })
          }
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
            filters.minRisk === 70
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
          }`}
        >
          High Risk (≥70)
        </button>

        <button
          onClick={() =>
            onChange({
              ...filters,
              status: 'delayed',
              minRisk: null,
            })
          }
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
            filters.status === 'delayed'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
          }`}
        >
          Delayed Schemes
        </button>

        <button
          onClick={() =>
            onChange({
              ...filters,
              status: 'proposed',
              minRisk: null,
            })
          }
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
            filters.status === 'proposed'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
          }`}
        >
          Proposed Schemes
        </button>

        <button
          onClick={() =>
            onChange({
              ...filters,
              status: 'completed',
              minRisk: null,
            })
          }
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
            filters.status === 'completed'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
          }`}
        >
          Completed
        </button>
      </div>
    </div>
  );
};
