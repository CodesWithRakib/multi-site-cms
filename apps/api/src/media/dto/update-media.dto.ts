import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({ description: 'Original uploaded filename' })
  @IsOptional()
  @IsString()
  originalFilename?: string | null;

  @ApiPropertyOptional({ description: 'Accessibility alt text' })
  @IsOptional()
  @IsString()
  altText?: string | null;

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsOptional()
  @IsString()
  caption?: string | null;
}
