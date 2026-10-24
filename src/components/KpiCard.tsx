import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  tone?: 'positive' | 'neutral' | 'warning' | 'critical';
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  icon?: React.ReactNode;
  onClick?: () => void;
}

const TONE_BORDER = {
  positive: 'border-l-4 border-l-emerald-500',
  neutral: 'border-l-4 border-l-slate-300',
  warning: 'border-l-4 border-l-amber-500',
  critical: 'border-l-4 border-l-rose-600',
};

const TONE_VALUE = {
  positive: 'text-slate-900',
  neutral: 'text-slate-900',
  warning: 'text-amber-700',
  critical: 'text-rose-700',
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  tone = 'neutral',
  trend,
  icon,
  onClick,
}) => {
  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    trend?.direction === 'up'
      ? 'text-emerald-600'
      : trend?.direction === 'down'
      ? 'text-rose-600'
      : 'text-slate-500';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-sm ${TONE_BORDER[tone]} ${onClick ? 'cursor-pointer hover:border-blue-300 active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && <div className="text-slate-400 p-1.5 bg-slate-50 rounded-lg">{icon}</div>}
      </div>

      <div className={`text-2xl font-bold tracking-tight mt-2 ${TONE_VALUE[tone]}`}>
        {value}
      </div>

      {(subValue || trend) && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
          {subValue && <span className="text-slate-500 font-medium">{subValue}</span>}
          {trend && (
            <div className={`flex items-center gap-1 font-medium ${trendColor}`}>
              <TrendIcon size={13} />
              <span>{trend.label}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
