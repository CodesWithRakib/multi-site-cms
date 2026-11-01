import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ApiErrorDetail, ApiErrorPayload } from '@multi-site-cms/types';

/**
 * OpenAPI models for the shared envelope.
 *
 * These classes exist for documentation only; the runtime payloads are plain
 * objects built by the interceptor and the exception filter. Keeping the shape in
 * `@multi-site-cms/types` means the document cannot drift from the contract.
 */
export class ApiMetaDto {
  @ApiProperty({ example: '3f1b8f5e-0f0a-4f5e-9f0a-1b2c3d4e5f60' })
  requestId!: string;

  @ApiProperty({ example: '2026-11-01T10:00:00.000Z' })
  timestamp!: string;
}

export class ApiErrorDetailDto implements ApiErrorDetail {
  @ApiPropertyOptional({ example: 'email' })
  field?: string;

  @ApiProperty({ example: 'isEmail' })
  code!: string;

  @ApiProperty({ example: 'Enter a valid email address.' })
  message!: string;
}

export class ApiErrorPayloadDto implements ApiErrorPayload {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: ApiErrorPayload['code'];

  @ApiProperty({ example: 'The request contains invalid fields.' })
  message!: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: ApiErrorPayloadDto })
  error!: ApiErrorPayloadDto;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}
