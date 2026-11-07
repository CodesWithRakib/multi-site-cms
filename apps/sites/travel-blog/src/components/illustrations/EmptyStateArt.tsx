import { cn } from '@multi-site-cms/ui';

export type EmptyStateArtName = 'lost' | 'no-stories' | 'no-results' | 'mail';

interface EmptyStateArtProps {
  readonly name: EmptyStateArtName;
  readonly className?: string;
}

/** Soft ground shadow shared by all spot illustrations. */
function Ground() {
  return <ellipse cx="120" cy="168" rx="78" ry="8" className="fill-foreground/10" />;
}

/** Dotted route used as a recurring motif across the set. */
function Route({ d }: { readonly d: string }) {
  return (
    <path
      d={d}
      stroke="currentColor"
      strokeOpacity="0.45"
      strokeWidth="2.5"
      strokeDasharray="2 8"
      strokeLinecap="round"
    />
  );
}

/**
 * Spot illustrations for empty and error states. Decorative, themed through
 * `text-primary`, and hidden from assistive technology; the surrounding text
 * always states the situation.
 */
export function EmptyStateArt({ name, className }: EmptyStateArtProps) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('text-primary', className)}
    >
      <Ground />

      {name === 'lost' && (
        <g>
          <Route d="M22 140 C 60 120, 70 150, 108 128" />
          {/* Compass that lost its bearings */}
          <circle cx="120" cy="86" r="52" fill="currentColor" opacity="0.12" />
          <circle cx="120" cy="86" r="42" className="fill-card stroke-current" strokeWidth="4" />
          <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5">
            <path d="M120 50v7M120 115v7M84 86h7M149 86h7" />
          </g>
          <g transform="rotate(38 120 86)">
            <path d="M120 58 L130 86 L120 80 L110 86 Z" fill="currentColor" />
            <path d="M120 114 L130 86 L120 92 L110 86 Z" className="fill-foreground/25" />
          </g>
          <circle cx="120" cy="86" r="4" className="fill-card stroke-current" strokeWidth="2" />
          {/* Question pin */}
          <g transform="translate(176 40)">
            <path
              d="M14 0 c-8 0 -14 6 -14 14 c0 11 14 26 14 26 s14 -15 14 -26 c0 -8 -6 -14 -14 -14 z"
              fill="currentColor"
            />
            <text
              x="14"
              y="19"
              textAnchor="middle"
              className="fill-white"
              fontSize="16"
              fontWeight="700"
            >
              ?
            </text>
          </g>
        </g>
      )}

      {name === 'no-stories' && (
        <g>
          <Route d="M40 130 C 70 100, 100 122, 132 92 S 190 80, 206 60" />
          {/* Folded map */}
          <path
            d="M44 52 L96 40 L148 56 L200 44 V140 L148 152 L96 136 L44 148 Z"
            fill="currentColor"
            opacity="0.14"
          />
          <path
            d="M44 52 L96 40 L148 56 L200 44 V140 L148 152 L96 136 L44 148 Z"
            className="stroke-current"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M96 40 V136 M148 56 V152"
            className="stroke-current"
            strokeWidth="2"
            opacity="0.4"
          />
          <g transform="translate(120 70)">
            <path
              d="M14 0 c-8 0 -14 6 -14 14 c0 11 14 26 14 26 s14 -15 14 -26 c0 -8 -6 -14 -14 -14 z"
              fill="currentColor"
            />
            <circle cx="14" cy="14" r="5" className="fill-white" />
          </g>
        </g>
      )}

      {name === 'no-results' && (
        <g>
          <Route d="M30 128 C 60 150, 96 110, 126 132" />
          <circle cx="104" cy="82" r="40" fill="currentColor" opacity="0.12" />
          <circle cx="104" cy="82" r="32" className="fill-card stroke-current" strokeWidth="5" />
          <path
            d="M128 106 L170 148"
            className="stroke-current"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Small peaks inside the lens */}
          <path d="M80 98 L96 70 L106 86 L114 76 L128 98 Z" fill="currentColor" opacity="0.5" />
          <circle cx="118" cy="62" r="5" className="fill-amber-300" />
        </g>
      )}

      {name === 'mail' && (
        <g>
          <Route d="M20 128 C 56 150, 84 96, 120 108 S 176 70, 214 44" />
          <rect x="62" y="72" width="116" height="76" rx="12" fill="currentColor" opacity="0.14" />
          <rect
            x="62"
            y="72"
            width="116"
            height="76"
            rx="12"
            className="fill-card stroke-current"
            strokeWidth="4"
          />
          <path
            d="M66 80 L120 118 L174 80"
            className="stroke-current"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M196 30 L226 42 L206 50 L204 66 L194 54 L180 58 Z" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}
