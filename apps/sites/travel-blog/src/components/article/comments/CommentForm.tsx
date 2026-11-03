'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { CreatePublicCommentPayload, PublicCommentItem } from '@multi-site-cms/types';
import { CommentRatingStars } from './CommentRatingStars';

interface CommentFormProps {
  slug: string;
  onCommentSubmitted: (comment: PublicCommentItem) => void;
}

export function CommentForm({ slug, onCommentSubmitted }: CommentFormProps) {
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(5);
  const [websiteUrl, setWebsiteUrl] = useState(''); // Honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      setErrorMessage('Please fill in your name, email, and comment thoughts.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreatePublicCommentPayload = {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        content: content.trim(),
        rating,
        website_url: websiteUrl, // Honeypot trap
      };

      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        success?: boolean;
        data?: PublicCommentItem;
        message?: string;
      };

      if (!res.ok || data.success === false || !data.data) {
        setErrorMessage(data.message || 'Unable to post your reflection. Please try again.');
        return;
      }

      // Success
      setSuccessMessage('Thank you! Your reflection has been published.');
      onCommentSubmitted(data.data);
      setContent('');
      setRating(5);
    } catch {
      setErrorMessage('Network connection lost. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-emerald-500/[0.03] p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground">
          Leave a Reader Review
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Have you traveled here or planning a trip? Share your experiences and tips with our global community.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Rating Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Rate This Expedition
          </label>
          <CommentRatingStars
            rating={rating}
            interactive={true}
            onChange={(r) => setRating(r)}
            size="lg"
          />
        </div>

        {/* Name and Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="commenter-name"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Your Name <span className="text-emerald-600">*</span>
            </label>
            <input
              id="commenter-name"
              type="text"
              required
              placeholder="e.g. Maya Lin"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="commenter-email"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Email Address <span className="text-emerald-600">*</span>
            </label>
            <input
              id="commenter-email"
              type="email"
              required
              placeholder="e.g. maya@wanderlust.com"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background/80 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              Kept strictly confidential; never published.
            </p>
          </div>
        </div>

        {/* Comment Content */}
        <div>
          <label
            htmlFor="commenter-content"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
          >
            Your Thoughts & Tips <span className="text-emerald-600">*</span>
          </label>
          <textarea
            id="commenter-content"
            required
            rows={4}
            minLength={3}
            maxLength={1000}
            placeholder="Share what captivated you, packing tips, or local hidden gems..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-input bg-background/80 p-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y"
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground">
            <span>Markdown formatting supported</span>
            <span>{content.length} / 1000</span>
          </div>
        </div>

        {/* Honeypot Field (invisible to normal users) */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website-trap">Website (leave empty)</label>
          <input
            id="website-trap"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Publishing Review...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Post Reflection</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

