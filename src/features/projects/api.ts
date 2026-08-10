import { api } from "@/lib/api";
import type {
  GenerateRoomsPayload,
  GenerateRoomsResponse,
  LocationMovePayload,
  MasterFlatType,
  MasterFlatTypeAvailability,
  MasterFlatTypeAvailabilityListParams,
  MasterFlatTypeAvailabilityUpdatePayload,
  MasterFlatTypeAvailabilityWritePayload,
  MasterFlatTypeListParams,
  MasterRoomType,
  MasterRoomTypeAvailability,
  MasterRoomTypeAvailabilityListParams,
  MasterRoomTypeAvailabilityUpdatePayload,
  MasterRoomTypeAvailabilityWritePayload,
  MasterRoomTypeListParams,
  MasterTypeUpdatePayload,
  MasterTypeWritePayload,
  PaginatedResponse,
  Project,
  ProjectCreatePayload,
  ProjectFlatTemplate,
  ProjectFlatTemplateItem,
  ProjectFlatTemplateItemListParams,
  ProjectFlatTemplateItemUpdatePayload,
  ProjectFlatTemplateItemWritePayload,
  ProjectFlatTemplateListParams,
  ProjectFlatTemplateUpdatePayload,
  ProjectFlatTemplateWritePayload,
  ProjectFlatType,
  ProjectFlatTypeListParams,
  ProjectListParams,
  ProjectLocationNode,
  ProjectLocationNodeClosure,
  ProjectLocationNodeListParams,
  ProjectLocationNodeUpdatePayload,
  ProjectLocationNodeWritePayload,
  ProjectMembership,
  ProjectMembershipListParams,
  ProjectMembershipUpdatePayload,
  ProjectMembershipWritePayload,
  ProjectModuleAccess,
  ProjectModuleAccessListParams,
  ProjectModuleAccessUpdatePayload,
  ProjectModuleAccessWritePayload,
  ProjectParty,
  ProjectPartyListParams,
  ProjectPartyModuleAccess,
  ProjectPartyModuleAccessListParams,
  ProjectPartyModuleAccessUpdatePayload,
  ProjectPartyModuleAccessWritePayload,
  ProjectPartyRoleGrant,
  ProjectPartyRoleGrantListParams,
  ProjectPartyRoleGrantUpdatePayload,
  ProjectPartyRoleGrantWritePayload,
  ProjectPartyTeam,
  ProjectPartyTeamListParams,
  ProjectPartyTeamUpdatePayload,
  ProjectPartyTeamWritePayload,
  ProjectPartyUpdatePayload,
  ProjectPartyWritePayload,
  ProjectProfile,
  ProjectProfileWritePayload,
  ProjectReleasePolicy,
  ProjectReleasePolicyListParams,
  ProjectReleasePolicyUpdatePayload,
  ProjectReleasePolicyWritePayload,
  ProjectRoomType,
  ProjectRoomTypeListParams,
  ProjectStatusActionPayload,
  ProjectStructureLevel,
  ProjectStructureLevelListParams,
  ProjectStructureLevelTransition,
  ProjectStructureLevelTransitionListParams,
  ProjectStructureLevelTransitionUpdatePayload,
  ProjectStructureLevelTransitionWritePayload,
  ProjectStructureLevelUpdatePayload,
  ProjectStructureLevelWritePayload,
  ProjectStructureTreeResponse,
  ProjectTypeUpdatePayload,
  ProjectTypeWritePayload,
  ProjectUpdatePayload,
  ProjectValidationReport,
  UserProjectMembership,
  UserProjectMembershipListParams,
  UserProjectMembershipUpdatePayload,
  UserProjectMembershipWritePayload,
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

async function writeProject(
  method: "post" | "patch" | "put",
  path: string,
  payload: ProjectCreatePayload | ProjectUpdatePayload
): Promise<Project> {
  const body = payload as Record<string, unknown>;

  if (hasFile(body)) {
    const response = await api[method]<Project>(path, toFormData(body), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await api[method]<Project>(path, payload);
  return response.data;
}

function createResourceApi<
  TResource,
  TCreate,
  TUpdate,
  TParams extends object = object,
>(basePath: string) {
  const collection = `${basePath}/`;

  return {
    list: async (
      params: TParams = {} as TParams
    ): Promise<PaginatedResponse<TResource>> => {
      const response = await api.get<PaginatedResponse<TResource>>(
        `${collection}${buildQueryString(params)}`
      );
      return response.data;
    },

    create: async (payload: TCreate): Promise<TResource> => {
      const response = await api.post<TResource>(collection, payload);
      return response.data;
    },

    get: async (id: number): Promise<TResource> => {
      const response = await api.get<TResource>(`${basePath}/${id}/`);
      return response.data;
    },

    update: async (id: number, payload: TUpdate): Promise<TResource> => {
      const response = await api.patch<TResource>(`${basePath}/${id}/`, payload);
      return response.data;
    },

    replace: async (id: number, payload: TUpdate): Promise<TResource> => {
      const response = await api.put<TResource>(`${basePath}/${id}/`, payload);
      return response.data;
    },

    remove: async (id: number): Promise<void> => {
      await api.delete(`${basePath}/${id}/`);
    },
  };
}

/* ── Projects ────────────────────────────────────────────────────────────── */

export const projectsApi = {
  list: async (
    params: ProjectListParams = {}
  ): Promise<PaginatedResponse<Project>> => {
    const response = await api.get<PaginatedResponse<Project>>(
      `/projects/${buildQueryString(params)}`
    );
    return response.data;
  },

  create: async (payload: ProjectCreatePayload): Promise<Project> => {
    return writeProject("post", "/projects/", payload);
  },

  get: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}/`);
    return response.data;
  },

  structureTree: async (id: number): Promise<ProjectStructureTreeResponse> => {
    const response = await api.get<ProjectStructureTreeResponse>(
      `/projects/${id}/structure-tree/`
    );
    return response.data;
  },

  update: async (id: number, payload: ProjectUpdatePayload): Promise<Project> => {
    return writeProject("patch", `/projects/${id}/`, payload);
  },

  replace: async (
    id: number,
    payload: ProjectUpdatePayload
  ): Promise<Project> => {
    return writeProject("put", `/projects/${id}/`, payload);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}/`);
  },

  getProfile: async (id: number): Promise<ProjectProfile> => {
    const response = await api.get<ProjectProfile>(`/projects/${id}/profile/`);
    return response.data;
  },

  updateProfile: async (
    id: number,
    payload: ProjectProfileWritePayload
  ): Promise<ProjectProfile> => {
    const response = await api.patch<ProjectProfile>(
      `/projects/${id}/profile/`,
      payload
    );
    return response.data;
  },

  upsertProfile: async (
    id: number,
    payload: ProjectProfileWritePayload
  ): Promise<ProjectProfile> => {
    const response = await api.put<ProjectProfile>(
      `/projects/${id}/profile/`,
      payload
    );
    return response.data;
  },

  validation: async (id: number): Promise<ProjectValidationReport> => {
    const response = await api.get<ProjectValidationReport>(
      `/projects/${id}/validation/`
    );
    return response.data;
  },

  activate: async (
    id: number,
    payload: ProjectStatusActionPayload = {}
  ): Promise<Project> => {
    const response = await api.post<Project>(
      `/projects/${id}/activate/`,
      payload
    );
    return response.data;
  },

  putOnHold: async (
    id: number,
    payload: ProjectStatusActionPayload = {}
  ): Promise<Project> => {
    const response = await api.post<Project>(
      `/projects/${id}/put-on-hold/`,
      payload
    );
    return response.data;
  },

  resume: async (
    id: number,
    payload: ProjectStatusActionPayload = {}
  ): Promise<Project> => {
    const response = await api.post<Project>(`/projects/${id}/resume/`, payload);
    return response.data;
  },

  complete: async (
    id: number,
    payload: ProjectStatusActionPayload = {}
  ): Promise<Project> => {
    const response = await api.post<Project>(
      `/projects/${id}/complete/`,
      payload
    );
    return response.data;
  },

  cancel: async (
    id: number,
    payload: ProjectStatusActionPayload = {}
  ): Promise<Project> => {
    const response = await api.post<Project>(`/projects/${id}/cancel/`, payload);
    return response.data;
  },

  reopen: async (
    id: number,
    payload: ProjectStatusActionPayload = {}
  ): Promise<Project> => {
    const response = await api.post<Project>(`/projects/${id}/reopen/`, payload);
    return response.data;
  },

  availableMasterRoomTypes: async (
    projectId: number
  ): Promise<MasterRoomType[]> => {
    const response = await api.get<MasterRoomType[]>(
      `/projects/${projectId}/available-master-room-types/`
    );
    return response.data;
  },

  availableMasterFlatTypes: async (
    projectId: number
  ): Promise<MasterFlatType[]> => {
    const response = await api.get<MasterFlatType[]>(
      `/projects/${projectId}/available-master-flat-types/`
    );
    return response.data;
  },
};

/* ── Nested location hierarchy (structure level transitions) ─────────────── */

export const locationHierarchyApi = {
  list: async (
    projectId: number,
    params: ProjectStructureLevelTransitionListParams = {}
  ): Promise<PaginatedResponse<ProjectStructureLevelTransition>> => {
    const response = await api.get<
      PaginatedResponse<ProjectStructureLevelTransition>
    >(`/projects/${projectId}/location-hierarchy/${buildQueryString(params)}`);
    return response.data;
  },

  create: async (
    projectId: number,
    payload: ProjectStructureLevelTransitionWritePayload
  ): Promise<ProjectStructureLevelTransition> => {
    const response = await api.post<ProjectStructureLevelTransition>(
      `/projects/${projectId}/location-hierarchy/`,
      payload
    );
    return response.data;
  },

  get: async (
    projectId: number,
    id: number
  ): Promise<ProjectStructureLevelTransition> => {
    const response = await api.get<ProjectStructureLevelTransition>(
      `/projects/${projectId}/location-hierarchy/${id}/`
    );
    return response.data;
  },

  update: async (
    projectId: number,
    id: number,
    payload: ProjectStructureLevelTransitionUpdatePayload
  ): Promise<ProjectStructureLevelTransition> => {
    const response = await api.patch<ProjectStructureLevelTransition>(
      `/projects/${projectId}/location-hierarchy/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    projectId: number,
    id: number,
    payload: ProjectStructureLevelTransitionUpdatePayload
  ): Promise<ProjectStructureLevelTransition> => {
    const response = await api.put<ProjectStructureLevelTransition>(
      `/projects/${projectId}/location-hierarchy/${id}/`,
      payload
    );
    return response.data;
  },

  remove: async (projectId: number, id: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/location-hierarchy/${id}/`);
  },
};

/* ── Catalog & structure resources ───────────────────────────────────────── */

export const masterRoomTypesApi = createResourceApi<
  MasterRoomType,
  MasterTypeWritePayload,
  MasterTypeUpdatePayload,
  MasterRoomTypeListParams
>("/master-room-types");

export const masterFlatTypesApi = createResourceApi<
  MasterFlatType,
  MasterTypeWritePayload,
  MasterTypeUpdatePayload,
  MasterFlatTypeListParams
>("/master-flat-types");

export const masterRoomTypeAvailabilitiesApi = createResourceApi<
  MasterRoomTypeAvailability,
  MasterRoomTypeAvailabilityWritePayload,
  MasterRoomTypeAvailabilityUpdatePayload,
  MasterRoomTypeAvailabilityListParams
>("/master-room-type-availabilities");

export const masterFlatTypeAvailabilitiesApi = createResourceApi<
  MasterFlatTypeAvailability,
  MasterFlatTypeAvailabilityWritePayload,
  MasterFlatTypeAvailabilityUpdatePayload,
  MasterFlatTypeAvailabilityListParams
>("/master-flat-type-availabilities");

export const projectRoomTypesApi = createResourceApi<
  ProjectRoomType,
  ProjectTypeWritePayload,
  ProjectTypeUpdatePayload,
  ProjectRoomTypeListParams
>("/project-room-types");

export const projectFlatTypesApi = createResourceApi<
  ProjectFlatType,
  ProjectTypeWritePayload,
  ProjectTypeUpdatePayload,
  ProjectFlatTypeListParams
>("/project-flat-types");

export const projectFlatTemplatesApi = createResourceApi<
  ProjectFlatTemplate,
  ProjectFlatTemplateWritePayload,
  ProjectFlatTemplateUpdatePayload,
  ProjectFlatTemplateListParams
>("/project-flat-templates");

export const projectFlatTemplateItemsApi = createResourceApi<
  ProjectFlatTemplateItem,
  ProjectFlatTemplateItemWritePayload,
  ProjectFlatTemplateItemUpdatePayload,
  ProjectFlatTemplateItemListParams
>("/project-flat-template-items");

export const projectStructureLevelsApi = createResourceApi<
  ProjectStructureLevel,
  ProjectStructureLevelWritePayload,
  ProjectStructureLevelUpdatePayload,
  ProjectStructureLevelListParams
>("/project-structure-levels");

export const projectLocationNodesApi = {
  ...createResourceApi<
    ProjectLocationNode,
    ProjectLocationNodeWritePayload,
    ProjectLocationNodeUpdatePayload,
    ProjectLocationNodeListParams
  >("/project-location-nodes"),

  tree: async (params: { project: number }): Promise<ProjectLocationNode[]> => {
    const response = await api.get<ProjectLocationNode[]>(
      `/project-location-nodes/tree/${buildQueryString(params)}`
    );
    return response.data;
  },

  move: async (
    id: number,
    payload: LocationMovePayload
  ): Promise<ProjectLocationNode> => {
    const response = await api.post<ProjectLocationNode>(
      `/project-location-nodes/${id}/move/`,
      payload
    );
    return response.data;
  },

  generateRooms: async (
    id: number,
    body: GenerateRoomsPayload = {}
  ): Promise<GenerateRoomsResponse> => {
    const response = await api.post<GenerateRoomsResponse>(
      `/project-location-nodes/${id}/generate-rooms/`,
      body
    );
    return response.data;
  },

  descendants: async (id: number): Promise<ProjectLocationNodeClosure[]> => {
    const response = await api.get<ProjectLocationNodeClosure[]>(
      `/project-location-nodes/${id}/descendants/`
    );
    return response.data;
  },
};

export const projectModuleAccessesApi = createResourceApi<
  ProjectModuleAccess,
  ProjectModuleAccessWritePayload,
  ProjectModuleAccessUpdatePayload,
  ProjectModuleAccessListParams
>("/project-module-accesses");

export const projectPartiesApi = createResourceApi<
  ProjectParty,
  ProjectPartyWritePayload,
  ProjectPartyUpdatePayload,
  ProjectPartyListParams
>("/project-parties");

export const projectPartyModuleAccessesApi = createResourceApi<
  ProjectPartyModuleAccess,
  ProjectPartyModuleAccessWritePayload,
  ProjectPartyModuleAccessUpdatePayload,
  ProjectPartyModuleAccessListParams
>("/project-party-module-accesses");

export const projectPartyRoleGrantsApi = createResourceApi<
  ProjectPartyRoleGrant,
  ProjectPartyRoleGrantWritePayload,
  ProjectPartyRoleGrantUpdatePayload,
  ProjectPartyRoleGrantListParams
>("/project-party-role-grants");

export const projectPartyTeamsApi = createResourceApi<
  ProjectPartyTeam,
  ProjectPartyTeamWritePayload,
  ProjectPartyTeamUpdatePayload,
  ProjectPartyTeamListParams
>("/project-party-teams");

export const projectMembershipsApi = createResourceApi<
  ProjectMembership,
  ProjectMembershipWritePayload,
  ProjectMembershipUpdatePayload,
  ProjectMembershipListParams
>("/project-memberships");

export const userProjectMembershipsApi = createResourceApi<
  UserProjectMembership,
  UserProjectMembershipWritePayload,
  UserProjectMembershipUpdatePayload,
  UserProjectMembershipListParams
>("/user-project-memberships");

export const projectReleasePoliciesApi = createResourceApi<
  ProjectReleasePolicy,
  ProjectReleasePolicyWritePayload,
  ProjectReleasePolicyUpdatePayload,
  ProjectReleasePolicyListParams
>("/project-release-policies");
