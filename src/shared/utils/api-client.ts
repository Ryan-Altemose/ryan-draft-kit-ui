import { ERROR_MESSAGES } from '@/shared/constants';
import {
  clearStoredBackendUserId,
  getStoredUserId,
} from '@/features/UserSession/user-session-storage';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

type UnauthorizedHandler = (() => void) | null;

const PROTECTED_USER_SCOPED_ROUTE =
  /^\/api\/(?:leagues(?:\/|$)|notebooks(?:\/|$)|users\/me(?:\/|$))/;

let backendUnauthorizedHandler: UnauthorizedHandler = null;

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function setBackendUnauthorizedHandler(
  handler: UnauthorizedHandler,
): void {
  backendUnauthorizedHandler = handler;
}

class ApiClient {
  private baseURL: string;
  private apiKey?: string;
  private injectUserHeader: boolean;

  constructor(
    baseURL: string,
    apiKey?: string,
    injectUserHeader: boolean = false,
  ) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.injectUserHeader = injectUserHeader;
  }

  private shouldAttachUserHeader(endpoint: string): boolean {
    return this.injectUserHeader && PROTECTED_USER_SCOPED_ROUTE.test(endpoint);
  }

  private getHeaders(
    endpoint: string,
    customHeaders?: HeadersInit,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    if (this.shouldAttachUserHeader(endpoint)) {
      const userId = getStoredUserId();

      if (!userId) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, 401);
      }

      headers['X-User-Id'] = userId;
    }

    if (customHeaders) {
      if (customHeaders instanceof Headers) {
        customHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(customHeaders)) {
        customHeaders.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, customHeaders);
      }
    }

    return headers;
  }

  private async readErrorPayload(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return undefined;
      }
    }

    try {
      const text = await response.text();
      return text.trim() ? text : undefined;
    } catch {
      return undefined;
    }
  }

  private async throwForResponse(
    response: Response,
    endpoint: string,
  ): Promise<never> {
    const payload = await this.readErrorPayload(response);
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : response.statusText || ERROR_MESSAGES.GENERIC;

    if (response.status === 401 && this.shouldAttachUserHeader(endpoint)) {
      clearStoredBackendUserId();
      backendUnauthorizedHandler?.();
    }

    throw new ApiError(message, response.status, payload);
  }

  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const hasAbsoluteBase = Boolean(this.baseURL);
    const url = hasAbsoluteBase
      ? new URL(`${this.baseURL}${endpoint}`)
      : new URL(endpoint, 'http://localhost');

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    if (!hasAbsoluteBase) {
      return `${url.pathname}${url.search}`;
    }

    return url.toString();
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(endpoint, options?.headers),
      ...options,
    });

    if (!response.ok) {
      return this.throwForResponse(response, endpoint);
    }

    return response.json();
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(endpoint, options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      return this.throwForResponse(response, endpoint);
    }

    return response.json();
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(endpoint, options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      return this.throwForResponse(response, endpoint);
    }

    return response.json();
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(endpoint, options?.headers),
      ...options,
    });

    if (!response.ok) {
      return this.throwForResponse(response, endpoint);
    }

    return response.json();
  }
}

export const backendClient = new ApiClient(BACKEND_URL, API_KEY, true);
export const externalApiClient = new ApiClient(API_URL, API_KEY);
export const localApiClient = new ApiClient('', API_KEY, true);
export const apiClient = backendClient;
