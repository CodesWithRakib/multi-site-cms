'use client';

import React from 'react';
import { ShellLayout } from '@/components/shell';
import { CommentsModerationContainer } from '@/features/comments/components/CommentsModerationContainer';

export default function CommentsPage() {
  return (
    <ShellLayout>
      <div className=" py-6">
        <CommentsModerationContainer />
      </div>
    </ShellLayout>
  );
}
