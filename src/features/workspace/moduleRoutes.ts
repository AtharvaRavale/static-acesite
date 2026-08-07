/**
 * Maps assigned product module codes to workspace app routes.
 * Only include routes that exist in the frontend router.
 */
const WORKSPACE_MODULE_ROUTES: Record<string, string> = {
  // Reserved for when dedicated workspace apps ship:
  // checklist: "/workspace/checklists",
  // workflow: "/workspace/workflows",
  // project: "/workspace/projects",
  // dms: "/workspace/documents",
};

export function getWorkspaceModuleRoute(moduleCode: string): string | null {
  const key = moduleCode.trim().toLowerCase();
  if (!key) return null;
  return WORKSPACE_MODULE_ROUTES[key] ?? null;
}

export function listKnownWorkspaceModuleCodes(): string[] {
  return Object.keys(WORKSPACE_MODULE_ROUTES);
}
