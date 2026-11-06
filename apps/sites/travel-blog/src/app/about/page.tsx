import type { Metadata } from 'next';
import Image from 'next/image';
import { Compass, Globe, Shield, Sparkles } from 'lucide-react';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'About Us — Travel Blog',
  description:
    'Considered, independent travel reporting, practical field guides, and immersive photojournalism.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Editorial Hero */}
      <header className="max-w-3xl space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" /> Our Mission & Manifesto
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
          Considered, independent <br />
          <span className="font-handwriting text-emerald-500 dark:text-emerald-400 text-4xl sm:text-6xl font-bold">
            travel reporting.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {siteConfig.name} was founded to provide practical, deeply researched itineraries and
          authentic travel storytelling designed to be useful years after publication.
        </p>
      </header>

      {/* Hero Visual Card */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl bg-muted shadow-lg">
        <Image
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85"
          alt="Expansive mountain range"
          fill
          preload
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 text-white max-w-lg space-y-1">
          <p className="font-handwriting text-2xl sm:text-3xl font-bold text-emerald-300">
            Field Dispatches from Every Continent
          </p>
          <p className="text-xs sm:text-sm text-neutral-200">
            From the high alpine glaciers of Switzerland to the tranquil temples of Kyoto.
          </p>
        </div>
      </div>

      {/* Editorial Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Depth Over Clicks</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We spend weeks researching on the ground to build detailed, field-tested guides with
            practical transit, budget, and cultural insights.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Globe className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Local Respect & Nuance</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Human-scale travel journalism grounded in local communities, respecting indigenous
            histories and environmental realities.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Authentic Visuals</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            No synthetic distortion or heavily manipulated photos. Just genuine moments captured by
            explorers in natural light.
          </p>
        </div>
      </section>

      {/* Founder Spotlight */}
      <section className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative h-44 w-44 sm:h-56 sm:w-56 overflow-hidden rounded-3xl ring-4 ring-emerald-500/20 shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                alt="Rakib Islam"
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Founder & Lead Explorer
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-foreground">
                Rakib Islam
              </h2>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              &ldquo;Travel has always been more than sightseeing—it is an exercise in empathy and
              discovery. Our goal with this platform is to give curious wanderers the confidence to
              step off the beaten track and connect authentically with the world.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterBanner />
    </div>
  );
}
