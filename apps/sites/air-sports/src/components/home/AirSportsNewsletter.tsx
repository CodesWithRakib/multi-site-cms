'use client';

import React, { useState, type FormEvent } from 'react';
import { Check, Loader2, Send } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/api';

export function AirSportsNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error');
      setFeedback('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    const res = await subscribeNewsletter(trimmed);
    if (res.success) {
      setStatus('success');
      setFeedback('Subscribed! Prepare for flight updates in your inbox.');
      setEmail('');
    } else {
      setStatus('error');
      setFeedback(res.message);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" id="newsletter">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 p-8 sm:p-12 text-white shadow-xl">
        {/* Subtle decorative flight trails background */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <svg
            viewBox="0 0 1000 300"
            fill="none"
            className="h-full w-full object-cover"
            preserveAspectRatio="none"
          >
            <path
              d="M0 150 C 300 50, 700 250, 1000 150"
              stroke="white"
              strokeWidth="6"
              strokeDasharray="12 12"
            />
            <path
              d="M0 220 C 400 120, 600 280, 1000 180"
              stroke="white"
              strokeWidth="4"
              strokeDasharray="8 8"
            />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
              <Send className="h-3.5 w-3.5" />
              <span>Stay In The Flight Loop</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight">
              Get Flight Inspiration
            </h2>
            <p className="text-sm sm:text-base text-sky-100 max-w-lg leading-relaxed">
              Subscribe to our newsletter for the latest flight tips, world cup dispatches, and air
              sports adventures.
            </p>
          </div>

          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="relative flex items-center">
                <input
                  id="airsports-newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={status === 'loading' || status === 'success'}
                  required
                  aria-label="Email address for flight newsletter"
                  className="w-full rounded-full border border-white/20 bg-white/95 px-5 py-3.5 pr-32 text-sm text-neutral-900 placeholder:text-neutral-500 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="absolute right-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-500 hover:scale-105 active:scale-95 disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : status === 'success' ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <Send className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>

              {feedback && (
                <p
                  className={`text-xs ${
                    status === 'success' ? 'text-emerald-200' : 'text-rose-200'
                  }`}
                  role="status"
                >
                  {feedback}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

