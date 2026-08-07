import { api } from "@/lib/api";
import type {
  DependencyGraphParams,
  DependencyGraphResponse,
  ImpactAnalysisParams,
  ImpactAnalysisResponse,
  ImportModuleResponse,
  LifecyclePhaseListParams,
  LifecyclePhaseReorderPayload,
  LifecyclePhaseWritePayload,
  ModuleCodeAvailabilityResponse,
  ModuleDependency,
  ModuleDependencyListParams,
  ModuleDependencyWritePayload,
  ModuleValidationReport,
  OrganizationModule,
  OrganizationModuleListParams,
  OrganizationModuleUpdatePayload,
  OrganizationModuleWritePayload,
  PaginatedResponse,
  ProductModule,
  ProductModuleCatalogResponse,
  ProductModuleLifecyclePhase,
  ProductModuleListParams,
  ProductModuleVersion,
  ProductModuleVersionListParams,
  ProductModuleWritePayload,
  PublishModulePayload,
  PublishModuleResponse,
} from "./types";

type QueryValue = string | number | boolean | undefined | null;

function buildQueryString(
  params: object = {}
): string {
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

async function writeProductModule(
  method: "post" | "patch" | "put",
  path: string,
  payload: ProductModuleWritePayload
): Promise<ProductModule> {
  const body = payload as Record<string, unknown>;

  if (hasFile(body)) {
    const response = await api[method]<ProductModule>(path, toFormData(body), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  const response = await api[method]<ProductModule>(path, payload);
  return response.data;
}

export const productModulesApi = {
  list: async (
    params: ProductModuleListParams = {}
  ): Promise<PaginatedResponse<ProductModule>> => {
    const response = await api.get<PaginatedResponse<ProductModule>>(
      `/product-modules/${buildQueryString(params)}`
    );
    return response.data;
  },

  create: async (payload: ProductModuleWritePayload): Promise<ProductModule> => {
    return writeProductModule("post", "/product-modules/", payload);
  },

  get: async (id: number): Promise<ProductModule> => {
    const response = await api.get<ProductModule>(`/product-modules/${id}/`);
    return response.data;
  },

  update: async (
    id: number,
    payload: ProductModuleWritePayload
  ): Promise<ProductModule> => {
    return writeProductModule("patch", `/product-modules/${id}/`, payload);
  },

  replace: async (
    id: number,
    payload: ProductModuleWritePayload
  ): Promise<ProductModule> => {
    return writeProductModule("put", `/product-modules/${id}/`, payload);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/product-modules/${id}/`);
  },

  catalog: async (
    params: ProductModuleListParams = {}
  ): Promise<ProductModuleCatalogResponse> => {
    const response = await api.get<ProductModuleCatalogResponse>(
      `/product-modules/catalog/${buildQueryString(params)}`
    );
    return response.data;
  },

  codeAvailability: async (params: {
    code: string;
    exclude_id?: number;
  }): Promise<ModuleCodeAvailabilityResponse> => {
    const response = await api.get<ModuleCodeAvailabilityResponse>(
      `/product-modules/code-availability/${buildQueryString(params)}`
    );
    return response.data;
  },

  validation: async (id: number): Promise<ModuleValidationReport> => {
    const response = await api.get<ModuleValidationReport>(
      `/product-modules/${id}/validation/`
    );
    return response.data;
  },

  publish: async (
    id: number,
    payload: PublishModulePayload = {}
  ): Promise<PublishModuleResponse> => {
    const response = await api.post<PublishModuleResponse>(
      `/product-modules/${id}/publish/`,
      payload
    );
    return response.data;
  },

  dependencyGraph: async (
    id: number,
    params: DependencyGraphParams = {}
  ): Promise<DependencyGraphResponse> => {
    const response = await api.get<DependencyGraphResponse>(
      `/product-modules/${id}/dependency-graph/${buildQueryString(params)}`
    );
    return response.data;
  },

  impactAnalysis: async (
    id: number,
    params: ImpactAnalysisParams = {}
  ): Promise<ImpactAnalysisResponse> => {
    const response = await api.get<ImpactAnalysisResponse>(
      `/product-modules/${id}/impact-analysis/${buildQueryString(params)}`
    );
    return response.data;
  },

  importModule: async (
    payload: FormData | Record<string, unknown>
  ): Promise<ImportModuleResponse> => {
    if (payload instanceof FormData) {
      const response = await api.post<ImportModuleResponse>(
        "/product-modules/import-module/",
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    }

    const response = await api.post<ImportModuleResponse>(
      "/product-modules/import-module/",
      payload
    );
    return response.data;
  },
};

export const productModuleVersionsApi = {
  list: async (
    params: ProductModuleVersionListParams = {}
  ): Promise<PaginatedResponse<ProductModuleVersion>> => {
    const response = await api.get<PaginatedResponse<ProductModuleVersion>>(
      `/product-module-versions/${buildQueryString(params)}`
    );
    return response.data;
  },

  get: async (id: number): Promise<ProductModuleVersion> => {
    const response = await api.get<ProductModuleVersion>(
      `/product-module-versions/${id}/`
    );
    return response.data;
  },
};

export const lifecyclePhasesApi = {
  list: async (
    params: LifecyclePhaseListParams = {}
  ): Promise<PaginatedResponse<ProductModuleLifecyclePhase>> => {
    const response = await api.get<PaginatedResponse<ProductModuleLifecyclePhase>>(
      `/product-module-phases/${buildQueryString(params)}`
    );
    return response.data;
  },

  create: async (
    payload: LifecyclePhaseWritePayload
  ): Promise<ProductModuleLifecyclePhase> => {
    const response = await api.post<ProductModuleLifecyclePhase>(
      "/product-module-phases/",
      payload
    );
    return response.data;
  },

  get: async (id: number): Promise<ProductModuleLifecyclePhase> => {
    const response = await api.get<ProductModuleLifecyclePhase>(
      `/product-module-phases/${id}/`
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: LifecyclePhaseWritePayload
  ): Promise<ProductModuleLifecyclePhase> => {
    const response = await api.patch<ProductModuleLifecyclePhase>(
      `/product-module-phases/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: LifecyclePhaseWritePayload
  ): Promise<ProductModuleLifecyclePhase> => {
    const response = await api.put<ProductModuleLifecyclePhase>(
      `/product-module-phases/${id}/`,
      payload
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/product-module-phases/${id}/`);
  },

  reorder: async (
    payload: LifecyclePhaseReorderPayload
  ): Promise<ProductModuleLifecyclePhase[]> => {
    const response = await api.post<ProductModuleLifecyclePhase[]>(
      "/product-module-phases/reorder/",
      payload
    );
    return response.data;
  },
};

export const moduleDependenciesApi = {
  list: async (
    params: ModuleDependencyListParams = {}
  ): Promise<PaginatedResponse<ModuleDependency>> => {
    const response = await api.get<PaginatedResponse<ModuleDependency>>(
      `/module-dependencies/${buildQueryString(params)}`
    );
    return response.data;
  },

  create: async (payload: ModuleDependencyWritePayload): Promise<ModuleDependency> => {
    const response = await api.post<ModuleDependency>("/module-dependencies/", payload);
    return response.data;
  },

  get: async (id: number): Promise<ModuleDependency> => {
    const response = await api.get<ModuleDependency>(`/module-dependencies/${id}/`);
    return response.data;
  },

  update: async (
    id: number,
    payload: ModuleDependencyWritePayload
  ): Promise<ModuleDependency> => {
    const response = await api.patch<ModuleDependency>(
      `/module-dependencies/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: ModuleDependencyWritePayload
  ): Promise<ModuleDependency> => {
    const response = await api.put<ModuleDependency>(
      `/module-dependencies/${id}/`,
      payload
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/module-dependencies/${id}/`);
  },
};

/* ── Organization modules (superadmin assignment resource) ───────────────── */

export const organizationModulesApi = {
  list: async (
    params: OrganizationModuleListParams = {}
  ): Promise<PaginatedResponse<OrganizationModule>> => {
    const response = await api.get<PaginatedResponse<OrganizationModule>>(
      `/organization-modules/${buildQueryString(params)}`
    );
    return response.data;
  },

  create: async (
    payload: OrganizationModuleWritePayload
  ): Promise<OrganizationModule> => {
    const response = await api.post<OrganizationModule>(
      "/organization-modules/",
      payload
    );
    return response.data;
  },

  get: async (id: number): Promise<OrganizationModule> => {
    const response = await api.get<OrganizationModule>(
      `/organization-modules/${id}/`
    );
    return response.data;
  },

  update: async (
    id: number,
    payload: OrganizationModuleUpdatePayload
  ): Promise<OrganizationModule> => {
    const response = await api.patch<OrganizationModule>(
      `/organization-modules/${id}/`,
      payload
    );
    return response.data;
  },

  replace: async (
    id: number,
    payload: OrganizationModuleUpdatePayload
  ): Promise<OrganizationModule> => {
    const response = await api.put<OrganizationModule>(
      `/organization-modules/${id}/`,
      payload
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/organization-modules/${id}/`);
  },
};
