'use client';

import React from 'react';
import { Search, RefreshCw, X, Filter } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export interface UserFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  siteFilter: string;
  onSiteFilterChange: (value: string) => void;
  sites: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  isFetching?: boolean;
}

export function UserFilterBar({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  siteFilter,
  onSiteFilterChange,
  sites,
  onRefresh,
  isFetching,
}: UserFilterBarProps) {
  const { t } = useAdmin();

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    siteFilter !== 'all';

  const handleClearFilters = () => {
    onSearchChange('');
    onRoleFilterChange('all');
    onStatusFilterChange('all');
    onSiteFilterChange('all');
  };

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search administrators by name, email, or role..."
          className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Select Filters & Refresh */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">{t.users.allRoles || 'All Roles'}</option>
          <option value="super_admin">{t.users.platformRole || 'Super Admin'}</option>
          <option value="site_admin">{t.users.siteRole || 'Site Admin'}</option>
          <option value="site_editor">Site Editor</option>
          <option value="site_author">Site Author</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">{t.users.allStatuses || 'All Statuses'}</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="locked">Locked</option>
        </select>

        {/* Site Filter */}
        <select
          value={siteFilter}
          onChange={(e) => onSiteFilterChange(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">{t.users.allSites || 'All Websites'}</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer"
          >
            <Filter className="size-3" />
            <span>Reset</span>
          </button>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh user list"
        >
          <RefreshCw
            className={`size-3.5 ${isFetching ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
          />
          <span className="hidden sm:inline">{t.actions?.refresh || 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}
