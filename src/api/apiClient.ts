import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { useAuthStore } from "@/auth/authStore";
import type { ApiResponse, ErrorResponse } from "./types";

export class ApiError extends Error {
  public constructor(
    public response: ErrorResponse,
    public axiosResponse: AxiosResponse,
  ) {
    super(response.message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  protected axios: AxiosInstance;

  public constructor(baseUrl: string, authenticated = true) {
    this.axios = Axios.create({ baseURL: baseUrl, validateStatus: () => true });

    if (authenticated) {
      this.axios.interceptors.request.use(async (config) => {
        const token = await useAuthStore.getState().getAccessToken(5);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
    }
  }

  public async request<T>(config: AxiosRequestConfig) {
    const res = await this.axios.request<ApiResponse<T>>(config);
    const body = res.data;

    if (isApiErrorResponse(body)) {
      throw new ApiError(body, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return body;
    }

    throw new ApiError(toErrorResponse(body, res.status), res);
  }

  public get<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ url, method: "GET", ...config });
  }

  public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.request<T>({ url, data, method: "POST", ...config });
  }

  public patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.request<T>({ url, data, method: "PATCH", ...config });
  }

  public delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ url, method: "DELETE", ...config });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorResponse(value: unknown): value is ErrorResponse {
  return isRecord(value) && value.error === true;
}

function toErrorResponse(body: unknown, status: number): ErrorResponse {
  if (isRecord(body) && typeof body.message === "string") {
    return {
      error: true,
      message: body.message,
      code: typeof body.code === "string" ? body.code : undefined,
      details: typeof body.details === "string" ? body.details : undefined,
    };
  }

  if (typeof body === "string" && body.trim()) {
    return { error: true, message: body };
  }

  return {
    error: true,
    message: `Request failed with status ${status}`,
  };
}
