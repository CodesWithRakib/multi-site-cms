import React from 'react';
import Link from 'next/link';

interface AirSportsLogoProps {
  className?: string;
  showSubtitle?: boolean;
  inverted?: boolean;
}

export function AirSportsLogo({
  className = '',
  showSubtitle = true,
  inverted = false,
}: AirSportsLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group transition-transform hover:opacity-95 ${className}`}
    >
      {/* Glider / Aerodynamic Wing Vector Icon */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-teal-500 to-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {/* Delta wing / paraglider glider silhouette */}
          <path d="M12 2L2 9L12 6L22 9L12 2Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2L2 9L12 22L22 9L12 2Z" />
          <path d="M12 6V22" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={`text-lg font-extrabold tracking-tight transition-colors ${
            inverted
              ? 'text-white group-hover:text-sky-300'
              : 'text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400'
          }`}
        >
          Air<span className={inverted ? 'text-sky-400' : 'text-sky-600 dark:text-sky-400'}>Sports</span>
        </span>
        {showSubtitle && (
          <span
            className={`text-[10px] font-medium tracking-wider uppercase ${
              inverted ? 'text-sky-200/70' : 'text-muted-foreground'
            }`}
          >
            Adventure in the Sky
          </span>
        )}
      </div>
    </Link>
  );
}

