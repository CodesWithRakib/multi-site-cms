/**
 * Shared API contract primitives.
 *
 * This package must remain framework-agnostic and free of runtime code so that
 * every application can depend on it without pulling in a UI, server, or state
 * management runtime.
 */

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'HTTP_ERROR';

/**
 * A field-level error detail.
 *
 * `code` is machine-readable and never localized; `message` is localized for the
 * request locale. Clients should branch on `code`/`field`, never on `message`.
 */
export interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
  meta: ApiMeta;
}

export interface HealthResponse {
  status: 'ok';
  service: 'api';
  uptimeSeconds: number;
}

export interface ReadinessCheck {
  status: 'up' | 'down';
  latencyMs: number;
}

export interface ReadinessResponse {
  status: 'ready';
  checks: {
    database: ReadinessCheck;
  };
}
