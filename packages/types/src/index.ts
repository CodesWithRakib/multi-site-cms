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
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'HTTP_ERROR';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: string[];
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
