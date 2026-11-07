'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@multi-site-cms/ui';

interface RevealProps {
  readonly children: ReactNode;
  /** Stagger in milliseconds, so siblings enter one after another. */
  readonly delay?: number;
  readonly className?: string;
}

type RevealState = 'visible' | 'hidden' | 'shown';

/**
 * Fades and lifts its child into view the first time it scrolls on screen.
 *
 * Progressive enhancement: the server renders it fully visible, so it works
 * without JavaScript. After hydration, only content that is still below the
 * fold is hidden and then revealed on scroll, and nothing is hidden at all for
 * visitors who prefer reduced motion.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>('visible');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onScreen = el.getBoundingClientRect().top < window.innerHeight;
    if (reduced || onScreen || typeof IntersectionObserver === 'undefined') return;

    setState('hidden');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState('shown');
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: state === 'shown' ? `${delay}ms` : undefined }}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out',
        state === 'hidden' && 'translate-y-6 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
