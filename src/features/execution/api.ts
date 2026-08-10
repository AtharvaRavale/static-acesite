import { api } from "@/lib/api";
import type {
  ExecutionLevel,
  ExecutionLevelListParams,
  ExecutionLevelUpdatePayload,
  ExecutionLevelWritePayload,
  ExecutionScheme,
  ExecutionSchemeListParams,
  ExecutionSchemeUpdatePayload,
  ExecutionSchemeWritePayload,
  PaginatedResponse,
} from "./types";

type QueryValue = string | number | boolean | undefined | null;

function buildQueryString(params: object = {}): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, QueryValue>)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const executionSchemesApi = {
  list: async (
    params: ExecutionSchemeListParams = {}
  ): Promise<PaginatedResponse<ExecutionScheme>> => {
    const response = await api.get<PaginatedResponse<ExecutionScheme>>(
      `/execution-schemes/${buildQueryString(params)}`
    );
    return response.data;
  },
  create: async (payload: ExecutionSchemeWritePayload): Promise<ExecutionScheme> => {
    const response = await api.post<ExecutionScheme>("/execution-schemes/", payload);
    return response.data;
  },
  update: async (
    id: number,
    payload: ExecutionSchemeUpdatePayload
  ): Promise<ExecutionScheme> => {
    const response = await api.patch<ExecutionScheme>(
      `/execution-schemes/${id}/`,
      payload
    );
    return response.data;
  },
};

export const executionLevelsApi = {
  list: async (
    params: ExecutionLevelListParams = {}
  ): Promise<PaginatedResponse<ExecutionLevel>> => {
    const response = await api.get<PaginatedResponse<ExecutionLevel>>(
      `/execution-levels/${buildQueryString(params)}`
    );
    return response.data;
  },
  create: async (payload: ExecutionLevelWritePayload): Promise<ExecutionLevel> => {
    const response = await api.post<ExecutionLevel>("/execution-levels/", payload);
    return response.data;
  },
  update: async (
    id: number,
    payload: ExecutionLevelUpdatePayload
  ): Promise<ExecutionLevel> => {
    const response = await api.patch<ExecutionLevel>(`/execution-levels/${id}/`, payload);
    return response.data;
  },
};
