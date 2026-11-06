import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { EVENT_STATUSES, type EventStatus } from '../../database/entities/types';

export const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateEventDto {
  @ApiProperty({ example: 'Shakrain Festival 2027' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'shakrain-festival-2027' })
  @IsString()
  @MaxLength(120)
  @Matches(EVENT_SLUG_PATTERN, {
    message: 'Slug must contain only lowercase alphanumeric characters and single hyphens',
  })
  slug!: string;

  @ApiPropertyOptional({ enum: EVENT_STATUSES, default: 'scheduled' })
  @IsOptional()
  @IsIn(EVENT_STATUSES)
  status?: EventStatus;

  @ApiProperty({ description: 'ISO 8601 start time' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional({ description: 'ISO 8601 end time', nullable: true })
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}
