import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadMediaDto {
  @ApiPropertyOptional({ description: 'Target site ID (omit or empty for platform-wide asset)' })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({ description: 'Accessibility alt text' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsOptional()
  @IsString()
  caption?: string;
}
