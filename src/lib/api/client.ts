import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./config";
import { clearSession, getRefreshToken, setTokens } from "@/features/auth/session";
import type { TokenRefreshResponse } from "@/features/auth/types";

/**
 * Shared axios client for the backend API.
 * JWT auth: if localStorage.token is present, sends Authorization: Bearer <token>.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!response || response.status !== 401 || !originalRequest) {
      throw error;
    }

    const url = originalRequest.url ?? "";
    const isAuthEndpoint =
      url.includes("/auth/login/") ||
      url.includes("/auth/token/refresh/") ||
      url.includes("/auth/logout/");

    if (originalRequest._retry || isAuthEndpoint) {
      throw error;
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearSession();
      throw error;
    }

    originalRequest._retry = true;

    try {
      // Backend rotates refresh tokens — must persist the new refresh or the
      // next refresh (or a concurrent StrictMode retry) will use a blacklisted token.
      refreshPromise ??= axios
        .post<TokenRefreshResponse>(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .then((refreshResponse) => {
          const nextAccess = refreshResponse.data.access;
          const nextRefresh = refreshResponse.data.refresh ?? refresh;
          setTokens(nextAccess, nextRefresh);
          return nextAccess;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const access = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      throw refreshError;
    }
  }
);
