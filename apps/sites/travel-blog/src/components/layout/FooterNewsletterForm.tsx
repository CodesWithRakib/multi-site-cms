'use client';

import { useState, type FormEvent } from 'react';
import { Check, Loader2, Send } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/api';

export function FooterNewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      setFeedback('Subscribed! Check your inbox soon.');
      setEmail('');
    } else {
      setStatus('error');
      setFeedback(res.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative flex items-center">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          disabled={status === 'loading' || status === 'success'}
          required
          aria-label="Email address for newsletter"
          className="w-full rounded-full border border-white/15 bg-white/10 px-4 py-2.5 pr-12 text-sm text-white placeholder-emerald-100/50 backdrop-blur-sm transition focus:border-emerald-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          aria-label="Subscribe to newsletter"
          className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-400 hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          {status === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : status === 'success' ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : (
            <Send className="h-3.5 w-3.5 translate-x-px -translate-y-px" />
          )}
        </button>
      </div>

      {feedback && (
        <p
          className={`text-xs ${
            status === 'success' ? 'text-emerald-300' : 'text-rose-300'
          }`}
          role="status"
        >
          {feedback}
        </p>
      )}
    </form>
  );
}

