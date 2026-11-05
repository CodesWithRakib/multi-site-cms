import { useId } from 'react';
import { FileText } from 'lucide-react';

import type { PostKind } from '../utils/post-display';

/**
 * Decorative per-type artwork for a post row; hidden from screen readers.
 * Gradient ids come from useId: the same post renders twice (table and phone
 * card), and an SVG url(#id) resolving to a hidden copy paints nothing.
 */
export function PostThumbnail({ kind }: { readonly kind: PostKind }) {
  const gradientId = `post-thumb-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <div
      className="size-12 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-slate-200/60 dark:border-slate-700/60"
      aria-hidden="true"
    >
      {kind === 'air' ? (
        <svg viewBox="0 0 80 55" className="size-full object-cover" fill="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
          </defs>
          <rect width="80" height="55" fill={`url(#${gradientId})`} />
          <ellipse cx="20" cy="40" rx="18" ry="8" fill="#ffffff" fillOpacity="0.8" />
          <ellipse cx="60" cy="35" rx="20" ry="9" fill="#ffffff" fillOpacity="0.75" />
          <g transform="translate(40, 22) rotate(-15)">
            <path d="M -15 -1 L 15 -1 L 12 1 L -12 1 Z" fill="#dc2626" />
            <rect x="-2" y="-7" width="4" height="14" rx="1" fill="#b91c1c" />
            <path d="M -6 6 L 6 6 L 0 3 Z" fill="#991b1b" />
          </g>
        </svg>
      ) : kind === 'travel' ? (
        <svg viewBox="0 0 80 55" className="size-full object-cover" fill="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <rect width="80" height="55" fill={`url(#${gradientId})`} />
          <polygon points="10,40 32,15 54,40" fill="#0f766e" />
          <polygon points="32,15 28,21 32,23 37,21" fill="#ffffff" />
          <polygon points="35,40 52,18 70,40" fill="#047857" />
          <polygon points="52,18 48,24 53,26 57,23" fill="#ffffff" />
          <rect y="38" width="80" height="17" fill="#0891b2" />
        </svg>
      ) : (
        <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
          <FileText className="size-5" />
        </div>
      )}
    </div>
  );
}
