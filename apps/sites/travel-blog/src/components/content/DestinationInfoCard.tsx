import React from 'react';
import { Calendar, DollarSign, Globe, Mountain, MapPin, Sparkles } from 'lucide-react';

export interface DestinationInfoCardProps {
  destination?: string;
  country?: string;
  region?: string;
  bestSeason?: string;
  currency?: string;
  language?: string;
  elevation?: string;
  highlights?: string[];
}

export function DestinationInfoCard({
  destination = 'Destination Overview',
  country,
  region,
  bestSeason,
  currency,
  language,
  elevation,
  highlights = [],
}: DestinationInfoCardProps) {
  const locationSubtitle = [region, country].filter(Boolean).join(', ');

  return (
    <aside className="my-8 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-card via-background to-emerald-50/20 dark:to-emerald-950/20 p-6 shadow-sm font-sans transition-all hover:border-emerald-500/30">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/80 pb-4 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-foreground tracking-tight">{destination}</h4>
          {locationSubtitle && (
            <p className="text-xs text-muted-foreground font-medium">{locationSubtitle}</p>
          )}
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {bestSeason && (
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Best Season
              </span>
              <span className="text-foreground font-medium">{bestSeason}</span>
            </div>
          </div>
        )}

        {currency && (
          <div className="flex items-start gap-2.5">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Currency
              </span>
              <span className="text-foreground font-medium">{currency}</span>
            </div>
          </div>
        )}

        {language && (
          <div className="flex items-start gap-2.5">
            <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Language
              </span>
              <span className="text-foreground font-medium">{language}</span>
            </div>
          </div>
        )}

        {elevation && (
          <div className="flex items-start gap-2.5">
            <Mountain className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Elevation
              </span>
              <span className="text-foreground font-medium">{elevation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Highlights List */}
      {highlights.length > 0 && (
        <div className="mt-5 border-t border-border/60 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Key Highlights</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground/90">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
