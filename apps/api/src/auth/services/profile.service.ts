import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '@multi-site-cms/types';
import type { DataSource } from 'typeorm';

import { AuditService } from '../../common/audit/audit.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { env } from '../../config/env';
import { DATA_SOURCE } from '../../database/database.tokens';
import { getInitializedRepository } from '../../database/ensure-connected';
import { MediaAsset } from '../../database/entities/media-asset.entity';
import { User } from '../../database/entities/user.entity';
import { publicMediaUrl } from '../../media/public-media-url';
import { AuthorizationService, type EffectiveAuthContext } from './authorization.service';

/**
 * The signed-in user's own profile: currently the avatar shown in the admin
 * and as the author photo on published articles.
 */
@Injectable()
export class ProfileService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly authorizationService: AuthorizationService,
    private readonly auditService: AuditService,
  ) {}

  /** Public URL of a user's avatar, or null when unset or the asset is gone. */
  async avatarUrl(user: Pick<User, 'avatarMediaId'>): Promise<string | null> {
    if (!user.avatarMediaId) return null;
    const mediaRepo = await getInitializedRepository(this.dataSource, MediaAsset);
    const asset = await mediaRepo.findOne({ where: { id: user.avatarMediaId } });
    return asset && !asset.deletedAt ? publicMediaUrl(asset.storageKey, env.API_BASE_URL) : null;
  }

  async toAuthUser(context: EffectiveAuthContext): Promise<AuthUser> {
    return this.authorizationService.toAuthUser(context, await this.avatarUrl(context.user));
  }

  /**
   * Sets (or clears, with null) the caller's avatar. The asset must be an
   * image the caller can already see in the Media Library, so a site admin
   * cannot point their avatar at another site's private upload.
   */
  async updateAvatar(context: EffectiveAuthContext, mediaId: string | null): Promise<AuthUser> {
    if (mediaId) {
      const mediaRepo = await getInitializedRepository(this.dataSource, MediaAsset);
      const asset = await mediaRepo.findOne({ where: { id: mediaId } });
      const visible =
        asset &&
        !asset.deletedAt &&
        (asset.siteId
          ? this.authorizationService.canAccessSite(context, asset.siteId)
          : context.isSuperAdmin);
      if (!visible) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'media.notFound');
      }
      if (!asset.mimeType.startsWith('image/')) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
          'profile.avatarNotImage',
        );
      }
    }

    const userRepo = await getInitializedRepository(this.dataSource, User);
    const previous = context.user.avatarMediaId;
    await userRepo.update({ id: context.user.id }, { avatarMediaId: mediaId });
    context.user.avatarMediaId = mediaId;

    await this.auditService.record({
      actorId: context.user.id,
      actorType: 'user',
      action: 'user.avatar_update',
      entityType: 'user',
      entityId: context.user.id,
      metadata: { previousMediaId: previous, mediaId },
    });

    return this.toAuthUser(context);
  }
}
