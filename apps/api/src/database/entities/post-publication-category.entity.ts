import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Category } from './category.entity';
import { PostPublication } from './post-publication.entity';

/**
 * Publication-level categorization. Taxonomy attaches to what a site actually
 * shows, not to the canonical post, so the same post can be "Destinations" on the
 * travel site and "Reports" elsewhere.
 *
 * The composite keys `(publication_id, site_id)` and `(category_id, site_id)`
 * make cross-site assignment impossible: both sides must carry the same
 * `site_id`, which is checked by foreign keys rather than application code.
 */
@Entity({ name: 'post_publication_categories' })
export class PostPublicationCategory {
  @PrimaryColumn({ name: 'publication_id', type: 'uuid' })
  publicationId!: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @PrimaryColumn({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @ManyToOne(() => PostPublication, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'publication_id', referencedColumnName: 'id' },
    { name: 'site_id', referencedColumnName: 'siteId' },
  ])
  publication!: PostPublication;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'category_id', referencedColumnName: 'id' },
    { name: 'site_id', referencedColumnName: 'siteId' },
  ])
  category!: Category;
}
