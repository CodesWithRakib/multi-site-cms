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
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        Share
      </span>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Share article"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        title="Share"
      >
        <Share2 className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={copyToClipboard}
        aria-label="Copy link to clipboard"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
        title={copied ? 'Copied!' : 'Copy link'}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X / Twitter"
        className="inline-flex h-9 px-3 items-center justify-center rounded-full border border-border bg-card text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
      >
        X
      </a>

      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex h-9 px-3 items-center justify-center rounded-full border border-border bg-card text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
      >
        LinkedIn
      </a>
    </div>
  );
}
