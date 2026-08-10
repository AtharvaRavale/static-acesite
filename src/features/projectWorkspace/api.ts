import { api } from "@/lib/api";
import type { ProjectFlatTemplate, ProjectReleasePolicy, ProjectStructureLevel, ProjectStructureLevelTransition, ProjectLocationNode } from "@/features/projects";
import type { ExecutionLevel, ExecutionScheme } from "@/features/execution";
import type {
  ExecutionExplorerNode,
  ExecutionExplorerParams,
  ExecutionLevelPayload,
  ExecutionNodePayload,
  ExecutionNodeRecord,
  ExecutionSchemePayload,
  ExplorerParams,
  ExplorerResponse,
  FlatTemplateComposePayload,
  LocationExplorerNode,
  LocationNodePayload,
  ProjectMasterAvailability,
  ProjectWorkspaceSetup,
  ReleasePolicyPayload,
  StructureLevelPayload,
  TransitionPayload,
} from "./types";

type QueryValue = string | number | boolean | null | undefined;

function qs(params: Record<string, QueryValue>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const projectWorkspaceApi = {
  setup: async (projectId: number): Promise<ProjectWorkspaceSetup> =>
    (await api.get<ProjectWorkspaceSetup>(`/projects/${projectId}/workspace-setup/`)).data,

  masterAvailability: async (projectId: number, allowEmpty = false): Promise<ProjectMasterAvailability> =>
    (await api.get<ProjectMasterAvailability>(
      `/projects/${projectId}/workspace-setup/master-availability/${qs({ allow_empty: allowEmpty || undefined })}`
    )).data,

  composeFlatTemplate: async (projectId: number, payload: FlatTemplateComposePayload): Promise<ProjectFlatTemplate> =>
    (await api.post<ProjectFlatTemplate>(`/projects/${projectId}/workspace-setup/flat-template-compose/`, payload)).data,

  deleteFlatTemplate: async (id: number): Promise<void> => {
    await api.delete(`/project-flat-templates/${id}/`);
  },

  locationExplorer: async (projectId: number, params: ExplorerParams = {}): Promise<ExplorerResponse<LocationExplorerNode>> =>
    (await api.get<ExplorerResponse<LocationExplorerNode>>(
      `/projects/${projectId}/workspace-setup/location-explorer/${qs(params as Record<string, QueryValue>)}`
    )).data,

  executionExplorer: async (projectId: number, params: ExecutionExplorerParams): Promise<ExplorerResponse<ExecutionExplorerNode>> =>
    (await api.get<ExplorerResponse<ExecutionExplorerNode>>(
      `/projects/${projectId}/workspace-setup/execution-explorer/${qs(params as unknown as Record<string, QueryValue>)}`
    )).data,

  createStructureLevel: async (payload: StructureLevelPayload): Promise<ProjectStructureLevel> =>
    (await api.post<ProjectStructureLevel>("/project-structure-levels/", payload)).data,
  updateStructureLevel: async (id: number, payload: Partial<Omit<StructureLevelPayload, "project">>): Promise<ProjectStructureLevel> =>
    (await api.patch<ProjectStructureLevel>(`/project-structure-levels/${id}/`, payload)).data,
  deleteStructureLevel: async (id: number): Promise<void> => {
    await api.delete(`/project-structure-levels/${id}/`);
  },

  createTransition: async (projectId: number, payload: TransitionPayload): Promise<ProjectStructureLevelTransition> =>
    (await api.post<ProjectStructureLevelTransition>(`/projects/${projectId}/location-hierarchy/`, payload)).data,
  updateTransition: async (projectId: number, id: number, payload: Partial<TransitionPayload>): Promise<ProjectStructureLevelTransition> =>
    (await api.patch<ProjectStructureLevelTransition>(`/projects/${projectId}/location-hierarchy/${id}/`, payload)).data,
  deleteTransition: async (projectId: number, id: number): Promise<void> => {
    await api.delete(`/projects/${projectId}/location-hierarchy/${id}/`);
  },

  createLocationNode: async (payload: LocationNodePayload): Promise<ProjectLocationNode> =>
    (await api.post<ProjectLocationNode>("/project-location-nodes/", payload)).data,
  updateLocationNode: async (id: number, payload: Partial<Omit<LocationNodePayload, "project">>): Promise<ProjectLocationNode> =>
    (await api.patch<ProjectLocationNode>(`/project-location-nodes/${id}/`, payload)).data,
  deleteLocationNode: async (id: number): Promise<void> => {
    await api.delete(`/project-location-nodes/${id}/`);
  },
  moveLocationNode: async (id: number, parent: number | null): Promise<ProjectLocationNode> =>
    (await api.post<ProjectLocationNode>(`/project-location-nodes/${id}/move/`, { parent })).data,
  generateRooms: async (id: number, roomLevel: number | null): Promise<unknown> =>
    (await api.post(`/project-location-nodes/${id}/generate-rooms/`, { room_level: roomLevel })).data,

  createExecutionScheme: async (payload: ExecutionSchemePayload): Promise<ExecutionScheme> =>
    (await api.post<ExecutionScheme>("/execution-schemes/", payload)).data,
  updateExecutionScheme: async (id: number, payload: Partial<Omit<ExecutionSchemePayload, "project">>): Promise<ExecutionScheme> =>
    (await api.patch<ExecutionScheme>(`/execution-schemes/${id}/`, payload)).data,
  deleteExecutionScheme: async (id: number): Promise<void> => {
    await api.delete(`/execution-schemes/${id}/`);
  },
  makeExecutionSchemeCurrent: async (id: number): Promise<ExecutionScheme> =>
    (await api.post<ExecutionScheme>(`/execution-schemes/${id}/make-current/`, {})).data,

  createExecutionLevel: async (payload: ExecutionLevelPayload): Promise<ExecutionLevel> =>
    (await api.post<ExecutionLevel>("/execution-levels/", payload)).data,
  updateExecutionLevel: async (id: number, payload: Partial<Omit<ExecutionLevelPayload, "scheme">>): Promise<ExecutionLevel> =>
    (await api.patch<ExecutionLevel>(`/execution-levels/${id}/`, payload)).data,
  deleteExecutionLevel: async (id: number): Promise<void> => {
    await api.delete(`/execution-levels/${id}/`);
  },

  createExecutionNode: async (payload: ExecutionNodePayload): Promise<ExecutionNodeRecord> =>
    (await api.post<ExecutionNodeRecord>("/execution-nodes/", payload)).data,
  updateExecutionNode: async (id: number, payload: Partial<Omit<ExecutionNodePayload, "scheme">>): Promise<ExecutionNodeRecord> =>
    (await api.patch<ExecutionNodeRecord>(`/execution-nodes/${id}/`, payload)).data,
  deleteExecutionNode: async (id: number): Promise<void> => {
    await api.delete(`/execution-nodes/${id}/`);
  },

  createReleasePolicy: async (payload: ReleasePolicyPayload): Promise<ProjectReleasePolicy> =>
    (await api.post<ProjectReleasePolicy>("/project-release-policies/", payload)).data,
  updateReleasePolicy: async (id: number, payload: Partial<Omit<ReleasePolicyPayload, "project">>): Promise<ProjectReleasePolicy> =>
    (await api.patch<ProjectReleasePolicy>(`/project-release-policies/${id}/`, payload)).data,
  deleteReleasePolicy: async (id: number): Promise<void> => {
    await api.delete(`/project-release-policies/${id}/`);
  },
};
