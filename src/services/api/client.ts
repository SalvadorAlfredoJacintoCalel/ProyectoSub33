import { ApiError, ApiErrorResponse, RequestOptions, ApiClientConfig } from "../../types/api";
import { tokenStore } from "../auth/tokenStore";

const DEFAULT_BASE_URL = "http://localhost:5196/api";

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(baseUrl: string): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json().catch(() => null)) as { token?: string } | null;
        const token = data?.token ?? null;
        tokenStore.set(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function getBaseUrl(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return DEFAULT_BASE_URL;
}

function buildUrl(baseUrl: string, path: string, params?: RequestOptions["params"]): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${normalizedBase}${normalizedPath}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        qs.append(key, String(value));
      }
    });
    const qsString = qs.toString();
    if (qsString) url = `${url}?${qsString}`;
  }
  return url;
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
  const getToken = config?.getToken ?? (() => tokenStore.get());
  const inFlightRequests = new Map<string, Promise<unknown>>();

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...fetchOptions } = options;
    const url = buildUrl(baseUrl, path, params);
    const method = String(fetchOptions.method ?? "GET").toUpperCase();

    const doFetch = async (token: string | null): Promise<T> => {
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
    };

    const execute = async (): Promise<T> => {
      const token = getToken();
      try {
        return await doFetch(token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && token) {
          const newToken = await refreshAccessToken(baseUrl);
          if (newToken) {
            return await doFetch(newToken);
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("auth:unauthorized"));
          }
        }
        throw error;
      }
    };

    // Deduplicar peticiones GET concurrentes (sin cache de datos obsoletos).
    // Se omite la deduplicación cuando la petición trae su propia señal de
    // cancelación, para no reutilizar una promesa que pudo ser abortada.
    if (method === "GET" && !options.signal) {
      const cacheKey = `GET:${url}`;
      const existing = inFlightRequests.get(cacheKey);
      if (existing) {
        return existing as Promise<T>;
      }

      const promise = execute();
      inFlightRequests.set(cacheKey, promise);
      try {
        return await promise;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    }

    return execute();
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
