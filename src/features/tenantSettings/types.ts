export interface TenantSettingsBootstrap {
  organization: {
    id: number;
    name: string;
    code: string;
    flow: "self" | "partner_company" | "both" | string;
    partners_enabled: boolean;
  };
  full_access: boolean;
  permissions: Record<string, boolean>;
}

export interface TenantUserSummary {
  id: number;
  email: string;
  username: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  user_type: string;
  is_active: boolean;
}

export interface TenantMembershipRow {
  membership_id: number;
  membership_type: "owner" | "member" | string;
  status: string;
  is_active: boolean;
  is_primary: boolean;
  primary_organization_unit: number | null;
  user: TenantUserSummary;
}

export interface TenantCreateUserPayload {
  organization: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  password?: string;
}

export interface TenantRole {
  id: number;
  module: number | null;
  module_code: string | null;
  name: string;
  code: string;
  description: string;
  organization: number | null;
  organization_name: string | null;
  partner_organization: number | null;
  partner_organization_name: string | null;
  is_system: boolean;
  scope_kind:
    | "organization"
    | "organization_module"
    | "partner_organization"
    | string;
  permission_codes: string[];
  is_active: boolean;
}

export type TenantRoleKind =
  | "organization"
  | "organization_module"
  | "partner_organization";

export interface TenantCreateRolePayload {
  organization: number;
  role_kind: TenantRoleKind;
  name: string;
  code?: string;
  description?: string;
  module?: number;
  partner_organization?: number;
}

export interface TenantPermissionItem {
  id: number;
  code: string;
  name: string;
  label: string;
  description: string;
  action: string;
  is_action: boolean;
  selected: boolean;
}

export interface TenantPermissionGroup {
  name: string;
  permissions: TenantPermissionItem[];
}

export interface TenantPermissionModule {
  organization_module_id?: number;
  module_id: number;
  module_code: string;
  module_name: string;
  icon: string;
  status?: string;
  groups: TenantPermissionGroup[];
}


export interface TenantAvailableRoleModule {
  organization_module_id: number;
  module_id: number;
  module_code: string;
  module_name: string;
  icon: string;
  status: string;
}

export interface TenantPermissionCatalog {
  organization: number;
  role: number | null;
  available_modules: TenantAvailableRoleModule[];
  modules: TenantPermissionModule[];
}

export type TenantRoleAssignmentScope =
  | "organization"
  | "organization_unit"
  | "project";

export interface TenantRoleAssignmentPayload {
  organization: number;
  user: number;
  role: number;
  scope_type: TenantRoleAssignmentScope;
  organization_units?: number[];
  scoped_project?: number | null; // legacy first selected project
  scoped_projects?: number[];
  is_active?: boolean;
}

export interface TenantRoleAssignment {
  id: number;
  user: number;
  user_email: string;
  role: number;
  role_name: string;
  role_code: string;
  role_scope_kind: string;
  scope_type: string;
  organization: number | null;
  organization_name: string | null;
  organization_unit: number | null;
  organization_unit_name: string | null;
  organization_units: number[];
  organization_unit_names: string[];
  partner_organization: number | null;
  partner_organization_name: string | null;
  scoped_project: number | null;
  scoped_project_name: string | null;
  scoped_projects: number[];
  scoped_project_names: string[];
  project_id: number | null;
  is_active: boolean;
}

export interface TenantRoleScopeOptions {
  organization: number;
  role: number;
  role_scope_kind: string;
  partner_organization: number | null;
  organization_units: Array<{ id: number; name: string; code: string; unit_type: string }>;
  projects: Array<{
    id: number;
    name: string;
    code: string;
    project_number: string;
    organization_unit: number | null;
    organization_unit_name: string | null;
  }>;
}
