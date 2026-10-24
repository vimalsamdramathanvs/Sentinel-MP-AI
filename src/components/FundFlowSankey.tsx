import React from 'react';

interface CategoryFlow {
  name: string;
  sanctioned: number;
  released: number;
  utilized: number;
}

const PALETTE = [
  '#2563eb', '#7c3aed', '#0891b2', '#10b981', '#f59e0b', '#dc2626', '#0f766e', '#9333ea'
];

export const FundFlowSankey: React.FC<{ categories: CategoryFlow[] }> = ({ categories }) => {
  const totalSanctioned = categories.reduce((acc, c) => acc + c.sanctioned, 0);
  const totalReleased = categories.reduce((acc, c) => acc + Math.min(c.released, c.sanctioned), 0);
  const totalUtilized = categories.reduce((acc, c) => acc + Math.min(c.utilized, c.released), 0);

  const formatCr = (val: number) => `₹${(val / 1e7).toFixed(1)} Cr`;

  return (
    <div className="w-full overflow-x-auto p-2">
      <div className="min-w-[640px] space-y-4">
        {/* Stage Headers */}
        <div className="grid grid-cols-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center border-b border-slate-200 pb-2">
          <div className="text-left">Stage 1: Sanctioned Allocation</div>
          <div>Stage 2: Category Breakdown</div>
          <div className="text-right">Stage 3: Realized Utilization</div>
        </div>

        {/* Global Summary Pillars */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-xs text-blue-600 font-medium">Total Sanctioned</div>
            <div className="text-xl font-bold text-blue-900 mt-1">{formatCr(totalSanctioned)}</div>
            <div className="text-xs text-blue-700/80 mt-1">100% of Authorised Cap</div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
            <div className="text-xs text-indigo-600 font-medium">Funds Released</div>
            <div className="text-xl font-bold text-indigo-900 mt-1">{formatCr(totalReleased)}</div>
            <div className="text-xs text-indigo-700/80 mt-1">
              {totalSanctioned > 0 ? Math.round((totalReleased / totalSanctioned) * 100) : 0}% Release Ratio
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-right">
            <div className="text-xs text-emerald-600 font-medium">Physical Utilized</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">{formatCr(totalUtilized)}</div>
            <div className="text-xs text-emerald-700/80 mt-1">
              {totalReleased > 0 ? Math.round((totalUtilized / totalReleased) * 100) : 0}% Expenditure Rate
            </div>
          </div>
        </div>

        {/* Category breakdown rows with relative flow bars */}
        <div className="space-y-2.5 pt-2">
          {categories.map((cat, idx) => {
            const relPct = totalSanctioned > 0 ? (cat.sanctioned / totalSanctioned) * 100 : 0;
            const utPct = cat.released > 0 ? Math.min(100, Math.round((cat.utilized / cat.released) * 100)) : 0;
            const color = PALETTE[idx % PALETTE.length];

            return (
              <div key={cat.name} className="bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-200/70 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: color }} />
                    <span className="capitalize">{cat.name.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
                    <span>Sanction: <strong>{formatCr(cat.sanctioned)}</strong></span>
                    <span>Released: <strong>{formatCr(cat.released)}</strong></span>
                    <span>Utilized: <strong className={utPct < 50 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{formatCr(cat.utilized)} ({utPct}%)</strong></span>
                  </div>
                </div>

                {/* Flow bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${utPct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
