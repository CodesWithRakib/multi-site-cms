'use client';

import { ShellLayout } from '@/components/shell';
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
export default function PostsPage() {
  const { setActiveSiteId } = useAdmin();
  const workspace = usePostsWorkspace();
  const { filters, publishingTarget } = workspace;

  return (
    <ShellLayout>
      <div className="w-full flex flex-col gap-6">
        <PostsWorkspaceHeader
          isFetching={workspace.isFetching}
          onRefresh={() => workspace.refetch()}
        />

        <PostsStatsCards stats={workspace.stats} isLoading={workspace.isLoading} />

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
