import { isAxiosError } from "axios";
import { api } from "@/lib/api/client";
import { auth } from "./authStore";
import {
  clearSession,
  getRefreshToken,
  hasStoredSession,
  setTokens,
} from "./session";
import type {
  AuthAccessContext,
  AuthOrganization,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  TokenRefreshPayload,
  TokenRefreshResponse,
  TokenResponse,
  TokenVerifyPayload,
} from "./types";

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined || value === "" ? null : Number(value);
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function parseAccessContext(data: unknown): AuthAccessContext | null {
  if (!data || typeof data !== "object") return null;
  const context = data as Record<string, unknown>;
  return {
    id: Number(context.id),
    organization: nullableNumber(context.organization),
    organization_name: String(context.organization_name ?? ""),
    organization_unit: nullableNumber(context.organization_unit),
    organization_unit_name: String(context.organization_unit_name ?? ""),
    partner_organization: nullableNumber(context.partner_organization),
    partner_organization_name: String(context.partner_organization_name ?? ""),
    project: nullableNumber(context.project),
    project_name: String(context.project_name ?? ""),
    selected_top_role_assignment: nullableNumber(context.selected_top_role_assignment),
    top_role_name: String(context.top_role_name ?? ""),
    selected_role_assignment: nullableNumber(context.selected_role_assignment),
    selected_role_name: String(context.selected_role_name ?? ""),
    permission_codes: Array.isArray(context.permission_codes)
      ? context.permission_codes.map(String)
      : [],
    is_active: Boolean(context.is_active),
    last_used_at: nullableString(context.last_used_at),
  };
}

function parseAuthOrganization(data: unknown): AuthOrganization | null {
  if (!data || typeof data !== "object") return null;
  const organization = data as Record<string, unknown>;
  return {
    id: Number(organization.id),
    organization_id: String(organization.organization_id ?? ""),
    name: String(organization.name ?? ""),
    code: String(organization.code ?? ""),
    membership_id: String(organization.membership_id ?? ""),
    membership_type: String(organization.membership_type ?? ""),
    status: String(organization.status ?? ""),
  };
}

function parseAuthUser(data: unknown): AuthUser {
  const user = data as Record<string, unknown>;
  const permissions = Array.isArray(user.permission_codes)
    ? user.permission_codes.map(String)
    : Array.isArray(user.permissions)
      ? user.permissions.map(String)
      : [];

  return {
    id: Number(user.id),
    email: String(user.email ?? ""),
    username: String(user.username ?? ""),
    first_name: String(user.first_name ?? ""),
    last_name: String(user.last_name ?? ""),
    user_type: String(user.user_type ?? ""),
    is_staff: Boolean(user.is_staff),
    is_superuser: Boolean(user.is_superuser),
    roles: Array.isArray(user.roles) ? user.roles.map(String) : [],
    permissions,
    permission_codes: permissions,
    active_access_context: parseAccessContext(user.active_access_context),
  };
}

function isUnauthorizedError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401;
}

/** Dedupes concurrent bootstraps (e.g. React StrictMode double-mount). */
let restorePromise: Promise<AuthUser | null> | null = null;

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>("/auth/login/", payload);
    return {
      ...response.data,
      user: parseAuthUser(response.data.user),
      organization: parseAuthOrganization(response.data.organization),
    };
  },

  refreshToken: async (payload: TokenRefreshPayload): Promise<TokenRefreshResponse> => {
    const response = await api.post<TokenRefreshResponse>("/auth/token/refresh/", payload);
    return response.data;
  },

  verifyToken: async (payload: TokenVerifyPayload): Promise<void> => {
    await api.post("/auth/token/verify/", payload);
  },

  me: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>("/auth/me/");
    return parseAuthUser(response.data);
  },

  logout: async (): Promise<void> => {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      } else {
        await api.post("/auth/logout/");
      }
    } catch {
      // Token may already be expired; logout must still complete locally.
    } finally {
      clearSession();
      auth.clearUser();
    }
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ detail?: string }> => {
    const response = await api.post<{ detail?: string }>("/auth/change-password/", payload);
    return response.data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ detail?: string }> => {
    const response = await api.post<{ detail?: string }>("/auth/forgot-password/", payload);
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ detail?: string }> => {
    const response = await api.post<{ detail?: string }>("/auth/reset-password/", payload);
    return response.data;
  },

  logoutLocal: (): void => {
    clearSession();
    auth.clearUser();
  },
};

export async function establishSession(tokens: TokenResponse): Promise<AuthUser> {
  setTokens(tokens.access, tokens.refresh);
  const user = await authApi.me().catch(() => parseAuthUser(tokens.user));
  auth.setSession(user, tokens.organization ?? auth.getOrganization());
  return user;
}

/**
 * Restore session after a full page reload.
 * - Uses one in-flight promise so StrictMode / multiple callers share work
 * - Tries /auth/me/, then explicit refresh+me before clearing tokens
 * - Only clears the session on definitive auth failure
 */
export async function restoreSession(): Promise<AuthUser | null> {
  if (!hasStoredSession()) {
    return null;
  }

  if (!restorePromise) {
    restorePromise = (async () => {
      try {
        const user = await authApi.me();
        auth.setUser(user);
        return user;
      } catch (error) {
        const refresh = getRefreshToken();

        // Transient/network errors: keep cached session if we still have tokens.
        if (!isUnauthorizedError(error)) {
          return auth.getUser();
        }

        if (!refresh) {
          authApi.logoutLocal();
          return null;
        }

        try {
          const refreshed = await authApi.refreshToken({ refresh });
          setTokens(refreshed.access, refreshed.refresh ?? refresh);
          const user = await authApi.me();
          auth.setUser(user);
          return user;
        } catch {
          authApi.logoutLocal();
          return null;
        }
      }
    })().finally(() => {
      restorePromise = null;
    });
  }

  return restorePromise;
}
