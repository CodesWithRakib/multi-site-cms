import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { User } from './user.entity';

/**
 * Server-side session record.
 *
 * `token_hash` stores the SHA-256 digest of the opaque, cryptographically random
 * session token delivered via an HttpOnly cookie. Raw session tokens are never
 * persisted in plaintext.
 *
 * Sessions can be explicitly revoked (`revoked_at`), expire naturally (`expires_at`),
 * or expire via idle timeout evaluated against `last_active_at`.
 */
@Entity({ name: 'sessions' })
@Check('CHK_sessions_token_hash_not_blank', 'length(btrim("token_hash")) > 0')
@Check('CHK_sessions_expiry_after_created', '"expires_at" > "created_at"')
@Index('IDX_sessions_expires_at', ['expiresAt'])
export class Session {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash!: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_active_at', type: 'timestamptz', default: () => 'now()' })
  lastActiveAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
