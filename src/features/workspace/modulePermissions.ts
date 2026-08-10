/**
 * Permission-aware workspace module visibility.
 *
 * Keep menu/module visibility rules here instead of checking role names in UI.
 * Organization owners and platform superusers bypass these requirements.
 * Direct pages still perform their own authorization checks.
 */
export const WORKSPACE_MODULE_VIEW_PERMISSIONS: Record<string, string[]> = {
  checklist: ["checklist.definition.view", "checklist.definition.manage", "checklist.template.view", "checklist.template.manage"],
  taxonomy: ["taxonomy.taxonomy.view", "taxonomy.category.view"],
  workflow: ["workflow.template.view", "workflow.template.manage", "workflow.applicability.view", "workflow.applicability.manage"],
};

export function canViewWorkspaceModule(moduleCode: string, permissionCodes: Iterable<string>, owner = false): boolean {
  if (owner) return true;
  const required = WORKSPACE_MODULE_VIEW_PERMISSIONS[moduleCode.trim().toLowerCase()];
  if (!required || required.length === 0) return true;
  const granted = new Set(permissionCodes);
  return required.some((code) => granted.has(code));
}
