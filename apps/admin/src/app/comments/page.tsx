'use client';

import React from 'react';
import { ShellLayout } from '@/components/shell';
import { CommentsModerationContainer } from '@/features/comments/components/CommentsModerationContainer';

export default function CommentsPage() {
  return (
    <ShellLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <CommentsModerationContainer />
      </div>
    </ShellLayout>
  );
}
