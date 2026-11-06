'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Copy, Check, Shield, Globe, Terminal, User, ArrowUpRight } from 'lucide-react';
import type { AuditLogItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface AuditLogDetailModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

function getResourceRoute(entityType: string): string | null {
  const norm = entityType.toLowerCase();
  if (norm.includes('comment')) return '/comments';
  if (norm.includes('post') || norm.includes('publication')) return '/posts';
  if (norm.includes('media')) return '/media';
  if (norm.includes('user') || norm.includes('role')) return '/users';
  if (norm.includes('site')) return '/sites';
  return null;
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  const { t } = useAdmin();
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionTheme = (action: string) => {
    if (action.includes('delete') || action.includes('failed'))
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (action.startsWith('auth.') || action.startsWith('role.'))
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    if (action.includes('status') || action.includes('schedule'))
      return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    if (action.startsWith('media.')) return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
    if (action.startsWith('post.') || action.startsWith('publication.'))
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
  };

  const resourceLink = getResourceRoute(log.entityType);
  const metadataEntries = Object.entries(log.metadata || {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border ${getActionTheme(
                log.action,
              )}`}
            >
              {log.action}
            </span>
            <span className="text-xs text-neutral-500 font-mono">ID: #{log.id}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-800">
            {/* Actor */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {t('auditLogs.actor')}
              </span>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {log.actorName || (log.actorType === 'system' ? 'System' : 'Unknown')}
              </p>
              {log.actorEmail && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{log.actorEmail}</p>
              )}
            </div>

            {/* Target Entity */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {t('auditLogs.entity')}
              </span>
              <div className="flex items-center gap-2">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                  {log.entityType}
                </p>
                {resourceLink && (
                  <Link
                    href={resourceLink}
                    onClick={onClose}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>View Section</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
              {log.entityId && (
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
                  {log.entityId}
                </p>
              )}
            </div>

            {/* Site Scope */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {t('auditLogs.site')}
              </span>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {log.siteName || t('auditLogs.allWebsites')}
              </p>
            </div>

            {/* IP Address & Request ID */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                {t('auditLogs.ipAddress')}
              </span>
              <p className="font-mono text-xs font-medium text-neutral-900 dark:text-neutral-100">
                {log.ipAddress || 'Internal Network'}
              </p>
              {log.requestId && (
                <p className="text-[11px] font-mono text-neutral-500 truncate">
                  Req: {log.requestId}
                </p>
              )}
            </div>
          </div>

          {/* Structured metadata overview */}
          {metadataEntries.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Key Parameters
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {metadataEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-800/40 text-xs"
                  >
                    <span className="block text-[11px] font-medium text-neutral-500 truncate">
                      {key}
                    </span>
                    <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JSON Metadata Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {t('auditLogs.metadataPayload')}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('auditLogs.copied') : t('auditLogs.copyJson')}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-neutral-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-56 border border-neutral-800">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <span className="text-xs text-neutral-500">
            {new Date(log.createdAt).toLocaleString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            {t('auditLogs.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
