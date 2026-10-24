import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  lower?: number;
  upper?: number;
  isForecast?: boolean;
}

interface TrendChartProps {
  data: DataPoint[];
  height?: number;
  unit?: string;
  isPercentage?: boolean;
  lineColor?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  height = 200,
  unit = '',
  isPercentage = true,
  lineColor = '#2563eb',
}) => {
  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-400 text-xs">No historical series data available</div>;
  }

  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const width = 600; // viewBox width

  const values = data.map((d) => d.value);
  const uppers = data.map((d) => d.upper ?? d.value);
  const lowers = data.map((d) => d.lower ?? d.value);

  const minVal = Math.max(0, Math.min(...lowers) * 0.85);
  const maxVal = Math.max(...uppers) * 1.15 || 1;
  const valRange = (maxVal - minVal) === 0 ? 1 : (maxVal - minVal);
  const lenDivisor = data.length > 1 ? (data.length - 1) : 1;

  const getX = (index: number) => {
    return padding.left + (index / lenDivisor) * (width - padding.left - padding.right);
  };

  const getY = (val: number) => {
    const usableHeight = height - padding.top - padding.bottom;
    return height - padding.bottom - ((val - minVal) / valRange) * usableHeight;
  };

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Area under line
  const areaPoints = `${getX(0)},${height - padding.bottom} ${linePoints} ${getX(data.length - 1)},${height - padding.bottom}`;

  // Forecast Confidence Interval polygon
  const forecastStartIndex = data.findIndex((d) => d.isForecast);
  let forecastBandPoints = '';

  if (forecastStartIndex !== -1) {
    const forecastSubset = data.slice(forecastStartIndex);
    const upperLine = forecastSubset.map((d, i) => `${getX(forecastStartIndex + i)},${getY(d.upper ?? d.value)}`).join(' ');
    const lowerLine = forecastSubset
      .slice()
      .reverse()
      .map((d, i) => `${getX(data.length - 1 - i)},${getY(d.lower ?? d.value)}`)
      .join(' ');
    forecastBandPoints = `${upperLine} ${lowerLine}`;
  }

  const formatVal = (val: number) => {
    if (isPercentage) return `${Math.round(val * 100)}%`;
    return `${val.toLocaleString()}${unit}`;
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio) => {
          const val = minVal + ratio * (maxVal - minVal);
          const y = getY(val);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                {formatVal(val)}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <polygon points={areaPoints} fill="url(#trendGradient)" />

        {/* Forecast CI Uncertainty Band (80% Confidence) */}
        {forecastBandPoints && (
          <polygon
            points={forecastBandPoints}
            fill="#f59e0b"
            fillOpacity="0.18"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}

        {/* Forecast separator line */}
        {forecastStartIndex !== -1 && (
          <g>
            <line
              x1={getX(forecastStartIndex)}
              y1={padding.top}
              x2={getX(forecastStartIndex)}
              y2={height - padding.bottom}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <text
              x={getX(forecastStartIndex) + 4}
              y={padding.top + 10}
              fontSize="9"
              fill="#d97706"
              fontWeight="bold"
            >
              80% CI Forecast Horizon
            </text>
          </g>
        )}

        {/* Main Data Line */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          points={linePoints}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.value);
          const isF = d.isForecast;

          return (
            <g key={d.label} className="group cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r={isF ? 4 : 3}
                fill={isF ? '#f59e0b' : lineColor}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-transform group-hover:scale-150"
              />
              <title>{`${d.label}: ${formatVal(d.value)}${isF ? ` (80% CI: ${formatVal(d.lower ?? 0)} - ${formatVal(d.upper ?? 0)})` : ''}`}</title>
              {/* X-axis labels (every 2 or 3) */}
              {(i % (data.length > 8 ? 2 : 1) === 0 || i === data.length - 1) && (
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={isF ? '#d97706' : '#64748b'}
                  fontWeight={isF ? 600 : 400}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
