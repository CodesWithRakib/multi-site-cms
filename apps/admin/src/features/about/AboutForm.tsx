'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import type { SiteAbout, SiteAboutPillar } from '@multi-site-cms/types';
import { normalizeSiteAbout, SITE_ABOUT_LIMITS } from '@multi-site-cms/validation/site-about';

import { useAdmin } from '@/lib/admin-context';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const labelClass = 'mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300';
/** React keys only (never rendered into the DOM, so no hydration concern). */
let draftKeySeed = 0;
const nextKey = () => `p${draftKeySeed++}`;

const cardClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 dark:border-slate-800 dark:bg-slate-900';

interface DraftPillar extends SiteAboutPillar {
  /** Client-only key so removing a card does not shuffle the others' inputs. */
  readonly key: string;
}

interface AboutFormProps {
  readonly initial: Partial<SiteAbout> | undefined;
  readonly isSaving: boolean;
  readonly disabled: boolean;
  readonly onSave: (about: SiteAbout) => Promise<void>;
}

function CharCount({ value, max }: { readonly value: string; readonly max: number }) {
  const near = value.length > max * 0.9;
  return (
    <span
      className={`text-[11px] ${near ? 'font-semibold text-amber-600' : 'text-slate-400'}`}
      aria-hidden="true"
    >
      {value.length}/{max}
    </span>
  );
}

export function AboutForm({ initial, isSaving, disabled, onSave }: AboutFormProps) {
  const { setHasUnsavedChanges } = useAdmin();
  const baseline = useMemo(() => normalizeSiteAbout(initial), [initial]);
  const idPrefix = useId();

  const [eyebrow, setEyebrow] = useState(baseline.eyebrow);
  const [headline, setHeadline] = useState(baseline.headline);
  const [highlight, setHighlight] = useState(baseline.highlight);
  const [intro, setIntro] = useState(baseline.intro);
  const [showWriters, setShowWriters] = useState(baseline.showWriters);
  const [pillars, setPillars] = useState<DraftPillar[]>(() =>
    baseline.pillars.map((p) => ({ ...p, key: nextKey() })),
  );

  const draft = useMemo(
    () =>
      normalizeSiteAbout({
        eyebrow,
        headline,
        highlight,
        intro,
        showWriters,
        pillars: pillars.map(({ title, body }) => ({ title, body })),
      }),
    [eyebrow, headline, highlight, intro, showWriters, pillars],
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  // Shares the admin-wide unsaved-changes guard (site switch / navigation prompts).
  useEffect(() => {
    setHasUnsavedChanges(dirty);
    return () => setHasUnsavedChanges(false);
  }, [dirty, setHasUnsavedChanges]);

  const updatePillar = (key: string, patch: Partial<SiteAboutPillar>) =>
    setPillars((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const locked = disabled || isSaving;
  const canAddPillar = pillars.length < SITE_ABOUT_LIMITS.maxPillars;

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (locked || !dirty) return;
        await onSave(draft);
      }}
    >
      <fieldset disabled={locked} className={`space-y-5 ${cardClass}`}>
        <legend className="sr-only">Page heading and introduction</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`${idPrefix}-eyebrow`} className={labelClass}>
                Small label above the heading
              </label>
              <CharCount value={eyebrow} max={SITE_ABOUT_LIMITS.eyebrow} />
            </div>
            <input
              id={`${idPrefix}-eyebrow`}
              className={inputClass}
              value={eyebrow}
              maxLength={SITE_ABOUT_LIMITS.eyebrow}
              placeholder="Our Mission"
              onChange={(e) => setEyebrow(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`${idPrefix}-highlight`} className={labelClass}>
                Highlighted phrase (optional)
              </label>
              <CharCount value={highlight} max={SITE_ABOUT_LIMITS.highlight} />
            </div>
            <input
              id={`${idPrefix}-highlight`}
              className={inputClass}
              value={highlight}
              maxLength={SITE_ABOUT_LIMITS.highlight}
              placeholder="worth telling"
              onChange={(e) => setHighlight(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${idPrefix}-headline`} className={labelClass}>
              Heading
            </label>
            <CharCount value={headline} max={SITE_ABOUT_LIMITS.headline} />
          </div>
          <input
            id={`${idPrefix}-headline`}
            className={inputClass}
            value={headline}
            maxLength={SITE_ABOUT_LIMITS.headline}
            placeholder="Stories from places worth the journey"
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${idPrefix}-intro`} className={labelClass}>
              Introduction
            </label>
            <CharCount value={intro} max={SITE_ABOUT_LIMITS.intro} />
          </div>
          <textarea
            id={`${idPrefix}-intro`}
            className={`${inputClass} min-h-40 resize-y`}
            value={intro}
            maxLength={SITE_ABOUT_LIMITS.intro}
            aria-describedby={`${idPrefix}-intro-hint`}
            onChange={(e) => setIntro(e.target.value)}
          />
          <p id={`${idPrefix}-intro-hint`} className="mt-1 text-xs text-slate-500">
            Plain text. Leave a blank line between paragraphs.
          </p>
        </div>
      </fieldset>

      <fieldset disabled={locked} className={`space-y-4 ${cardClass}`}>
        <legend className="sr-only">Value cards</legend>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Value cards</h2>
            <p className="text-xs text-slate-500">
              Up to {SITE_ABOUT_LIMITS.maxPillars} short points about what the site stands for.
              Cards without a title are not saved.
            </p>
          </div>
          <button
            type="button"
            disabled={!canAddPillar}
            onClick={() => setPillars((list) => [...list, { key: nextKey(), title: '', body: '' }])}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add card
          </button>
        </div>

        {pillars.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">
            No cards yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {pillars.map((pillar, index) => (
              <li
                key={pillar.key}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor={`${idPrefix}-pt-${index}`} className={labelClass}>
                      Card {index + 1} title
                    </label>
                    <input
                      id={`${idPrefix}-pt-${index}`}
                      className={inputClass}
                      value={pillar.title}
                      maxLength={SITE_ABOUT_LIMITS.pillarTitle}
                      onChange={(e) => updatePillar(pillar.key, { title: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPillars((list) => list.filter((p) => p.key !== pillar.key))}
                    className="mb-0.5 rounded-xl p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    aria-label={`Remove card ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor={`${idPrefix}-pb-${index}`} className={labelClass}>
                      Card {index + 1} text
                    </label>
                    <CharCount value={pillar.body} max={SITE_ABOUT_LIMITS.pillarBody} />
                  </div>
                  <textarea
                    id={`${idPrefix}-pb-${index}`}
                    className={`${inputClass} min-h-20 resize-y`}
                    value={pillar.body}
                    maxLength={SITE_ABOUT_LIMITS.pillarBody}
                    onChange={(e) => updatePillar(pillar.key, { body: e.target.value })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${cardClass}`}
      >
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
            checked={showWriters}
            disabled={locked}
            onChange={(e) => setShowWriters(e.target.checked)}
          />
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Show our writers
            </span>
            <span className="block text-xs text-slate-500">
              Lists the authors of published stories at the bottom of the page.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3">
          {dirty && !isSaving && (
            <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>
          )}
          <button
            type="submit"
            disabled={locked || !dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
