import { IsUUID, ValidateIf } from 'class-validator';

/** `PATCH /auth/me/avatar`: a Media Library image id, or null to remove the photo. */
export class UpdateAvatarDto {
  @ValidateIf((_dto: UpdateAvatarDto, value: unknown) => value !== null)
  @IsUUID('4')
  mediaId!: string | null;
}
