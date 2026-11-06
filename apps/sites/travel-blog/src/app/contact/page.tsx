import type { Metadata } from 'next';
import { Mail, Phone } from 'lucide-react';

import { ContactForm } from '@/components/contact/ContactForm';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { siteConfig } from '@/config/site';
import { parseContactEmail, parseContactPhone } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Contact the Editors',
  description: `Pitch a story, report an itinerary correction, or reach the ${siteConfig.name} editors.`,
  alternates: { canonical: '/contact' },
};

const contactEmail = parseContactEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
const contactPhone = parseContactPhone(process.env.NEXT_PUBLIC_CONTACT_PHONE);

export default function ContactPage() {
  const hasDirectContact = Boolean(contactEmail ?? contactPhone);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      <header className="max-w-2xl space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Editorial Correspondence
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Get in Touch
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Have a travel story to pitch, feedback on an itinerary, or partnership inquiries? Send us
          a dispatch.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        <div
          className={`rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-10 ${
            hasDirectContact ? 'lg:col-span-7' : 'lg:col-span-12'
          }`}
        >
          {contactEmail ? (
            <ContactForm contactEmail={contactEmail} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail aria-hidden="true" className="size-6" />
              </span>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Our editorial inbox is being set up
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Contact details will appear here soon. In the meantime, subscribe below to follow
                new stories.
              </p>
            </div>
          )}
        </div>

        {hasDirectContact && (
          <aside className="lg:col-span-5 space-y-6" aria-label="Direct inquiries">
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-foreground">Direct Inquiries</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                {contactEmail && (
                  <p className="flex items-center gap-2.5">
                    <Mail
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <a href={`mailto:${contactEmail}`} className="hover:text-foreground underline">
                      {contactEmail}
                    </a>
                  </p>
                )}
                {contactPhone && (
                  <p className="flex items-center gap-2.5">
                    <Phone
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <a
                      href={`tel:${contactPhone.href}`}
                      className="hover:text-foreground underline"
                    >
                      {contactPhone.label}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <NewsletterBanner />
    </div>
  );
}
