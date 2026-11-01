import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @ApiPropertyOptional({ description: 'Tag display name', example: 'Adventure' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'URL-safe tag slug', example: 'adventure' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Optional tag description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
