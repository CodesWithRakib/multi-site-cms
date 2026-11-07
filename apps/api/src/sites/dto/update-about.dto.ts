import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SITE_ABOUT_LIMITS } from '@multi-site-cms/validation/site-about';

export class UpdateAboutPillarDto {
  @IsString()
  @MaxLength(SITE_ABOUT_LIMITS.pillarTitle)
  title!: string;

  @IsString()
  @MaxLength(SITE_ABOUT_LIMITS.pillarBody)
  body!: string;
}

/** Full replacement of the About page content (the admin form always sends every field). */
export class UpdateAboutDto {
  @IsString()
  @MaxLength(SITE_ABOUT_LIMITS.eyebrow)
  eyebrow!: string;

  @IsString()
  @MaxLength(SITE_ABOUT_LIMITS.headline)
  headline!: string;

  @IsString()
  @MaxLength(SITE_ABOUT_LIMITS.highlight)
  highlight!: string;

  @IsString()
  @MaxLength(SITE_ABOUT_LIMITS.intro)
  intro!: string;

  @IsArray()
  @ArrayMaxSize(SITE_ABOUT_LIMITS.maxPillars)
  @ValidateNested({ each: true })
  @Type(() => UpdateAboutPillarDto)
  pillars!: UpdateAboutPillarDto[];

  @IsBoolean()
  showWriters!: boolean;
}
