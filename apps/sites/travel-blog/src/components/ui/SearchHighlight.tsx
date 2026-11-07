'use client';

import React from 'react';

interface SearchHighlightProps {
  text: string;
  query?: string;
  className?: string;
}

export function SearchHighlight({ text, query = '', className = '' }: SearchHighlightProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 1)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={`match-${index}-${part}`}
              className="rounded bg-emerald-200/80 px-1 py-0.5 font-semibold text-emerald-950 dark:bg-emerald-900/70 dark:text-emerald-100"
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
}
