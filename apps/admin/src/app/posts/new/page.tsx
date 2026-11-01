'use client';

import { PostForm } from '@/features/posts';

export default function NewPostPage() {
  return (
    <div className="py-6 px-4">
      <PostForm isCreateMode={true} />
    </div>
  );
}
