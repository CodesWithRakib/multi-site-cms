import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateMediaDto {
  @ApiPropertyOptional({ description: 'Target site ID (null for platform-scoped assets)' })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({ description: 'Original uploaded filename', example: 'hero-banner.jpg' })
  @IsOptional()
  @IsString()
  originalFilename?: string;

  @ApiProperty({ description: 'MIME type of the media asset', example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/, {
    message: 'MIME type must be in standard format (e.g. image/jpeg, image/png, application/pdf)',
  })
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: '204800' })
  @IsNotEmpty()
  byteSize!: string | number;

  @ApiPropertyOptional({
    description: 'SHA-256 or MD5 checksum',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Storage provider', default: 'local' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{0,31}$/, {
    message: 'Storage provider must be lowercase alphanumeric (e.g., local, s3, r2)',
  })
  storageProvider?: string;

  @ApiPropertyOptional({ description: 'Opaque storage object key or path' })
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiPropertyOptional({ description: 'Image width in pixels', example: 1920 })
  @IsOptional()
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels', example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({ description: 'Accessibility alt text' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsOptional()
  @IsString()
  caption?: string;
}
