import { api } from "@/lib/api/client";
import type {
  TenantCreateRolePayload,
  TenantCreateUserPayload,
  TenantMembershipRow,
  TenantPermissionCatalog,
  TenantRole,
  TenantRoleAssignment,
  TenantRoleAssignmentPayload,
  TenantRoleScopeOptions,
  TenantSettingsBootstrap,
} from "./types";

export const tenantSettingsApi = {
  bootstrap: async (organization: number): Promise<TenantSettingsBootstrap> => {
    const response = await api.get<TenantSettingsBootstrap>(
      "/rbac/tenant-settings/bootstrap/",
      { params: { organization } }
    );
    return response.data;
  },

  users: async (organization: number): Promise<TenantMembershipRow[]> => {
    const response = await api.get<TenantMembershipRow[]>(
      "/rbac/tenant-settings/users/",
      { params: { organization } }
    );
    return response.data;
  },

  createUser: async (payload: TenantCreateUserPayload) => {
    const response = await api.post("/rbac/tenant-settings/users/", payload);
    return response.data;
  },

  updateUser: async (
    organization: number,
    membershipId: number,
    payload: { first_name?: string; last_name?: string; phone?: string; primary_organization_unit?: number | null }
  ) => {
    const response = await api.patch(
      `/rbac/tenant-settings/users/${membershipId}/`,
      { organization, ...payload }
    );
    return response.data;
  },

  deleteUser: async (organization: number, membershipId: number) => {
    await api.delete(`/rbac/tenant-settings/users/${membershipId}/`, {
      data: { organization },
    });
  },

  userAction: async (
    organization: number,
    membershipId: number,
    action: "activate" | "deactivate" | "reset-password",
    payload: Record<string, unknown> = {}
  ) => {
    const response = await api.post(
      `/rbac/tenant-settings/users/${membershipId}/${action}/`,
      { organization, ...payload }
    );
    return response.data;
  },

  roles: async (organization: number): Promise<TenantRole[]> => {
    const response = await api.get<TenantRole[]>(
      "/rbac/tenant-settings/roles/",
      { params: { organization } }
    );
    return response.data;
  },

  createRole: async (payload: TenantCreateRolePayload): Promise<TenantRole> => {
    const response = await api.post<TenantRole>(
      "/rbac/tenant-settings/roles/",
      payload
    );
    return response.data;
  },

  updateRole: async (
    organization: number,
    role: number,
    payload: { name?: string; code?: string; description?: string }
  ): Promise<TenantRole> => {
    const response = await api.patch<TenantRole>(
      `/rbac/tenant-settings/roles/${role}/`,
      { organization, ...payload }
    );
    return response.data;
  },

  deleteRole: async (organization: number, role: number) => {
    await api.delete(`/rbac/tenant-settings/roles/${role}/`, {
      data: { organization },
    });
  },

  roleAction: async (
    organization: number,
    role: number,
    action: "activate" | "deactivate"
  ): Promise<TenantRole> => {
    const response = await api.post<TenantRole>(
      `/rbac/tenant-settings/roles/${role}/${action}/`,
      { organization }
    );
    return response.data;
  },

  permissionCatalog: async (
    organization: number,
    role?: number | null,
    roleKind?: string
  ): Promise<TenantPermissionCatalog> => {
    const response = await api.get<TenantPermissionCatalog>(
      "/rbac/tenant-settings/permissions/",
      {
        params: {
          organization,
          role: role ?? undefined,
          role_kind: role ? undefined : roleKind,
        },
      }
    );
    return response.data;
  },

  replaceRolePermissions: async (
    organization: number,
    role: number,
    permissionIds: number[]
  ): Promise<{ role: TenantRole; modules: TenantPermissionCatalog["modules"] }> => {
    const response = await api.put(
      `/rbac/tenant-settings/roles/${role}/permissions/`,
      { organization, permission_ids: permissionIds }
    );
    return response.data;
  },

  roleScopeOptions: async (
    organization: number,
    role: number
  ): Promise<TenantRoleScopeOptions> => {
    const response = await api.get<TenantRoleScopeOptions>(
      `/rbac/tenant-settings/roles/${role}/scope-options/`,
      { params: { organization } }
    );
    return response.data;
  },

  assignments: async (organization: number): Promise<TenantRoleAssignment[]> => {
    const response = await api.get<TenantRoleAssignment[]>(
      "/rbac/tenant-settings/role-assignments/",
      { params: { organization } }
    );
    return response.data;
  },

  createAssignment: async (
    payload: TenantRoleAssignmentPayload
  ): Promise<TenantRoleAssignment> => {
    const response = await api.post<TenantRoleAssignment>(
      "/rbac/tenant-settings/role-assignments/",
      payload
    );
    return response.data;
  },

  updateAssignment: async (
    organization: number,
    assignment: number,
    payload: Partial<TenantRoleAssignmentPayload>
  ): Promise<TenantRoleAssignment> => {
    const response = await api.patch<TenantRoleAssignment>(
      `/rbac/tenant-settings/role-assignments/${assignment}/`,
      { organization, ...payload }
    );
    return response.data;
  },

  deleteAssignment: async (organization: number, assignment: number) => {
    await api.delete(`/rbac/tenant-settings/role-assignments/${assignment}/`, {
      data: { organization },
    });
  },

  assignmentAction: async (
    organization: number,
    assignment: number,
    action: "revoke" | "activate" | "deactivate"
  ): Promise<TenantRoleAssignment> => {
    const response = await api.post<TenantRoleAssignment>(
      `/rbac/tenant-settings/role-assignments/${assignment}/${action}/`,
      { organization }
    );
    return response.data;
  },
};
