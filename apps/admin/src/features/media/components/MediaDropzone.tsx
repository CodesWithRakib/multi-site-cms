'use client';

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useUploadMediaMutation } from '@/lib/cms-api';
import type { MediaAssetItem } from '@multi-site-cms/types';

export interface MediaDropzoneProps {
  siteId?: string;
  onUploaded?: (asset: MediaAssetItem) => void;
}

export function MediaDropzone({ siteId, onUploaded }: MediaDropzoneProps) {
  const [uploadMedia, { isLoading }] = useUploadMediaMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const isVideo = file.type.startsWith('video/') || file.type.startsWith('audio/');
    const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrorMsg(`File too large. Maximum allowed size is ${isVideo ? '50MB' : '15MB'}.`);
      return;
    }

    setSelectedFile(file);
    if (!altText) {
      // Suggest alt text from clean filename
      const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setAltText(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (siteId) formData.append('siteId', siteId);
    if (altText.trim()) formData.append('altText', altText.trim());
    if (caption.trim()) formData.append('caption', caption.trim());

    try {
      const result = await uploadMedia(formData).unwrap();
      setSuccessMsg('Media uploaded successfully!');
      setSelectedFile(null);
      setAltText('');
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploaded) {
        onUploaded(result.media);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; details?: unknown };
      setErrorMsg(errorObj.message || 'Failed to upload media. Check file signature and size.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : selectedFile
              ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,application/pdf,video/mp4"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(selectedFile.size / 1024).toFixed(1)} KB — Click or drop another file to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Click to select or drag and drop media here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PNG, JPG, WebP, SVG, GIF, PDF (up to 15MB) or MP4 (up to 50MB)
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {selectedFile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-2">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
              Alt Text (Accessibility)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descriptive image summary"
              className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 text-xs">
              Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Photo credit or caption"
              className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!selectedFile || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm shadow-xs"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isLoading ? 'Uploading...' : 'Upload Media Asset'}</span>
        </button>
      </div>
    </form>
  );
}
