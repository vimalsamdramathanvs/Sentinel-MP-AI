import React from 'react';
import { getRiskTier, RISK_SCALE } from '../data/riskEngine';

export const RiskBadge: React.FC<{ score?: number; showScore?: boolean; size?: 'sm' | 'md' }> = ({
  score = 0,
  showScore = true,
  size = 'md',
}) => {
  const safeScore = typeof score === 'number' && !isNaN(score) ? Math.max(0, Math.min(100, score)) : 0;
  const tier = getRiskTier(safeScore);
  const cfg = RISK_SCALE[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${cfg.badgeBg} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      <span>{cfg.label}</span>
      {showScore && <span className="font-mono opacity-85">({safeScore.toFixed(1)})</span>}
    </span>
  );
};
