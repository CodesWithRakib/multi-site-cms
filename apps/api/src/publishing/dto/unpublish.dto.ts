import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnpublishDto {
  @ApiProperty({
    description: 'Reason for unpublishing the content back to draft status',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  reason?: string;
}
