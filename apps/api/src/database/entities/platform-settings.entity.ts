import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type {
  PlatformGeneralSettings,
  PlatformMaintenanceSettings,
  PlatformMediaSettings,
  PlatformPublishingSettings,
  PlatformSecuritySettings,
} from '@multi-site-cms/types';

/**
 * Singleton record storing platform-wide operational, security,
 * media, publishing, and maintenance configurations.
 */
@Entity({ name: 'platform_settings' })
export class PlatformSettingsEntity {
  @PrimaryColumn({ type: 'varchar', length: 64, default: 'default' })
  id!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  general!: PlatformGeneralSettings;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  security!: PlatformSecuritySettings;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  media!: PlatformMediaSettings;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  publishing!: PlatformPublishingSettings;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  maintenance!: PlatformMaintenanceSettings;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
