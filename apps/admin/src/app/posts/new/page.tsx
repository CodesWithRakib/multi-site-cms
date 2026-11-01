'use client';

import { ShellLayout } from '@/components/shell';
import { PostForm } from '@/features/posts';

export default function NewPostPage() {
  return (
    <ShellLayout>
      <div className="py-2">
        <PostForm isCreateMode={true} />
      </div>
    </ShellLayout>
  );
}
