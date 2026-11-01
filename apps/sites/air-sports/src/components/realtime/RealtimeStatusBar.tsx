'use client';

import React from 'react';
import { Activity, Radio, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { RealtimeStatus } from './useRealtimeStream';

interface RealtimeStatusBarProps {
  status: RealtimeStatus;
  lastPing: Date | null;
  onRefresh?: () => void;
  className?: string;
}

export function RealtimeStatusBar({
  status,
  lastPing,
  onRefresh,
  className = '',
}: RealtimeStatusBarProps) {
  const statusConfig = {
    connected: {
      label: 'Live Stream Active',
      sublabel: lastPing ? `Heartbeat: ${lastPing.toLocaleTimeString()}` : 'Connected',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      icon: Radio,
      ping: true,
    },
    connecting: {
      label: 'Connecting Stream...',
      sublabel: 'Establishing live channel',
      color: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      icon: Activity,
      ping: false,
    },
    reconnecting: {
      label: 'Reconnecting...',
      sublabel: 'Backing off & retrying',
      color: 'bg-amber-500',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      icon: Wifi,
      ping: true,
    },
    fallback: {
      label: 'Fallback Mode',
      sublabel: 'Polling updates every 60s',
      color: 'bg-slate-500',
      textColor: 'text-slate-600 dark:text-slate-300',
      bgColor: 'bg-muted border-border',
      icon: WifiOff,
      ping: false,
    },
  }[status];

  const IconComponent = statusConfig.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-3 rounded-full border px-3.5 py-1.5 text-xs font-mono transition-colors ${statusConfig.bgColor} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="relative flex size-2.5">
          {statusConfig.ping && (
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full ${statusConfig.color} opacity-75`}
            />
          )}
          <span className={`relative inline-flex size-2.5 rounded-full ${statusConfig.color}`} />
        </span>
        <IconComponent className={`size-3.5 ${statusConfig.textColor}`} />
        <span className={`font-semibold tracking-wide uppercase ${statusConfig.textColor}`}>
          {statusConfig.label}
        </span>
      </div>

      <span className="hidden sm:inline text-muted-foreground">·</span>
      <span className="hidden sm:inline text-muted-foreground text-[11px]">
        {statusConfig.sublabel}
      </span>

      {status === 'fallback' && onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="ml-1 inline-flex items-center gap-1 rounded bg-background/80 px-2 py-0.5 text-[11px] font-sans font-medium text-foreground hover:bg-background transition-colors"
          title="Refresh updates now"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      )}
    </div>
  );
}
