'use client';

import React, { useState } from 'react';
import { CheckCircle2, RotateCw, Send } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/api';

export function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const result = await subscribeNewsletter(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setStatus({ type: 'success', message: result.message });
      setEmail('');
    } else {
      setStatus({ type: 'error', message: result.message });
    }
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-100/80 via-teal-50/60 to-emerald-100/80 dark:from-emerald-950/40 dark:via-neutral-900/80 dark:to-teal-950/40 p-8 sm:p-12 shadow-sm"
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Info Column */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 max-w-xl">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Send className="h-7 w-7 rotate-45 ml-1" />
          </div>

          <div className="space-y-1">
            <h2
              id="newsletter-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white"
            >
              Get Travel Inspiration
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 font-normal">
              Join our newsletter and never miss a travel story, guide, or curated itinerary again.
            </p>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="w-full lg:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center rounded-full p-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-4 pr-2 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send className="h-3.5 w-3.5 rotate-45 ml-0.5" />
                  </>
                )}
              </button>
            </div>

            {status && (
              <p
                className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  status.type === 'success'
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                    : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                }`}
              >
                {status.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                <span>{status.message}</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
