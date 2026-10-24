import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  CONSTITUENCY_TREND_SERIES,
  ConstituencyTrendSeries,
  NATIONAL_BENCHMARK_RATES,
  TREND_MONTHS_LABELS,
} from '../data/constituencyTrendsData';
import {
  TrendingUp,
  SlidersHorizontal,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';

type MetricMode = 'utilization_rate' | 'cumulative_cr' | 'monthly_lakhs';

interface HoverInfo {
  monthIndex: number;
  monthLabel: string;
  fullMonth: string;
  xPos: number;
  items: {
    constituency: ConstituencyTrendSeries;
    value: number;
    formattedValue: string;
    prevDelta: number;
  }[];
}

export const ConstituencyUtilizationD3Chart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Selected constituencies (defaults to top 3 representative ones)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'varanasi',
    'bengaluru-urban',
    'pune',
    'patna-sahib',
  ]);

  // UI / Display Toggles
  const [metricMode, setMetricMode] = useState<MetricMode>('utilization_rate');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [showAreaFill, setShowAreaFill] = useState<boolean>(true);
  const [hoveredSeriesId, setHoveredSeriesId] = useState<string | null>(null);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Interactive Hover / Crosshair state
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // Active series list
  const activeSeries = useMemo(() => {
    return CONSTITUENCY_TREND_SERIES.filter((s) => selectedIds.includes(s.id));
  }, [selectedIds]);

  // Toggle selection
  const toggleConstituency = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Presets
  const applyPreset = (type: 'all' | 'metros' | 'high_growth' | 'lagging' | 'default') => {
    if (type === 'all') {
      setSelectedIds(CONSTITUENCY_TREND_SERIES.map((s) => s.id));
    } else if (type === 'metros') {
      setSelectedIds(
        CONSTITUENCY_TREND_SERIES.filter((s) => s.category === 'Metropolitan').map((s) => s.id)
      );
    } else if (type === 'high_growth') {
      setSelectedIds(
        CONSTITUENCY_TREND_SERIES.filter((s) => s.netGrowthPctPoints >= 40).map((s) => s.id)
      );
    } else if (type === 'lagging') {
      setSelectedIds(
        CONSTITUENCY_TREND_SERIES.filter((s) => s.currentUtilizationRate < 65).map((s) => s.id)
      );
    } else {
      setSelectedIds(['varanasi', 'bengaluru-urban', 'pune', 'patna-sahib']);
    }
  };

  // Main D3 Rendering Logic with ResizeObserver
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;

    const renderChart = () => {
      const containerWidth = container.clientWidth || 800;
      const height = 360;
      const margin = { top: 32, right: 130, bottom: 42, left: 58 };
      const width = Math.max(containerWidth, 540);
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      svg.attr('viewBox', `0 0 ${width} ${height}`);
      svg.selectAll('*').remove(); // Clear previous render

      // Color gradients for area fills under each series
      const defs = svg.append('defs');

      CONSTITUENCY_TREND_SERIES.forEach((s) => {
        const gradient = defs
          .append('linearGradient')
          .attr('id', `area-grad-${s.id}`)
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '0%')
          .attr('y2', '100%');

        gradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', s.color)
          .attr('stop-opacity', 0.24);

        gradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', s.color)
          .attr('stop-opacity', 0.0);
      });

      // Filter for node drop-shadows
      const filter = defs
        .append('filter')
        .attr('id', 'dot-shadow')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      filter
        .append('feDropShadow')
        .attr('dx', '0')
        .attr('dy', '1.5')
        .attr('stdDeviation', '1.5')
        .attr('flood-color', '#0f172a')
        .attr('flood-opacity', '0.2');

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Determine X Scale: Date scale across 12 months
      const firstDate = CONSTITUENCY_TREND_SERIES[0].monthlyData[0].date;
      const lastDate =
        CONSTITUENCY_TREND_SERIES[0].monthlyData[
          CONSTITUENCY_TREND_SERIES[0].monthlyData.length - 1
        ].date;

      const xScale = d3
        .scaleTime()
        .domain([firstDate, lastDate])
        .range([0, innerWidth]);

      // Determine Y Scale Domain based on Metric
      let yMax = 100;
      if (metricMode === 'utilization_rate') {
        yMax = 100;
      } else if (metricMode === 'cumulative_cr') {
        const vals: number[] = activeSeries.flatMap((s) => s.monthlyData.map((d) => d.cumulativeUtilizedCr));
        const maxVal = vals.length > 0 ? Math.max(...vals) : 20;
        yMax = Math.ceil(maxVal * 1.15);
      } else {
        const vals: number[] = activeSeries.flatMap((s) => s.monthlyData.map((d) => d.monthlyExpenditureLakhs));
        const maxVal = vals.length > 0 ? Math.max(...vals) : 120;
        yMax = Math.ceil((maxVal * 1.2) / 10) * 10;
      }

      const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

      // Value extractor helper
      const getMetricValue = (d: any) => {
        if (metricMode === 'utilization_rate') return d.utilizationRate;
        if (metricMode === 'cumulative_cr') return d.cumulativeUtilizedCr;
        return d.monthlyExpenditureLakhs;
      };

      // 1. Draw Subtle Gridlines (Horizontal)
      const yGrid = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(() => '');

      g.append('g')
        .attr('class', 'gridline')
        .call(yGrid)
        .selectAll('line')
        .attr('stroke', '#f1f5f9')
        .attr('stroke-dasharray', '3,3');

      g.select('.domain').remove();

      // 2. MoSPI 75% Statutory Target Benchmark Band (for Utilization Rate mode)
      if (metricMode === 'utilization_rate' && showBenchmark) {
        // Target 75% guideline line
        const targetY = yScale(75);
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', targetY)
          .attr('y2', targetY)
          .attr('stroke', '#cbd5e1')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4');

        g.append('text')
          .attr('x', innerWidth - 4)
          .attr('y', targetY - 6)
          .attr('text-anchor', 'end')
          .attr('fill', '#94a3b8')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .text('MoSPI 75% Target Threshold');

        // Draw national benchmark trajectory curve
        const benchmarkDates = CONSTITUENCY_TREND_SERIES[0].monthlyData.map((d) => d.date);
        const benchmarkLineData = NATIONAL_BENCHMARK_RATES.map((b, i) => ({
          date: benchmarkDates[i],
          rate: b.rate,
        }));

        const benchLineGen = d3
          .line<{ date: Date; rate: number }>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d.rate))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(benchmarkLineData)
          .attr('fill', 'none')
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1.8)
          .attr('stroke-dasharray', '2,3')
          .attr('d', benchLineGen);

        const lastBench = benchmarkLineData[benchmarkLineData.length - 1];
        g.append('text')
          .attr('x', xScale(lastBench.date) + 6)
          .attr('y', yScale(lastBench.rate) + 3)
          .attr('fill', '#64748b')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .text(`National Avg (80%)`);
      }

      // 3. D3 Line and Area Generators
      const lineGen = d3
        .line<any>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(getMetricValue(d)))
        .curve(d3.curveMonotoneX);

      const areaGen = d3
        .area<any>()
        .x((d) => xScale(d.date))
        .y0(innerHeight)
        .y1((d) => yScale(getMetricValue(d)))
        .curve(d3.curveMonotoneX);

      // 4. Render Series Area Fills
      if (showAreaFill) {
        activeSeries.forEach((s) => {
          const isFaded = hoveredSeriesId && hoveredSeriesId !== s.id;
          g.append('path')
            .datum(s.monthlyData)
            .attr('fill', `url(#area-grad-${s.id})`)
            .attr('d', areaGen)
            .attr('opacity', isFaded ? 0.08 : 0.8)
            .attr('class', 'transition-opacity duration-300 pointer-events-none');
        });
      }

      // 5. Render Series Lines & End Labels
      activeSeries.forEach((s) => {
        const isHovered = hoveredSeriesId === s.id;
        const isFaded = hoveredSeriesId && !isHovered;

        // The line path
        const path = g
          .append('path')
          .datum(s.monthlyData)
          .attr('fill', 'none')
          .attr('stroke', s.color)
          .attr('stroke-width', isHovered ? 3.5 : 2.5)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('opacity', isFaded ? 0.3 : 1)
          .attr('d', lineGen)
          .attr('class', 'transition-all duration-300 cursor-pointer')
          .on('mouseenter', () => setHoveredSeriesId(s.id))
          .on('mouseleave', () => setHoveredSeriesId(null));

        // Animated entry stroke
        const totalLength = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', 0);

        // Data point circles on line
        g.selectAll(`.dot-${s.id}`)
          .data(s.monthlyData)
          .enter()
          .append('circle')
          .attr('cx', (d: any) => xScale(d.date))
          .attr('cy', (d: any) => yScale(getMetricValue(d)))
          .attr('r', isHovered ? 4.5 : 3)
          .attr('fill', '#ffffff')
          .attr('stroke', s.color)
          .attr('stroke-width', isHovered ? 2.5 : 1.8)
          .attr('filter', 'url(#dot-shadow)')
          .attr('opacity', isFaded ? 0.3 : 1)
          .attr('class', 'transition-all duration-300 pointer-events-none');

        // End Label and Indicator Pill
        const lastPoint = s.monthlyData[s.monthlyData.length - 1];
        const lastVal = getMetricValue(lastPoint);
        const lastX = xScale(lastPoint.date);
        const lastY = yScale(lastVal);

        const labelGroup = g
          .append('g')
          .attr('transform', `translate(${lastX + 8}, ${lastY})`)
          .attr('opacity', isFaded ? 0.35 : 1)
          .attr('class', 'cursor-pointer select-none transition-opacity duration-300')
          .on('mouseenter', () => setHoveredSeriesId(s.id))
          .on('mouseleave', () => setHoveredSeriesId(null));

        // Label pill background
        labelGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', -9)
          .attr('width', 114)
          .attr('height', 18)
          .attr('rx', 4)
          .attr('fill', isHovered ? s.color : '#f8fafc')
          .attr('stroke', isHovered ? s.color : '#e2e8f0')
          .attr('stroke-width', 1);

        // Label Text
        const formattedValStr =
          metricMode === 'utilization_rate'
            ? `${lastVal.toFixed(1)}%`
            : metricMode === 'cumulative_cr'
            ? `₹${lastVal.toFixed(1)}Cr`
            : `${lastVal}L`;

        labelGroup
          .append('text')
          .attr('x', 6)
          .attr('y', 3.5)
          .attr('fill', isHovered ? '#ffffff' : '#1e293b')
          .attr('font-size', '10px')
          .attr('font-weight', '700')
          .text(`${s.name}`);

        labelGroup
          .append('text')
          .attr('x', 108)
          .attr('y', 3.5)
          .attr('text-anchor', 'end')
          .attr('fill', isHovered ? '#ffffff' : s.color)
          .attr('font-size', '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .text(formattedValStr);
      });

      // 6. D3 Bottom Axis (Months)
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(12)
        .tickFormat((d: any) => d3.timeFormat('%b %y')(d));

      const xAxisG = g
        .append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      xAxisG.select('.domain').attr('stroke', '#cbd5e1');
      xAxisG
        .selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('dy', '12px');
      xAxisG.selectAll('.tick line').attr('stroke', '#cbd5e1').attr('y2', 6);

      // 7. D3 Left Axis
      const yAxis = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat((d: any) => {
          if (metricMode === 'utilization_rate') return `${d}%`;
          if (metricMode === 'cumulative_cr') return `₹${d}Cr`;
          return `${d}L`;
        });

      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').attr('stroke', '#cbd5e1');
      yAxisG
        .selectAll('.tick text')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('dx', '-6px');
      yAxisG.selectAll('.tick line').attr('stroke', '#cbd5e1');

      // 8. Interactive Mouse Crosshair Tracker with bisector
      const bisectDate = d3.bisector((d: any) => d.date).left;

      // Group for crosshair guide line and hover indicators
      const hoverGuideG = g.append('g').attr('class', 'hover-guide').style('display', 'none');

      const crosshairLine = hoverGuideG
        .append('line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#475569')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');

      // Active dots container
      const hoverDotsG = hoverGuideG.append('g');

      // Transparent interactive overlay rect
      svg
        .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'crosshair')
        .on('pointerenter', () => hoverGuideG.style('display', null))
        .on('pointerleave', () => {
          hoverGuideG.style('display', 'none');
          setHoverInfo(null);
        })
        .on('pointermove', (event: PointerEvent) => {
          const [xm] = d3.pointer(event, g.node() as SVGGElement);
          const x0 = xScale.invert(xm);
          const sampleSeries = activeSeries[0]?.monthlyData || [];
          const idx = bisectDate(sampleSeries, x0, 1);
          const d0 = sampleSeries[idx - 1];
          const d1 = sampleSeries[idx];
          let chosenIndex = idx;

          if (d0 && d1) {
            chosenIndex =
              x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()
                ? idx
                : idx - 1;
          } else if (d0) {
            chosenIndex = idx - 1;
          }

          chosenIndex = Math.max(0, Math.min(sampleSeries.length - 1, chosenIndex));
          const currentPointDate = sampleSeries[chosenIndex]?.date;
          if (!currentPointDate) return;

          const cx = xScale(currentPointDate);
          crosshairLine.attr('x1', cx).attr('x2', cx);

          // Update highlighted circles at this month
          hoverDotsG.selectAll('*').remove();

          const itemsForTooltip: HoverInfo['items'] = [];

          activeSeries.forEach((s) => {
            const pt = s.monthlyData[chosenIndex];
            if (!pt) return;
            const cy = yScale(getMetricValue(pt));

            hoverDotsG
              .append('circle')
              .attr('cx', cx)
              .attr('cy', cy)
              .attr('r', 6)
              .attr('fill', s.color)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 2.5)
              .attr('filter', 'url(#dot-shadow)');

            const val = getMetricValue(pt);
            const prevVal =
              chosenIndex > 0 ? getMetricValue(s.monthlyData[chosenIndex - 1]) : val;
            const delta = Math.round((val - prevVal) * 10) / 10;

            const formatted =
              metricMode === 'utilization_rate'
                ? `${val.toFixed(1)}%`
                : metricMode === 'cumulative_cr'
                ? `₹${val.toFixed(2)} Cr`
                : `₹${val} Lakhs`;

            itemsForTooltip.push({
              constituency: s,
              value: val,
              formattedValue: formatted,
              prevDelta: delta,
            });
          });

          // Sort items by value descending
          itemsForTooltip.sort((a, b) => b.value - a.value);

          setHoverInfo({
            monthIndex: chosenIndex,
            monthLabel: sampleSeries[chosenIndex].monthLabel,
            fullMonth: sampleSeries[chosenIndex].fullMonth,
            xPos: cx + margin.left,
            items: itemsForTooltip,
          });
        });
    };

    renderChart();

    let lastWidth = container.clientWidth;
    let rafId: number | null = null;

    const resizeObserver = new ResizeObserver(() => {
      const currentWidth = container.clientWidth;
      if (Math.abs(currentWidth - lastWidth) <= 2) return;
      lastWidth = currentWidth;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        renderChart();
      });
    });

    resizeObserver.observe(container);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
    };
  }, [activeSeries, metricMode, showBenchmark, showAreaFill, hoveredSeriesId]);

  // Derived Performance Summary Stats for Selected Constituencies
  const summaryStats = useMemo(() => {
    if (activeSeries.length === 0) return null;

    const sortedByRate = [...activeSeries].sort(
      (a, b) => b.currentUtilizationRate - a.currentUtilizationRate
    );
    const sortedByGrowth = [...activeSeries].sort(
      (a, b) => b.netGrowthPctPoints - a.netGrowthPctPoints
    );

    const leader = sortedByRate[0];
    const lagger = sortedByRate[sortedByRate.length - 1];
    const fastestGrower = sortedByGrowth[0];

    const avgRate = Math.round(
      activeSeries.reduce((acc, s) => acc + s.currentUtilizationRate, 0) / activeSeries.length
    );

    const totalUtilizedCr = Math.round(
      activeSeries.reduce((acc, s) => {
        const last = s.monthlyData[s.monthlyData.length - 1];
        return acc + last.cumulativeUtilizedCr;
      }, 0) * 10
    ) / 10;

    const totalSanctionedCr = Math.round(
      activeSeries.reduce((acc, s) => acc + s.totalSanctionedCr, 0) * 10
    ) / 10;

    return {
      leader,
      lagger,
      fastestGrower,
      avgRate,
      totalUtilizedCr,
      totalSanctionedCr,
    };
  }, [activeSeries]);

  return (
    <div
      id="constituency-utilization-d3-card"
      className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4"
    >
      {/* Card Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Constituency Fund Utilization Dynamics (D3.js 12-Month Trajectory)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  FY 2025–26
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Multi-constituency comparative expenditure curves with D3 interactive crosshair inspection &amp; MoSPI statutory thresholds.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector & Display Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setMetricMode('utilization_rate')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                metricMode === 'utilization_rate'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View as percentage of released funds spent"
            >
              Utilization Rate (%)
            </button>
            <button
              onClick={() => setMetricMode('cumulative_cr')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                metricMode === 'cumulative_cr'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View cumulative utilized capital in ₹ Crore"
            >
              Cumulative (₹ Cr)
            </button>
            <button
              onClick={() => setMetricMode('monthly_lakhs')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                metricMode === 'monthly_lakhs'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View month-by-month drawdowns in ₹ Lakhs"
            >
              Monthly Draw (₹ L)
            </button>
          </div>

          {/* Benchmark & Area Toggles */}
          {metricMode === 'utilization_rate' && (
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                showBenchmark
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle MoSPI statutory benchmark & national average line"
            >
              <ShieldCheck size={12} />
              <span>MoSPI Target (75%)</span>
            </button>
          )}

          <button
            onClick={() => setShowAreaFill(!showAreaFill)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
              showAreaFill
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle gradient area fills"
          >
            <Layers size={12} />
            <span>Gradient Fills</span>
          </button>
        </div>
      </div>

      {/* Quick Preset Selector & Multi-Constituency Filter Pills */}
      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <SlidersHorizontal size={13} className="text-slate-500" />
            <span>Select Parliamentary Constituencies ({selectedIds.length}/{CONSTITUENCY_TREND_SERIES.length}):</span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium">Presets:</span>
            <button
              onClick={() => applyPreset('metros')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
            >
              Metros
            </button>
            <button
              onClick={() => applyPreset('high_growth')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
            >
              High Growth (&gt;40pts)
            </button>
            <button
              onClick={() => applyPreset('lagging')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
            >
              Lagging (&lt;65%)
            </button>
            <button
              onClick={() => applyPreset('all')}
              className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => applyPreset('default')}
              className="px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
              title="Reset to default selection"
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Constituency Selection Badges */}
        <div className="flex flex-wrap gap-1.5">
          {CONSTITUENCY_TREND_SERIES.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleConstituency(s.id)}
                onMouseEnter={() => isSelected && setHoveredSeriesId(s.id)}
                onMouseLeave={() => setHoveredSeriesId(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white shadow-2xs font-semibold text-slate-800'
                    : 'bg-slate-100/70 border-slate-200/60 text-slate-500 hover:bg-slate-200/60'
                }`}
                style={{
                  borderColor: isSelected ? s.color : undefined,
                  borderLeftWidth: isSelected ? '3px' : '1px',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color, opacity: isSelected ? 1 : 0.4 }}
                />
                <span>{s.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {s.currentUtilizationRate}%
                </span>
                {isSelected && <Check size={11} className="text-slate-500 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* D3 Canvas Container & Interactive Floating Tooltip */}
      <div className="relative" ref={containerRef}>
        <svg
          ref={svgRef}
          className="w-full h-auto select-none overflow-visible"
          style={{ minHeight: '340px' }}
        />

        {/* Rich D3 Interactive Hover Tooltip */}
        {hoverInfo && (
          <div
            className="absolute top-2 z-20 pointer-events-none transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(hoverInfo.xPos - 110, 10),
                (containerRef.current?.clientWidth || 700) - 240
              )}px`,
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-sm text-white rounded-xl p-3 shadow-xl border border-slate-700/80 text-xs w-[220px] space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span>{hoverInfo.fullMonth}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Month {hoverInfo.monthIndex + 1}/12
                </span>
              </div>

              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-0.5">
                {hoverInfo.items.map((item) => (
                  <div
                    key={item.constituency.id}
                    className="flex items-center justify-between gap-1 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.constituency.color }}
                      />
                      <span className="truncate text-slate-200 font-medium">
                        {item.constituency.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      <span className="font-mono font-bold text-white">
                        {item.formattedValue}
                      </span>
                      {metricMode === 'utilization_rate' && item.prevDelta !== 0 && (
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            item.prevDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.prevDelta > 0 ? `+${item.prevDelta}%` : `${item.prevDelta}%`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {metricMode === 'utilization_rate' && showBenchmark && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>National Target</span>
                  <span className="font-mono font-semibold text-slate-300">
                    {NATIONAL_BENCHMARK_RATES[hoverInfo.monthIndex]?.rate}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparative Key Metrics Strip */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Top Performer (Utilization)
            </span>
            <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: summaryStats.leader.color }}
              />
              <span className="truncate">{summaryStats.leader.name}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-emerald-600 mt-0.5">
              {summaryStats.leader.currentUtilizationRate}% Expended
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Fastest 12M Acceleration
            </span>
            <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: summaryStats.fastestGrower.color }}
              />
              <span className="truncate">{summaryStats.fastestGrower.name}</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-indigo-600 mt-0.5">
              +{summaryStats.fastestGrower.netGrowthPctPoints} pts Gain
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Average of Selected
            </span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              {summaryStats.avgRate}%
            </div>
            <div className="text-[10px] text-slate-500">
              vs 80.0% MoSPI National Target
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Funds Absorbed
            </span>
            <div className="text-base font-black text-slate-900 mt-0.5">
              ₹{summaryStats.totalUtilizedCr} Cr
            </div>
            <div className="text-[10px] text-slate-500">
              of ₹{summaryStats.totalSanctionedCr} Cr Sanctioned
            </div>
          </div>
        </div>
      )}

      {/* Collapsible 12-Month Audit Trail Progression Table */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowDataTable(!showDataTable)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <TableIcon size={13} />
          <span>{showDataTable ? 'Hide 12-Month Data Matrix' : 'Inspect 12-Month Progression Data Table'}</span>
          {showDataTable ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showDataTable && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 text-xs animate-in fade-in duration-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5 sticky left-0 bg-slate-100">Constituency</th>
                  <th className="p-2.5">State</th>
                  <th className="p-2.5 text-right">Sanctioned</th>
                  {TREND_MONTHS_LABELS.map((m) => (
                    <th key={m} className="p-2 text-right font-mono text-[10px]">
                      {m}
                    </th>
                  ))}
                  <th className="p-2.5 text-right font-bold text-slate-900">12M Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSeries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 sticky left-0 bg-white shadow-xs flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span>{s.name}</span>
                    </td>
                    <td className="p-2.5 text-slate-600">{s.state}</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">
                      ₹{s.totalSanctionedCr} Cr
                    </td>
                    {s.monthlyData.map((d) => (
                      <td
                        key={d.monthIndex}
                        className={`p-2 text-right font-mono text-[10px] ${
                          d.utilizationRate >= 75
                            ? 'text-emerald-700 font-bold'
                            : d.utilizationRate < 50
                            ? 'text-slate-500'
                            : 'text-slate-800'
                        }`}
                      >
                        {d.utilizationRate}%
                      </td>
                    ))}
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                      +{s.netGrowthPctPoints} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
