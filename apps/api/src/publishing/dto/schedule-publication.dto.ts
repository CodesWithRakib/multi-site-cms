import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SchedulePublicationDto {
  @ApiProperty({
    description: 'Target publication instant in ISO 8601 format with timezone or UTC offset',
    example: '2026-11-02T10:00:00.000Z',
  })
  @IsNotEmpty({ message: 'validation.isNotEmpty' })
  @IsISO8601({}, { message: 'publication.scheduledTimeInvalid' })
  scheduledFor!: string;

  @ApiProperty({
    description: 'Optional editorial reason for scheduling',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  reason?: string;
}
