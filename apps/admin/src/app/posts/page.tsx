'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { ActionNotice } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { DeletePostDialog } from '@/features/posts/components/DeletePostDialog';
import { PostsFilterBar } from '@/features/posts/components/PostsFilterBar';
import { PostsStatsCards } from '@/features/posts/components/PostsStatsCards';
import { PostsStatusTabs } from '@/features/posts/components/PostsStatusTabs';
import { PostsTable } from '@/features/posts/components/PostsTable';
import { PostsWorkspaceHeader } from '@/features/posts/components/PostsWorkspaceHeader';
import { PublishingModal } from '@/features/posts/components/PublishingModal';
import { usePostsWorkspace } from '@/features/posts/hooks/usePostsWorkspace';
import { useAdmin } from '@/lib/admin-context';

/**
 * Posts workspace: orchestration only. State and data live in
 * usePostsWorkspace; each section is a component in features/posts.
 */
function PostsWorkspacePage({ initialSearch }: { readonly initialSearch: string }) {
  const { setActiveSiteId } = useAdmin();
  const workspace = usePostsWorkspace(initialSearch);
  const { filters, publishingTarget } = workspace;

  return (
    <ShellLayout>
      <div className="w-full flex flex-col gap-6">
        <PostsWorkspaceHeader
          isFetching={workspace.isFetching}
          onRefresh={() => workspace.refetch()}
        />

        <ActionNotice notice={workspace.notice} onDismiss={workspace.dismissNotice} />

        <PostsStatsCards stats={workspace.stats} isLoading={workspace.isStatsLoading} />

        <PostsStatusTabs
          stats={workspace.stats}
          activeStatus={filters.statusFilter}
          onChange={workspace.setStatusFilter}
        />

        <PostsFilterBar
          sites={workspace.sites}
          searchTerm={filters.searchTerm}
          typeFilter={filters.typeFilter}
          hasActiveFilters={workspace.hasActiveFilters}
          onSearchChange={workspace.setSearchTerm}
          onTypeChange={workspace.setTypeFilter}
          onSiteChange={(siteId) => {
            setActiveSiteId(siteId);
            workspace.setPage(1);
          }}
          onClear={workspace.clearFilters}
        />

        <PostsTable {...workspace} />
      </div>

      <DeletePostDialog
        target={workspace.pendingDelete}
        isDeleting={workspace.isDeleting}
        onCancel={workspace.cancelDelete}
        onConfirm={() => void workspace.confirmDelete()}
      />

      {publishingTarget && (
        <PublishingModal
          isOpen
          onClose={workspace.closePublishing}
          action={publishingTarget.action}
          publication={publishingTarget.publication}
          postTitle={publishingTarget.title}
          onSuccess={() => workspace.refetch()}
        />
      )}
    </ShellLayout>
  );
}

/** Reads `?q=` (set by the header search) and restarts the workspace when it changes. */
function PostsRoute() {
  const query = useSearchParams().get('q') ?? '';
  return <PostsWorkspacePage key={query} initialSearch={query} />;
}

export default function PostsPage() {
  return (
    <Suspense fallback={null}>
      <PostsRoute />
    </Suspense>
  );
}
