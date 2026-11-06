'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@multi-site-cms/ui';

import { useAdmin } from '@/lib/admin-context';
import { useGetVerificationChallengeQuery } from '@/lib/cms-api';

interface DnsChallengeDialogProps {
  readonly siteId: string;
  /** Open while set. */
  readonly domainId: string | null;
  readonly isVerifying: boolean;
  readonly onVerify: (domainId: string) => void;
  readonly onClose: () => void;
}

function CopyValue({ label, value }: { readonly label: string; readonly value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context); the value stays selectable.
    }
  };

  return (
    <div>
      <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <p className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all select-all">
          {value}
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 shrink-0 cursor-pointer"
          aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
        >
          {copied ? (
            <Check className="size-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * TXT record a site owner must publish to prove control of a domain. A Radix
 * dialog: focus is trapped, Escape and the close button dismiss it.
 */
export function DnsChallengeDialog({
  siteId,
  domainId,
  isVerifying,
  onVerify,
  onClose,
}: DnsChallengeDialogProps) {
  const { t } = useAdmin();
  const { data: challenge, isError } = useGetVerificationChallengeQuery(
    { siteId, domainId: domainId ?? '' },
    { skip: !domainId },
  );

  return (
    <Dialog open={domainId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
            <Shield className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{t.sites.dnsChallenge || 'DNS verification'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
            {t.sites.dnsInstructions}
          </DialogDescription>
        </DialogHeader>

        {isError ? (
          <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
            The verification record could not be loaded. Close this dialog and try again.
          </p>
        ) : !challenge ? (
          <div className="py-8 flex flex-col items-center gap-2.5" role="status">
            <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden="true" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading DNS record…</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Record type
              </span>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100">TXT</p>
            </div>
            <CopyValue label="Host name" value={challenge.recordName} />
            <CopyValue label="Record value" value={challenge.recordValue} />
          </div>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => challenge && onVerify(challenge.domainId)}
            disabled={!challenge || isVerifying}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs hover:brightness-105 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isVerifying && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            <span>{isVerifying ? 'Checking…' : 'Verify DNS record now'}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
