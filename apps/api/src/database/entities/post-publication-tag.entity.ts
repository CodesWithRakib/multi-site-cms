import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { PostPublication } from './post-publication.entity';
import { Tag } from './tag.entity';

/**
 * Publication-level tagging, the tag counterpart of
 * `post_publication_categories`. Same-site enforcement is relational: both
 * composite foreign keys include `site_id`.
 */
@Entity({ name: 'post_publication_tags' })
export class PostPublicationTag {
  @PrimaryColumn({ name: 'publication_id', type: 'uuid' })
  publicationId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @PrimaryColumn({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @ManyToOne(() => PostPublication, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'publication_id', referencedColumnName: 'id' },
    { name: 'site_id', referencedColumnName: 'siteId' },
  ])
  publication!: PostPublication;

  @ManyToOne(() => Tag, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'tag_id', referencedColumnName: 'id' },
    { name: 'site_id', referencedColumnName: 'siteId' },
  ])
  tag!: Tag;
}
