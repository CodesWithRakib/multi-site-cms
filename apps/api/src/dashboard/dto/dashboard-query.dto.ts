import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID } from 'class-validator';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Filter overview by site ID (Super Admin can omit for platform-wide metrics)',
  })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({
    description: 'Number of days for content activity series (e.g. 7, 14, 30, 90)',
    default: 30,
    enum: [7, 14, 30, 90],
  })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @IsIn([7, 14, 30, 90])
  days?: number = 30;
}
