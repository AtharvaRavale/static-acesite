import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executionLevelsApi, executionSchemesApi } from "./api";
import type {
  ExecutionLevelListParams,
  ExecutionLevelUpdatePayload,
  ExecutionLevelWritePayload,
  ExecutionSchemeListParams,
  ExecutionSchemeUpdatePayload,
  ExecutionSchemeWritePayload,
} from "./types";

export const executionSchemeKeys = {
  all: ["execution-schemes"] as const,
  list: (params: ExecutionSchemeListParams) =>
    [...executionSchemeKeys.all, "list", params] as const,
};

export const executionLevelKeys = {
  all: ["execution-levels"] as const,
  list: (params: ExecutionLevelListParams) =>
    [...executionLevelKeys.all, "list", params] as const,
};

export function useExecutionSchemes(params: ExecutionSchemeListParams = {}) {
  return useQuery({
    queryKey: executionSchemeKeys.list(params),
    queryFn: () => executionSchemesApi.list(params),
  });
}

export function useCreateExecutionScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExecutionSchemeWritePayload) =>
      executionSchemesApi.create(payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: executionSchemeKeys.all }),
  });
}

export function useUpdateExecutionScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExecutionSchemeUpdatePayload }) =>
      executionSchemesApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: executionSchemeKeys.all }),
  });
}

export function useExecutionLevels(params: ExecutionLevelListParams = {}) {
  return useQuery({
    queryKey: executionLevelKeys.list(params),
    queryFn: () => executionLevelsApi.list(params),
  });
}

export function useCreateExecutionLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExecutionLevelWritePayload) => executionLevelsApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: executionLevelKeys.all });
      void queryClient.invalidateQueries({ queryKey: executionSchemeKeys.all });
    },
  });
}

export function useUpdateExecutionLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExecutionLevelUpdatePayload }) =>
      executionLevelsApi.update(id, payload),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: executionLevelKeys.all }),
  });
}
