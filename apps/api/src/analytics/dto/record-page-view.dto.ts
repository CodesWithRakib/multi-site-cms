import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class RecordPageViewDto {
  @ApiProperty({ description: 'ID of the site where page was viewed' })
  @IsUUID('4')
  siteId!: string;

  @ApiPropertyOptional({ description: 'Optional post ID if viewing a specific article' })
  @IsOptional()
  @IsUUID('4')
  postId?: string;

  @ApiProperty({ description: 'Normalized page path (e.g. / or /top-10-destinations)' })
  @IsString()
  @MaxLength(1024)
  path!: string;

  @ApiPropertyOptional({ description: 'HTTP referrer URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;

  @ApiPropertyOptional({ description: 'Anonymized visitor ID or session hash' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  visitorId?: string;

  @ApiPropertyOptional({ description: 'Time spent on page in seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSeconds?: number;
}
