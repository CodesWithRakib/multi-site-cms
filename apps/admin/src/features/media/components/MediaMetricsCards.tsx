'use client';

import React from 'react';
import { Image as ImageIcon, HardDrive, FileText } from 'lucide-react';
import type { MediaStats } from '../types';

interface MediaMetricsCardsProps {
  stats: MediaStats;
}

export function MediaMetricsCards({ stats }: MediaMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Assets */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
            <ImageIcon className="size-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Assets
          </div>
        </div>
        <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
          <path d="M0 35 Q 25 10, 50 25 T 100 5" fill="none" stroke="#3b82f6" strokeWidth="3" />
        </svg>
      </div>

      {/* Card 2: Storage Used */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
            <HardDrive className="size-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Storage
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.storageFormatted}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Storage Used
          </div>
        </div>
        <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
          <path d="M0 30 Q 30 5, 60 20 T 100 8" fill="none" stroke="#00e599" strokeWidth="3" />
        </svg>
      </div>

      {/* Card 3: Images & Photos */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <ImageIcon className="size-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            WebP/JPG
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.images}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Images & Photos
          </div>
        </div>
        <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
          <path d="M0 38 Q 35 15, 70 25 T 100 12" fill="none" stroke="#f59e0b" strokeWidth="3" />
        </svg>
      </div>

      {/* Card 4: Documents & Other */}
      <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="size-11 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center">
            <FileText className="size-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
            PDF/Media
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.docsAndOther}
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Documents & Other
          </div>
        </div>
        <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
          <path d="M0 25 Q 20 35, 60 10 T 100 15" fill="none" stroke="#a855f7" strokeWidth="3" />
        </svg>
      </div>
    </div>
  );
}

