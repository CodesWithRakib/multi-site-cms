import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: 'Tag display name', example: 'Adventure' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'URL-safe tag slug', example: 'adventure' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and single hyphens',
  })
  slug!: string;

  @ApiPropertyOptional({ description: 'Optional tag description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
