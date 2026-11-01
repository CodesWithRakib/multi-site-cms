import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ArchivePublicationDto {
  @ApiProperty({
    description: 'Reason for archiving the publication',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'validation.isString' })
  reason?: string;
}
