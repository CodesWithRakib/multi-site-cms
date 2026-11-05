import { IsString, MaxLength, MinLength } from 'class-validator';

/** `POST /auth/password`: the signed-in user changes their own password. */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  /** Final rules come from the platform password policy (Settings → Security). */
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
