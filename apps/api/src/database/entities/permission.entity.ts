import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * A stable, machine-checked capability such as `publication:publish`.
 *
 * Permission keys are global rather than role-specific so new roles can be
 * introduced by granting existing permissions instead of editing guards.
 */
@Entity({ name: 'permissions' })
@Check('CHK_permissions_key_not_blank', '"key"::text <> \'\'')
@Check('CHK_permissions_key_format', '"key"::text ~ \'^[a-z][a-z0-9_]*(:[a-z][a-z0-9_]*)+$\'')
export class Permission {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'citext', unique: true })
  key!: string;

  @Column({ type: 'text' })
  description!: string;
}
