import {
  ApiClientError,
  createApiClient,
  type HttpMethod,
  type QueryValue,
} from '@multi-site-cms/api-client';
import type { ApiSuccess, HealthResponse } from '@multi-site-cms/types';
import { createApi } from '@reduxjs/toolkit/query/react';

export interface PlatformApiOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface PlatformRequestArgs {
  path: string;
  method?: HttpMethod;
  body?: unknown;
  query?: Readonly<Record<string, QueryValue>>;
  headers?: Readonly<Record<string, string>>;
  credentials?: RequestCredentials;
}

export interface PlatformApiError {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

/**
 * A single versioned API definition per application. Domain endpoints are
 * injected by the owning feature module; only operational endpoints belong
 * here.
 */
export function createPlatformApi(options: PlatformApiOptions) {
  const client = createApiClient(options);

  return createApi({
    reducerPath: 'platformApi',
    tagTypes: [
      'Post',
      'Media',
      'Site',
      'User',
      'Publication',
      'Taxonomy',
      'Health',
      'Auth',
      'Comment',
    ],
    baseQuery: async (args: PlatformRequestArgs, { signal }) => {
      try {
        const data = await client.request<ApiSuccess<unknown>>(args.path, {
          method: args.method,
          body: args.body,
          query: args.query,
          headers: args.headers,
          credentials: args.credentials ?? 'include',
          signal,
        });

        return { data: data ?? null };
      } catch (error) {
        if (error instanceof ApiClientError) {
          const apiError: PlatformApiError = {
            status: error.status,
            code: error.code,
            message: error.message,
          };

          if (error.requestId !== undefined) {
            apiError.requestId = error.requestId;
          }

          if (error.details !== undefined) {
            apiError.details = error.details;
          }

          return { error: apiError };
        }

        return {
          error: {
            status: 0,
            code: 'UNKNOWN_ERROR',
            message: 'The API request failed unexpectedly.',
          } satisfies PlatformApiError,
        };
      }
    },
    endpoints: (build) => ({
      getHealth: build.query<HealthResponse, void>({
        query: () => ({ path: '/health' }),
        transformResponse: (response: ApiSuccess<HealthResponse>) => response.data,
      }),
    }),
  });
}

export type PlatformApi = ReturnType<typeof createPlatformApi>;
