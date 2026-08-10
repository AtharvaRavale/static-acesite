/**
 * Workspace route fallbacks for core modules already represented in this
 * frontend. Project Setup is intentionally forced through the tenant-aware
 * workspace route; other modules may still provide their own frontend_route.
 */
const WORKSPACE_MODULE_ROUTES: Record<string, string> = {
  account: "/settings",
  organization: "/workspace/organization",
  project: "/workspace/project",
  taxonomy: "/taxonomy",
  workflow: "/workflows",
  checklist: "/checklists",
};

export function getWorkspaceModuleRoute(
  moduleCode: string,
  frontendRoute?: string | null
): string | null {
  const key = moduleCode.trim().toLowerCase();
  if (!key) return null;

  // Core modules represented by first-party routes in this frontend must
  // always use the canonical route. This protects tenant navigation from
  // stale/mistyped ProductModule.frontend_route values (for example
  // `workflow=/workflow` while the actual React route is `/workflows`).
  if (key in WORKSPACE_MODULE_ROUTES) {
    return WORKSPACE_MODULE_ROUTES[key];
  }

  // Extension/optional modules can still provide their route from the
  // ProductModule catalog.
  const route = frontendRoute?.trim();
  if (route && route.startsWith("/")) return route;
  return null;
}

export function listKnownWorkspaceModuleCodes(): string[] {
  return Object.keys(WORKSPACE_MODULE_ROUTES);
}
