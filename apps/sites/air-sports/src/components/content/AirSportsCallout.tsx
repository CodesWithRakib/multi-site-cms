import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface AirSportsCalloutProps {
  type?: string;
  children: React.ReactNode;
}

export function AirSportsCallout({ type = 'info', children }: AirSportsCalloutProps) {
  const styles =
    {
      info: 'bg-blue-500/10 border-blue-500/40 text-blue-950 dark:text-blue-100',
      warning: 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100',
      tip: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100',
    }[type] || 'bg-muted/40 border-border text-foreground';

  const IconComponent = type === 'warning' ? AlertCircle : type === 'tip' ? CheckCircle2 : Info;

  return (
    <div className={`my-6 flex gap-3.5 rounded-xl border p-4.5 ${styles}`}>
      <IconComponent className="size-5 shrink-0 mt-0.5 text-primary" />
      <div className="text-sm leading-relaxed [&>p]:my-1">{children}</div>
    </div>
  );
}

