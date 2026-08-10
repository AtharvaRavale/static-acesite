import type { AuthOrganization, AuthUser } from "./types";

export function isPlatformUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.user_type === "platform";
}

export function isPlatformSuperuser(
  user: AuthUser | null | undefined
): boolean {
  return Boolean(user && user.user_type === "platform" && user.is_superuser === true);
}

export function isOrganizationUser(
  user: AuthUser | null | undefined,
  _organization?: AuthOrganization | null
): boolean {
  if (!user) return false;
  return user.user_type === "non_platform";
}

export function canAccessPlatformRoutes(
  user: AuthUser | null | undefined
): boolean {
  return isPlatformUser(user);
}

export function canAccessWorkspaceRoutes(
  user: AuthUser | null | undefined,
  organization: AuthOrganization | null | undefined
): boolean {
  return isOrganizationUser(user, organization);
}

const PLATFORM_PREFIXES = [
  "/modules",
  "/organization-provisioning",
  "/organizations",
  "/platform-setup",
] as const;

export function isPlatformOnlyPath(pathname: string): boolean {
  return PLATFORM_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isWorkspacePath(pathname: string): boolean {
  return pathname === "/workspace" || pathname.startsWith("/workspace/");
}

export function getDefaultLandingPath(
  user: AuthUser | null | undefined,
  organization: AuthOrganization | null | undefined
): string {
  if (isOrganizationUser(user, organization)) {
    return "/workspace";
  }
  if (isPlatformUser(user)) {
    return "/modules";
  }
  return "/";
}
