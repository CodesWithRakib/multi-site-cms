import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlertTriangle, Eye } from 'lucide-react';

import { DocRenderer } from '@/components/content/DocRenderer';
import { fetchDraftPreview } from '@/lib/api';

interface PreviewPageProps {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: 'Editorial Preview — Air Sports Desk',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function PreviewPostPage({ params, searchParams }: PreviewPageProps) {
  const { postId } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const post = await fetchDraftPreview(postId, token);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      {/* Warning Draft Banner */}
      <aside
        aria-label="Draft preview warning"
        className="mb-8 border-b border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 py-3 px-4 sm:px-6 font-mono text-xs"
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>AUTHENTICATED DRAFT PREVIEW · NOT PUBLISHED PUBLICLY</span>
          </div>
          <span className="hidden sm:inline text-muted-foreground text-[11px]">HMAC Validated</span>
        </div>
      </aside>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-600">
            Internal Preview
          </span>
          <span className="font-mono text-xs text-muted-foreground">Type: {post.type}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-4 text-lg text-foreground/85 leading-relaxed font-sans border-l-2 border-primary/40 pl-4 py-1">
            {post.excerpt}
          </p>
        )}

        <div className="mt-6 flex items-center gap-4 border-y border-border py-3 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Eye className="size-3.5 text-primary" />
            Editorial Review Mode
          </span>
          <span>·</span>
          <span>{post.readingTimeMinutes} min estimated read</span>
        </div>

        <div className="my-8">
          <DocRenderer document={post.body} />
        </div>
      </article>
    </div>
  );
}
