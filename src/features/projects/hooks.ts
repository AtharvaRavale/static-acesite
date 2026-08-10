import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  locationHierarchyApi,
  masterFlatTypeAvailabilitiesApi,
  masterFlatTypesApi,
  masterRoomTypeAvailabilitiesApi,
  masterRoomTypesApi,
  projectFlatTemplateItemsApi,
  projectFlatTemplatesApi,
  projectFlatTypesApi,
  projectLocationNodesApi,
  projectMembershipsApi,
  projectModuleAccessesApi,
  projectPartiesApi,
  projectPartyModuleAccessesApi,
  projectPartyRoleGrantsApi,
  projectPartyTeamsApi,
  projectReleasePoliciesApi,
  projectRoomTypesApi,
  projectsApi,
  projectStructureLevelsApi,
  userProjectMembershipsApi,
} from "./api";
import type {
  GenerateRoomsPayload,
  LocationMovePayload,
  MasterFlatTypeAvailabilityListParams,
  MasterFlatTypeAvailabilityUpdatePayload,
  MasterFlatTypeAvailabilityWritePayload,
  MasterFlatTypeListParams,
  MasterRoomTypeAvailabilityListParams,
  MasterRoomTypeAvailabilityUpdatePayload,
  MasterRoomTypeAvailabilityWritePayload,
  MasterRoomTypeListParams,
  MasterTypeUpdatePayload,
  MasterTypeWritePayload,
  ProjectCreatePayload,
  ProjectFlatTemplateItemListParams,
  ProjectFlatTemplateItemUpdatePayload,
  ProjectFlatTemplateItemWritePayload,
  ProjectFlatTemplateListParams,
  ProjectFlatTemplateUpdatePayload,
  ProjectFlatTemplateWritePayload,
  ProjectFlatTypeListParams,
  ProjectListParams,
  ProjectLocationNodeListParams,
  ProjectLocationNodeUpdatePayload,
  ProjectLocationNodeWritePayload,
  ProjectMembershipListParams,
  ProjectMembershipUpdatePayload,
  ProjectMembershipWritePayload,
  ProjectModuleAccessListParams,
  ProjectModuleAccessUpdatePayload,
  ProjectModuleAccessWritePayload,
  ProjectPartyListParams,
  ProjectPartyModuleAccessListParams,
  ProjectPartyModuleAccessUpdatePayload,
  ProjectPartyModuleAccessWritePayload,
  ProjectPartyRoleGrantListParams,
  ProjectPartyRoleGrantUpdatePayload,
  ProjectPartyRoleGrantWritePayload,
  ProjectPartyTeamListParams,
  ProjectPartyTeamUpdatePayload,
  ProjectPartyTeamWritePayload,
  ProjectPartyUpdatePayload,
  ProjectPartyWritePayload,
  ProjectProfileWritePayload,
  ProjectReleasePolicyListParams,
  ProjectReleasePolicyUpdatePayload,
  ProjectReleasePolicyWritePayload,
  ProjectRoomTypeListParams,
  ProjectStatusActionPayload,
  ProjectStructureLevelListParams,
  ProjectStructureLevelTransitionListParams,
  ProjectStructureLevelTransitionUpdatePayload,
  ProjectStructureLevelTransitionWritePayload,
  ProjectStructureLevelUpdatePayload,
  ProjectStructureLevelWritePayload,
  ProjectTypeUpdatePayload,
  ProjectTypeWritePayload,
  ProjectUpdatePayload,
  UserProjectMembershipListParams,
  UserProjectMembershipUpdatePayload,
  UserProjectMembershipWritePayload,
} from "./types";

/* ── Query keys ──────────────────────────────────────────────────────────── */

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: ProjectListParams) =>
    [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  profile: (id: number) => [...projectKeys.all, "profile", id] as const,
  validation: (id: number) => [...projectKeys.all, "validation", id] as const,
  structureTree: (id: number) => [...projectKeys.all, "structure-tree", id] as const,
  availableMasterRoomTypes: (projectId: number) =>
    [...projectKeys.all, "available-master-room-types", projectId] as const,
  availableMasterFlatTypes: (projectId: number) =>
    [...projectKeys.all, "available-master-flat-types", projectId] as const,
};

export const locationHierarchyKeys = {
  all: ["location-hierarchy"] as const,
  lists: (projectId: number) =>
    [...locationHierarchyKeys.all, "list", projectId] as const,
  list: (projectId: number, params: ProjectStructureLevelTransitionListParams) =>
    [...locationHierarchyKeys.lists(projectId), params] as const,
  detail: (projectId: number, id: number) =>
    [...locationHierarchyKeys.all, "detail", projectId, id] as const,
};

export const masterRoomTypeKeys = {
  all: ["master-room-types"] as const,
  list: (params: MasterRoomTypeListParams) =>
    [...masterRoomTypeKeys.all, "list", params] as const,
  detail: (id: number) => [...masterRoomTypeKeys.all, "detail", id] as const,
};

export const masterFlatTypeKeys = {
  all: ["master-flat-types"] as const,
  list: (params: MasterFlatTypeListParams) =>
    [...masterFlatTypeKeys.all, "list", params] as const,
  detail: (id: number) => [...masterFlatTypeKeys.all, "detail", id] as const,
};

export const masterRoomTypeAvailabilityKeys = {
  all: ["master-room-type-availabilities"] as const,
  list: (params: MasterRoomTypeAvailabilityListParams) =>
    [...masterRoomTypeAvailabilityKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...masterRoomTypeAvailabilityKeys.all, "detail", id] as const,
};

export const masterFlatTypeAvailabilityKeys = {
  all: ["master-flat-type-availabilities"] as const,
  list: (params: MasterFlatTypeAvailabilityListParams) =>
    [...masterFlatTypeAvailabilityKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...masterFlatTypeAvailabilityKeys.all, "detail", id] as const,
};

export const projectRoomTypeKeys = {
  all: ["project-room-types"] as const,
  list: (params: ProjectRoomTypeListParams) =>
    [...projectRoomTypeKeys.all, "list", params] as const,
  detail: (id: number) => [...projectRoomTypeKeys.all, "detail", id] as const,
};

export const projectFlatTypeKeys = {
  all: ["project-flat-types"] as const,
  list: (params: ProjectFlatTypeListParams) =>
    [...projectFlatTypeKeys.all, "list", params] as const,
  detail: (id: number) => [...projectFlatTypeKeys.all, "detail", id] as const,
};

export const projectFlatTemplateKeys = {
  all: ["project-flat-templates"] as const,
  list: (params: ProjectFlatTemplateListParams) =>
    [...projectFlatTemplateKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectFlatTemplateKeys.all, "detail", id] as const,
};

export const projectFlatTemplateItemKeys = {
  all: ["project-flat-template-items"] as const,
  list: (params: ProjectFlatTemplateItemListParams) =>
    [...projectFlatTemplateItemKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectFlatTemplateItemKeys.all, "detail", id] as const,
};

export const projectStructureLevelKeys = {
  all: ["project-structure-levels"] as const,
  list: (params: ProjectStructureLevelListParams) =>
    [...projectStructureLevelKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectStructureLevelKeys.all, "detail", id] as const,
};

export const projectLocationNodeKeys = {
  all: ["project-location-nodes"] as const,
  list: (params: ProjectLocationNodeListParams) =>
    [...projectLocationNodeKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectLocationNodeKeys.all, "detail", id] as const,
  tree: (projectId: number) =>
    [...projectLocationNodeKeys.all, "tree", projectId] as const,
  descendants: (id: number) =>
    [...projectLocationNodeKeys.all, "descendants", id] as const,
};

export const projectModuleAccessKeys = {
  all: ["project-module-accesses"] as const,
  list: (params: ProjectModuleAccessListParams) =>
    [...projectModuleAccessKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectModuleAccessKeys.all, "detail", id] as const,
};

export const projectPartyKeys = {
  all: ["project-parties"] as const,
  list: (params: ProjectPartyListParams) =>
    [...projectPartyKeys.all, "list", params] as const,
  detail: (id: number) => [...projectPartyKeys.all, "detail", id] as const,
};

export const projectPartyModuleAccessKeys = {
  all: ["project-party-module-accesses"] as const,
  list: (params: ProjectPartyModuleAccessListParams) =>
    [...projectPartyModuleAccessKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectPartyModuleAccessKeys.all, "detail", id] as const,
};

export const projectPartyRoleGrantKeys = {
  all: ["project-party-role-grants"] as const,
  list: (params: ProjectPartyRoleGrantListParams) =>
    [...projectPartyRoleGrantKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectPartyRoleGrantKeys.all, "detail", id] as const,
};

export const projectPartyTeamKeys = {
  all: ["project-party-teams"] as const,
  list: (params: ProjectPartyTeamListParams) =>
    [...projectPartyTeamKeys.all, "list", params] as const,
  detail: (id: number) => [...projectPartyTeamKeys.all, "detail", id] as const,
};

export const projectMembershipKeys = {
  all: ["project-memberships"] as const,
  list: (params: ProjectMembershipListParams) =>
    [...projectMembershipKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectMembershipKeys.all, "detail", id] as const,
};

export const userProjectMembershipKeys = {
  all: ["user-project-memberships"] as const,
  list: (params: UserProjectMembershipListParams) =>
    [...userProjectMembershipKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...userProjectMembershipKeys.all, "detail", id] as const,
};

export const projectReleasePolicyKeys = {
  all: ["project-release-policies"] as const,
  list: (params: ProjectReleasePolicyListParams) =>
    [...projectReleasePolicyKeys.all, "list", params] as const,
  detail: (id: number) =>
    [...projectReleasePolicyKeys.all, "detail", id] as const,
};

function invalidateProjectQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: number
) {
  void queryClient.invalidateQueries({ queryKey: projectKeys.all });
  if (id != null) {
    void queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
    void queryClient.invalidateQueries({ queryKey: projectKeys.profile(id) });
    void queryClient.invalidateQueries({
      queryKey: projectKeys.validation(id),
    });
  }
}

function invalidateLocationTree(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId?: number
) {
  void queryClient.invalidateQueries({ queryKey: projectLocationNodeKeys.all });
  if (projectId != null) {
    void queryClient.invalidateQueries({
      queryKey: projectLocationNodeKeys.tree(projectId),
    });
  }
}

/* ── Projects ────────────────────────────────────────────────────────────── */

export function useProjects(params: ProjectListParams = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id: number | null) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? -1),
    queryFn: () => projectsApi.get(id!),
    enabled: id !== null,
  });
}

export function useProjectStructureTree(id: number | null) {
  return useQuery({
    queryKey: projectKeys.structureTree(id ?? -1),
    queryFn: () => projectsApi.structureTree(id!),
    enabled: id !== null,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreatePayload) => projectsApi.create(payload),
    onSuccess: () => invalidateProjectQueries(queryClient),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectUpdatePayload;
    }) => projectsApi.update(id, payload),
    onSuccess: (_data, variables) =>
      invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useReplaceProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectUpdatePayload;
    }) => projectsApi.replace(id, payload),
    onSuccess: (_data, variables) =>
      invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.remove(id),
    onSuccess: () => invalidateProjectQueries(queryClient),
  });
}

export function useProjectProfile(id: number | null) {
  return useQuery({
    queryKey: projectKeys.profile(id ?? -1),
    queryFn: () => projectsApi.getProfile(id!),
    enabled: id !== null,
  });
}

export function useUpdateProjectProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectProfileWritePayload;
    }) => projectsApi.updateProfile(id, payload),
    onSuccess: (_data, variables) =>
      invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useUpsertProjectProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectProfileWritePayload;
    }) => projectsApi.upsertProfile(id, payload),
    onSuccess: (_data, variables) =>
      invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useProjectValidation(id: number | null) {
  return useQuery({
    queryKey: projectKeys.validation(id ?? -1),
    queryFn: () => projectsApi.validation(id!),
    enabled: id !== null,
  });
}

function useProjectStatusAction(
  action: (
    id: number,
    payload?: ProjectStatusActionPayload
  ) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload?: ProjectStatusActionPayload;
    }) => action(id, payload),
    onSuccess: (_data, variables) =>
      invalidateProjectQueries(queryClient, variables.id),
  });
}

export function useActivateProject() {
  return useProjectStatusAction(projectsApi.activate);
}

export function usePutProjectOnHold() {
  return useProjectStatusAction(projectsApi.putOnHold);
}

export function useResumeProject() {
  return useProjectStatusAction(projectsApi.resume);
}

export function useCompleteProject() {
  return useProjectStatusAction(projectsApi.complete);
}

export function useCancelProject() {
  return useProjectStatusAction(projectsApi.cancel);
}

export function useReopenProject() {
  return useProjectStatusAction(projectsApi.reopen);
}

export function useAvailableMasterRoomTypes(projectId: number | null) {
  return useQuery({
    queryKey: projectKeys.availableMasterRoomTypes(projectId ?? -1),
    queryFn: () => projectsApi.availableMasterRoomTypes(projectId!),
    enabled: projectId !== null,
  });
}

export function useAvailableMasterFlatTypes(projectId: number | null) {
  return useQuery({
    queryKey: projectKeys.availableMasterFlatTypes(projectId ?? -1),
    queryFn: () => projectsApi.availableMasterFlatTypes(projectId!),
    enabled: projectId !== null,
  });
}

/* ── Location hierarchy ──────────────────────────────────────────────────── */

export function useLocationHierarchy(
  projectId: number | null,
  params: ProjectStructureLevelTransitionListParams = {}
) {
  return useQuery({
    queryKey: locationHierarchyKeys.list(projectId ?? -1, params),
    queryFn: () => locationHierarchyApi.list(projectId!, params),
    enabled: projectId !== null,
  });
}

export function useLocationHierarchyTransition(
  projectId: number | null,
  id: number | null
) {
  return useQuery({
    queryKey: locationHierarchyKeys.detail(projectId ?? -1, id ?? -1),
    queryFn: () => locationHierarchyApi.get(projectId!, id!),
    enabled: projectId !== null && id !== null,
  });
}

export function useCreateLocationHierarchyTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: number;
      payload: ProjectStructureLevelTransitionWritePayload;
    }) => locationHierarchyApi.create(projectId, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: locationHierarchyKeys.lists(variables.projectId),
      });
    },
  });
}

export function useUpdateLocationHierarchyTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      id,
      payload,
    }: {
      projectId: number;
      id: number;
      payload: ProjectStructureLevelTransitionUpdatePayload;
    }) => locationHierarchyApi.update(projectId, id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: locationHierarchyKeys.lists(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: locationHierarchyKeys.detail(
          variables.projectId,
          variables.id
        ),
      });
    },
  });
}

export function useReplaceLocationHierarchyTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      id,
      payload,
    }: {
      projectId: number;
      id: number;
      payload: ProjectStructureLevelTransitionUpdatePayload;
    }) => locationHierarchyApi.replace(projectId, id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: locationHierarchyKeys.lists(variables.projectId),
      });
      void queryClient.invalidateQueries({
        queryKey: locationHierarchyKeys.detail(
          variables.projectId,
          variables.id
        ),
      });
    },
  });
}

export function useDeleteLocationHierarchyTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: number; id: number }) =>
      locationHierarchyApi.remove(projectId, id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: locationHierarchyKeys.lists(variables.projectId),
      });
    },
  });
}

/* ── Master types ────────────────────────────────────────────────────────── */

export function useMasterRoomTypes(params: MasterRoomTypeListParams = {}) {
  return useQuery({
    queryKey: masterRoomTypeKeys.list(params),
    queryFn: () => masterRoomTypesApi.list(params),
  });
}

export function useMasterRoomType(id: number | null) {
  return useQuery({
    queryKey: masterRoomTypeKeys.detail(id ?? -1),
    queryFn: () => masterRoomTypesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateMasterRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MasterTypeWritePayload) =>
      masterRoomTypesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: masterRoomTypeKeys.all }),
  });
}

export function useUpdateMasterRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: MasterTypeUpdatePayload;
    }) => masterRoomTypesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: masterRoomTypeKeys.all }),
  });
}

export function useDeleteMasterRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => masterRoomTypesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: masterRoomTypeKeys.all }),
  });
}

export function useMasterFlatTypes(params: MasterFlatTypeListParams = {}) {
  return useQuery({
    queryKey: masterFlatTypeKeys.list(params),
    queryFn: () => masterFlatTypesApi.list(params),
  });
}

export function useMasterFlatType(id: number | null) {
  return useQuery({
    queryKey: masterFlatTypeKeys.detail(id ?? -1),
    queryFn: () => masterFlatTypesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateMasterFlatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MasterTypeWritePayload) =>
      masterFlatTypesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: masterFlatTypeKeys.all }),
  });
}

export function useUpdateMasterFlatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: MasterTypeUpdatePayload;
    }) => masterFlatTypesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: masterFlatTypeKeys.all }),
  });
}

export function useDeleteMasterFlatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => masterFlatTypesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: masterFlatTypeKeys.all }),
  });
}

/* ── Master availabilities ───────────────────────────────────────────────── */

export function useMasterRoomTypeAvailabilities(
  params: MasterRoomTypeAvailabilityListParams = {}
) {
  return useQuery({
    queryKey: masterRoomTypeAvailabilityKeys.list(params),
    queryFn: () => masterRoomTypeAvailabilitiesApi.list(params),
  });
}

export function useMasterRoomTypeAvailability(id: number | null) {
  return useQuery({
    queryKey: masterRoomTypeAvailabilityKeys.detail(id ?? -1),
    queryFn: () => masterRoomTypeAvailabilitiesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateMasterRoomTypeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MasterRoomTypeAvailabilityWritePayload) =>
      masterRoomTypeAvailabilitiesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: masterRoomTypeAvailabilityKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateMasterRoomTypeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: MasterRoomTypeAvailabilityUpdatePayload;
    }) => masterRoomTypeAvailabilitiesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: masterRoomTypeAvailabilityKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteMasterRoomTypeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => masterRoomTypeAvailabilitiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: masterRoomTypeAvailabilityKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useMasterFlatTypeAvailabilities(
  params: MasterFlatTypeAvailabilityListParams = {}
) {
  return useQuery({
    queryKey: masterFlatTypeAvailabilityKeys.list(params),
    queryFn: () => masterFlatTypeAvailabilitiesApi.list(params),
  });
}

export function useMasterFlatTypeAvailability(id: number | null) {
  return useQuery({
    queryKey: masterFlatTypeAvailabilityKeys.detail(id ?? -1),
    queryFn: () => masterFlatTypeAvailabilitiesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateMasterFlatTypeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MasterFlatTypeAvailabilityWritePayload) =>
      masterFlatTypeAvailabilitiesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: masterFlatTypeAvailabilityKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateMasterFlatTypeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: MasterFlatTypeAvailabilityUpdatePayload;
    }) => masterFlatTypeAvailabilitiesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: masterFlatTypeAvailabilityKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteMasterFlatTypeAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => masterFlatTypeAvailabilitiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: masterFlatTypeAvailabilityKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/* ── Project room / flat types ───────────────────────────────────────────── */

export function useProjectRoomTypes(params: ProjectRoomTypeListParams = {}) {
  return useQuery({
    queryKey: projectRoomTypeKeys.list(params),
    queryFn: () => projectRoomTypesApi.list(params),
  });
}

export function useProjectRoomType(id: number | null) {
  return useQuery({
    queryKey: projectRoomTypeKeys.detail(id ?? -1),
    queryFn: () => projectRoomTypesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectTypeWritePayload) =>
      projectRoomTypesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectRoomTypeKeys.all }),
  });
}

export function useUpdateProjectRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectTypeUpdatePayload;
    }) => projectRoomTypesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectRoomTypeKeys.all }),
  });
}

export function useDeleteProjectRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectRoomTypesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectRoomTypeKeys.all }),
  });
}

export function useProjectFlatTypes(params: ProjectFlatTypeListParams = {}) {
  return useQuery({
    queryKey: projectFlatTypeKeys.list(params),
    queryFn: () => projectFlatTypesApi.list(params),
  });
}

export function useProjectFlatType(id: number | null) {
  return useQuery({
    queryKey: projectFlatTypeKeys.detail(id ?? -1),
    queryFn: () => projectFlatTypesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectFlatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectTypeWritePayload) =>
      projectFlatTypesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectFlatTypeKeys.all }),
  });
}

export function useUpdateProjectFlatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectTypeUpdatePayload;
    }) => projectFlatTypesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectFlatTypeKeys.all }),
  });
}

export function useDeleteProjectFlatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectFlatTypesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectFlatTypeKeys.all }),
  });
}

/* ── Flat templates ──────────────────────────────────────────────────────── */

export function useProjectFlatTemplates(
  params: ProjectFlatTemplateListParams = {}
) {
  return useQuery({
    queryKey: projectFlatTemplateKeys.list(params),
    queryFn: () => projectFlatTemplatesApi.list(params),
  });
}

export function useProjectFlatTemplate(id: number | null) {
  return useQuery({
    queryKey: projectFlatTemplateKeys.detail(id ?? -1),
    queryFn: () => projectFlatTemplatesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectFlatTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectFlatTemplateWritePayload) =>
      projectFlatTemplatesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateKeys.all,
      }),
  });
}

export function useUpdateProjectFlatTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectFlatTemplateUpdatePayload;
    }) => projectFlatTemplatesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateKeys.all,
      }),
  });
}

export function useDeleteProjectFlatTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectFlatTemplatesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateKeys.all,
      }),
  });
}

export function useProjectFlatTemplateItems(
  params: ProjectFlatTemplateItemListParams = {}
) {
  return useQuery({
    queryKey: projectFlatTemplateItemKeys.list(params),
    queryFn: () => projectFlatTemplateItemsApi.list(params),
  });
}

export function useProjectFlatTemplateItem(id: number | null) {
  return useQuery({
    queryKey: projectFlatTemplateItemKeys.detail(id ?? -1),
    queryFn: () => projectFlatTemplateItemsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectFlatTemplateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectFlatTemplateItemWritePayload) =>
      projectFlatTemplateItemsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateItemKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateKeys.all,
      });
    },
  });
}

export function useUpdateProjectFlatTemplateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectFlatTemplateItemUpdatePayload;
    }) => projectFlatTemplateItemsApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateItemKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateKeys.all,
      });
    },
  });
}

export function useDeleteProjectFlatTemplateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectFlatTemplateItemsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateItemKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: projectFlatTemplateKeys.all,
      });
    },
  });
}

/* ── Structure levels ────────────────────────────────────────────────────── */

export function useProjectStructureLevels(
  params: ProjectStructureLevelListParams = {}
) {
  return useQuery({
    queryKey: projectStructureLevelKeys.list(params),
    queryFn: () => projectStructureLevelsApi.list(params),
  });
}

export function useProjectStructureLevel(id: number | null) {
  return useQuery({
    queryKey: projectStructureLevelKeys.detail(id ?? -1),
    queryFn: () => projectStructureLevelsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectStructureLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectStructureLevelWritePayload) =>
      projectStructureLevelsApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectStructureLevelKeys.all,
      }),
  });
}

export function useUpdateProjectStructureLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectStructureLevelUpdatePayload;
    }) => projectStructureLevelsApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectStructureLevelKeys.all,
      }),
  });
}

export function useDeleteProjectStructureLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectStructureLevelsApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectStructureLevelKeys.all,
      }),
  });
}

/* ── Location nodes ──────────────────────────────────────────────────────── */

export function useProjectLocationNodes(
  params: ProjectLocationNodeListParams = {}
) {
  return useQuery({
    queryKey: projectLocationNodeKeys.list(params),
    queryFn: () => projectLocationNodesApi.list(params),
  });
}

export function useProjectLocationNode(id: number | null) {
  return useQuery({
    queryKey: projectLocationNodeKeys.detail(id ?? -1),
    queryFn: () => projectLocationNodesApi.get(id!),
    enabled: id !== null,
  });
}

export function useProjectLocationTree(projectId: number | null) {
  return useQuery({
    queryKey: projectLocationNodeKeys.tree(projectId ?? -1),
    queryFn: () => projectLocationNodesApi.tree({ project: projectId! }),
    enabled: projectId !== null,
  });
}

export function useLocationNodeDescendants(id: number | null) {
  return useQuery({
    queryKey: projectLocationNodeKeys.descendants(id ?? -1),
    queryFn: () => projectLocationNodesApi.descendants(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectLocationNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectLocationNodeWritePayload) =>
      projectLocationNodesApi.create(payload),
    onSuccess: (data) => invalidateLocationTree(queryClient, data.project),
  });
}

export function useUpdateProjectLocationNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectLocationNodeUpdatePayload;
    }) => projectLocationNodesApi.update(id, payload),
    onSuccess: (data) => invalidateLocationTree(queryClient, data.project),
  });
}

export function useDeleteProjectLocationNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectLocationNodesApi.remove(id),
    onSuccess: () => invalidateLocationTree(queryClient),
  });
}

export function useMoveLocationNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: LocationMovePayload;
    }) => projectLocationNodesApi.move(id, payload),
    onSuccess: (data) => invalidateLocationTree(queryClient, data.project),
  });
}

export function useGenerateRooms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload?: GenerateRoomsPayload;
    }) => projectLocationNodesApi.generateRooms(id, payload),
    onSuccess: (data) =>
      invalidateLocationTree(queryClient, data.node.project),
  });
}

/* ── Module access ───────────────────────────────────────────────────────── */

export function useProjectModuleAccesses(
  params: ProjectModuleAccessListParams = {}
) {
  return useQuery({
    queryKey: projectModuleAccessKeys.list(params),
    queryFn: () => projectModuleAccessesApi.list(params),
  });
}

export function useProjectModuleAccess(id: number | null) {
  return useQuery({
    queryKey: projectModuleAccessKeys.detail(id ?? -1),
    queryFn: () => projectModuleAccessesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectModuleAccessWritePayload) =>
      projectModuleAccessesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectModuleAccessKeys.all,
      }),
  });
}

export function useUpdateProjectModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectModuleAccessUpdatePayload;
    }) => projectModuleAccessesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectModuleAccessKeys.all,
      }),
  });
}

export function useDeleteProjectModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectModuleAccessesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectModuleAccessKeys.all,
      }),
  });
}

/* ── Parties ─────────────────────────────────────────────────────────────── */

export function useProjectParties(params: ProjectPartyListParams = {}) {
  return useQuery({
    queryKey: projectPartyKeys.list(params),
    queryFn: () => projectPartiesApi.list(params),
  });
}

export function useProjectParty(id: number | null) {
  return useQuery({
    queryKey: projectPartyKeys.detail(id ?? -1),
    queryFn: () => projectPartiesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPartyWritePayload) =>
      projectPartiesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectPartyKeys.all }),
  });
}

export function useUpdateProjectParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectPartyUpdatePayload;
    }) => projectPartiesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectPartyKeys.all }),
  });
}

export function useDeleteProjectParty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectPartiesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: projectPartyKeys.all }),
  });
}

export function useProjectPartyModuleAccesses(
  params: ProjectPartyModuleAccessListParams = {}
) {
  return useQuery({
    queryKey: projectPartyModuleAccessKeys.list(params),
    queryFn: () => projectPartyModuleAccessesApi.list(params),
  });
}

export function useProjectPartyModuleAccess(id: number | null) {
  return useQuery({
    queryKey: projectPartyModuleAccessKeys.detail(id ?? -1),
    queryFn: () => projectPartyModuleAccessesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectPartyModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPartyModuleAccessWritePayload) =>
      projectPartyModuleAccessesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyModuleAccessKeys.all,
      }),
  });
}

export function useUpdateProjectPartyModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectPartyModuleAccessUpdatePayload;
    }) => projectPartyModuleAccessesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyModuleAccessKeys.all,
      }),
  });
}

export function useDeleteProjectPartyModuleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectPartyModuleAccessesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyModuleAccessKeys.all,
      }),
  });
}

export function useProjectPartyRoleGrants(
  params: ProjectPartyRoleGrantListParams = {}
) {
  return useQuery({
    queryKey: projectPartyRoleGrantKeys.list(params),
    queryFn: () => projectPartyRoleGrantsApi.list(params),
  });
}

export function useProjectPartyRoleGrant(id: number | null) {
  return useQuery({
    queryKey: projectPartyRoleGrantKeys.detail(id ?? -1),
    queryFn: () => projectPartyRoleGrantsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectPartyRoleGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPartyRoleGrantWritePayload) =>
      projectPartyRoleGrantsApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyRoleGrantKeys.all,
      }),
  });
}

export function useUpdateProjectPartyRoleGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectPartyRoleGrantUpdatePayload;
    }) => projectPartyRoleGrantsApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyRoleGrantKeys.all,
      }),
  });
}

export function useDeleteProjectPartyRoleGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectPartyRoleGrantsApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyRoleGrantKeys.all,
      }),
  });
}

export function useProjectPartyTeams(params: ProjectPartyTeamListParams = {}) {
  return useQuery({
    queryKey: projectPartyTeamKeys.list(params),
    queryFn: () => projectPartyTeamsApi.list(params),
  });
}

export function useProjectPartyTeam(id: number | null) {
  return useQuery({
    queryKey: projectPartyTeamKeys.detail(id ?? -1),
    queryFn: () => projectPartyTeamsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectPartyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPartyTeamWritePayload) =>
      projectPartyTeamsApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyTeamKeys.all,
      }),
  });
}

export function useUpdateProjectPartyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectPartyTeamUpdatePayload;
    }) => projectPartyTeamsApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyTeamKeys.all,
      }),
  });
}

export function useDeleteProjectPartyTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectPartyTeamsApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectPartyTeamKeys.all,
      }),
  });
}

/* ── Memberships ─────────────────────────────────────────────────────────── */

export function useProjectMemberships(
  params: ProjectMembershipListParams = {}
) {
  return useQuery({
    queryKey: projectMembershipKeys.list(params),
    queryFn: () => projectMembershipsApi.list(params),
  });
}

export function useProjectMembership(id: number | null) {
  return useQuery({
    queryKey: projectMembershipKeys.detail(id ?? -1),
    queryFn: () => projectMembershipsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectMembershipWritePayload) =>
      projectMembershipsApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectMembershipKeys.all,
      }),
  });
}

export function useUpdateProjectMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectMembershipUpdatePayload;
    }) => projectMembershipsApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectMembershipKeys.all,
      }),
  });
}

export function useDeleteProjectMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectMembershipsApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectMembershipKeys.all,
      }),
  });
}

export function useUserProjectMemberships(
  params: UserProjectMembershipListParams = {}
) {
  return useQuery({
    queryKey: userProjectMembershipKeys.list(params),
    queryFn: () => userProjectMembershipsApi.list(params),
  });
}

export function useUserProjectMembership(id: number | null) {
  return useQuery({
    queryKey: userProjectMembershipKeys.detail(id ?? -1),
    queryFn: () => userProjectMembershipsApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateUserProjectMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserProjectMembershipWritePayload) =>
      userProjectMembershipsApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: userProjectMembershipKeys.all,
      }),
  });
}

export function useUpdateUserProjectMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UserProjectMembershipUpdatePayload;
    }) => userProjectMembershipsApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: userProjectMembershipKeys.all,
      }),
  });
}

export function useDeleteUserProjectMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userProjectMembershipsApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: userProjectMembershipKeys.all,
      }),
  });
}

/* ── Release policies ────────────────────────────────────────────────────── */

export function useProjectReleasePolicies(
  params: ProjectReleasePolicyListParams = {}
) {
  return useQuery({
    queryKey: projectReleasePolicyKeys.list(params),
    queryFn: () => projectReleasePoliciesApi.list(params),
  });
}

export function useProjectReleasePolicy(id: number | null) {
  return useQuery({
    queryKey: projectReleasePolicyKeys.detail(id ?? -1),
    queryFn: () => projectReleasePoliciesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateProjectReleasePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectReleasePolicyWritePayload) =>
      projectReleasePoliciesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectReleasePolicyKeys.all,
      }),
  });
}

export function useUpdateProjectReleasePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ProjectReleasePolicyUpdatePayload;
    }) => projectReleasePoliciesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectReleasePolicyKeys.all,
      }),
  });
}

export function useDeleteProjectReleasePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectReleasePoliciesApi.remove(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: projectReleasePolicyKeys.all,
      }),
  });
}
