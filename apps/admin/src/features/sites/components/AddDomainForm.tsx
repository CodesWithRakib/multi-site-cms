'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Plus } from 'lucide-react';

import { useAdmin } from '@/lib/admin-context';

interface AddDomainFormProps {
  readonly isAdding: boolean;
  /** Resolves true when the domain was added. */
  readonly onAdd: (hostname: string, isPrimary: boolean) => Promise<boolean>;
}

/** Binds a new hostname to the site; it must then be verified by DNS. */
export function AddDomainForm({ isAdding, onAdd }: AddDomainFormProps) {
  const { t } = useAdmin();
  const [hostname, setHostname] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!hostname.trim()) return;
    if (await onAdd(hostname, isPrimary)) {
      setHostname('');
      setIsPrimary(false);
    }
  };

  return (
    <section
      aria-labelledby="add-domain-heading"
      className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs"
    >
      <h2
        id="add-domain-heading"
        className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1"
      >
        {t.sites.addDomain || 'Add domain'}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Bind an alias or custom hostname. Hostnames are normalized to lowercase.
      </p>

      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div>
          <label
            htmlFor="new-hostname"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Hostname
          </label>
          <input
            id="new-hostname"
            type="text"
            required
            inputMode="url"
            autoComplete="off"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            placeholder="news.example.org"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <input
            id="new-domain-primary"
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="size-4 rounded-md border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/20"
          />
          <label
            htmlFor="new-domain-primary"
            className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Make this the primary domain
          </label>
        </div>

        <button
          type="submit"
          disabled={isAdding}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 text-brand-950 text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isAdding ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4 stroke-[2.5]" aria-hidden="true" />
          )}
          <span>{isAdding ? 'Adding…' : 'Add domain'}</span>
        </button>
      </form>
    </section>
  );
}
