import React from 'react';
import { AlertCircle, Info, Lightbulb } from 'lucide-react';

export interface CalloutBoxProps {
  type?: 'info' | 'warning' | 'tip';
  children: React.ReactNode;
}

export function CalloutBox({ type = 'info', children }: CalloutBoxProps) {
  const isTip = type === 'tip';
  const isWarn = type === 'warning';

  const styles = isWarn
    ? 'border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200'
    : isTip
      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200'
      : 'border-emerald-500/20 bg-emerald-500/5 text-foreground';

  const Icon = isWarn ? AlertCircle : isTip ? Lightbulb : Info;
  const iconColor = isWarn
    ? 'text-amber-600 dark:text-amber-400'
    : isTip
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <aside className={`my-6 rounded-xl border p-4.5 flex gap-3 text-sm font-sans ${styles}`}>
      <div className="shrink-0 mt-0.5">
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="space-y-1 leading-relaxed">{children}</div>
    </aside>
  );
}
