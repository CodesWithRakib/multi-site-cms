'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';

import type { CreatePublicCommentPayload, SubmittedPublicComment } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { REVIEW_LIMITS, validateReview, type ReviewErrors } from '@/lib/review';

import { RatingInput } from './RatingInput';

interface CommentFormProps {
  readonly slug: string;
  /** Called once the review was accepted; `comment.status` says whether it is live yet. */
  readonly onSubmitted: (comment: SubmittedPublicComment) => void;
}

const INPUT =
  'w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary/30 sm:text-sm';

interface FieldProps {
  readonly id: string;
  readonly label: string;
  readonly error?: string;
  readonly hint?: ReactNode;
  readonly children: (describedBy: string | undefined) => ReactNode;
}

/** Label, control, optional hint and an inline error that is announced when it appears. */
function Field({ id, label, error, hint, children }: FieldProps) {
  const noteId = `${id}-note`;
  const describedBy = error || hint ? noteId : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      {children(describedBy)}
      {error ? (
        <p id={noteId} role="alert" className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The review form. Plain-language, per-field validation (not a browser
 * tooltip), the first problem gets focus, and the server's own refusal is shown
 * next to the button. Comments are pre-moderated, so success may mean "waiting
 * for review"; the parent explains which.
 */
export function CommentForm({ slug, onSubmitted }: CommentFormProps) {
  const uid = useId();
  const ids = { name: `${uid}-name`, email: `${uid}-email`, content: `${uid}-content` };
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The form opens on demand, so put the cursor where the reader will type.
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const clearError = (field: keyof ReviewErrors) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setServerError(null);

    const found = validateReview({ name, email, content });
    if (Object.keys(found).length > 0) {
      setErrors(found);
      if (found.name) nameRef.current?.focus();
      else if (found.email) emailRef.current?.focus();
      else contentRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreatePublicCommentPayload = {
        authorName: name.trim(),
        authorEmail: email.trim(),
        content: content.trim(),
        rating,
        website_url: honeypot,
      };
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: SubmittedPublicComment;
        message?: string;
      } | null;

      if (!res.ok || !body || body.success === false || !body.data) {
        setServerError(body?.message || 'We could not post your review. Please try again.');
        return;
      }
      onSubmitted(body.data);
    } catch {
      setServerError('The connection dropped. Check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-7"
      aria-label="Write a review"
    >
      <RatingInput value={rating} onChange={setRating} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={ids.name} label="Your name" error={errors.name}>
          {(describedBy) => (
            <input
              ref={nameRef}
              id={ids.name}
              type="text"
              autoComplete="name"
              maxLength={REVIEW_LIMITS.name.max}
              placeholder="e.g. Maya Lin"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy}
              className={cn(INPUT, errors.name ? 'border-destructive' : 'border-input')}
            />
          )}
        </Field>

        <Field
          id={ids.email}
          label="Email"
          error={errors.email}
          hint="Used only to follow up. It is never shown."
        >
          {(describedBy) => (
            <input
              ref={emailRef}
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={REVIEW_LIMITS.email.max}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError('email');
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              className={cn(INPUT, errors.email ? 'border-destructive' : 'border-input')}
            />
          )}
        </Field>
      </div>

      <Field id={ids.content} label="Your review" error={errors.content}>
        {(describedBy) => (
          <>
            <textarea
              ref={contentRef}
              id={ids.content}
              rows={5}
              maxLength={REVIEW_LIMITS.content.max}
              placeholder="What stood out? Any tips for the next traveller?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                clearError('content');
              }}
              aria-invalid={Boolean(errors.content)}
              aria-describedby={describedBy}
              className={cn(
                INPUT,
                'min-h-32 resize-y',
                errors.content ? 'border-destructive' : 'border-input',
              )}
            />
            <p
              aria-hidden="true"
              className={cn(
                'text-right text-xs tabular-nums',
                content.length > REVIEW_LIMITS.content.max * 0.9
                  ? 'font-semibold text-amber-600'
                  : 'text-muted-foreground',
              )}
            >
              {content.length} / {REVIEW_LIMITS.content.max}
            </p>
          </>
        )}
      </Field>

      {/* Spam trap: real readers never see or fill it. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${uid}-website`}>Website (leave empty)</label>
        <input
          id={`${uid}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {serverError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Reviews are checked before they appear.</p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send aria-hidden="true" className="size-4" />
              Submit review
            </>
          )}
        </button>
      </div>
    </form>
  );
}
