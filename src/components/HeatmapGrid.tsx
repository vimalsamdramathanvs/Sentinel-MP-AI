import React from 'react';
import { getRiskColor } from '../data/riskEngine';

interface HeatmapGridProps {
  districts: string[];
  months: string[];
  dataMatrix: Record<string, number | null>; // keyed by `${district}|${month}`
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ districts, months, dataMatrix }) => {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold">
            <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left font-medium z-10">
              District
            </th>
            {months.map((m) => (
              <th key={m} className="px-2 py-3 text-center font-mono font-medium">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {districts.map((d) => (
            <tr key={d} className="hover:bg-slate-50/60 transition-colors">
              <td className="sticky left-0 bg-white px-4 py-2 font-medium text-slate-800 whitespace-nowrap z-10 border-r border-slate-100 shadow-xs">
                {d}
              </td>
              {months.map((m) => {
                const score = dataMatrix[`${d}|${m}`];
                const hasScore = score !== undefined && score !== null;

                return (
                  <td key={m} className="p-1 text-center">
                    <div
                      title={hasScore ? `${d}, ${m}: Risk ${score.toFixed(1)}/100` : 'No Activity recorded'}
                      className="w-8 h-8 mx-auto rounded-md flex items-center justify-center font-mono text-[10px] font-bold text-white transition-transform hover:scale-110 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: hasScore ? getRiskColor(score) : '#f1f5f9',
                        color: hasScore && score < 50 ? '#0f172a' : '#ffffff',
                      }}
                    >
                      {hasScore ? Math.round(score) : '—'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
