export type MediaViewMode = 'grid' | 'list';
export type MediaTab = 'browse' | 'upload';

export interface MediaStats {
  total: number;
  storageFormatted: string;
  images: number;
  docsAndOther: number;
}

