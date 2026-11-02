import React from 'react';
import Image from 'next/image';
import { ArrowRight, Compass } from 'lucide-react';
import { PillButton } from '@/components/ui/PillButton';

export function PortalHeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl shadow-xl">
      {/* Background Photography */}
      <div className="relative h-72 sm:h-84 md:h-96 w-full">
        <Image
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85"
          alt="Panoramic mountain lake and explorer"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 80vw"
          className="object-cover object-center"
        />

        {/* Sophisticated Dark Gradient Wash for Typography Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20" />
      </div>

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 md:px-16 max-w-2xl text-white space-y-4 sm:space-y-5">
        {/* Tag Pill */}
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
          <Compass className="h-3.5 w-3.5 text-emerald-400" />
          <span>Welcome to Travel Blog</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15]">
          Explore the World <br />
          <span className="font-handwriting text-4xl sm:text-6xl md:text-7xl font-bold text-emerald-400 select-none">
            One Story at a Time
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-normal max-w-lg">
          Discover breathtaking destinations, get expert travel tips, and read inspiring travel
          stories.
        </p>

        {/* Action Button */}
        <div className="pt-1">
          <PillButton
            href="#blogs-grid"
            size="md"
            icon={<ArrowRight className="h-4 w-4" />}
            iconPosition="right"
            className="bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/40"
          >
            Explore Blogs
          </PillButton>
        </div>
      </div>
    </section>
  );
}

