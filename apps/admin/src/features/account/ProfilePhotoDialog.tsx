'use client';

import { useState } from 'react';
import { ImageUp, Loader2, Trash2 } from 'lucide-react';
import type { MediaAssetItem } from '@multi-site-cms/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@multi-site-cms/ui';

import { MediaLibraryModal } from '@/features/media';
import { useAdmin } from '@/lib/admin-context';
import { apiErrorMessage } from '@/lib/api-error';
import { useUpdateMyAvatarMutation } from '@/lib/cms-api';

import { UserAvatar } from './UserAvatar';

interface ProfilePhotoDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * Lets any signed-in user set their profile photo from the Media Library
 * (upload or pick). The photo appears in the admin and as the author photo
 * on every article they wrote.
 */
export function ProfilePhotoDialog({ open, onClose }: ProfilePhotoDialogProps) {
  const { user } = useAdmin();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateAvatar, { isLoading }] = useUpdateMyAvatarMutation();

  if (!user) return null;

  const save = async (mediaId: string | null) => {
    setError(null);
    try {
      await updateAvatar({ mediaId }).unwrap();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'The photo could not be saved.'));
    }
  };

  const handleSelect = (asset: MediaAssetItem) => {
    setIsLibraryOpen(false);
    if (!asset.mimeType.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG or WebP).');
      return;
    }
    void save(asset.id);
  };

  return (
    <>
      <Dialog open={open && !isLibraryOpen} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Profile photo</DialogTitle>
            <DialogDescription>
              Shown in the admin and next to your name on every article you publish.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            <UserAvatar
              name={user.displayName}
              avatarUrl={user.avatarUrl}
              className="size-28 text-3xl ring-4 ring-primary/15"
            />
            <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
            {error && (
              <p role="alert" className="text-center text-xs font-medium text-destructive">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <button
              type="button"
              disabled={isLoading || !user.avatarUrl}
              onClick={() => void save(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsLibraryOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <ImageUp aria-hidden="true" className="size-4" />
              )}
              {user.avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectMedia={handleSelect}
      />
    </>
  );
}
