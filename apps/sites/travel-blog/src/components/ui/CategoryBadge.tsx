import React from 'react';
import Link from 'next/link';

interface CategoryBadgeProps {
  label: string;
  slug?: string;
  variant?: 'emerald' | 'cyan' | 'amber' | 'neutral' | 'auto';
  className?: string;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  europe: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
  asia: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  america: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
  adventure: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20',
  destinations: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'travel-tips': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
  'budget-travel': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'food-travel': 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20',
  guides: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20',
  stories: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
};

export function CategoryBadge({
  label,
  slug,
  variant = 'auto',
  className = '',
  size = 'md',
}: CategoryBadgeProps) {
  const normalizedKey = (slug || label).toLowerCase().replace(/\s+/g, '-');
  const resolvedColor =
    variant === 'auto'
      ? colorMap[normalizedKey] || 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      : {
          emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
          cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
          amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20',
          neutral: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/20',
        }[variant];

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  }[size];

  const content = (
    <span
      className={`inline-flex items-center font-semibold rounded-full border backdrop-blur-xs transition-transform hover:scale-105 ${sizeClasses} ${resolvedColor} ${className}`}
    >
      {label}
    </span>
  );

  if (slug) {
    return (
      <Link href={`/categories/${slug}`} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}

