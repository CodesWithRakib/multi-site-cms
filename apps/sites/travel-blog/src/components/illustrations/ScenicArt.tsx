import { cn } from '@multi-site-cms/ui';

export type ScenicVariant = 'mountains' | 'coast' | 'forest';

const SCENES: readonly ScenicVariant[] = ['mountains', 'coast', 'forest'];

/** Stable scene for a string (slug, id) so the same page always gets the same artwork. */
export function sceneFor(seed: string): ScenicVariant {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return SCENES[hash % SCENES.length] ?? 'mountains';
}

interface ScenicArtProps {
  readonly variant?: ScenicVariant;
  readonly className?: string;
}

/**
 * Decorative landscape for page headers and image-less story tiles. Pure SVG
 * (no network, no bitmap), tinted from the site theme through `text-primary`
 * so it follows light/dark and any brand palette. Always hidden from
 * assistive technology: it carries no information.
 */
export function ScenicArt({ variant = 'mountains', className }: ScenicArtProps) {
  return (
    <svg
      viewBox="0 0 480 240"
      preserveAspectRatio="xMaxYMax slice"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('text-primary', className)}
    >
      {/* Sun and clouds */}
      <circle cx="372" cy="62" r="26" className="fill-amber-300/80 dark:fill-amber-200/60" />
      <circle cx="372" cy="62" r="40" className="fill-amber-300/20 dark:fill-amber-200/10" />
      <g className="fill-foreground/10">
        <rect x="70" y="52" width="74" height="10" rx="5" />
        <rect x="92" y="40" width="46" height="12" rx="6" />
        <rect x="250" y="84" width="58" height="9" rx="4.5" />
      </g>

      {/* Dotted flight path with a paper plane */}
      <path
        d="M20 150 C 110 90, 170 120, 250 70 S 360 40, 440 24"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="2 8"
        strokeLinecap="round"
      />
      <path
        d="M432 14 L456 22 L440 28 L438 40 L430 31 L418 34 Z"
        fill="currentColor"
        opacity="0.8"
      />

      {variant === 'mountains' && (
        <g fill="currentColor">
          <path
            opacity="0.16"
            d="M0 240V150L70 96L118 138L186 70L262 142L330 104L410 150L480 112V240Z"
          />
          <path
            opacity="0.3"
            d="M0 240V182L58 142L112 176L190 118L262 178L338 140L420 186L480 160V240Z"
          />
          <path opacity="0.5" d="M0 240V212L84 178L156 208L248 170L330 210L410 188L480 214V240Z" />
          <path
            opacity="0.9"
            d="M186 70L204 94L196 92L186 100L176 90L168 94Z"
            className="text-white"
          />
        </g>
      )}

      {variant === 'coast' && (
        <g fill="currentColor">
          <path opacity="0.16" d="M0 240V150C80 130 150 160 240 140S400 120 480 150V240Z" />
          <path opacity="0.3" d="M0 240V182C90 166 160 196 250 178S400 160 480 184V240Z" />
          <path opacity="0.5" d="M0 240V212C100 200 170 226 260 210S410 196 480 214V240Z" />
          {/* Palm */}
          <path
            d="M96 200 C100 170 98 150 90 124"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            opacity="0.7"
            d="M90 124 C70 112 52 118 44 132 C62 122 76 124 90 124Z M90 124 C100 104 120 98 136 106 C118 108 104 114 90 124Z M90 124 C84 106 70 94 52 94 C70 100 80 110 90 124Z"
          />
        </g>
      )}

      {variant === 'forest' && (
        <g fill="currentColor">
          <path opacity="0.16" d="M0 240V160L90 120L170 156L260 108L350 150L430 124L480 150V240Z" />
          {[40, 96, 150, 330, 392, 446].map((x, index) => (
            <path
              key={x}
              opacity={index % 2 === 0 ? 0.45 : 0.3}
              d={`M${x} 214 L${x - 20} 214 L${x - 8} 190 L${x - 16} 190 L${x} 150 L${x + 16} 190 L${x + 8} 190 L${x + 20} 214 Z`}
            />
          ))}
          <path opacity="0.5" d="M0 240V218C120 204 200 228 300 214S430 204 480 220V240Z" />
        </g>
      )}

      {/* A pin marking the destination */}
      <g className="text-foreground" opacity="0.85">
        <path
          d="M300 128 c-9 0 -16 7 -16 16 c0 12 16 28 16 28 s16 -16 16 -28 c0 -9 -7 -16 -16 -16 z"
          fill="currentColor"
          opacity="0.15"
        />
        <circle cx="300" cy="144" r="5" fill="currentColor" opacity="0.5" />
      </g>
    </svg>
  );
}
