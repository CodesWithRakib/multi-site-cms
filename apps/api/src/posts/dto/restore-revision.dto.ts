import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RestoreRevisionDto {
  @ApiPropertyOptional({ description: 'Reason or summary for restoring this revision' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeSummary?: string;
}
