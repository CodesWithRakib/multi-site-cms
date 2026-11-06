'use client';

import { useId, useState, type FormEvent } from 'react';
import { Check, Loader2, Send } from 'lucide-react';

import { subscribeNewsletter } from '@/lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface NewsletterFormProps {
  /** `pill` = large white pill for the banner; `compact` = dark-surface field for the footer. */
  readonly variant?: 'pill' | 'compact';
}

/** Single newsletter signup form, shared by the newsletter banner and the footer. */
export function NewsletterForm({ variant = 'pill' }: NewsletterFormProps) {
  const feedbackId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');

  const isPill = variant === 'pill';
  const locked = status === 'loading' || status === 'success';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error');
      setFeedback('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    const res = await subscribeNewsletter(trimmed);
    if (res.success) {
      setStatus('success');
      setFeedback(res.message);
      setEmail('');
    } else {
      setStatus('error');
      setFeedback(res.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full min-w-0 space-y-2">
      <div
        className={
          isPill
            ? 'flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg ring-4 ring-white/20 focus-within:ring-white/40'
            : 'flex items-center gap-1 rounded-full bg-white/10 p-1 ring-1 ring-white/15 focus-within:ring-white/40'
        }
      >
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          disabled={locked}
          required
          aria-label="Email address for the newsletter"
          aria-describedby={feedback ? feedbackId : undefined}
          aria-invalid={status === 'error'}
          className={
            isPill
              ? 'min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none'
              : 'min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none'
          }
        />
        <button
          type="submit"
          disabled={locked}
          aria-label={isPill ? undefined : 'Subscribe'}
          className={
            isPill
              ? 'inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-500 active:scale-[0.97] disabled:opacity-60'
              : 'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-400 active:scale-95 disabled:opacity-60'
          }
        >
          {status === 'loading' ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : status === 'success' ? (
            <Check aria-hidden="true" className="size-4" />
          ) : isPill ? (
            <>
              Subscribe
              <Send aria-hidden="true" className="size-3.5" />
            </>
          ) : (
            <Send aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {feedback && (
        <p
          id={feedbackId}
          role={status === 'error' ? 'alert' : 'status'}
          className={`px-2 text-xs ${status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
