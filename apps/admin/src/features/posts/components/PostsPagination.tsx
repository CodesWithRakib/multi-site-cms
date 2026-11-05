'use client';

import { Pagination } from '@/components/navigation/Pagination';
import { useAdmin } from '@/lib/admin-context';

import { POSTS_PAGE_SIZE } from '../hooks/usePostsWorkspace';

interface PostsPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly totalPosts: number;
  readonly onPageChange: (page: number) => void;
}

export function PostsPagination({
  page,
  totalPages,
  totalPosts,
  onPageChange,
}: PostsPaginationProps) {
  const { t } = useAdmin();
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      total={totalPosts}
      pageSize={POSTS_PAGE_SIZE}
      itemLabel={t.content.posts || 'posts'}
      onPageChange={onPageChange}
    />
  );
}
