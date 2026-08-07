import type { Location } from "react-router-dom";
import {
  getDefaultLandingPath,
  isPlatformOnlyPath,
  isPlatformUser,
  isWorkspacePath,
} from "./guards";
import type { AuthOrganization, AuthUser } from "./types";

export const DEFAULT_AUTH_REDIRECT = "/";

function extractPath(from: unknown): string | null {
  if (typeof from === "string") {
    return from;
  }

  if (from && typeof from === "object" && "pathname" in from) {
    const location = from as Location;
    return `${location.pathname}${location.search}${location.hash}`;
  }

  return null;
}

/** Basic open-redirect safe path (no role checks). */
export function getSafeRedirectPath(from: unknown): string {
  const raw = extractPath(from);
  if (!raw) {
    return DEFAULT_AUTH_REDIRECT;
  }

  const path = raw.trim();

  if (/^https?:\/\//i.test(path) || path.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  if (!path.startsWith("/")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  const pathname = path.split(/[?#]/)[0];
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  return path;
}

/** Resolve post-login / home redirect with role awareness. */
export function resolveAuthRedirect(
  from: unknown,
  user: AuthUser | null | undefined,
  organization: AuthOrganization | null | undefined
): string {
  const safe = getSafeRedirectPath(from);
  const pathname = safe.split(/[?#]/)[0] || "/";
  const landing = getDefaultLandingPath(user, organization);

  if (pathname === "/" || pathname === DEFAULT_AUTH_REDIRECT) {
    return landing;
  }

  if (isPlatformOnlyPath(pathname) && !isPlatformUser(user)) {
    return landing;
  }

  if (isWorkspacePath(pathname) && isPlatformUser(user)) {
    return landing;
  }

  return safe;
}
