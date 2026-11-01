import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelScheduleDto {
  @ApiProperty({
    description: 'Reason for cancelling the scheduled publication',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  reason?: string;
}
