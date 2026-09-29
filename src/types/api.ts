export interface ApiErrorResponse {
  message?: string;
  mensaje?: string;
  detalle?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly data: ApiErrorResponse | null;

  constructor(status: number, message: string, data: ApiErrorResponse | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  static fromResponse(status: number, data: ApiErrorResponse | null): ApiError {
    const message = data?.mensaje ?? data?.message ?? data?.detalle ?? `Error ${status}`;
    return new ApiError(status, message, data);
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
}