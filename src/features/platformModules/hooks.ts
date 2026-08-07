import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  lifecyclePhasesApi,
  moduleDependenciesApi,
  organizationModulesApi,
  productModulesApi,
  productModuleVersionsApi,
} from "./api";
import type {
  DependencyGraphParams,
  ImpactAnalysisParams,
  LifecyclePhaseListParams,
  LifecyclePhaseReorderPayload,
  LifecyclePhaseWritePayload,
  ModuleDependencyListParams,
  ModuleDependencyWritePayload,
  OrganizationModuleListParams,
  OrganizationModuleUpdatePayload,
  OrganizationModuleWritePayload,
  ProductModuleListParams,
  ProductModuleVersionListParams,
  ProductModuleWritePayload,
  PublishModulePayload,
} from "./types";

export const productModuleKeys = {
  all: ["product-modules"] as const,
  lists: () => [...productModuleKeys.all, "list"] as const,
  list: (params: ProductModuleListParams) =>
    [...productModuleKeys.lists(), params] as const,
  details: () => [...productModuleKeys.all, "detail"] as const,
  detail: (id: number) => [...productModuleKeys.details(), id] as const,
  catalog: (params: ProductModuleListParams) =>
    [...productModuleKeys.all, "catalog", params] as const,
  codeAvailability: (code: string, excludeId?: number) =>
    [...productModuleKeys.all, "code-availability", code, excludeId] as const,
  validation: (id: number) =>
    [...productModuleKeys.all, "validation", id] as const,
  dependencyGraph: (id: number, params: DependencyGraphParams) =>
    [...productModuleKeys.all, "dependency-graph", id, params] as const,
  impactAnalysis: (id: number, params: ImpactAnalysisParams) =>
    [...productModuleKeys.all, "impact-analysis", id, params] as const,
};

export const productModuleVersionKeys = {
  all: ["product-module-versions"] as const,
  list: (params: ProductModuleVersionListParams) =>
    [...productModuleVersionKeys.all, "list", params] as const,
  detail: (id: number) => [...productModuleVersionKeys.all, "detail", id] as const,
};

export const lifecyclePhaseKeys = {
  all: ["product-module-phases"] as const,
  list: (params: LifecyclePhaseListParams) =>
    [...lifecyclePhaseKeys.all, "list", params] as const,
  detail: (id: number) => [...lifecyclePhaseKeys.all, "detail", id] as const,
};

export const moduleDependencyKeys = {
  all: ["module-dependencies"] as const,
  list: (params: ModuleDependencyListParams) =>
    [...moduleDependencyKeys.all, "list", params] as const,
  detail: (id: number) => [...moduleDependencyKeys.all, "detail", id] as const,
};

function invalidateProductModuleQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
  void queryClient.invalidateQueries({ queryKey: productModuleVersionKeys.all });
  void queryClient.invalidateQueries({ queryKey: lifecyclePhaseKeys.all });
  void queryClient.invalidateQueries({ queryKey: moduleDependencyKeys.all });
}

/* ── Product modules ─────────────────────────────────────────────────────── */

export function useProductModules(params: ProductModuleListParams = {}) {
  return useQuery({
    queryKey: productModuleKeys.list(params),
    queryFn: () => productModulesApi.list(params),
  });
}

export function useProductModule(id: number | null) {
  return useQuery({
    queryKey: productModuleKeys.detail(id ?? -1),
    queryFn: () => productModulesApi.get(id!),
    enabled: id !== null,
  });
}

export function useProductModuleCatalog(params: ProductModuleListParams = {}) {
  return useQuery({
    queryKey: productModuleKeys.catalog(params),
    queryFn: () => productModulesApi.catalog(params),
  });
}

export function useCreateProductModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductModuleWritePayload) => productModulesApi.create(payload),
    onSuccess: () => invalidateProductModuleQueries(queryClient),
  });
}

export function useUpdateProductModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductModuleWritePayload }) =>
      productModulesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productModuleKeys.detail(variables.id),
      });
      invalidateProductModuleQueries(queryClient);
    },
  });
}

export function useDeleteProductModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productModulesApi.remove(id),
    onSuccess: () => invalidateProductModuleQueries(queryClient),
  });
}

export function useCheckModuleCodeAvailability(
  code: string,
  excludeId?: number,
  enabled = true
) {
  return useQuery({
    queryKey: productModuleKeys.codeAvailability(code, excludeId),
    queryFn: () => productModulesApi.codeAvailability({ code, exclude_id: excludeId }),
    enabled: enabled && code.trim().length > 0,
  });
}

export function useModuleValidation(id: number | null) {
  return useQuery({
    queryKey: productModuleKeys.validation(id ?? -1),
    queryFn: () => productModulesApi.validation(id!),
    enabled: id !== null,
  });
}

export function usePublishModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: PublishModulePayload }) =>
      productModulesApi.publish(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productModuleKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: productModuleVersionKeys.all });
      invalidateProductModuleQueries(queryClient);
    },
  });
}

export function useDependencyGraph(
  id: number | null,
  params: DependencyGraphParams = {}
) {
  return useQuery({
    queryKey: productModuleKeys.dependencyGraph(id ?? -1, params),
    queryFn: () => productModulesApi.dependencyGraph(id!, params),
    enabled: id !== null,
  });
}

export function useImpactAnalysis(id: number | null, params: ImpactAnalysisParams = {}) {
  return useQuery({
    queryKey: productModuleKeys.impactAnalysis(id ?? -1, params),
    queryFn: () => productModulesApi.impactAnalysis(id!, params),
    enabled: id !== null,
  });
}

export function useImportModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormData | Record<string, unknown>) =>
      productModulesApi.importModule(payload),
    onSuccess: () => invalidateProductModuleQueries(queryClient),
  });
}

/* ── Versions ────────────────────────────────────────────────────────────── */

export function useProductModuleVersions(params: ProductModuleVersionListParams = {}) {
  return useQuery({
    queryKey: productModuleVersionKeys.list(params),
    queryFn: () => productModuleVersionsApi.list(params),
  });
}

/* ── Lifecycle phases ────────────────────────────────────────────────────── */

export function useLifecyclePhases(params: LifecyclePhaseListParams = {}) {
  return useQuery({
    queryKey: lifecyclePhaseKeys.list(params),
    queryFn: () => lifecyclePhasesApi.list(params),
  });
}

export function useCreateLifecyclePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LifecyclePhaseWritePayload) => lifecyclePhasesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lifecyclePhaseKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

export function useUpdateLifecyclePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LifecyclePhaseWritePayload }) =>
      lifecyclePhasesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lifecyclePhaseKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

export function useDeleteLifecyclePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => lifecyclePhasesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lifecyclePhaseKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

export function useReorderLifecyclePhases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LifecyclePhaseReorderPayload) => lifecyclePhasesApi.reorder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lifecyclePhaseKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

/* ── Dependencies ────────────────────────────────────────────────────────── */

export function useModuleDependencies(params: ModuleDependencyListParams = {}) {
  return useQuery({
    queryKey: moduleDependencyKeys.list(params),
    queryFn: () => moduleDependenciesApi.list(params),
  });
}

export function useCreateModuleDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ModuleDependencyWritePayload) =>
      moduleDependenciesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moduleDependencyKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

export function useUpdateModuleDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ModuleDependencyWritePayload }) =>
      moduleDependenciesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moduleDependencyKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

export function useDeleteModuleDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => moduleDependenciesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moduleDependencyKeys.all });
      void queryClient.invalidateQueries({ queryKey: productModuleKeys.all });
    },
  });
}

/* ── Organization modules (superadmin assignment) ────────────────────────── */

export const organizationModuleKeys = {
  all: ["organization-modules"] as const,
  lists: () => [...organizationModuleKeys.all, "list"] as const,
  list: (params: OrganizationModuleListParams) =>
    [...organizationModuleKeys.lists(), params] as const,
  details: () => [...organizationModuleKeys.all, "detail"] as const,
  detail: (id: number) => [...organizationModuleKeys.details(), id] as const,
};

export function useOrganizationModuleAssignments(
  params: OrganizationModuleListParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: organizationModuleKeys.list(params),
    queryFn: () => organizationModulesApi.list(params),
    enabled,
  });
}

export function useOrganizationModuleAssignment(id: number | null) {
  return useQuery({
    queryKey: organizationModuleKeys.detail(id ?? -1),
    queryFn: () => organizationModulesApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateOrganizationModuleAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationModuleWritePayload) =>
      organizationModulesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationModuleKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateOrganizationModuleAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: OrganizationModuleUpdatePayload;
    }) => organizationModulesApi.update(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: organizationModuleKeys.detail(variables.id),
      });
      void queryClient.invalidateQueries({
        queryKey: organizationModuleKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useDeleteOrganizationModuleAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => organizationModulesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationModuleKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
