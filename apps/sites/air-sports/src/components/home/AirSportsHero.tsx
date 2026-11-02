'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Headphones,
  Mountain,
  Play,
  ShieldCheck,
  Sparkles,
  Wind,
  X,
} from 'lucide-react';
import { PillButton } from '@/components/ui/PillButton';

const FEATURE_PILLS = [
  {
    icon: Wind,
    title: 'Multiple Activities',
    desc: 'Paragliding, Skydiving & More',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & Certified',
    desc: 'Professional Services & Gear',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Mountain,
    title: 'Stunning Locations',
    desc: 'Worldwide Mountain Flights',
    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  },
  {
    icon: Headphones,
    title: 'Expert Guides',
    desc: 'Fly with Top Confidence',
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  },
];

export function AirSportsHero() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3.5 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                <span>Feel the Freedom</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Air Sports <br />
                Adventure in the{' '}
                <span className="font-handwriting text-5xl sm:text-7xl lg:text-8xl text-emerald-500 font-bold italic select-none">
                  Sky
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
                Experience the thrill of air sports — from paragliding over alpine ridges to
                high-altitude skydiving, and feel the ultimate freedom above the clouds.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <PillButton
                  href="#activities"
                  size="lg"
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="right"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                >
                  Explore Air Sports
                </PillButton>

                <button
                  type="button"
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-base font-semibold rounded-full border border-border bg-card/80 backdrop-blur-md text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  </div>
                  <span>Watch Video</span>
                </button>
              </div>
            </div>

            {/* Right Column: Hero Skydiver Photography */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-3xl border border-border/80 bg-muted shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1483301563007-8d0161daa1d0?auto=format&fit=crop&w=1200&q=85"
                  alt="Skydiver soaring freely over high snow-capped mountain peaks"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-black/60 p-3.5 backdrop-blur-md text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-white">
                      <Wind className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">Swiss Alps Drop Zone</p>
                      <p className="text-[10px] text-sky-200">Terminal Velocity 12,000 FT</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Live Dispatch
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Feature Badges Bar */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURE_PILLS.map((pill) => {
              const Icon = pill.icon;
              return (
                <div
                  key={pill.title}
                  className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition hover:border-sky-500/40 hover:shadow-sm"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${pill.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{pill.title}</h4>
                    <p className="text-[11px] text-muted-foreground">{pill.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-neutral-900 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setVideoModalOpen(false)}
              aria-label="Close video modal"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/Wd_n2gZq2c0?autoplay=1"
                title="Air Sports Freefall"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
