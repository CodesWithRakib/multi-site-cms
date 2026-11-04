'use client';

import { useState, type FormEvent } from 'react';
import { Mail, Send } from 'lucide-react';

import { buildContactMailto } from '@/lib/contact';

const INPUT_CLASS =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

interface ContactFormProps {
  readonly contactEmail: string;
}

/**
 * Composes a message in the reader's own email client via `mailto:`.
 * The site does not send or store anything.
 */
export function ContactForm({ contactEmail }: ContactFormProps) {
  const [formData, setFormData] = useState({ name: '', subject: '', message: '' });
  const [opened, setOpened] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.href = buildContactMailto(contactEmail, formData);
    setOpened(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-xs font-semibold text-foreground">
          Your Name
        </label>
        <input
          id="name"
          required
          type="text"
          autoComplete="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Alex Traveler"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-xs font-semibold text-foreground">
          Subject
        </label>
        <input
          id="subject"
          required
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Itinerary correction, story pitch, or press inquiry"
          className={INPUT_CLASS}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-xs font-semibold text-foreground">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us about your story or inquiry..."
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-sm shadow-emerald-600/20"
        >
          <span>Open in Email App</span>
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="text-xs text-muted-foreground">
          Opens your email app with this message ready to send.
        </p>
      </div>

      {opened && (
        <p role="status" className="flex items-start gap-2 text-sm text-muted-foreground">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            If your email app did not open, write to{' '}
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium text-emerald-700 underline dark:text-emerald-300"
            >
              {contactEmail}
            </a>
            .
          </span>
        </p>
      )}
    </form>
  );
}
