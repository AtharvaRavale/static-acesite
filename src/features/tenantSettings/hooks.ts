import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantSettingsApi } from "./api";
import type {
  TenantCreateRolePayload,
  TenantCreateUserPayload,
  TenantRoleAssignmentPayload,
} from "./types";

export const tenantSettingsKeys = {
  all: ["tenant-settings"] as const,
  bootstrap: (organization: number) => [...tenantSettingsKeys.all, "bootstrap", organization] as const,
  users: (organization: number) => [...tenantSettingsKeys.all, "users", organization] as const,
  roles: (organization: number) => [...tenantSettingsKeys.all, "roles", organization] as const,
  permissions: (organization: number, role: number | null, roleKind?: string) =>
    [...tenantSettingsKeys.all, "permissions", organization, role, roleKind ?? ""] as const,
  assignments: (organization: number) => [...tenantSettingsKeys.all, "assignments", organization] as const,
  roleScopeOptions: (organization: number, role: number) =>
    [...tenantSettingsKeys.all, "role-scope-options", organization, role] as const,
};

export const useTenantSettingsBootstrap = (organization: number | null) =>
  useQuery({
    queryKey: tenantSettingsKeys.bootstrap(organization ?? -1),
    queryFn: () => tenantSettingsApi.bootstrap(organization!),
    enabled: organization !== null,
  });

export const useTenantUsers = (organization: number | null, enabled = true) =>
  useQuery({
    queryKey: tenantSettingsKeys.users(organization ?? -1),
    queryFn: () => tenantSettingsApi.users(organization!),
    enabled: organization !== null && enabled,
  });

export const useTenantRoles = (organization: number | null, enabled = true) =>
  useQuery({
    queryKey: tenantSettingsKeys.roles(organization ?? -1),
    queryFn: () => tenantSettingsApi.roles(organization!),
    enabled: organization !== null && enabled,
  });

export const useTenantPermissionCatalog = (
  organization: number | null,
  role: number | null,
  roleKind?: string,
  enabled = true
) =>
  useQuery({
    queryKey: tenantSettingsKeys.permissions(organization ?? -1, role, roleKind),
    queryFn: () => tenantSettingsApi.permissionCatalog(organization!, role, roleKind),
    enabled: organization !== null && enabled,
  });

export const useTenantRoleScopeOptions = (
  organization: number | null,
  role: number | null,
  enabled = true
) =>
  useQuery({
    queryKey: tenantSettingsKeys.roleScopeOptions(organization ?? -1, role ?? -1),
    queryFn: () => tenantSettingsApi.roleScopeOptions(organization!, role!),
    enabled: organization !== null && role !== null && enabled,
  });

export const useTenantAssignments = (organization: number | null, enabled = true) =>
  useQuery({
    queryKey: tenantSettingsKeys.assignments(organization ?? -1),
    queryFn: () => tenantSettingsApi.assignments(organization!),
    enabled: organization !== null && enabled,
  });

function invalidateUsers(queryClient: ReturnType<typeof useQueryClient>, organization: number) {
  void queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.users(organization) });
  void queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.bootstrap(organization) });
}

function invalidateRoles(queryClient: ReturnType<typeof useQueryClient>, organization: number) {
  void queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.roles(organization) });
  void queryClient.invalidateQueries({ queryKey: ["tenant-settings", "permissions", organization] });
  void queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.bootstrap(organization) });
}

function invalidateAssignments(queryClient: ReturnType<typeof useQueryClient>, organization: number) {
  void queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.assignments(organization) });
  void queryClient.invalidateQueries({ queryKey: tenantSettingsKeys.bootstrap(organization) });
}

export function useCreateTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantCreateUserPayload) => tenantSettingsApi.createUser(payload),
    onSuccess: (_data, payload) => invalidateUsers(queryClient, payload.organization),
  });
}

export function useUpdateTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, membershipId, payload }: {
      organization: number;
      membershipId: number;
      payload: { first_name?: string; last_name?: string; phone?: string; primary_organization_unit?: number | null };
    }) => tenantSettingsApi.updateUser(organization, membershipId, payload),
    onSuccess: (_data, variables) => invalidateUsers(queryClient, variables.organization),
  });
}

export function useDeleteTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, membershipId }: { organization: number; membershipId: number }) =>
      tenantSettingsApi.deleteUser(organization, membershipId),
    onSuccess: (_data, variables) => invalidateUsers(queryClient, variables.organization),
  });
}

export function useTenantUserAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, membershipId, action, payload }: {
      organization: number;
      membershipId: number;
      action: "activate" | "deactivate" | "reset-password";
      payload?: Record<string, unknown>;
    }) => tenantSettingsApi.userAction(organization, membershipId, action, payload),
    onSuccess: (_data, variables) => invalidateUsers(queryClient, variables.organization),
  });
}

export function useCreateTenantRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantCreateRolePayload) => tenantSettingsApi.createRole(payload),
    onSuccess: (_data, payload) => invalidateRoles(queryClient, payload.organization),
  });
}

export function useUpdateTenantRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, role, payload }: {
      organization: number;
      role: number;
      payload: { name?: string; code?: string; description?: string };
    }) => tenantSettingsApi.updateRole(organization, role, payload),
    onSuccess: (_data, variables) => invalidateRoles(queryClient, variables.organization),
  });
}

export function useDeleteTenantRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, role }: { organization: number; role: number }) =>
      tenantSettingsApi.deleteRole(organization, role),
    onSuccess: (_data, variables) => invalidateRoles(queryClient, variables.organization),
  });
}

export function useTenantRoleAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, role, action }: {
      organization: number;
      role: number;
      action: "activate" | "deactivate";
    }) => tenantSettingsApi.roleAction(organization, role, action),
    onSuccess: (_data, variables) => invalidateRoles(queryClient, variables.organization),
  });
}

export function useReplaceTenantRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, role, permissionIds }: { organization: number; role: number; permissionIds: number[] }) =>
      tenantSettingsApi.replaceRolePermissions(organization, role, permissionIds),
    onSuccess: (_data, variables) => invalidateRoles(queryClient, variables.organization),
  });
}

export function useCreateTenantAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantRoleAssignmentPayload) => tenantSettingsApi.createAssignment(payload),
    onSuccess: (_data, payload) => invalidateAssignments(queryClient, payload.organization),
  });
}

export function useUpdateTenantAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, assignment, payload }: {
      organization: number;
      assignment: number;
      payload: Partial<TenantRoleAssignmentPayload>;
    }) => tenantSettingsApi.updateAssignment(organization, assignment, payload),
    onSuccess: (_data, variables) => invalidateAssignments(queryClient, variables.organization),
  });
}

export function useDeleteTenantAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, assignment }: { organization: number; assignment: number }) =>
      tenantSettingsApi.deleteAssignment(organization, assignment),
    onSuccess: (_data, variables) => invalidateAssignments(queryClient, variables.organization),
  });
}

export function useTenantAssignmentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ organization, assignment, action }: {
      organization: number;
      assignment: number;
      action: "revoke" | "activate" | "deactivate";
    }) => tenantSettingsApi.assignmentAction(organization, assignment, action),
    onSuccess: (_data, variables) => invalidateAssignments(queryClient, variables.organization),
  });
}
