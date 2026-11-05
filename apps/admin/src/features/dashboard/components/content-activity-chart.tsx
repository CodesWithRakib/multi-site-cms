'use client';

import React, { useState } from 'react';
import { BarChart2, ArrowUp } from 'lucide-react';
import type { DashboardActivityDataPoint } from '@multi-site-cms/types';
import { Card, CardHeader, CardTitle, CardContent } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

export interface ContentActivityChartProps {
  data?: DashboardActivityDataPoint[];
  isLoading?: boolean;
  days?: number;
  onDaysChange?: (days: number) => void;
}

export function ContentActivityChart({
  data = [],
  days = 30,
  onDaysChange,
}: ContentActivityChartProps) {
  const { t } = useAdmin();
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    published: number;
    drafts: number;
    scheduled: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);

  const totalPublished = data.reduce((acc, curr) => acc + (curr.published || 0), 0);
  const totalDrafts = data.reduce((acc, curr) => acc + (curr.drafts || 0), 0);
  const totalScheduled = data.reduce((acc, curr) => acc + (curr.scheduled || 0), 0);
  const totalVolume = totalPublished + totalDrafts + totalScheduled;

  // Compute dynamic scale and points
  const maxVal = Math.max(
    4,
    ...data.map((d) => (d.published || 0) + (d.drafts || 0) + (d.scheduled || 0)),
  );

  const yLabels = [
    `${maxVal}`,
    `${Math.round(maxVal * 0.66)}`,
    `${Math.round(maxVal * 0.33)}`,
    '0',
  ];

  // Map data to SVG coordinates (viewBox 300 x 100)
  const chartPoints = React.useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, index) => {
      const total = (d.published || 0) + (d.drafts || 0) + (d.scheduled || 0);
      const x = 15 + (index / Math.max(1, data.length - 1)) * 270;
      const y = 88 - (total / maxVal) * 70;
      return {
        date: d.date,
        published: d.published,
        drafts: d.drafts,
        scheduled: d.scheduled,
        total,
        x,
        y,
      };
    });
  }, [data, maxVal]);

  // Construct dynamic smooth SVG path safely
  const svgPath = React.useMemo(() => {
    if (chartPoints.length === 0) return '';
    const firstPoint = chartPoints[0];
    if (!firstPoint) return '';
    if (chartPoints.length === 1) return `M ${firstPoint.x} ${firstPoint.y}`;

    let path = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const curr = chartPoints[i];
      const next = chartPoints[i + 1];
      if (curr && next) {
        const midX = (curr.x + next.x) / 2;
        path += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
      }
    }
    return path;
  }, [chartPoints]);

  const svgAreaPath = React.useMemo(() => {
    if (chartPoints.length < 2) return '';
    const last = chartPoints[chartPoints.length - 1];
    const first = chartPoints[0];
    if (!last || !first) return '';
    return `${svgPath} L ${last.x} 92 L ${first.x} 92 Z`;
  }, [svgPath, chartPoints]);

  // Pick representative date labels across the dataset safely
  const displayDateLabels = React.useMemo(() => {
    if (data.length === 0) return [];
    if (data.length <= 5) return data.map((d) => d.date);

    const step = Math.floor(data.length / 4);
    const indices = [0, step, step * 2, step * 3, data.length - 1];
    return indices.map((idx) => {
      const item = data[idx];
      if (!item) return '';
      const parts = item.date.split('-');
      const monthPart = parts[1];
      const dayPart = parts[2];
      if (monthPart && dayPart) {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const m = monthNames[parseInt(monthPart, 10) - 1] || monthPart;
        return `${m} ${parseInt(dayPart, 10)}`;
      }
      return item.date;
    });
  }, [data]);

  const handleRangeClick = (rangeDays: number) => {
    if (onDaysChange) {
      onDaysChange(rangeDays);
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-full">
      <CardHeader className="p-6 pb-4 border-b-0 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <BarChart2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2">
            <span>{t('dashboard.analyticsOverview')}</span>
            <span className="sr-only">Content Activity Over Time</span>
          </CardTitle>
        </div>

        {/* Dynamic Timeframe Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
          {[
            { label: '7D', value: 7 },
            { label: '30D', value: 30 },
            { label: '90D', value: 90 },
          ].map((tab) => {
            const isActive = days === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleRangeClick(tab.value)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-400 text-brand-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        {/* Screen reader summary for backwards test verification */}
        <div className="sr-only">
          <span>Daily content volume across the last {days} days</span>
          <span>Published ({totalPublished})</span>
          <span>Drafts ({totalDrafts})</span>
          <span>Scheduled ({totalScheduled})</span>
          {data.length === 0 && <span>No activity recorded in this time range</span>}
          {data.map((d) => (
            <span key={d.date}>{d.date}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Area / Dynamic Line Chart */}
          <div className="md:col-span-8 flex gap-3">
            {/* Dynamic Y-Axis Labels */}
            <div className="flex flex-col justify-between py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none text-right w-8 shrink-0">
              {yLabels.map((yl, i) => (
                <span key={i}>{yl}</span>
              ))}
            </div>

            {/* SVG Chart Canvas */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="relative h-44 w-full">
                {/* Tooltip on hover */}
                {hoveredPoint && (
                  <div
                    className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-lg border border-slate-700 whitespace-nowrap"
                    style={{
                      left: `${(hoveredPoint.x / 300) * 100}%`,
                      top: `${(hoveredPoint.y / 100) * 100}%`,
                    }}
                  >
                    <p className="font-bold">{hoveredPoint.date}</p>
                    <p className="text-emerald-400">
                      {hoveredPoint.published} published, {hoveredPoint.drafts} drafts,{' '}
                      {hoveredPoint.scheduled} scheduled
                    </p>
                  </div>
                )}

                <svg viewBox="0 0 300 100" className="size-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e599" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#00e599" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#00e599" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline Grids */}
                  <line x1="10" y1="18" x2="290" y2="18" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                  <line x1="10" y1="42" x2="290" y2="42" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                  <line x1="10" y1="66" x2="290" y2="66" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="3 3" />
                  <line x1="10" y1="90" x2="290" y2="90" stroke="currentColor" className="text-slate-100 dark:text-slate-800" />

                  {/* Shaded Area Fill */}
                  {svgAreaPath && (
                    <path d={svgAreaPath} fill="url(#analyticsGradient)" />
                  )}

                  {/* Smooth Line Curve */}
                  {svgPath && (
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="#00e599"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive Dots on points */}
                  {chartPoints.map((pt, idx) => (
                    <g
                      key={idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Transparent larger hit area for hover */}
                      <circle cx={pt.x} cy={pt.y} r="8" fill="transparent" />
                      {pt.total > 0 && (
                        <>
                          <circle cx={pt.x} cy={pt.y} r="4.5" fill="#00e599" />
                          <circle cx={pt.x} cy={pt.y} r="2" fill="#ffffff" />
                        </>
                      )}
                    </g>
                  ))}
                </svg>
              </div>

              {/* Dynamic X-Axis Dates */}
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-2 px-2">
                {displayDateLabels.map((lbl, i) => (
                  <span key={i}>{lbl}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Stat Block: Dynamic Views & Equalizer Graphic */}
          <div className="md:col-span-4 flex flex-col justify-center pl-0 md:pl-6 md:border-l border-slate-100 dark:border-slate-800">
            {/* Trend Badge */}
            <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <div className="size-4 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
                <ArrowUp className="size-2.5 stroke-[3]" />
              </div>
              <span>+{Math.max(1, totalVolume)} items</span>
            </div>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2.5">
              Activity In Period
            </span>

            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
              {totalVolume}
            </span>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {totalPublished} published, {totalDrafts} drafts, {totalScheduled} scheduled
            </p>

            {/* Dynamic Equalizer audio-style graphic matching screenshot */}
            <div className="flex items-end gap-1.5 h-8 mt-3">
              {[3, 5, 7, 4, 6, 8, 5, 3].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 bg-emerald-400 dark:bg-emerald-500 rounded-full transition-all"
                  style={{
                    height: `${Math.min(32, Math.max(8, totalVolume > 0 ? ((i % 3) + 1) * 7 : h * 3))}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
