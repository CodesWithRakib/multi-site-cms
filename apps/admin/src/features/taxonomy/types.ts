import type { CategoryItem } from '@multi-site-cms/types';

export type TaxonomyTab = 'categories' | 'tags';

export interface TaxonomyActionMessage {
  type: 'success' | 'error';
  text: string;
}

export interface CategoryNode extends CategoryItem {
  children?: CategoryItem[];
}
