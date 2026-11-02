import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PillButton } from '@/components/ui/PillButton';

const CHECKLIST = [
  'Professional Instructors',
  'Top-Notch Safety Standards',
  'Breathtaking Alpine Locations',
  'Unforgettable Flight Memories',
];

export function FlyHigherBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Scenic Thumbnail */}
          <div className="lg:col-span-4 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-square w-full overflow-hidden rounded-2xl bg-muted">
            <Image
              src="https://images.unsplash.com/photo-1741619143496-7d81260df3bf?auto=format&fit=crop&w=800&q=80"
              alt="Glider soaring peacefully over mountain ridges at sunset"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
              Sunset Over Dolomite Ridges
            </div>
          </div>

          {/* Middle: Value Proposition & Checklist */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Why Choose Our Air Sports?
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Fly Higher, Live Better
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Our air sports experiences are designed for adventure seekers, with top safety
              standards, certified instructors, and unforgettable flight moments.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs font-semibold text-foreground/90">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Metrics & CTA */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center gap-5 border-t lg:border-t-0 lg:border-l border-border/80 pt-6 lg:pt-0 lg:pl-8 text-center lg:text-right">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground">50K+</p>
              <p className="text-xs text-muted-foreground font-medium">Happy Adventurers</p>
              <div className="flex items-center justify-center lg:justify-end -space-x-2 pt-2">
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
                ].map((src, idx) => (
                  <div
                    key={src}
                    className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-background"
                  >
                    <Image
                      src={src}
                      alt={`Adventurer ${idx + 1}`}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <PillButton
              href="#activities"
              size="md"
              icon={<ArrowRight className="h-4 w-4" />}
              iconPosition="right"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
            >
              Start Your Adventure
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}
