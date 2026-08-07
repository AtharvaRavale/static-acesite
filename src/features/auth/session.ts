import type { AuthUser } from "./types";
import type { AuthOrganization } from "./types";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser";
const ORGANIZATION_KEY = "authOrganization";

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function getStoredUser(): AuthUser | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (!canUseStorage()) return;
  if (!user) {
    window.localStorage.removeItem(USER_KEY);
    return;
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredOrganization(): AuthOrganization | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(ORGANIZATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthOrganization;
  } catch {
    return null;
  }
}

export function setStoredOrganization(organization: AuthOrganization | null): void {
  if (!canUseStorage()) return;
  if (!organization) {
    window.localStorage.removeItem(ORGANIZATION_KEY);
    return;
  }
  window.localStorage.setItem(ORGANIZATION_KEY, JSON.stringify(organization));
}

export function clearSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ORGANIZATION_KEY);
}

export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}

export function hasStoredSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}
