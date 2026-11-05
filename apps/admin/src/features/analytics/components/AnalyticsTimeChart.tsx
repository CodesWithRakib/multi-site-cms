'use client';

import React, { useState, useMemo } from 'react';
import type { AnalyticsTimeseriesPoint } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface AnalyticsTimeChartProps {
  data: AnalyticsTimeseriesPoint[];
  isLoading?: boolean;
}

export function AnalyticsTimeChart({ data, isLoading }: AnalyticsTimeChartProps) {
  const { t } = useAdmin();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { pathViews, pathAreaViews, pathVisitors, pathAreaVisitors, coords } =
    useMemo(() => {
      if (!data || data.length === 0) {
        return {
          maxViews: 100,
          pathViews: '',
          pathAreaViews: '',
          pathVisitors: '',
          pathAreaVisitors: '',
          coords: [],
        };
      }

      const width = 800;
      const height = 260;
      const padding = { top: 20, right: 20, bottom: 40, left: 20 };
      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const max = Math.max(...data.map((d) => Math.max(d.pageViews, d.uniqueVisitors, 10))) * 1.15;
      const stepX = chartW / Math.max(data.length - 1, 1);

      const ptsViews: Array<{ x: number; y: number }> = [];
      const ptsVisitors: Array<{ x: number; y: number }> = [];

      data.forEach((d, i) => {
        const x = padding.left + i * stepX;
        const yViews = padding.top + chartH - (d.pageViews / max) * chartH;
        const yVisitors = padding.top + chartH - (d.uniqueVisitors / max) * chartH;
        ptsViews.push({ x, y: yViews });
        ptsVisitors.push({ x, y: yVisitors });
      });

      const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
        const first = pts[0];
        if (!first) return '';
        let str = `M ${first.x},${first.y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          if (!p0 || !p1) continue;
          const cpX = (p0.x + p1.x) / 2;
          str += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
        }
        return str;
      };

      const lineViews = buildSmoothPath(ptsViews);
      const lineVisitors = buildSmoothPath(ptsVisitors);

      const baseline = padding.top + chartH;
      const lastV = ptsViews[ptsViews.length - 1];
      const firstV = ptsViews[0];
      const areaViews =
        lastV && firstV
          ? `${lineViews} L ${lastV.x},${baseline} L ${firstV.x},${baseline} Z`
          : '';

      const lastVis = ptsVisitors[ptsVisitors.length - 1];
      const firstVis = ptsVisitors[0];
      const areaVisitors =
        lastVis && firstVis
          ? `${lineVisitors} L ${lastVis.x},${baseline} L ${firstVis.x},${baseline} Z`
          : '';

      const coordsList: Array<{
        x: number;
        yViews: number;
        yVisitors: number;
        date: string;
        pageViews: number;
        uniqueVisitors: number;
        avgDurationSeconds: number;
      }> = [];

      ptsViews.forEach((pv, i) => {
        const visPt = ptsVisitors[i];
        const d = data[i];
        if (visPt && d) {
          coordsList.push({
            x: pv.x,
            yViews: pv.y,
            yVisitors: visPt.y,
            date: d.date,
            pageViews: d.pageViews,
            uniqueVisitors: d.uniqueVisitors,
            avgDurationSeconds: d.avgDurationSeconds,
          });
        }
      });

      return {
        maxViews: Math.round(max),
        pathViews: lineViews,
        pathAreaViews: areaViews,
        pathVisitors: lineVisitors,
        pathAreaVisitors: areaVisitors,
        coords: coordsList,
      };
    }, [data]);

  const activePoint = hoveredIndex !== null ? coords[hoveredIndex] : null;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('analytics.trafficOverview')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('analytics.viewsAndVisitors')}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300">
              {t('analytics.totalPageViews')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-sky-500 shadow-xs" />
            <span className="text-slate-700 dark:text-slate-300">
              {t('analytics.uniqueVisitors')}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart area */}
      <div className="relative w-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="size-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        )}

        <svg
          viewBox="0 0 800 260"
          className="w-full h-64 overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="40" x2="780" y2="40" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="4 4" />
          <line x1="20" y1="105" x2="780" y2="105" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="4 4" />
          <line x1="20" y1="170" x2="780" y2="170" stroke="#94a3b8" strokeOpacity="0.15" strokeDasharray="4 4" />
          <line x1="20" y1="235" x2="780" y2="235" stroke="#94a3b8" strokeOpacity="0.25" />

          {/* Area Fills */}
          <path d={pathAreaViews} fill="url(#viewsGrad)" />
          <path d={pathAreaVisitors} fill="url(#visitorsGrad)" />

          {/* Stroke Lines */}
          <path
            d={pathViews}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathVisitors}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive hover guides and markers */}
          {coords.map((c, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={c.x - 12}
                y="10"
                width="24"
                height="230"
                fill="transparent"
              />
              {hoveredIndex === i && (
                <>
                  <line
                    x1={c.x}
                    y1="20"
                    x2={c.x}
                    y2="235"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                  <circle cx={c.x} cy={c.yViews} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx={c.x} cy={c.yVisitors} r="4" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
                </>
              )}
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && (
          <div
            className="absolute -top-2 pointer-events-none z-20 px-3 py-2 rounded-xl bg-slate-900/95 text-white text-[11px] font-medium shadow-xl border border-slate-700/80 -translate-x-1/2 transition-all backdrop-blur-xs"
            style={{ left: `${(activePoint.x / 800) * 100}%` }}
          >
            <div className="text-slate-500 dark:text-slate-400 font-bold mb-1">{activePoint.date}</div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span>{t('analytics.views')}:</span>
              <strong className="font-bold text-white">{activePoint.pageViews}</strong>
            </div>
            <div className="flex items-center gap-2 text-sky-400">
              <span>{t('analytics.uniqueVisitors')}:</span>
              <strong className="font-bold text-white">{activePoint.uniqueVisitors}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

