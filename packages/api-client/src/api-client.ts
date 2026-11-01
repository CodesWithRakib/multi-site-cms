export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  defaultHeaders?: Readonly<Record<string, string>>;
  credentials?: RequestCredentials;
  /**
   * Injection point for tests and non-standard runtimes. Defaults to the global
   * fetch implementation.
   */
  fetch?: typeof fetch;
}

export interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Readonly<Record<string, string>>;
  body?: unknown;
  query?: Readonly<Record<string, QueryValue>>;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
}

export interface ApiClient {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
}

export interface ApiClientErrorOptions {
  status: number;
  code: string;
  requestId?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly details: unknown;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

interface ParsedApiError {
  code: string;
  message: string;
  requestId: string | undefined;
  details: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readApiError(payload: unknown, response: Response): ParsedApiError | undefined {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return undefined;
  }

  const { error, meta } = payload;

  if (typeof error.code !== 'string' || typeof error.message !== 'string') {
    return undefined;
  }

  const requestId =
    (isRecord(meta) && typeof meta.requestId === 'string' ? meta.requestId : undefined) ??
    response.headers.get('x-request-id') ??
    undefined;

  return {
    code: error.code,
    message: error.message,
    requestId,
    details: error.details,
  };
}

function buildUrl(
  baseUrl: string,
  path: string,
  query: Readonly<Record<string, QueryValue>> | undefined,
): string {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(path)) {
    throw new ApiClientError('Absolute request URLs are not allowed.', {
      status: 0,
      code: 'INVALID_REQUEST',
    });
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(
    normalizedPath.length > 0 ? `${normalizedBase}/${normalizedPath}` : normalizedBase,
  );

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Create a typed JSON client for the public API contract.
 *
 * The client is deliberately framework-agnostic: it can be used in Next.js
 * server components, route handlers, tests, or the RTK Query base query. It
 * never accepts absolute request URLs, preventing accidental request forgery
 * against arbitrary hosts from a caller-controlled path.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.trim();
  const timeoutMs = options.timeoutMs ?? 8_000;

  if (baseUrl.length === 0) {
    throw new ApiClientError('An API base URL is required.', {
      status: 0,
      code: 'INVALID_CONFIGURATION',
    });
  }

  try {
    const parsedBaseUrl = new URL(baseUrl);
    if (parsedBaseUrl.protocol !== 'http:' && parsedBaseUrl.protocol !== 'https:') {
      throw new Error('Unsupported protocol.');
    }
  } catch {
    throw new ApiClientError('The API base URL must be an absolute HTTP(S) URL.', {
      status: 0,
      code: 'INVALID_CONFIGURATION',
    });
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ApiClientError('The API timeout must be a positive number.', {
      status: 0,
      code: 'INVALID_CONFIGURATION',
    });
  }

  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);

  return {
    async request<T>(path: string, requestOptions: ApiRequestOptions = {}): Promise<T> {
      const url = buildUrl(baseUrl, path, requestOptions.query);
      const controller = new AbortController();
      let timedOut = false;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      const externalSignal = requestOptions.signal;
      const handleExternalAbort = (): void => {
        controller.abort();
      };

      if (externalSignal) {
        if (externalSignal.aborted) {
          handleExternalAbort();
        } else {
          externalSignal.addEventListener('abort', handleExternalAbort, { once: true });
        }
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...options.defaultHeaders,
        ...requestOptions.headers,
      };

      const isFormData = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData;

      const hasContentType = Object.keys(headers).some(
        (headerName) => headerName.toLowerCase() === 'content-type',
      );

      if (requestOptions.body !== undefined && !hasContentType && !isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const requestCredentials = requestOptions.credentials ?? options.credentials;

      try {
        const response = await fetchImpl(url, {
          method: requestOptions.method ?? 'GET',
          headers,
          body:
            requestOptions.body === undefined
              ? undefined
              : isFormData
                ? (requestOptions.body as FormData)
                : JSON.stringify(requestOptions.body),
          credentials: requestCredentials,
          signal: controller.signal,
          cache: 'no-store',
        });

        const text = await response.text();
        let payload: unknown;

        if (text.length > 0) {
          try {
            payload = JSON.parse(text) as unknown;
          } catch {
            if (response.ok) {
              throw new ApiClientError('The API returned an invalid JSON response.', {
                status: response.status,
                code: 'INVALID_RESPONSE',
                requestId: response.headers.get('x-request-id') ?? undefined,
              });
            }
          }
        }

        if (!response.ok) {
          const apiError = readApiError(payload, response);

          throw new ApiClientError(
            apiError?.message ?? `The API request failed with status ${response.status}.`,
            {
              status: response.status,
              code: apiError?.code ?? `HTTP_${response.status}`,
              requestId: apiError?.requestId,
              details: apiError?.details,
            },
          );
        }

        if (response.status === 204 || text.length === 0) {
          return undefined as T;
        }

        return payload as T;
      } catch (error) {
        if (error instanceof ApiClientError) {
          throw error;
        }

        if (controller.signal.aborted) {
          throw new ApiClientError(
            timedOut ? 'The API request timed out.' : 'The API request was aborted.',
            {
              status: 0,
              code: timedOut ? 'REQUEST_TIMEOUT' : 'REQUEST_ABORTED',
            },
          );
        }

        throw new ApiClientError(
          error instanceof Error ? error.message : 'The API request failed.',
          {
            status: 0,
            code: 'NETWORK_ERROR',
          },
        );
      } finally {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', handleExternalAbort);
      }
    },
  };
}
