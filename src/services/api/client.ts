import { ApiError, ApiErrorResponse, RequestOptions, ApiClientConfig } from "../../types/api";

const DEFAULT_BASE_URL = "http://localhost:5196/api";

function getBaseUrl(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return DEFAULT_BASE_URL;
}

function buildUrl(baseUrl: string, path: string, params?: RequestOptions["params"]): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

function getAuthHeader(token?: string | null): Record<string, string> {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function parseErrorResponse(response: Response): Promise<ApiErrorResponse | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text) as ApiErrorResponse;
  } catch {
    return null;
  }
}

function createJsonHeaders(token?: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...getAuthHeader(token),
  };
}

export function createApiClient(config?: Partial<ApiClientConfig>): {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, body: unknown, options?: RequestOptions) => Promise<T>;
  put: <T>(path: string, body: unknown, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, body: unknown, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
} {
  const baseUrl = config?.baseUrl ?? getBaseUrl();
  const getToken = config?.getToken ?? (() => localStorage.getItem("authToken"));

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...fetchOptions } = options;
    const token = getToken();

    const url = buildUrl(baseUrl, path, params);
    const mergedHeaders: Record<string, string> = {
      ...createJsonHeaders(token),
      ...(headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      const errorData = await parseErrorResponse(response);
      throw ApiError.fromResponse(response.status, errorData);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
    patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
  };
}

export const apiClient = createApiClient();

export { ApiError };
export type { ApiErrorResponse, RequestOptions, ApiClientConfig };