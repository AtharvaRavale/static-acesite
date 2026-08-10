import { api } from "@/lib/api";
import type { OrganizationModule, ProductModule } from "@/features/platformModules";
import type {
  AcceptInvitePayload,
  AcceptInviteResponse,
  AvailableModuleItem,
  BulkInviteMembersPayload,
  BulkInviteMembersResponse,
  Department,
  DepartmentListParams,
  DepartmentStructureResponse,
  DepartmentUnitAssignment,
  DepartmentUnitAssignmentListParams,
  DepartmentUnitAssignmentWritePayload,
  DepartmentWritePayload,
  MembershipAccessSummaryResponse,
  ModuleConfigurationPayload,
  Organization,
  OrganizationActivityListParams,
  OrganizationActivityResponse,
  OrganizationAdminInvite,
  OrganizationInvitationListParams,
  OrganizationInvitationsParams,
  OrganizationListParams,
  OrganizationMembership,
  OrganizationMembershipListParams,
  OrganizationMembershipWritePayload,
  OrganizationModuleDetailResponse,
  OrganizationModulesParams,
  OrganizationOverviewResponse,
  OrganizationSetupTreeResponse,
  OrganizationTreeParams,
  OrganizationUnit,
  OrganizationUnitListParams,
  OrganizationUnitTreeNode,
  OrganizationUnitWritePayload,
  OrganizationWritePayload,
  PaginatedResponse,
  PartnerOrganization,
  PartnerOrganizationContact,
  PartnerOrganizationContactListParams,
  PartnerOrganizationContactWritePayload,
  PartnerOrganizationListParams,
  PartnerOrganizationTreeNode,
  PartnerOrganizationWritePayload,
  ProvisionCoreModulesResponse,
  TransferOwnershipPayload,
  TransferOwnershipResponse,
  UserOrganizationUnitScope,
  UserOrganizationUnitScopeListParams,
  UserOrganizationUnitScopeWritePayload,
  ValidateInvitePayload,
  ValidateInviteResponse,
} from "./types";

type QueryValue = string | number | boolean | undefined | null;

function buildQueryString(params: object = {}): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params as Record<string, QueryValue>)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function toFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (value === null) {
      formData.append(key, "");
      continue;
    }
    if (value instanceof File) {
      formData.append(key, value);
      continue;
    }
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      continue;
    }
    formData.append(key, String(value));
  }

  return formData;
}

function hasFile(payload: Record<string, unknown>): boolean {
  return Object.values(payload).some((value) => value instanceof File);
}

async function writeJsonOrFormData<T>(
  method: "post" | "patch" | "put",
  path: string,
  payload: Record<string, unknown>
): Promise<T> {
  if (hasFile(payload)) {
    const response = await api[method]<T>(path, toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await api[method]<T>(path, payload);
  return response.data;
}

/* ── Organizations ───────────────────────────────────────────────────────── */

export const organizationsApi = {
  list: async (
    params: OrganizationListParams = {}
  ): Promise<PaginatedResponse<Organization>> => {
    const response = await api.get<PaginatedResponse<Organization>>(
      `/organizations/${buildQueryString(params)}`
    );
    return response.data;
  },

  create: async (payload: OrganizationWritePayload): Promise<Organization> => {
    return writeJsonOrFormData("post", "/organizations/", payload as Record<string, unknown>);
  },

  get: async (id: number): Promise<Organization> => {
    const response = await api.get<Organization>(`/organizations/${id}/`);
    return response.data;
  },

  update: async (
    id: number,
    payload: OrganizationWritePayload
  ): Promise<Organization> => {
    return writeJsonOrFormData(
      "patch",
      `/organizations/${id}/`,
      payload as Record<string, unknown>
    );
  },

  replace: async (
    id: number,
    payload: OrganizationWritePayload
  ): Promise<Organization> => {
    return writeJsonOrFormData(
      "put",
      `/organizations/${id}/`,
      payload as Record<string, unknown>
    );
  },

  /** Hard delete is rejected by the API; prefer close/suspend. */
  remove: async (id: number): Promise<void> => {
    await api.delete(`/organizations/${id}/`);
  },

  uploadLogo: async (id: number, logo: File): Promise<Organization> => {
    const formData = new FormData();
    formData.append("logo", logo);
    const response = await api.post<Organization>(
      `/organizations/${id}/upload-logo/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  removeLogo: async (id: number): Promise<Organization> => {
    const response = await api.delete<Organization>(
      `/organizations/${id}/remove-logo/`
    );
    return response.data;
  },

  transferOwnership: async (
    id: number,
    payload: TransferOwnershipPayload
  ): Promise<TransferOwnershipResponse> => {
    const response = await api.post<TransferOwnershipResponse>(
      `/organizations/${id}/transfer-ownership/`,
      payload
    );
    return response.data;
  },

  activate: async (id: number): Promise<Organization> => {
    const response = await api.post<Organization>(`/organizations/${id}/activate/`);
    return response.data;
  },

  suspend: async (id: number): Promise<Organization> => {
    const response = await api.post<Organization>(`/organizations/${id}/suspend/`);
    return response.data;
  },

  close: async (id: number): Promise<Organization> => {
    const response = await api.post<Organization>(`/organizations/${id}/close/`);
    return response.data;
  },

  restore: async (id: number): Promise<Organization> => {
    const response = await api.post<Organization>(`/organizations/${id}/restore/`);
    return response.data;
  },

  provisionCoreModules: async (
    id: number
  ): Promise<ProvisionCoreModulesResponse> => {
    const response = await api.post<ProvisionCoreModulesResponse>(
      `/organizations/${id}/provision-core-modules/`
    );
    return response.data;
  },

  overview: async (id: number): Promise<OrganizationOverviewResponse> => {
    const response = await api.get<OrganizationOverviewResponse>(
      `/organizations/${id}/overview/`
    );
    return response.data;
  },

  setupTree: async (
    id: number,
    params: OrganizationTreeParams = {}
  ): Promise<OrganizationSetupTreeResponse> => {
    const response = await api.get<OrganizationSetupTreeResponse>(
      `/organizations/${id}/setup-tree/${buildQueryString(params)}`
    );
    return response.data;
  },

  unitTree: async (
    id: number,
    params: OrganizationTreeParams = {}
  ): Promise<OrganizationUnitTreeNode[]> => {
    const response = await api.get<OrganizationUnitTreeNode[]>(
      `/organizations/${id}/unit-tree/${buildQueryString(params)}`
    );
    return response.data;
  },

  partnerTree: async (
    id: number,
    params: OrganizationTreeParams = {}
  ): Promise<PartnerOrganizationTreeNode[]> => {
    const response = await api.get<PartnerOrganizationTreeNode[]>(
      `/organizations/${id}/partner-tree/${buildQueryString(params)}`
    );
    return response.data;
  },

  departmentStructure: async (
    id: number,
    params: OrganizationTreeParams = {}
  ): Promise<DepartmentStructureResponse> => {
    const response = await api.get<DepartmentStructureResponse>(
      `/organizations/${id}/department-structure/${buildQueryString(params)}`
    );
    return response.data;
  },

  invitations: async (
    id: number,
    params: OrganizationInvitationsParams = {}
  ): Promise<OrganizationAdminInvite[]> => {
    const response = await api.get<OrganizationAdminInvite[]>(
      `/organizations/${id}/invitations/${buildQueryString(params)}`
    );
    return response.data;
  },

  bulkInviteMembers: async (
    id: number,
    payload: BulkInviteMembersPayload
  ): Promise<BulkInviteMembersResponse> => {
    const response = await api.post<BulkInviteMembersResponse>(
      `/organizations/${id}/bulk-invite-members/`,
      payload
    );
    return response.data;
  },

  modules: async (
    id: number,
    params: OrganizationModulesParams = {}
  ): Promise<OrganizationModule[]> => {
    const response = await api.get<OrganizationModule[]>(
      `/organizations/${id}/modules/${buildQueryString(params)}`
    );
    return response.data;
  },

  availableModules: async (id: number): Promise<AvailableModuleItem[]> => {
    const response = await api.get<AvailableModuleItem[]>(
      `/organizations/${id}/available-modules/`
    );
    return response.data;
  },

  getModule: async (
    id: number,
    moduleId: number | string
  ): Promise<OrganizationModuleDetailResponse> => {
    const response = await api.get<OrganizationModuleDetailResponse>(
      `/organizations/${id}/modules/${moduleId}/`
    );
    return response.data;
  },

  enableModule: async (
    id: number,
    moduleId: number | string
  ): Promise<OrganizationModule> => {
    const response = await api.post<OrganizationModule>(
      `/organizations/${id}/modules/${moduleId}/enable/`
    );
    return response.data;
  },

  readOnlyModule: async (
    id: number,
    moduleId: number | string
  ): Promise<OrganizationModule> => {
    const response = await api.post<OrganizationModule>(
      `/organizations/${id}/modules/${moduleId}/read-only/`
    );
    return response.data;
  },

  disableModule: async (
    id: number,
    moduleId: number | string
  ): Promise<OrganizationModule> => {
    const response = await api.post<OrganizationModule>(
      `/organizations/${id}/modules/${moduleId}/disable/`
    );
    return response.data;
  },

  updateModuleConfiguration: async (
    id: number,
    moduleId: number | string,
    payload: ModuleConfigurationPayload
  ): Promise<OrganizationModule> => {
    const response = await api.patch<OrganizationModule>(
      `/organizations/${id}/modules/${moduleId}/configuration/`,
      payload
    );
    return response.data;
  },

  activity: async (
    id: number,
    params: OrganizationActivityListParams = {}
  ): Promise<OrganizationActivityResponse> => {
    const response = await api.get<OrganizationActivityResponse>(
      `/organizations/${id}/activity/${buildQueryString(params)}`
    );
    return response.data;
  },
};

/* ── Partner organizations ───────────────────────────────────────────────── */

export const partnerOrganizationsApi = {
  list: async (
    params: PartnerOrganizationListParams = {}
  ): Promise<PaginatedResponse<PartnerOrganization>> => {
    const response = await api.get<PaginatedResponse<PartnerOrganization>>(
      `/partner-organizations/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<PartnerOrganization> => {
    const response = await api.get<PartnerOrganization>(
      `/partner-organizations/${id}/`
    );
    return response.data;
  },

  create: async (
    payload: PartnerOrganizationWritePayload
  ): Promise<PartnerOrganization> => {
    const response = await api.post<PartnerOrganization>(
      "/partner-organizations/",
      payload
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: PartnerOrganizationWritePayload
  ): Promise<PartnerOrganization> => {
    const response = await api.patch<PartnerOrganization>(
      `/partner-organizations/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: PartnerOrganizationWritePayload
  ): Promise<PartnerOrganization> => {
    const response = await api.put<PartnerOrganization>(
      `/partner-organizations/${id}/`,
      payload
    );
    return response.data;
  },

  activate: async (id: number): Promise<PartnerOrganization> => {
    const response = await api.post<PartnerOrganization>(`/partner-organizations/${id}/activate/`);
    return response.data;
  },

  deactivate: async (id: number): Promise<PartnerOrganization> => {
    const response = await api.post<PartnerOrganization>(`/partner-organizations/${id}/deactivate/`);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/partner-organizations/${id}/`);
  },
};

/* ── Partner organization contacts ───────────────────────────────────────── */

export const partnerOrganizationContactsApi = {
  list: async (
    params: PartnerOrganizationContactListParams = {}
  ): Promise<PaginatedResponse<PartnerOrganizationContact>> => {
    const response = await api.get<PaginatedResponse<PartnerOrganizationContact>>(
      `/partner-organization-contacts/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<PartnerOrganizationContact> => {
    const response = await api.get<PartnerOrganizationContact>(
      `/partner-organization-contacts/${id}/`
    );
    return response.data;
  },

  create: async (
    payload: PartnerOrganizationContactWritePayload
  ): Promise<PartnerOrganizationContact> => {
    const response = await api.post<PartnerOrganizationContact>(
      "/partner-organization-contacts/",
      payload
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: PartnerOrganizationContactWritePayload
  ): Promise<PartnerOrganizationContact> => {
    const response = await api.patch<PartnerOrganizationContact>(
      `/partner-organization-contacts/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: PartnerOrganizationContactWritePayload
  ): Promise<PartnerOrganizationContact> => {
    const response = await api.put<PartnerOrganizationContact>(
      `/partner-organization-contacts/${id}/`,
      payload
    );
    return response.data;
  },

  setPrimary: async (id: number): Promise<PartnerOrganizationContact> => {
    const response = await api.post<PartnerOrganizationContact>(`/partner-organization-contacts/${id}/set-primary/`);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/partner-organization-contacts/${id}/`);
  },
};

/* ── Departments ─────────────────────────────────────────────────────────── */

export const departmentsApi = {
  list: async (
    params: DepartmentListParams = {}
  ): Promise<PaginatedResponse<Department>> => {
    const response = await api.get<PaginatedResponse<Department>>(
      `/departments/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<Department> => {
    const response = await api.get<Department>(`/departments/${id}/`);
    return response.data;
  },

  create: async (payload: DepartmentWritePayload): Promise<Department> => {
    return writeJsonOrFormData("post", "/departments/", payload as Record<string, unknown>);
  },

  update: async (
    id: number,
    payload: DepartmentWritePayload
  ): Promise<Department> => {
    return writeJsonOrFormData(
      "patch",
      `/departments/${id}/`,
      payload as Record<string, unknown>
    );
  },

  replace: async (
    id: number,
    payload: DepartmentWritePayload
  ): Promise<Department> => {
    return writeJsonOrFormData(
      "put",
      `/departments/${id}/`,
      payload as Record<string, unknown>
    );
  },

  activate: async (id: number): Promise<Department> => {
    const response = await api.post<Department>(`/departments/${id}/activate/`);
    return response.data;
  },

  deactivate: async (id: number): Promise<Department> => {
    const response = await api.post<Department>(`/departments/${id}/deactivate/`);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}/`);
  },

  uploadImage: async (id: number, image: File): Promise<Department> => {
    const formData = new FormData();
    formData.append("image", image);
    const response = await api.post<Department>(
      `/departments/${id}/upload-image/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  removeImage: async (id: number): Promise<Department> => {
    const response = await api.delete<Department>(
      `/departments/${id}/remove-image/`
    );
    return response.data;
  },
};

/* ── Department unit assignments ─────────────────────────────────────────── */

export const departmentUnitAssignmentsApi = {
  list: async (
    params: DepartmentUnitAssignmentListParams = {}
  ): Promise<PaginatedResponse<DepartmentUnitAssignment>> => {
    const response = await api.get<PaginatedResponse<DepartmentUnitAssignment>>(
      `/department-unit-assignments/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<DepartmentUnitAssignment> => {
    const response = await api.get<DepartmentUnitAssignment>(
      `/department-unit-assignments/${id}/`
    );
    return response.data;
  },

  create: async (
    payload: DepartmentUnitAssignmentWritePayload
  ): Promise<DepartmentUnitAssignment> => {
    return writeJsonOrFormData(
      "post",
      "/department-unit-assignments/",
      payload as Record<string, unknown>
    );
  },

  update: async (
    id: number,
    payload: DepartmentUnitAssignmentWritePayload
  ): Promise<DepartmentUnitAssignment> => {
    return writeJsonOrFormData(
      "patch",
      `/department-unit-assignments/${id}/`,
      payload as Record<string, unknown>
    );
  },

  replace: async (
    id: number,
    payload: DepartmentUnitAssignmentWritePayload
  ): Promise<DepartmentUnitAssignment> => {
    return writeJsonOrFormData(
      "put",
      `/department-unit-assignments/${id}/`,
      payload as Record<string, unknown>
    );
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/department-unit-assignments/${id}/`);
  },

  uploadImage: async (
    id: number,
    image: File
  ): Promise<DepartmentUnitAssignment> => {
    const formData = new FormData();
    formData.append("image", image);
    const response = await api.post<DepartmentUnitAssignment>(
      `/department-unit-assignments/${id}/upload-image/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  removeImage: async (id: number): Promise<DepartmentUnitAssignment> => {
    const response = await api.delete<DepartmentUnitAssignment>(
      `/department-unit-assignments/${id}/remove-image/`
    );
    return response.data;
  },
};

/* ── Organization memberships ────────────────────────────────────────────── */

export const organizationMembershipsApi = {
  list: async (
    params: OrganizationMembershipListParams = {}
  ): Promise<PaginatedResponse<OrganizationMembership>> => {
    const response = await api.get<PaginatedResponse<OrganizationMembership>>(
      `/organization-memberships/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<OrganizationMembership> => {
    const response = await api.get<OrganizationMembership>(
      `/organization-memberships/${id}/`
    );
    return response.data;
  },

  create: async (
    payload: OrganizationMembershipWritePayload
  ): Promise<OrganizationMembership> => {
    const response = await api.post<OrganizationMembership>(
      "/organization-memberships/",
      payload
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: OrganizationMembershipWritePayload
  ): Promise<OrganizationMembership> => {
    const response = await api.patch<OrganizationMembership>(
      `/organization-memberships/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: OrganizationMembershipWritePayload
  ): Promise<OrganizationMembership> => {
    const response = await api.put<OrganizationMembership>(
      `/organization-memberships/${id}/`,
      payload
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/organization-memberships/${id}/`);
  },

  suspend: async (id: number): Promise<OrganizationMembership> => {
    const response = await api.post<OrganizationMembership>(
      `/organization-memberships/${id}/suspend/`
    );
    return response.data;
  },

  reactivate: async (id: number): Promise<OrganizationMembership> => {
    const response = await api.post<OrganizationMembership>(
      `/organization-memberships/${id}/reactivate/`
    );
    return response.data;
  },

  removeMembership: async (id: number): Promise<OrganizationMembership> => {
    const response = await api.post<OrganizationMembership>(
      `/organization-memberships/${id}/remove/`
    );
    return response.data;
  },

  makePrimary: async (id: number): Promise<OrganizationMembership> => {
    const response = await api.post<OrganizationMembership>(
      `/organization-memberships/${id}/make-primary/`
    );
    return response.data;
  },

  resendInvitation: async (id: number): Promise<OrganizationAdminInvite> => {
    const response = await api.post<OrganizationAdminInvite>(
      `/organization-memberships/${id}/resend-invitation/`
    );
    return response.data;
  },

  revokeInvitation: async (id: number): Promise<OrganizationAdminInvite> => {
    const response = await api.post<OrganizationAdminInvite>(
      `/organization-memberships/${id}/revoke-invitation/`
    );
    return response.data;
  },

  accessSummary: async (id: number): Promise<MembershipAccessSummaryResponse> => {
    const response = await api.get<MembershipAccessSummaryResponse>(
      `/organization-memberships/${id}/access-summary/`
    );
    return response.data;
  },
};

/* ── Organization units ──────────────────────────────────────────────────── */

export const organizationUnitsApi = {
  list: async (
    params: OrganizationUnitListParams = {}
  ): Promise<PaginatedResponse<OrganizationUnit>> => {
    const response = await api.get<PaginatedResponse<OrganizationUnit>>(
      `/organization-units/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<OrganizationUnit> => {
    const response = await api.get<OrganizationUnit>(`/organization-units/${id}/`);
    return response.data;
  },

  create: async (
    payload: OrganizationUnitWritePayload
  ): Promise<OrganizationUnit> => {
    return writeJsonOrFormData(
      "post",
      "/organization-units/",
      payload as Record<string, unknown>
    );
  },

  update: async (
    id: number,
    payload: OrganizationUnitWritePayload
  ): Promise<OrganizationUnit> => {
    return writeJsonOrFormData(
      "patch",
      `/organization-units/${id}/`,
      payload as Record<string, unknown>
    );
  },

  replace: async (
    id: number,
    payload: OrganizationUnitWritePayload
  ): Promise<OrganizationUnit> => {
    return writeJsonOrFormData(
      "put",
      `/organization-units/${id}/`,
      payload as Record<string, unknown>
    );
  },

  activate: async (id: number): Promise<OrganizationUnit> => {
    const response = await api.post<OrganizationUnit>(`/organization-units/${id}/activate/`);
    return response.data;
  },

  deactivate: async (id: number): Promise<OrganizationUnit> => {
    const response = await api.post<OrganizationUnit>(`/organization-units/${id}/deactivate/`);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/organization-units/${id}/`);
  },

  uploadImage: async (id: number, image: File): Promise<OrganizationUnit> => {
    const formData = new FormData();
    formData.append("image", image);
    const response = await api.post<OrganizationUnit>(
      `/organization-units/${id}/upload-image/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  removeImage: async (id: number): Promise<OrganizationUnit> => {
    const response = await api.delete<OrganizationUnit>(
      `/organization-units/${id}/remove-image/`
    );
    return response.data;
  },
};

/* ── Organization unit scopes ────────────────────────────────────────────── */

export const organizationUnitScopesApi = {
  list: async (
    params: UserOrganizationUnitScopeListParams = {}
  ): Promise<PaginatedResponse<UserOrganizationUnitScope>> => {
    const response = await api.get<PaginatedResponse<UserOrganizationUnitScope>>(
      `/organization-unit-scopes/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<UserOrganizationUnitScope> => {
    const response = await api.get<UserOrganizationUnitScope>(
      `/organization-unit-scopes/${id}/`
    );
    return response.data;
  },

  create: async (
    payload: UserOrganizationUnitScopeWritePayload
  ): Promise<UserOrganizationUnitScope> => {
    const response = await api.post<UserOrganizationUnitScope>(
      "/organization-unit-scopes/",
      payload
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: UserOrganizationUnitScopeWritePayload
  ): Promise<UserOrganizationUnitScope> => {
    const response = await api.patch<UserOrganizationUnitScope>(
      `/organization-unit-scopes/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: UserOrganizationUnitScopeWritePayload
  ): Promise<UserOrganizationUnitScope> => {
    const response = await api.put<UserOrganizationUnitScope>(
      `/organization-unit-scopes/${id}/`,
      payload
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/organization-unit-scopes/${id}/`);
  },
};

/* ── Organization invitations ────────────────────────────────────────────── */

export const organizationInvitationsApi = {
  list: async (
    params: OrganizationInvitationListParams = {}
  ): Promise<PaginatedResponse<OrganizationAdminInvite>> => {
    const response = await api.get<PaginatedResponse<OrganizationAdminInvite>>(
      `/organization-invitations/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<OrganizationAdminInvite> => {
    const response = await api.get<OrganizationAdminInvite>(
      `/organization-invitations/${id}/`
    );
    return response.data;
  },

  validateToken: async (
    payload: ValidateInvitePayload
  ): Promise<ValidateInviteResponse> => {
    const response = await api.post<ValidateInviteResponse>(
      "/organization-invitations/validate-token/",
      payload
    );
    return response.data;
  },

  accept: async (payload: AcceptInvitePayload): Promise<AcceptInviteResponse> => {
    const response = await api.post<AcceptInviteResponse>(
      "/organization-invitations/accept/",
      payload
    );
    return response.data;
  },

  resend: async (id: number): Promise<OrganizationAdminInvite> => {
    const response = await api.post<OrganizationAdminInvite>(
      `/organization-invitations/${id}/resend/`
    );
    return response.data;
  },

  revoke: async (id: number): Promise<OrganizationAdminInvite> => {
    const response = await api.post<OrganizationAdminInvite>(
      `/organization-invitations/${id}/revoke/`
    );
    return response.data;
  },

  expire: async (id: number): Promise<OrganizationAdminInvite> => {
    const response = await api.post<OrganizationAdminInvite>(
      `/organization-invitations/${id}/expire/`
    );
    return response.data;
  },

  validateOrganizationInvitation: async (
    payload: ValidateInvitePayload
  ): Promise<ValidateInviteResponse> => {
    const response = await api.post<ValidateInviteResponse>(
      "/auth/validate-organization-invitation/",
      payload
    );
    return response.data;
  },

  acceptOrganizationInvitation: async (
    payload: AcceptInvitePayload
  ): Promise<AcceptInviteResponse> => {
    const response = await api.post<AcceptInviteResponse>(
      "/auth/accept-organization-invitation/",
      payload
    );
    return response.data;
  },
};

/** Auth-path invitation helpers (same handlers as invitationsApi auth methods). */
export const authInvitationApi = {
  validateOrganizationInvitation:
    organizationInvitationsApi.validateOrganizationInvitation,
  acceptOrganizationInvitation:
    organizationInvitationsApi.acceptOrganizationInvitation,
};

export type { OrganizationModule, ProductModule };
