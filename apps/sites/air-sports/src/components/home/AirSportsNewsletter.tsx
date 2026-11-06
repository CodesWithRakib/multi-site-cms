import { Send } from 'lucide-react';

import { NewsletterForm } from './NewsletterForm';

/** Dark "flight loop" banner: icon tile + pitch on the left, signup pill on the right. */
export function AirSportsNewsletter() {
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="dark relative isolate overflow-hidden rounded-3xl bg-linear-to-r from-brand-950 via-brand-900 to-brand-700 p-6 text-white [color-scheme:dark] sm:p-10">
        {/* Sky backdrop: glow, contrail and mountain ridge. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-400/25 blur-3xl" />
          <svg
            viewBox="0 0 1000 300"
            preserveAspectRatio="none"
            fill="none"
            className="absolute inset-0 size-full"
          >
            <path
              d="M560 90 C 700 40, 850 70, 1000 20"
              stroke="white"
              strokeOpacity="0.45"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M0 300V250L120 200L230 240L360 170L480 235L620 160L760 230L880 180L1000 235V300H0Z"
              fill="white"
              fillOpacity="0.06"
            />
            <path
              d="M0 300V275L160 240L300 275L470 225L640 275L800 235L1000 280V300H0Z"
              fill="white"
              fillOpacity="0.08"
            />
          </svg>
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-10">
          <div className="flex items-start gap-5">
            <span className="hidden size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur sm:flex">
              <Send aria-hidden="true" className="size-7 text-brand-200" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/75">
                Stay in the flight loop
              </p>
              <h2
                id="newsletter-heading"
                className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                Get Flight Inspiration
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                New guides, event dates and safety notes from the Bangladesh sky, straight to your
                inbox.
              </p>
            </div>
          </div>

          <NewsletterForm variant="pill" />
        </div>
      </div>
    </section>
  );
}
