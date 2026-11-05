import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import type { AnalyticsTimeframe } from '@multi-site-cms/types';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter analytics by site ID (Super Admin can omit for platform-wide aggregated metrics)',
  })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Number of days to analyze (e.g. 7, 14, 30, 90, 365)',
    default: 30,
    enum: [7, 14, 30, 90, 365],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? 30 : parsed;
    }
    return value;
  })
  @IsInt()
  @IsIn([7, 14, 30, 90, 365])
  days?: number = 30;

  @ApiPropertyOptional({
    description: 'Timeframe shorthand (7d, 14d, 30d, 90d, 1y)',
    enum: ['7d', '14d', '30d', '90d', '1y'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['7d', '14d', '30d', '90d', '1y'])
  timeframe?: AnalyticsTimeframe;
}
