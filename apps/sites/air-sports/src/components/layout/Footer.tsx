import React from 'react';
import Link from 'next/link';
import { Activity, Radio, ShieldCheck } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Brand Info */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Radio className="size-4" />
              </div>
              <span className="text-base font-black uppercase tracking-tight text-white">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm font-sans">
              {siteConfig.description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-stone-400">
              <Activity className="size-3.5 text-emerald-500" />
              <span>Real-Time Broadcast Frequency · Active Telemetry</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-3">
              Coverage
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Live Radar Feed
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-primary transition-colors">
                  Championship Events
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary transition-colors">
                  Aviation Disciplines
                </Link>
              </li>
              <li>
                <Link href="/tags" className="hover:text-primary transition-colors">
                  Tags & Taxonomy
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary transition-colors">
                  Search Archives
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-3">
              Editorial Policy
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed font-sans mb-3">
              Dispatches and weather telemetries are published through the centralized multi-site
              editorial desk with cryptographic verification and outbox delivery.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>Independent Publication · Authoritative Content</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-400">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Powered by Multi-Site CMS Architecture</p>
        </div>
      </div>
    </footer>
  );
}
