'use client';

import React, { useState } from 'react';
import { ShieldCheck, History } from 'lucide-react';
import type { AuditLogCategory, AuditLogItem } from '@multi-site-cms/types';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useListAuditLogsQuery,
  useGetAuditSummaryQuery,
  useListSitesQuery,
} from '@/lib/cms-api';
import {
  AuditLogStatsCards,
  AuditLogFilterBar,
  AuditLogTable,
  AuditLogDetailModal,
} from '@/features/audit-logs';

export default function AuditLogsPage() {
  const { t, activeSiteId } = useAdmin();

  // Search & Filter State
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditLogCategory>('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(
    activeSiteId || undefined,
  );
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Queries
  const { data: sitesData } = useListSitesQuery();
  const sites = sitesData || [];

  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    refetch: refetchLogs,
  } = useListAuditLogsQuery({
    page,
    limit: 15,
    search: searchTerm.trim() || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    siteId: selectedSiteId || undefined,
  });

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useGetAuditSummaryQuery({
    siteId: selectedSiteId || undefined,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchLogs(), refetchSummary()]);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCategoryChange = (category: AuditLogCategory) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSiteChange = (siteId?: string) => {
    setSelectedSiteId(siteId);
    setPage(1);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (!logsData || logsData.items.length === 0) return;
    const headers = ['ID', 'Action', 'Actor Name', 'Actor Email', 'Entity', 'Site', 'IP', 'Date'];
    const rows = logsData.items.map((item) => [
      item.id,
      item.action,
      `"${item.actorName || item.actorType}"`,
      `"${item.actorEmail || ''}"`,
      item.entityType,
      `"${item.siteName || 'Platform Global'}"`,
      item.ipAddress || '',
      `"${item.createdAt}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const handleExportJson = () => {
    if (!logsData || logsData.items.length === 0) return;
    const blob = new Blob([JSON.stringify(logsData.items, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
              <History className="size-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              {t('auditLogs.title')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="size-3" />
              <span>Immutable Ledger</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t('auditLogs.subtitle')}
          </p>
        </div>

        {/* KPI Metric Cards */}
        <AuditLogStatsCards summary={summaryData} isLoading={isSummaryLoading} />

        {/* Filter and Search Bar */}
        <AuditLogFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedSiteId={selectedSiteId}
          onSiteChange={handleSiteChange}
          sites={sites}
          onRefresh={handleRefresh}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          isRefreshing={isLogsFetching}
        />

        {/* Audit Log Data Table */}
        <AuditLogTable
          logs={logsData?.items ?? []}
          total={logsData?.total ?? 0}
          page={logsData?.page ?? page}
          limit={logsData?.limit ?? 15}
          totalPages={logsData?.totalPages ?? 1}
          onPageChange={setPage}
          onSelectLog={setSelectedLog}
          isLoading={isLogsLoading}
        />

        {/* Detail Inspection Modal */}
        <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      </div>
    </ShellLayout>
  );
}
