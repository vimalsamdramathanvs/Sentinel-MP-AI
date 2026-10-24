import React from 'react';
import { RiskComponents } from '../types';

interface RiskRadarChartProps {
  components: RiskComponents;
  size?: number;
}

const AXIS_LABELS: Record<keyof RiskComponents, string> = {
  cost_risk: 'Cost Anomaly',
  delay_risk: 'Delay Overdue',
  utilization_risk: 'Fund Misuse',
  duplicate_risk: 'Duplicate Geo',
  vendor_risk: 'Vendor Risk',
  agency_risk: 'Agency Track',
  compliance_risk: 'Document UC',
  geo_risk: 'Satellite Zero-Chg',
};

export const RiskRadarChart: React.FC<RiskRadarChartProps> = ({ components, size = 300 }) => {
  const keys = Object.keys(AXIS_LABELS) as (keyof RiskComponents)[];
  const count = keys.length;
  const center = size / 2;
  const radius = center - 45;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = keys
    .map((k, i) => {
      const val = components[k] || 0;
      const { x, y } = getCoordinates(i, val);
      return `${x},${y}`;
    })
    .join(' ');

  const levels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Concentric grid polygons */}
        {levels.map((lvl) => {
          const gridPoints = keys
            .map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <g key={lvl}>
              <polygon
                points={gridPoints}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={lvl === 100 ? 1.5 : 1}
                strokeDasharray={lvl < 100 ? '2,2' : undefined}
              />
              <text
                x={center}
                y={center - (lvl / 100) * radius - 2}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
              >
                {lvl}
              </text>
            </g>
          );
        })}

        {/* Radial Axis Spokes */}
        {keys.map((k, i) => {
          const { x, y } = getCoordinates(i, 100);
          const labelCoord = getCoordinates(i, 122);
          const val = components[k] || 0;

          return (
            <g key={k}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight={500}
                fill={val > 65 ? '#dc2626' : val > 40 ? '#d97706' : '#475569'}
              >
                {AXIS_LABELS[k]} ({val.toFixed(0)})
              </text>
            </g>
          );
        })}

        {/* Data Shape */}
        <polygon
          points={polygonPoints}
          fill="rgba(239, 68, 68, 0.22)"
          stroke="#ef4444"
          strokeWidth={2}
        />

        {/* Data Vertices */}
        {keys.map((k, i) => {
          const val = components[k] || 0;
          const { x, y } = getCoordinates(i, val);
          return (
            <circle
              key={k}
              cx={x}
              cy={y}
              r={val > 60 ? 4.5 : 3.5}
              fill={val > 60 ? '#ef4444' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth={1.5}
            >
              <title>{`${AXIS_LABELS[k]}: ${val}/100`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
};
