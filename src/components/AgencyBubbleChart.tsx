import React from 'react';
import { getRiskColor } from '../data/riskEngine';

interface AgencyPerformance {
  agencyId: string;
  name: string;
  type: string;
  totalProjects: number;
  delayed: number;
  sanctioned: number;
  avgRiskScore: number;
  isBlacklisted: boolean;
}

export const AgencyBubbleChart: React.FC<{ agencies: AgencyPerformance[] }> = ({ agencies }) => {
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  // X axis: Delay projects (0 to 12)
  // Y axis: Risk score (0 to 100)
  // Radius: totalProjects (8 to 30) => radius 8 to 26

  const getX = (delayed: number) => {
    return padding.left + (delayed / 12) * (width - padding.left - padding.right);
  };

  const getY = (risk: number) => {
    return height - padding.bottom - (risk / 100) * (height - padding.top - padding.bottom);
  };

  const getRadius = (count: number) => {
    return 10 + (count / 25) * 16;
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        {/* Grid lines */}
        {[20, 40, 60, 80, 100].map((risk) => {
          const y = getY(risk);
          return (
            <g key={risk}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                {risk}
              </text>
            </g>
          );
        })}

        {[0, 3, 6, 9, 12].map((del) => {
          const x = getX(del);
          return (
            <g key={del}>
              <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="#f1f5f9" strokeWidth={1} />
              <text x={x} y={height - padding.bottom + 16} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                {del} delayed
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="10" fontWeight={600} fill="#64748b">
          Delayed Projects Count (X-Axis)
        </text>
        <text x={12} y={height / 2} textAnchor="middle" fontSize="10" fontWeight={600} fill="#64748b" transform={`rotate(-90 12 ${height/2})`}>
          Avg Composite Risk Score (Y-Axis)
        </text>

        {/* Bubbles */}
        {agencies.map((agency) => {
          const x = getX(agency.delayed);
          const y = getY(agency.avgRiskScore);
          const r = getRadius(agency.totalProjects);
          const color = getRiskColor(agency.avgRiskScore);

          return (
            <g key={agency.agencyId} className="group cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={color}
                fillOpacity={0.65}
                stroke={color}
                strokeWidth={agency.isBlacklisted ? 3 : 1.5}
                strokeDasharray={agency.isBlacklisted ? '3,2' : undefined}
                className="transition-all duration-300 group-hover:scale-110 group-hover:fill-opacity-90"
              />
              <text
                x={x}
                y={y - r - 4}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight={600}
                fill="#1e293b"
                className="pointer-events-none drop-shadow-xs"
              >
                {agency.type}
              </text>
              <title>
                {`${agency.name}\n• Total: ${agency.totalProjects} projects\n• Delayed: ${agency.delayed}\n• Sanctioned: ₹${(agency.sanctioned / 1e7).toFixed(1)} Cr\n• Avg Risk: ${agency.avgRiskScore}/100${agency.isBlacklisted ? ' (BLACKLISTED)' : ''}`}
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
