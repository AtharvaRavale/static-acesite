import type { AuthAccessContext } from "@/features/auth";

export interface WorkspaceMembership {
  id: number;
  membership_type: "owner" | "member" | string;
  status: string;
  is_primary: boolean;
  is_owner: boolean;
  primary_organization_unit_id: number | null;
}

export interface WorkspaceUnitNode {
  id: number;
  name: string;
  code: string;
  unit_type: string;
  parent_id: number | null;
  selectable: boolean;
  children: WorkspaceUnitNode[];
}

export interface WorkspacePartnerOrganizationRef {
  id: number;
  name: string;
  code: string;
  partner_type: string;
}

export type WorkspaceRoleScopeType =
  | "organization"
  | "organization_unit"
  | "project"
  | "partner_organization"
  | string;

export interface WorkspaceTopRole {
  assignment_id: number;
  role_id: number;
  name: string;
  code: string;
  scope_kind: "organization" | "partner_organization" | string;
  scope_type: WorkspaceRoleScopeType;
  permission_codes: string[];
  organization_id: number;
  organization_unit_ids: number[];
  selectable_unit_ids: number[];
  scoped_project_id: number | null;
  is_partner_role: boolean;
  partner_organization: WorkspacePartnerOrganizationRef | null;
}

export interface WorkspaceModule {
  source: "organization" | "project" | "partner_project";
  organization_module_id: number;
  project_module_access_id: number | null;
  module_id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  frontend_route: string;
  menu_order: number;
  status: "enabled" | "read_only" | string;
  status_display: string;
  read_only: boolean;
}

export interface WorkspaceOrganization {
  id: number;
  organization_id: string;
  name: string;
  code: string;
  flow: "self" | "partner_company" | "both" | string;
  logo_url: string | null;
  membership: WorkspaceMembership;
  organization_units: WorkspaceUnitNode[];
  top_roles: WorkspaceTopRole[];
  organization_modules: WorkspaceModule[];
}

export interface WorkspaceBootstrapResponse {
  organizations: WorkspaceOrganization[];
  active_access_context: AuthAccessContext | null;
  settings_permission_code: string;
}

export interface WorkspaceProject {
  id: number;
  organization: number;
  organization_unit: number | null;
  organization_unit_name: string | null;
  name: string;
  code: string;
  project_number: string;
  location: string;
  status: string;
  status_display: string;
  image_url: string | null;
}

export interface WorkspaceProjectListParams {
  organization: number;
  organization_unit?: number | null;
  role_assignment?: number | null;
}

export interface WorkspaceProjectModuleParams {
  project: number;
  role_assignment?: number | null;
}

export interface WorkspaceAccessContextPayload {
  organization: number;
  organization_unit: number | null;
  partner_organization: number | null;
  project: number | null;
  selected_top_role_assignment: number | null;
  selected_role_assignment: null;
  is_active: true;
}

export interface WorkspaceState {
  bootstrap: WorkspaceBootstrapResponse | null;
  organizations: WorkspaceOrganization[];
  organization: WorkspaceOrganization | null;
  organizationUnit: WorkspaceUnitNode | null;
  project: WorkspaceProject | null;
  topRole: WorkspaceTopRole | null;
  projects: WorkspaceProject[];
  organizationModules: WorkspaceModule[];
  projectModules: WorkspaceModule[];
  visibleModules: WorkspaceModule[];
  settingsPermissionCode: string;
  canAccessSettings: boolean;
  hasProject: boolean;
  selectableUnitIds: number[];
  isUnitSelectable: (unitId: number) => boolean;
  isLoading: boolean;
  isProjectsLoading: boolean;
  isProjectModulesLoading: boolean;
  isContextSyncing: boolean;
  error: unknown;
  projectError: unknown;
  projectModulesError: unknown;
  selectOrganization: (organizationId: number) => void;
  selectOrganizationContext: (organizationId: number, unitId: number | null) => void;
  selectOrganizationUnit: (unitId: number | null) => void;
  selectProject: (projectId: number | null) => void;
  selectTopRole: (assignmentId: number | null) => void;
  refresh: () => Promise<unknown>;
}
