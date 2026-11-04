import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListAdminCommentsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by specific site UUID' })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Filter by comment moderation status',
    enum: ['all', 'approved', 'pending', 'rejected', 'spam'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'approved', 'pending', 'rejected', 'spam'])
  status?: 'all' | 'approved' | 'pending' | 'rejected' | 'spam';

  @ApiPropertyOptional({ description: 'Search term across author name, email, or content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by specific publication UUID' })
  @IsOptional()
  @IsUUID('4')
  publicationId?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page limit (1-100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
