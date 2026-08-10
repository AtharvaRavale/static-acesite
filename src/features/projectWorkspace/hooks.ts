import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectWorkspaceApi } from "./api";
import type { ExecutionExplorerParams, ExplorerParams, FlatTemplateComposePayload } from "./types";

export const projectWorkspaceKeys = {
  all: ["project-workspace"] as const,
  setup: (projectId: number) => [...projectWorkspaceKeys.all, "setup", projectId] as const,
  availability: (projectId: number) => [...projectWorkspaceKeys.all, "availability", projectId] as const,
  locations: (projectId: number, params: ExplorerParams) => [...projectWorkspaceKeys.all, "locations", projectId, params] as const,
  execution: (projectId: number, params: ExecutionExplorerParams) => [...projectWorkspaceKeys.all, "execution", projectId, params] as const,
};

export function useProjectWorkspaceSetup(projectId: number | null) {
  return useQuery({
    queryKey: projectWorkspaceKeys.setup(projectId ?? -1),
    queryFn: () => projectWorkspaceApi.setup(projectId!),
    enabled: projectId !== null,
  });
}

export function useProjectMasterAvailability(
  projectId: number | null,
  enabled = true,
  allowEmpty = false
) {
  return useQuery({
    queryKey: [...projectWorkspaceKeys.availability(projectId ?? -1), allowEmpty] as const,
    queryFn: () => projectWorkspaceApi.masterAvailability(projectId!, allowEmpty),
    enabled: projectId !== null && enabled,
    retry: false,
  });
}

export function useLocationExplorer(projectId: number | null, params: ExplorerParams, enabled = true) {
  return useQuery({
    queryKey: projectWorkspaceKeys.locations(projectId ?? -1, params),
    queryFn: () => projectWorkspaceApi.locationExplorer(projectId!, params),
    enabled: projectId !== null && enabled,
  });
}

export function useExecutionExplorer(projectId: number | null, params: ExecutionExplorerParams | null, enabled = true) {
  return useQuery({
    queryKey: projectWorkspaceKeys.execution(projectId ?? -1, params ?? { scheme: -1 }),
    queryFn: () => projectWorkspaceApi.executionExplorer(projectId!, params!),
    enabled: projectId !== null && params !== null && enabled,
  });
}

export function useProjectWorkspaceMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  projectId: number | null,
  extraInvalidate: readonly unknown[][] = []
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      if (projectId !== null) {
        await queryClient.invalidateQueries({ queryKey: projectWorkspaceKeys.setup(projectId) });
        await queryClient.invalidateQueries({
          queryKey: [...projectWorkspaceKeys.all, "availability", projectId],
        });
        await queryClient.invalidateQueries({ queryKey: [...projectWorkspaceKeys.all, "locations", projectId] });
        await queryClient.invalidateQueries({ queryKey: [...projectWorkspaceKeys.all, "execution", projectId] });
      }
      for (const key of extraInvalidate) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useComposeFlatTemplate(projectId: number | null) {
  return useProjectWorkspaceMutation<FlatTemplateComposePayload, Awaited<ReturnType<typeof projectWorkspaceApi.composeFlatTemplate>>>(
    (payload) => projectWorkspaceApi.composeFlatTemplate(projectId!, payload),
    projectId
  );
}
