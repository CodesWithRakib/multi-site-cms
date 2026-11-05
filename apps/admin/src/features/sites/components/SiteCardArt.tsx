import { useId } from 'react';

type ArtKind = 'air' | 'travel' | 'generic';

export function siteArtKind(siteKey: string): ArtKind {
  const key = siteKey.toLowerCase();
  if (key.includes('air')) return 'air';
  if (key.includes('travel')) return 'travel';
  return 'generic';
}

/**
 * Decorative cover art for a site card, hidden from assistive technology.
 * Gradient ids come from useId so two cards never share (and break) them.
 */
export function SiteCardArt({ kind }: { readonly kind: ArtKind }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const sky = `site-art-sky-${id}`;
  const accent = `site-art-accent-${id}`;

  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {kind === 'air' ? (
        <>
          <defs>
            <linearGradient id={sky} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id={accent} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <rect width="400" height="160" fill={`url(#${sky})`} />
          <path
            d="M-20 140 Q 60 110, 140 135 T 300 130 T 420 145 L 420 160 L -20 160 Z"
            fill="#ffffff"
            opacity="0.8"
          />
          <path
            d="M20 150 Q 120 125, 220 145 T 400 135 L 400 160 L 20 160 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <path
            d="M40 70 Q 120 75, 195 82"
            stroke="#ffffff"
            strokeWidth="4"
            strokeDasharray="6 4"
            opacity="0.8"
          />
          <g transform="translate(190, 60) rotate(10) scale(0.65)">
            <polygon points="40,20 80,24 60,32 30,26" fill="#b91c1c" />
            <ellipse cx="60" cy="24" rx="35" ry="8" fill={`url(#${accent})`} />
            <polygon points="50,16 65,0 72,0 60,16" fill="#f87171" />
            <circle cx="88" cy="24" r="5" fill="#facc15" />
          </g>
        </>
      ) : kind === 'travel' ? (
        <>
          <defs>
            <linearGradient id={sky} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id={accent} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <rect width="400" height="160" fill={`url(#${sky})`} />
          <polygon points="50,110 140,40 220,110" fill="#64748b" opacity="0.7" />
          <polygon points="125,52 140,40 155,52" fill="#ffffff" />
          <polygon points="170,110 260,30 350,110" fill="#475569" opacity="0.8" />
          <polygon points="245,43 260,30 275,43" fill="#ffffff" />
          <polygon points="-20,120 70,60 160,120" fill="#334155" />
          <polygon points="230,125 320,55 410,125" fill="#1e293b" />
          <rect y="105" width="400" height="55" fill={`url(#${accent})`} />
        </>
      ) : (
        <>
          <defs>
            <linearGradient id={sky} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#082625" />
              <stop offset="50%" stopColor="#0f4644" />
              <stop offset="100%" stopColor="#00e599" />
            </linearGradient>
          </defs>
          <rect width="400" height="160" fill={`url(#${sky})`} />
          <circle
            cx="200"
            cy="80"
            r="50"
            stroke="#00e599"
            strokeWidth="1.5"
            fill="none"
            opacity="0.3"
          />
          <circle
            cx="200"
            cy="80"
            r="30"
            stroke="#ffffff"
            strokeWidth="1"
            fill="none"
            opacity="0.2"
          />
        </>
      )}
    </svg>
  );
}
