'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Globe, Play, Sparkles, Star, Users, X } from 'lucide-react';
import { PillButton } from '@/components/ui';

export function TravelHero() {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section className="relative overflow-hidden pt-4 pb-6 sm:pt-6 sm:pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content Column */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 z-10 text-center lg:text-left">
          {/* Accent Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Explore More</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Discover the <br className="hidden sm:inline" />
            Beauty of the{' '}
            <span className="font-handwriting text-5xl sm:text-7xl lg:text-8xl text-emerald-500 font-bold italic select-none">
              World
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
            Travel stories, destination guides and unforgettable experiences from around the globe.
            Plan your next journey with considered field notes and expert insights.
          </p>

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <PillButton
              href="#destinations"
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
            >
              Start Exploring
            </PillButton>

            <button
              type="button"
              onClick={() => setVideoModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 text-base font-semibold rounded-full border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md text-neutral-800 dark:text-neutral-100 hover:bg-white dark:hover:bg-neutral-900 transition-all cursor-pointer shadow-2xs group"
            >
              <div className="h-7 w-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </div>
              <span>Watch Video</span>
            </button>
          </div>

          {/* Trust Social Proof Badges */}
          <div className="pt-6 border-t border-neutral-200/80 dark:border-neutral-800/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-neutral-900 dark:text-white leading-tight">100+</p>
                <p className="text-[11px] text-muted-foreground font-medium">Destinations</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-neutral-900 dark:text-white leading-tight">500K+</p>
                <p className="text-[11px] text-muted-foreground font-medium">Travelers</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="h-4 w-4 fill-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-neutral-900 dark:text-white leading-tight">4.9</p>
                <p className="text-[11px] text-muted-foreground font-medium">User Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Visual Image Column */}
        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-4/3 sm:aspect-5/4">
            <Image
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85"
              alt="Backpacker gazing across pristine alpine lake and peaks"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Subtle Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

            {/* Floating Decorative Badge */}
            <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-white/50 dark:border-neutral-800/80 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  📍
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">Swiss Alpine Glaciers</p>
                  <p className="text-[11px] text-muted-foreground">Most Visited Destination 2026</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-2xs">
                Featured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Experience Travel Blog Cinematic Journey</h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 flex items-center justify-center text-center p-6 text-neutral-400">
              <p className="text-sm">
                Cinematic destination showreel is ready. Connect your YouTube or Vimeo travel playlist anytime.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

