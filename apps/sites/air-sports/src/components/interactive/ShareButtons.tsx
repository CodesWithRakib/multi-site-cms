'use client';

import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';

export interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
        return;
      } catch {
        // User canceled or share failed; fall back to copy
      }
    }

    await copyToClipboard();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mr-1">
        Transmit
      </span>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Share article"
        className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:border-foreground/30 transition-colors shadow-xs"
        title="Share"
      >
        <Share2 className="size-4 text-primary" />
      </button>

      <button
        type="button"
        onClick={copyToClipboard}
        aria-label="Copy link to clipboard"
        className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:border-foreground/30 transition-colors shadow-xs"
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="inline-flex h-9 px-3 items-center justify-center rounded-xl border border-border bg-card text-xs font-mono font-bold text-foreground hover:bg-muted hover:border-foreground/30 transition-colors shadow-xs"
      >
        X
      </a>

      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex h-9 px-3 items-center justify-center rounded-xl border border-border bg-card text-xs font-mono font-bold text-foreground hover:bg-muted hover:border-foreground/30 transition-colors shadow-xs"
      >
        IN
      </a>
    </div>
  );
}
