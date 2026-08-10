import type {
  MasterFlatType,
  MasterRoomType,
  ProjectFlatTemplate,
  ProjectFlatType,
  ProjectReleasePolicy,
  ProjectRoomType,
  ProjectStructureLevel,
  ProjectStructureLevelTransition,
} from "@/features/projects";
import type { ExecutionFlowMode, ExecutionLevel, ExecutionScheme } from "@/features/execution";

export interface ProjectWorkspaceProject {
  id: number;
  organization: number;
  organization_name: string;
  organization_unit: number | null;
  organization_unit_name: string | null;
  name: string;
  code: string;
  project_number: string;
  status: string;
  image_url: string | null;
}

export interface ProjectWorkspaceModuleChoice {
  id: number;
  organization_module_id: number;
  module_id: number;
  code: string;
  name: string;
}

export interface ProjectWorkspaceCounts {
  structure_levels: number;
  location_nodes: number;
  flat_templates: number;
  execution_schemes: number;
  execution_levels: number;
  execution_nodes: number;
  release_policies: number;
}

export interface ProjectWorkspaceSetup {
  project: ProjectWorkspaceProject;
  capabilities: Record<string, boolean>;
  structure_levels: ProjectStructureLevel[];
  structure_transitions: ProjectStructureLevelTransition[];
  room_types: ProjectRoomType[];
  flat_types: ProjectFlatType[];
  flat_templates: ProjectFlatTemplate[];
  execution_schemes: ExecutionScheme[];
  execution_levels: ExecutionLevel[];
  release_policies: ProjectReleasePolicy[];
  project_modules: ProjectWorkspaceModuleChoice[];
  counts: ProjectWorkspaceCounts;
}

export interface AvailabilityBucket<T> {
  scope: "organization" | "organization_unit";
  target_id: number;
  results: T[];
}

export interface ProjectMasterAvailability {
  flat_types: AvailabilityBucket<MasterFlatType>;
  room_types: AvailabilityBucket<MasterRoomType>;
}

export interface FlatTemplateComposeRoom {
  master_room_type: number;
  name?: string;
  quantity: number;
}

export interface FlatTemplateComposePayload {
  template_id?: number | null;
  master_flat_type: number;
  name: string;
  code?: string;
  description?: string;
  is_default?: boolean;
  rooms: FlatTemplateComposeRoom[];
}

export interface ExplorerNode {
  id: number;
  name: string;
  code: string;
  level: number;
  level_name: string;
  level_sequence: number;
  parent: number | null;
  parent_name: string | null;
  depth: number;
  children_count: number;
  full_path: string;
}

export interface LocationExplorerNode extends ExplorerNode {
  sort_order: number;
  area_type: string;
  applied_flat_template: number | null;
  applied_flat_template_name: string | null;
}

export interface ExecutionExplorerNode extends ExplorerNode {
  sequence: number;
  effective_flow_mode: ExecutionFlowMode;
}

export interface ExplorerResponse<T> {
  count: number;
  page: number;
  page_size: number;
  results: T[];
}

export interface ExplorerParams {
  parent?: number | "root" | "any" | null;
  level?: number | null;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ExecutionExplorerParams extends ExplorerParams {
  scheme: number;
}

export interface StructureLevelPayload {
  project: number;
  name: string;
  code?: string;
  sequence: number;
  checklist_allowed?: boolean;
  visible_in_navigation?: boolean;
  is_flat_template_applicable?: boolean;
  is_active?: boolean;
}

export interface TransitionPayload {
  parent_level?: number | null;
  child_level: number;
  is_active?: boolean;
}

export interface LocationNodePayload {
  project: number;
  level: number;
  parent?: number | null;
  name: string;
  code?: string;
  applied_flat_template?: number | null;
  checklist_allowed?: boolean;
  sort_order?: number;
  area_type?: string;
  generate_rooms?: boolean;
  room_level?: number | null;
  is_active?: boolean;
}

export interface ExecutionSchemePayload {
  project: number;
  name: string;
  code?: string;
  description?: string;
  is_current?: boolean;
  is_active?: boolean;
}

export interface ExecutionLevelPayload {
  scheme: number;
  name: string;
  code?: string;
  sequence?: number;
  default_flow_mode?: ExecutionFlowMode;
  visible_in_navigation?: boolean;
  is_active?: boolean;
}

export interface ExecutionNodePayload {
  scheme: number;
  level: number;
  parent?: number | null;
  name: string;
  code?: string;
  sequence?: number;
  flow_mode_override?: "" | ExecutionFlowMode;
  completion_rules?: Record<string, unknown>;
  is_active?: boolean;
}

export interface ExecutionNodeRecord extends ExecutionNodePayload {
  id: number;
  scheme_name: string;
  level_name: string;
  parent_name: string | null;
  effective_flow_mode: ExecutionFlowMode;
  project: number;
  depth: number;
  full_path: string;
  children?: ExecutionNodeRecord[];
}

export interface ReleasePolicyPayload {
  project: number;
  organization_module: number;
  release_level: "item" | "record" | "block_node" | "hierarchy";
  physical_scope_type: "all_locations" | "structure_level";
  structure_level?: number | null;
  include_physical_descendants?: boolean;
  execution_scope_type: "all_execution" | "execution_level";
  execution_level?: number | null;
  include_execution_descendants?: boolean;
  completion_rules?: Record<string, unknown>;
  priority?: number;
  is_active?: boolean;
}
