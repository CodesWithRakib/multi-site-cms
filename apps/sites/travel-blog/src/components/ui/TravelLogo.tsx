import React from 'react';
import Link from 'next/link';

interface TravelLogoProps {
  className?: string;
  showSubtitle?: boolean;
  inverted?: boolean;
}

export function TravelLogo({
  className = '',
  showSubtitle = true,
  inverted = false,
}: TravelLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group transition-transform hover:opacity-95 ${className}`}
    >
      {/* Mountain Peak Vector Icon */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs group-hover:scale-105 transition-transform">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          {/* Main mountain peak */}
          <path d="M2.5 19L9.5 7L13 13" />
          {/* Secondary peak */}
          <path d="M9.5 19L16 9L21.5 19H2.5Z" />
          {/* Snow cap highlight */}
          <path d="M14 12.5L16 9L18 12.5" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <span
          className={`font-sans text-lg font-extrabold tracking-tight transition-colors ${
            inverted
              ? 'text-white group-hover:text-emerald-300'
              : 'text-foreground group-hover:text-primary'
          }`}
        >
          Travel<span className={inverted ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}>Blog</span>
        </span>
        {showSubtitle && (
          <span
            className={`text-[10px] font-medium tracking-wider uppercase ${
              inverted ? 'text-emerald-300/80' : 'text-muted-foreground'
            }`}
          >
            Explore the World
          </span>
        )}
      </div>
    </Link>
  );
}

