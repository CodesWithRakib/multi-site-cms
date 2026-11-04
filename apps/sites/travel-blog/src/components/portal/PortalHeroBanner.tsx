'use client';

import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export function PortalHeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background p-6 sm:p-10 lg:p-12">
      <div className="relative z-10 max-w-3xl space-y-4">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          <span>The Explorer Journal</span>
          <span className="text-emerald-500">•</span>
          <span>Field Notes & Guides</span>
        </div>

        {/* Editorial Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.15]">
          Curated Travel Stories &amp;{' '}
          <span className="font-handwriting text-4xl sm:text-6xl text-emerald-600 dark:text-emerald-400 font-bold italic select-none">
            Adventures
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
          Dive into authentic firsthand itineraries, practical dispatch notes, cultural highlights,
          and hidden trails curated by passionate travelers worldwide.
        </p>
      </div>

      {/* Decorative Atmosphere Elements */}
      <div className="pointer-events-none absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute right-12 top-6 opacity-10 dark:opacity-20 hidden md:block">
        <Compass className="h-36 w-36 text-emerald-600" />
      </div>
    </section>
  );
}
