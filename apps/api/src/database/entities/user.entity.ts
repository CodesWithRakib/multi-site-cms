import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { UserStatus } from './types';

/**
 * Global platform identity. Users are not owned by a site; access to a site is
 * expressed only through `user_role_assignments`.
 *
 * `password_hash` is excluded from `select` by default so ordinary user queries
 * cannot leak it into a response or a log. Authentication code must opt in.
 */
@Entity({ name: 'users' })
@Check('CHK_users_email_not_blank', '"email"::text <> \'\'')
@Check('CHK_users_status', "\"status\" IN ('active', 'invited', 'suspended', 'disabled')")
@Index('IDX_users_status', ['status'])
export class User {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'citext', unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'text', nullable: true, select: false })
  passwordHash!: string | null;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ type: 'text', default: 'active' })
  status!: UserStatus;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'failed_login_count', type: 'integer', default: 0 })
  failedLoginCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
