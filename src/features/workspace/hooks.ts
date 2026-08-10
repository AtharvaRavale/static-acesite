import { useMutation, useQuery } from "@tanstack/react-query";
import { workspaceApi } from "./api";
import type {
  WorkspaceAccessContextPayload,
  WorkspaceProjectListParams,
  WorkspaceProjectModuleParams,
} from "./types";

export const workspaceKeys = {
  all: ["workspace"] as const,
  bootstrap: () => [...workspaceKeys.all, "bootstrap"] as const,
  projects: (params: WorkspaceProjectListParams) =>
    [...workspaceKeys.all, "projects", params] as const,
  projectModules: (params: WorkspaceProjectModuleParams) =>
    [...workspaceKeys.all, "project-modules", params] as const,
};

export function useWorkspaceBootstrap(enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.bootstrap(),
    queryFn: workspaceApi.bootstrap,
    enabled,
  });
}

export function useWorkspaceProjects(
  params: WorkspaceProjectListParams | null
) {
  return useQuery({
    queryKey: workspaceKeys.projects(
      params ?? { organization: -1, organization_unit: null, role_assignment: null }
    ),
    queryFn: () => workspaceApi.projects(params!),
    enabled: params !== null,
  });
}

export function useWorkspaceProjectModules(
  params: WorkspaceProjectModuleParams | null
) {
  return useQuery({
    queryKey: workspaceKeys.projectModules(
      params ?? { project: -1, role_assignment: null }
    ),
    queryFn: () => workspaceApi.projectModules(params!),
    enabled: params !== null,
  });
}

export function useUpdateWorkspaceAccessContext() {
  return useMutation({
    mutationFn: (payload: WorkspaceAccessContextPayload) =>
      workspaceApi.updateCurrentAccessContext(payload),
  });
}
