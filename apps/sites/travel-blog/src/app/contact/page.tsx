'use client';

import React, { useState, type FormEvent } from 'react';
import { Check, Mail, MapPin, Send } from 'lucide-react';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      <header className="max-w-2xl space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Mail className="h-3.5 w-3.5" /> Editorial Correspondence
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Get in Touch
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Have a travel story to pitch, feedback on an itinerary, or partnership inquiries? Send us
          a dispatch.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Form */}
        <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Dispatch Sent</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Thank you for reaching out. An editor will review your note and respond within 48
                hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Your Name
                  </label>
                  <input
                    id="name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Traveler"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Email Address
                  </label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-sm shadow-emerald-600/20"
              >
                <span>Send Dispatch</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-lg font-bold text-foreground">Direct Inquiries</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>editorial@travelblog.com</span>
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Field Desks in Zurich, Tokyo & New York</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <NewsletterBanner />
    </div>
  );
}
