import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  departmentUnitAssignmentsApi,
  departmentsApi,
  organizationInvitationsApi,
  organizationMembershipsApi,
  organizationsApi,
  organizationUnitScopesApi,
  organizationUnitsApi,
  partnerOrganizationContactsApi,
  partnerOrganizationsApi,
} from "./api";
import type {
  AcceptInvitePayload,
  BulkInviteMembersPayload,
  DepartmentListParams,
  DepartmentUnitAssignmentListParams,
  DepartmentUnitAssignmentWritePayload,
  DepartmentWritePayload,
  ModuleConfigurationPayload,
  OrganizationActivityListParams,
  OrganizationInvitationListParams,
  OrganizationInvitationsParams,
  OrganizationListParams,
  OrganizationMembershipListParams,
  OrganizationMembershipWritePayload,
  OrganizationModulesParams,
  OrganizationTreeParams,
  OrganizationUnitListParams,
  OrganizationUnitWritePayload,
  OrganizationWritePayload,
  PartnerOrganizationContactListParams,
  PartnerOrganizationContactWritePayload,
  PartnerOrganizationListParams,
  PartnerOrganizationWritePayload,
  TransferOwnershipPayload,
  UserOrganizationUnitScopeListParams,
  UserOrganizationUnitScopeWritePayload,
  ValidateInvitePayload,
} from "./types";

/* ── Query key factories ─────────────────────────────────────────────────── */

export const organizationKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationKeys.all, "list"] as const,
  list: (params: OrganizationListParams) =>
    [...organizationKeys.lists(), params] as const,
  details: () => [...organizationKeys.all, "detail"] as const,
  detail: (id: number) => [...organizationKeys.details(), id] as const,
  overview: (id: number) => [...organizationKeys.all, "overview", id] as const,
  unitTree: (id: number, params: OrganizationTreeParams) =>
    [...organizationKeys.all, "unit-tree", id, params] as const,
  partnerTree: (id: number, params: OrganizationTreeParams) =>
    [...organizationKeys.all, "partner-tree", id, params] as const,
  departmentStructure: (id: number, params: OrganizationTreeParams) =>
    [...organizationKeys.all, "department-structure", id, params] as const,
  invitations: (id: number, params: OrganizationInvitationsParams) =>
    [...organizationKeys.all, "invitations", id, params] as const,
  modules: (id: number, params: OrganizationModulesParams) =>
    [...organizationKeys.all, "modules", id, params] as const,
  availableModules: (id: number) =>
    [...organizationKeys.all, "available-modules", id] as const,
  module: (id: number, moduleId: number | string) =>
    [...organizationKeys.all, "module", id, moduleId] as const,
  activity: (id: number, params: OrganizationActivityListParams) =>
    [...organizationKeys.all, "activity", id, params] as const,
};

export const partnerOrganizationKeys = {
  all: ["partner-organizations"] as const,
  lists: () => [...partnerOrganizationKeys.all, "list"] as const,
  list: (params: PartnerOrganizationListParams) =>
    [...partnerOrganizationKeys.lists(), params] as const,
  details: () => [...partnerOrganizationKeys.all, "detail"] as const,
  detail: (id: number) => [...partnerOrganizationKeys.details(), id] as const,
};

export const partnerOrganizationContactKeys = {
  all: ["partner-organization-contacts"] as const,
  lists: () => [...partnerOrganizationContactKeys.all, "list"] as const,
  list: (params: PartnerOrganizationContactListParams) =>
    [...partnerOrganizationContactKeys.lists(), params] as const,
  details: () => [...partnerOrganizationContactKeys.all, "detail"] as const,
  detail: (id: number) =>
    [...partnerOrganizationContactKeys.details(), id] as const,
};

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (params: DepartmentListParams) =>
    [...departmentKeys.lists(), params] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: number) => [...departmentKeys.details(), id] as const,
};

export const departmentUnitAssignmentKeys = {
  all: ["department-unit-assignments"] as const,
  lists: () => [...departmentUnitAssignmentKeys.all, "list"] as const,
  list: (params: DepartmentUnitAssignmentListParams) =>
    [...departmentUnitAssignmentKeys.lists(), params] as const,
  details: () => [...departmentUnitAssignmentKeys.all, "detail"] as const,
  detail: (id: number) =>
    [...departmentUnitAssignmentKeys.details(), id] as const,
};

export const organizationMembershipKeys = {
  all: ["organization-memberships"] as const,
  lists: () => [...organizationMembershipKeys.all, "list"] as const,
  list: (params: OrganizationMembershipListParams) =>
    [...organizationMembershipKeys.lists(), params] as const,
  details: () => [...organizationMembershipKeys.all, "detail"] as const,
  detail: (id: number) =>
    [...organizationMembershipKeys.details(), id] as const,
  accessSummary: (id: number) =>
    [...organizationMembershipKeys.all, "access-summary", id] as const,
};

export const organizationUnitKeys = {
  all: ["organization-units"] as const,
  lists: () => [...organizationUnitKeys.all, "list"] as const,
  list: (params: OrganizationUnitListParams) =>
    [...organizationUnitKeys.lists(), params] as const,
  details: () => [...organizationUnitKeys.all, "detail"] as const,
  detail: (id: number) => [...organizationUnitKeys.details(), id] as const,
};

export const organizationUnitScopeKeys = {
  all: ["organization-unit-scopes"] as const,
  lists: () => [...organizationUnitScopeKeys.all, "list"] as const,
  list: (params: UserOrganizationUnitScopeListParams) =>
    [...organizationUnitScopeKeys.lists(), params] as const,
  details: () => [...organizationUnitScopeKeys.all, "detail"] as const,
  detail: (id: number) =>
    [...organizationUnitScopeKeys.details(), id] as const,
};

export const organizationInvitationKeys = {
  all: ["organization-invitations"] as const,
  lists: () => [...organizationInvitationKeys.all, "list"] as const,
  list: (params: OrganizationInvitationListParams) =>
    [...organizationInvitationKeys.lists(), params] as const,
  details: () => [...organizationInvitationKeys.all, "detail"] as const,
  detail: (id: number) =>
    [...organizationInvitationKeys.details(), id] as const,
};

function invalidateOrganizationQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

function invalidatePartnerQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: partnerOrganizationKeys.all });
  void queryClient.invalidateQueries({
    queryKey: partnerOrganizationContactKeys.all,
  });
  void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

function invalidateDepartmentQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: departmentKeys.all });
  void queryClient.invalidateQueries({
    queryKey: departmentUnitAssignmentKeys.all,
  });
  void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

function invalidateMembershipQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({
    queryKey: organizationMembershipKeys.all,
  });
  void queryClient.invalidateQueries({
    queryKey: organizationInvitationKeys.all,
  });
  void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

function invalidateUnitQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({ queryKey: organizationUnitKeys.all });
  void queryClient.invalidateQueries({
    queryKey: organizationUnitScopeKeys.all,
  });
  void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

function invalidateInvitationQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  void queryClient.invalidateQueries({
    queryKey: organizationInvitationKeys.all,
  });
  void queryClient.invalidateQueries({
    queryKey: organizationMembershipKeys.all,
  });
  void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
}

/* ── Organizations ───────────────────────────────────────────────────────── */

export function useOrganizations(params: OrganizationListParams = {}) {
  return useQuery({
    queryKey: organizationKeys.list(params),
    queryFn: () => organizationsApi.list(params),
  });
}

/** Compatibility alias for useOrganizations. */
export function useOrganizationsList(params: OrganizationListParams = {}) {
  return useOrganizations(params);
}

export function useOrganization(id: number | null) {
  return useQuery({
    queryKey: organizationKeys.detail(id ?? -1),
    queryFn: () => organizationsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationWritePayload) =>
      organizationsApi.create(payload),
    onSuccess: () => invalidateOrganizationQueries(queryClient),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationWritePayload;
    }) => organizationsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useReplaceOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationWritePayload;
    }) => organizationsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

/** Hard delete is rejected by the API; prefer close/suspend. */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.remove(id),
    onSuccess: () => invalidateOrganizationQueries(queryClient),
  });
}

export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, logo }: { id: number; logo: File }) =>
      organizationsApi.uploadLogo(id, logo),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useRemoveOrganizationLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.removeLogo(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useTransferOrganizationOwnership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: TransferOwnershipPayload;
    }) => organizationsApi.transferOwnership(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      });
      invalidateMembershipQueries(queryClient);
    },
  });
}

export function useActivateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.activate(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useSuspendOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.suspend(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useCloseOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.close(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useRestoreOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.restore(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useProvisionOrganizationCoreModules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationsApi.provisionCoreModules(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.modules(id, {}),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.availableModules(id),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useOrganizationOverview(id: number | null) {
  return useQuery({
    queryKey: organizationKeys.overview(id ?? -1),
    queryFn: () => organizationsApi.overview(id!),
    enabled: id !== null,
  });
}

export function useOrganizationUnitTree(
  id: number | null,
  params: OrganizationTreeParams = {}
) {
  return useQuery({
    queryKey: organizationKeys.unitTree(id ?? -1, params),
    queryFn: () => organizationsApi.unitTree(id!, params),
    enabled: id !== null,
  });
}

export function useOrganizationPartnerTree(
  id: number | null,
  params: OrganizationTreeParams = {}
) {
  return useQuery({
    queryKey: organizationKeys.partnerTree(id ?? -1, params),
    queryFn: () => organizationsApi.partnerTree(id!, params),
    enabled: id !== null,
  });
}

export function useOrganizationDepartmentStructure(
  id: number | null,
  params: OrganizationTreeParams = {}
) {
  return useQuery({
    queryKey: organizationKeys.departmentStructure(id ?? -1, params),
    queryFn: () => organizationsApi.departmentStructure(id!, params),
    enabled: id !== null,
  });
}

export function useOrganizationInvitations(
  id: number | null,
  params: OrganizationInvitationsParams = {}
) {
  return useQuery({
    queryKey: organizationKeys.invitations(id ?? -1, params),
    queryFn: () => organizationsApi.invitations(id!, params),
    enabled: id !== null,
  });
}

export function useBulkInviteOrganizationMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: BulkInviteMembersPayload;
    }) => organizationsApi.bulkInviteMembers(id, payload),
    onSuccess: () => invalidateMembershipQueries(queryClient),
  });
}

export function useOrganizationModules(
  id: number | null,
  params: OrganizationModulesParams = {}
) {
  return useQuery({
    queryKey: organizationKeys.modules(id ?? -1, params),
    queryFn: () => organizationsApi.modules(id!, params),
    enabled: id !== null,
  });
}

export function useOrganizationAvailableModules(id: number | null) {
  return useQuery({
    queryKey: organizationKeys.availableModules(id ?? -1),
    queryFn: () => organizationsApi.availableModules(id!),
    enabled: id !== null,
  });
}

export function useOrganizationModule(
  id: number | null,
  moduleId: number | string | null
) {
  return useQuery({
    queryKey: organizationKeys.module(id ?? -1, moduleId ?? -1),
    queryFn: () => organizationsApi.getModule(id!, moduleId!),
    enabled: id !== null && moduleId !== null,
  });
}

export function useEnableOrganizationModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      moduleId,
    }: {
      id: number;
      moduleId: number | string;
    }) => organizationsApi.enableModule(id, moduleId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.modules(variables.id, {}),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.availableModules(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.module(variables.id, variables.moduleId),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useReadOnlyOrganizationModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      moduleId,
    }: {
      id: number;
      moduleId: number | string;
    }) => organizationsApi.readOnlyModule(id, moduleId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.modules(variables.id, {}),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.availableModules(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.module(variables.id, variables.moduleId),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useDisableOrganizationModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      moduleId,
    }: {
      id: number;
      moduleId: number | string;
    }) => organizationsApi.disableModule(id, moduleId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.modules(variables.id, {}),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.availableModules(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.module(variables.id, variables.moduleId),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUpdateOrganizationModuleConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      moduleId,
      payload,
    }: {
      id: number;
      moduleId: number | string;
      payload: ModuleConfigurationPayload;
    }) => organizationsApi.updateModuleConfiguration(id, moduleId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.modules(variables.id, {}),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.module(variables.id, variables.moduleId),
      });
      invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useOrganizationActivity(
  id: number | null,
  params: OrganizationActivityListParams = {}
) {
  return useQuery({
    queryKey: organizationKeys.activity(id ?? -1, params),
    queryFn: () => organizationsApi.activity(id!, params),
    enabled: id !== null,
  });
}

/* ── Partner organizations ───────────────────────────────────────────────── */

export function usePartnerOrganizations(
  params: PartnerOrganizationListParams = {}
) {
  return useQuery({
    queryKey: partnerOrganizationKeys.list(params),
    queryFn: () => partnerOrganizationsApi.list(params),
  });
}

export function usePartnerOrganization(id: number | null) {
  return useQuery({
    queryKey: partnerOrganizationKeys.detail(id ?? -1),
    queryFn: () => partnerOrganizationsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreatePartnerOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PartnerOrganizationWritePayload) =>
      partnerOrganizationsApi.create(payload),
    onSuccess: () => invalidatePartnerQueries(queryClient),
  });
}

export function useUpdatePartnerOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: PartnerOrganizationWritePayload;
    }) => partnerOrganizationsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationKeys.detail(variables.id),
      });
      invalidatePartnerQueries(queryClient);
    },
  });
}

export function useReplacePartnerOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: PartnerOrganizationWritePayload;
    }) => partnerOrganizationsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationKeys.detail(variables.id),
      });
      invalidatePartnerQueries(queryClient);
    },
  });
}

export function useDeletePartnerOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => partnerOrganizationsApi.remove(id),
    onSuccess: () => invalidatePartnerQueries(queryClient),
  });
}

/* ── Partner organization contacts ───────────────────────────────────────── */

export function usePartnerOrganizationContacts(
  params: PartnerOrganizationContactListParams = {}
) {
  return useQuery({
    queryKey: partnerOrganizationContactKeys.list(params),
    queryFn: () => partnerOrganizationContactsApi.list(params),
  });
}

export function usePartnerOrganizationContact(id: number | null) {
  return useQuery({
    queryKey: partnerOrganizationContactKeys.detail(id ?? -1),
    queryFn: () => partnerOrganizationContactsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreatePartnerOrganizationContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PartnerOrganizationContactWritePayload) =>
      partnerOrganizationContactsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationContactKeys.all,
      });
    },
  });
}

export function useUpdatePartnerOrganizationContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: PartnerOrganizationContactWritePayload;
    }) => partnerOrganizationContactsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationContactKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationContactKeys.all,
      });
    },
  });
}

export function useReplacePartnerOrganizationContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: PartnerOrganizationContactWritePayload;
    }) => partnerOrganizationContactsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationContactKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationContactKeys.all,
      });
    },
  });
}

export function useDeletePartnerOrganizationContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => partnerOrganizationContactsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: partnerOrganizationContactKeys.all,
      });
    },
  });
}

/* ── Departments ─────────────────────────────────────────────────────────── */

export function useDepartments(params: DepartmentListParams = {}) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => departmentsApi.list(params),
  });
}

export function useDepartment(id: number | null) {
  return useQuery({
    queryKey: departmentKeys.detail(id ?? -1),
    queryFn: () => departmentsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentWritePayload) =>
      departmentsApi.create(payload),
    onSuccess: () => invalidateDepartmentQueries(queryClient),
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: DepartmentWritePayload;
    }) => departmentsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(variables.id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

export function useReplaceDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: DepartmentWritePayload;
    }) => departmentsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(variables.id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentsApi.remove(id),
    onSuccess: () => invalidateDepartmentQueries(queryClient),
  });
}

export function useUploadDepartmentImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, image }: { id: number; image: File }) =>
      departmentsApi.uploadImage(id, image),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(variables.id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

export function useRemoveDepartmentImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentsApi.removeImage(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

/* ── Department unit assignments ─────────────────────────────────────────── */

export function useDepartmentUnitAssignments(
  params: DepartmentUnitAssignmentListParams = {}
) {
  return useQuery({
    queryKey: departmentUnitAssignmentKeys.list(params),
    queryFn: () => departmentUnitAssignmentsApi.list(params),
  });
}

export function useDepartmentUnitAssignment(id: number | null) {
  return useQuery({
    queryKey: departmentUnitAssignmentKeys.detail(id ?? -1),
    queryFn: () => departmentUnitAssignmentsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateDepartmentUnitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentUnitAssignmentWritePayload) =>
      departmentUnitAssignmentsApi.create(payload),
    onSuccess: () => invalidateDepartmentQueries(queryClient),
  });
}

export function useUpdateDepartmentUnitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: DepartmentUnitAssignmentWritePayload;
    }) => departmentUnitAssignmentsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentUnitAssignmentKeys.detail(variables.id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

export function useReplaceDepartmentUnitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: DepartmentUnitAssignmentWritePayload;
    }) => departmentUnitAssignmentsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentUnitAssignmentKeys.detail(variables.id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

export function useDeleteDepartmentUnitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentUnitAssignmentsApi.remove(id),
    onSuccess: () => invalidateDepartmentQueries(queryClient),
  });
}

export function useUploadDepartmentUnitAssignmentImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, image }: { id: number; image: File }) =>
      departmentUnitAssignmentsApi.uploadImage(id, image),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: departmentUnitAssignmentKeys.detail(variables.id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

export function useRemoveDepartmentUnitAssignmentImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentUnitAssignmentsApi.removeImage(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: departmentUnitAssignmentKeys.detail(id),
      });
      invalidateDepartmentQueries(queryClient);
    },
  });
}

/* ── Organization memberships ────────────────────────────────────────────── */

export function useOrganizationMemberships(
  params: OrganizationMembershipListParams = {}
) {
  return useQuery({
    queryKey: organizationMembershipKeys.list(params),
    queryFn: () => organizationMembershipsApi.list(params),
  });
}

export function useOrganizationMembership(id: number | null) {
  return useQuery({
    queryKey: organizationMembershipKeys.detail(id ?? -1),
    queryFn: () => organizationMembershipsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateOrganizationMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationMembershipWritePayload) =>
      organizationMembershipsApi.create(payload),
    onSuccess: () => invalidateMembershipQueries(queryClient),
  });
}

export function useUpdateOrganizationMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationMembershipWritePayload;
    }) => organizationMembershipsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationMembershipKeys.detail(variables.id),
      });
      invalidateMembershipQueries(queryClient);
    },
  });
}

export function useReplaceOrganizationMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationMembershipWritePayload;
    }) => organizationMembershipsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationMembershipKeys.detail(variables.id),
      });
      invalidateMembershipQueries(queryClient);
    },
  });
}

export function useDeleteOrganizationMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationMembershipsApi.remove(id),
    onSuccess: () => invalidateMembershipQueries(queryClient),
  });
}

export function useSuspendMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationMembershipsApi.suspend(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationMembershipKeys.detail(id),
      });
      invalidateMembershipQueries(queryClient);
    },
  });
}

export function useReactivateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationMembershipsApi.reactivate(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationMembershipKeys.detail(id),
      });
      invalidateMembershipQueries(queryClient);
    },
  });
}

export function useRemoveMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationMembershipsApi.removeMembership(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationMembershipKeys.detail(id),
      });
      invalidateMembershipQueries(queryClient);
    },
  });
}

export function useMakePrimaryMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationMembershipsApi.makePrimary(id),
    onSuccess: () => invalidateMembershipQueries(queryClient),
  });
}

export function useResendMembershipInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      organizationMembershipsApi.resendInvitation(id),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}

export function useRevokeMembershipInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      organizationMembershipsApi.revokeInvitation(id),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}

export function useMembershipAccessSummary(id: number | null) {
  return useQuery({
    queryKey: organizationMembershipKeys.accessSummary(id ?? -1),
    queryFn: () => organizationMembershipsApi.accessSummary(id!),
    enabled: id !== null,
  });
}

/* ── Organization units ──────────────────────────────────────────────────── */

export function useOrganizationUnits(params: OrganizationUnitListParams = {}) {
  return useQuery({
    queryKey: organizationUnitKeys.list(params),
    queryFn: () => organizationUnitsApi.list(params),
  });
}

export function useOrganizationUnit(id: number | null) {
  return useQuery({
    queryKey: organizationUnitKeys.detail(id ?? -1),
    queryFn: () => organizationUnitsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateOrganizationUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationUnitWritePayload) =>
      organizationUnitsApi.create(payload),
    onSuccess: () => invalidateUnitQueries(queryClient),
  });
}

export function useUpdateOrganizationUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationUnitWritePayload;
    }) => organizationUnitsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitKeys.detail(variables.id),
      });
      invalidateUnitQueries(queryClient);
    },
  });
}

export function useReplaceOrganizationUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationUnitWritePayload;
    }) => organizationUnitsApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitKeys.detail(variables.id),
      });
      invalidateUnitQueries(queryClient);
    },
  });
}

export function useDeleteOrganizationUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationUnitsApi.remove(id),
    onSuccess: () => invalidateUnitQueries(queryClient),
  });
}

export function useUploadOrganizationUnitImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, image }: { id: number; image: File }) =>
      organizationUnitsApi.uploadImage(id, image),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitKeys.detail(variables.id),
      });
      invalidateUnitQueries(queryClient);
    },
  });
}

export function useRemoveOrganizationUnitImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationUnitsApi.removeImage(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitKeys.detail(id),
      });
      invalidateUnitQueries(queryClient);
    },
  });
}

/* ── Organization unit scopes ────────────────────────────────────────────── */

export function useOrganizationUnitScopes(
  params: UserOrganizationUnitScopeListParams = {}
) {
  return useQuery({
    queryKey: organizationUnitScopeKeys.list(params),
    queryFn: () => organizationUnitScopesApi.list(params),
  });
}

export function useOrganizationUnitScope(id: number | null) {
  return useQuery({
    queryKey: organizationUnitScopeKeys.detail(id ?? -1),
    queryFn: () => organizationUnitScopesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateOrganizationUnitScope() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserOrganizationUnitScopeWritePayload) =>
      organizationUnitScopesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitScopeKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: organizationMembershipKeys.all,
      });
    },
  });
}

export function useUpdateOrganizationUnitScope() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UserOrganizationUnitScopeWritePayload;
    }) => organizationUnitScopesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitScopeKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationUnitScopeKeys.all,
      });
    },
  });
}

export function useReplaceOrganizationUnitScope() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UserOrganizationUnitScopeWritePayload;
    }) => organizationUnitScopesApi.replace(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitScopeKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationUnitScopeKeys.all,
      });
    },
  });
}

export function useDeleteOrganizationUnitScope() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationUnitScopesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationUnitScopeKeys.all,
      });
    },
  });
}

/* ── Organization invitations ────────────────────────────────────────────── */

export function useOrganizationInvitationList(
  params: OrganizationInvitationListParams = {}
) {
  return useQuery({
    queryKey: organizationInvitationKeys.list(params),
    queryFn: () => organizationInvitationsApi.list(params),
  });
}

export function useOrganizationInvitation(id: number | null) {
  return useQuery({
    queryKey: organizationInvitationKeys.detail(id ?? -1),
    queryFn: () => organizationInvitationsApi.get(id!),
    enabled: id !== null,
  });
}

export function useValidateOrganizationInvitation() {
  return useMutation({
    mutationFn: (payload: ValidateInvitePayload) =>
      organizationInvitationsApi.validateOrganizationInvitation(payload),
  });
}

export function useAcceptOrganizationInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AcceptInvitePayload) =>
      organizationInvitationsApi.acceptOrganizationInvitation(payload),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}

export function useValidateInvitationToken() {
  return useMutation({
    mutationFn: (payload: ValidateInvitePayload) =>
      organizationInvitationsApi.validateToken(payload),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AcceptInvitePayload) =>
      organizationInvitationsApi.accept(payload),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}

export function useResendOrganizationInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationInvitationsApi.resend(id),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}

export function useRevokeOrganizationInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationInvitationsApi.revoke(id),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}

export function useExpireOrganizationInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationInvitationsApi.expire(id),
    onSuccess: () => invalidateInvitationQueries(queryClient),
  });
}
