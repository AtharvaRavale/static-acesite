export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ExecutionFlowMode = "automatic" | "manual";

export interface ExecutionScheme {
  id: number;
  project: number;
  project_name: string;
  name: string;
  code: string;
  description: string;
  is_current: boolean;
  is_active: boolean;
  levels_count: number;
  nodes_count: number;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface ExecutionSchemeWritePayload {
  project: number;
  name: string;
  code?: string;
  description?: string;
  is_current?: boolean;
  is_active?: boolean;
}

export type ExecutionSchemeUpdatePayload = Partial<
  Omit<ExecutionSchemeWritePayload, "project">
>;

export interface ExecutionLevel {
  id: number;
  scheme: number;
  scheme_name: string;
  project: number;
  name: string;
  code: string;
  sequence: number;
  default_flow_mode: ExecutionFlowMode;
  visible_in_navigation: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface ExecutionLevelWritePayload {
  scheme: number;
  name: string;
  code?: string;
  sequence?: number;
  default_flow_mode?: ExecutionFlowMode;
  visible_in_navigation?: boolean;
  is_active?: boolean;
}

export type ExecutionLevelUpdatePayload = Partial<
  Omit<ExecutionLevelWritePayload, "scheme">
>;

export interface ExecutionSchemeListParams {
  project?: number;
  is_current?: boolean;
  page?: number;
  page_size?: number;
}

export interface ExecutionLevelListParams {
  project?: number;
  scheme?: number;
  page?: number;
  page_size?: number;
}
