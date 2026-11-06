'use client';

import { Pagination } from '@/components/navigation/Pagination';
import { useAdmin } from '@/lib/admin-context';

interface PostsPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly totalPosts: number;
  readonly pageSize: number;
  readonly pageSizeOptions: readonly number[];
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function PostsPagination({
  page,
  totalPages,
  totalPosts,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PostsPaginationProps) {
  const { t } = useAdmin();
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      total={totalPosts}
      pageSize={pageSize}
      itemLabel={t.content.posts || 'posts'}
      onPageChange={onPageChange}
      pageSizeOptions={pageSizeOptions}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
