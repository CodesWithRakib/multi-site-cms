'use client';

import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { PostForm } from '@/features/posts';
import { useGetPostQuery } from '@/lib/cms-api';

export default function EditPostPage() {
  const params = useParams();
  const rawPostId = params?.postId;
  const postId =
    typeof rawPostId === 'string' ? rawPostId : Array.isArray(rawPostId) ? rawPostId[0] || '' : '';

  const { data: post, isLoading, error } = useGetPostQuery(postId, { skip: !postId });

  if (isLoading) {
    return (
      <ShellLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 dark:text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs">Loading post content...</span>
        </div>
      </ShellLayout>
    );
  }

  if (error || !post) {
    return (
      <ShellLayout>
        <div className="max-w-md mx-auto my-16 p-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <h2 className="text-lg font-bold text-red-900 dark:text-red-200">Post Not Found</h2>
          <p className="text-xs text-red-700 dark:text-red-300">
            The requested post could not be loaded or has been archived.
          </p>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div className="py-2">
        <PostForm initialPost={post} isCreateMode={false} />
      </div>
    </ShellLayout>
  );
}
