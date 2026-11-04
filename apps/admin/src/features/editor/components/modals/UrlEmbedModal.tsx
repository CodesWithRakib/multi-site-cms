'use client';

import React, { useState } from 'react';

export interface UrlEmbedModalProps {
  type: 'link' | 'youtube';
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export function UrlEmbedModal({ type, onClose, onSubmit }: UrlEmbedModalProps) {
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!urlInput.trim()) return;
    onSubmit(urlInput.trim());
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
      <div>
        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
          {type === 'link' ? 'Destination URL *' : 'YouTube Video URL *'}
        </label>
        <input
          type="url"
          required
          autoFocus
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={
            type === 'link'
              ? 'https://example.com'
              : 'https://www.youtube.com/watch?v=...'
          }
          className="w-full px-3 py-2 border rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl cursor-pointer"
        >
          Confirm
        </button>
      </div>
    </form>
  );
}
