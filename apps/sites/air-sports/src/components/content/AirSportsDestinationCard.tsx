import React from 'react';
import { Calendar, DollarSign, Globe, MapPin, Mountain, Sparkles } from 'lucide-react';

export interface AirSportsDestinationCardProps {
  destination?: string;
  country?: string;
  region?: string;
  bestSeason?: string;
  currency?: string;
  language?: string;
  elevation?: string;
  highlights?: string[];
}

export function AirSportsDestinationCard({
  destination = 'Destination Overview',
  country,
  region,
  bestSeason,
  currency,
  language,
  elevation,
  highlights = [],
}: AirSportsDestinationCardProps) {
  const subtitle = [region, country].filter(Boolean).join(', ');

  return (
    <div className="my-6 rounded-xl border border-primary/20 bg-card p-5 shadow-xs font-sans">
      <div className="flex items-center gap-3 border-b border-border/80 pb-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MapPin className="size-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground">{destination}</h4>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {bestSeason && (
          <div className="flex items-start gap-2">
            <Calendar className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="block font-semibold uppercase text-muted-foreground">
                Best Season
              </span>
              <span className="text-foreground font-medium">{bestSeason}</span>
            </div>
          </div>
        )}
        {elevation && (
          <div className="flex items-start gap-2">
            <Mountain className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="block font-semibold uppercase text-muted-foreground">
                Launch Elevation
              </span>
              <span className="text-foreground font-medium">{elevation}</span>
            </div>
          </div>
        )}
        {currency && (
          <div className="flex items-start gap-2">
            <DollarSign className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="block font-semibold uppercase text-muted-foreground">Currency</span>
              <span className="text-foreground font-medium">{currency}</span>
            </div>
          </div>
        )}
        {language && (
          <div className="flex items-start gap-2">
            <Globe className="size-3.5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="block font-semibold uppercase text-muted-foreground">Language</span>
              <span className="text-foreground font-medium">{language}</span>
            </div>
          </div>
        )}
      </div>

      {highlights.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground mb-2">
            <Sparkles className="size-3 text-primary" />
            <span>Highlights</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground/90">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
