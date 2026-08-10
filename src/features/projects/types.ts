/** AceSite projects API contract (Backend/core/project). */

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectType =
  | "residential"
  | "commercial"
  | "industrial"
  | "infrastructure"
  | "mixed_use"
  | "institutional"
  | "renovation"
  | "other";

export type MeasurementSystem = "metric" | "imperial";

export type ProjectPartyStatus =
  | "bidding"
  | "active"
  | "paused"
  | "completed"
  | "removed";

export type ProjectPartyRole =
  | "contractor"
  | "subcontractor"
  | "consultant"
  | "supplier"
  | "architect"
  | "engineer"
  | "client_representative"
  | "government_agency"
  | "vendor"
  | "other";

export type ProjectAreaType =
  | "general"
  | "private_area"
  | "common_area"
  | "amenity_area"
  | "service_area"
  | "external_area";

export type ProjectMembershipStatus =
  | "invited"
  | "active"
  | "suspended"
  | "removed";

export type ReleaseLevel = "item" | "record" | "block_node" | "hierarchy";

export type PhysicalScopeType = "all_locations" | "structure_level";

export type ExecutionScopeType = "all_execution" | "execution_level";

export type JsonObject = Record<string, unknown>;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuditFields {
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface ActiveFields {
  is_active: boolean;
}

/* ── Project ─────────────────────────────────────────────────────────────── */

export interface ProjectProfile extends AuditFields {
  id: number;
  project: number;
  project_name: string;
  project_code: string;
  project_number: string;
  project_organization: number;
  project_type: ProjectType;
  external_reference: string;
  contract_reference: string;
  planned_start_date: string | null;
  planned_end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  timezone: string;
  currency: string;
  measurement_system: MeasurementSystem;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_or_province: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Project extends AuditFields, ActiveFields {
  id: number;
  organization: number;
  organization_name: string;
  organization_unit: number | null;
  organization_unit_name: string | null;
  name: string;
  code: string;
  project_number: string;
  location: string;
  description: string;
  status: ProjectStatus;
  status_display: string;
  status_changed_at: string;
  status_changed_by: number | null;
  status_changed_by_email: string | null;
  allowed_status_transitions: ProjectStatus[];
  grouping_config: JsonObject;
  /** Write-only on create/update; omitted from typical reads. */
  image?: File | string | null;
  image_url: string | null;
  profile: ProjectProfile | null;
  has_profile: boolean;
}

export interface ProjectWritePayload {
  organization?: number;
  organization_unit?: number | null;
  name?: string;
  code?: string;
  project_number?: string;
  location?: string;
  description?: string;
  grouping_config?: JsonObject;
  image?: File | string | null;
  is_active?: boolean;
}

export interface ProjectCreatePayload extends ProjectWritePayload {
  organization: number;
  name: string;
  code: string;
}

export type ProjectUpdatePayload = ProjectWritePayload;

export interface ProjectProfileWritePayload {
  project_type?: ProjectType;
  external_reference?: string;
  contract_reference?: string;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  timezone?: string;
  currency?: string;
  measurement_system?: MeasurementSystem;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_or_province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ProjectStatusActionPayload {
  reason?: string;
}

export interface ProjectValidationIssue {
  field: string | null;
  message: string;
}

export interface ProjectValidationReport {
  project_id: number;
  project_code: string;
  project_number: string;
  status: ProjectStatus;
  is_ready_for_activation: boolean;
  errors: ProjectValidationIssue[];
  warnings: ProjectValidationIssue[];
}

export interface ProjectListParams {
  organization?: number;
  organization_unit?: number;
  status?: ProjectStatus | string;
  project_number?: string;
  project_type?: ProjectType;
  currency?: string;
  country?: string;
  city?: string;
  timezone?: string;
  has_profile?: boolean;
  planned_start_from?: string;
  planned_start_to?: string;
  planned_end_from?: string;
  planned_end_to?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/* ── Master / project catalog ────────────────────────────────────────────── */

export interface MasterRoomType extends AuditFields, ActiveFields {
  id: number;
  owner_organization: number | null;
  name: string;
  code: string;
  is_global: boolean;
}

export interface MasterFlatType extends AuditFields, ActiveFields {
  id: number;
  owner_organization: number | null;
  name: string;
  code: string;
  is_global: boolean;
}

export interface MasterTypeWritePayload {
  owner_organization?: number | null;
  name: string;
  code: string;
  is_global?: boolean;
  is_active?: boolean;
}

export type MasterTypeUpdatePayload = Partial<MasterTypeWritePayload>;

export interface MasterRoomTypeAvailability extends AuditFields, ActiveFields {
  id: number;
  master_room_type: number;
  master_name: string;
  organization: number | null;
  organization_unit: number | null;
  target_name: string | null;
  metadata: JsonObject;
}

export interface MasterFlatTypeAvailability extends AuditFields, ActiveFields {
  id: number;
  master_flat_type: number;
  master_name: string;
  organization: number | null;
  organization_unit: number | null;
  target_name: string | null;
  metadata: JsonObject;
}

export interface MasterRoomTypeAvailabilityWritePayload {
  master_room_type: number;
  organization?: number | null;
  organization_unit?: number | null;
  metadata?: JsonObject;
  is_active?: boolean;
}

export interface MasterFlatTypeAvailabilityWritePayload {
  master_flat_type: number;
  organization?: number | null;
  organization_unit?: number | null;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type MasterRoomTypeAvailabilityUpdatePayload =
  Partial<MasterRoomTypeAvailabilityWritePayload>;

export type MasterFlatTypeAvailabilityUpdatePayload =
  Partial<MasterFlatTypeAvailabilityWritePayload>;

export interface ProjectRoomType extends AuditFields, ActiveFields {
  id: number;
  project: number;
  source_master: number | null;
  source_master_name: string | null;
  name: string;
  code: string;
}

export interface ProjectFlatType extends AuditFields, ActiveFields {
  id: number;
  project: number;
  source_master: number | null;
  source_master_name: string | null;
  name: string;
  code: string;
}

export interface ProjectTypeWritePayload {
  project: number;
  source_master?: number | null;
  name?: string;
  code?: string;
  is_active?: boolean;
}

export type ProjectTypeUpdatePayload = Partial<
  Omit<ProjectTypeWritePayload, "project">
>;

export interface ProjectFlatTemplateItem extends AuditFields, ActiveFields {
  id: number;
  template: number;
  room_type: number;
  room_type_name: string;
  name: string;
  code: string;
  sequence: number;
  quantity: number;
  metadata: JsonObject;
}

export interface ProjectFlatTemplate extends AuditFields, ActiveFields {
  id: number;
  project: number;
  flat_type: number;
  flat_type_name: string;
  name: string;
  code: string;
  description: string;
  is_default: boolean;
  metadata: JsonObject;
  items?: ProjectFlatTemplateItem[];
}

export interface ProjectFlatTemplateWritePayload {
  project: number;
  flat_type: number;
  name: string;
  code: string;
  description?: string;
  is_default?: boolean;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectFlatTemplateUpdatePayload = Partial<
  Omit<ProjectFlatTemplateWritePayload, "project">
>;

export interface ProjectFlatTemplateItemWritePayload {
  template: number;
  room_type: number;
  name: string;
  code?: string;
  sequence: number;
  quantity?: number;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectFlatTemplateItemUpdatePayload = Partial<
  Omit<ProjectFlatTemplateItemWritePayload, "template">
>;

/* ── Structure / location hierarchy ──────────────────────────────────────── */

export interface ProjectStructureLevel extends AuditFields, ActiveFields {
  id: number;
  project: number;
  name: string;
  code: string;
  sequence: number;
  checklist_allowed: boolean;
  visible_in_navigation: boolean;
  is_flat_template_applicable: boolean;
}

export interface ProjectStructureLevelWritePayload {
  project: number;
  name: string;
  code: string;
  sequence: number;
  checklist_allowed?: boolean;
  visible_in_navigation?: boolean;
  is_flat_template_applicable?: boolean;
  is_active?: boolean;
}

export type ProjectStructureLevelUpdatePayload = Partial<
  Omit<ProjectStructureLevelWritePayload, "project">
>;

export interface ProjectStructureLevelTransition extends AuditFields, ActiveFields {
  id: number;
  project: number;
  project_name: string;
  parent_level: number | null;
  parent_level_name: string | null;
  parent_level_code: string | null;
  parent_level_sequence: number | null;
  child_level: number;
  child_level_name: string;
  child_level_code: string;
  child_level_sequence: number;
  is_root_transition: boolean;
}

export interface ProjectStructureLevelTransitionWritePayload {
  parent_level?: number | null;
  child_level: number;
  is_active?: boolean;
}

export type ProjectStructureLevelTransitionUpdatePayload = Partial<
  ProjectStructureLevelTransitionWritePayload
>;

export interface ProjectLocationNode extends AuditFields, ActiveFields {
  id: number;
  project: number;
  level: number;
  level_name: string;
  parent: number | null;
  parent_name: string | null;
  name: string;
  code: string;
  applied_flat_template: number | null;
  checklist_allowed: boolean;
  path: string;
  depth: number;
  sort_order: number;
  full_code: string;
  full_path: string;
  area_type: ProjectAreaType;
  /** Write-only: auto-generate rooms from applied flat template. */
  generate_rooms?: boolean;
  /** Write-only: structure level for generated room nodes. */
  room_level?: number | null;
  children?: ProjectLocationNode[];
}

export interface ProjectLocationNodeWritePayload {
  project: number;
  level: number;
  parent?: number | null;
  name: string;
  code?: string;
  applied_flat_template?: number | null;
  checklist_allowed?: boolean;
  sort_order?: number;
  area_type?: ProjectAreaType;
  generate_rooms?: boolean;
  room_level?: number | null;
  is_active?: boolean;
}

export type ProjectLocationNodeUpdatePayload = Partial<
  Omit<ProjectLocationNodeWritePayload, "project">
>;

export interface LocationMovePayload {
  parent: number | null;
}

export interface GenerateRoomsPayload {
  room_level?: number | null;
}

export interface GenerateRoomsResponse {
  created_count: number;
  created: ProjectLocationNode[];
  node: ProjectLocationNode;
}

export interface ProjectLocationNodeClosure {
  id: number;
  project: number;
  ancestor: number;
  ancestor_name: string;
  descendant: number;
  descendant_name: string;
  depth: number;
  created_at: string;
}

export interface ProjectStructureTreeCounts {
  structure_levels: number;
  transitions: number;
  location_nodes: number;
  root_location_nodes: number;
}

export interface ProjectStructureTreeResponse {
  project: Project;
  structure_levels: ProjectStructureLevel[];
  transitions: ProjectStructureLevelTransition[];
  location_tree: ProjectLocationNode[];
  counts: ProjectStructureTreeCounts;
}

/* ── Access / parties / memberships ──────────────────────────────────────── */

export interface ProjectModuleAccess extends AuditFields, ActiveFields {
  id: number;
  project: number;
  organization_module: number;
  module_id: number;
  module_code: string;
  module_name: string;
  metadata: JsonObject;
}

export interface ProjectModuleAccessWritePayload {
  project: number;
  organization_module: number;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectModuleAccessUpdatePayload = Partial<
  Omit<ProjectModuleAccessWritePayload, "project">
>;

export interface ProjectParty extends AuditFields, ActiveFields {
  id: number;
  project: number;
  partner_organization: number | null;
  display_name: string;
  party_kind: string;
  partner_type: string | null;
  project_role: ProjectPartyRole | null;
  status: ProjectPartyStatus;
  trade_package: string;
  scope_summary: string;
  contract_reference: string;
  starts_on: string | null;
  ends_on: string | null;
  metadata: JsonObject;
}

export interface ProjectPartyWritePayload {
  project: number;
  partner_organization?: number | null;
  project_role?: ProjectPartyRole | null;
  status?: ProjectPartyStatus;
  trade_package?: string;
  scope_summary?: string;
  contract_reference?: string;
  starts_on?: string | null;
  ends_on?: string | null;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectPartyUpdatePayload = Partial<
  Omit<ProjectPartyWritePayload, "project">
>;

export interface ProjectPartyTeam extends AuditFields, ActiveFields {
  id: number;
  project: number;
  project_party: number;
  party_name: string;
  name: string;
  code: string;
  description: string;
  metadata: JsonObject;
}

export interface ProjectPartyTeamWritePayload {
  project_party: number;
  name: string;
  code?: string;
  description?: string;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectPartyTeamUpdatePayload = Partial<
  Omit<ProjectPartyTeamWritePayload, "project_party">
>;

export interface ProjectMembership extends AuditFields, ActiveFields {
  id: number;
  /** Write-only helper to resolve owner party when project_party omitted. */
  project?: number;
  project_id: number;
  project_name: string;
  project_party: number;
  party_name: string;
  user: number;
  user_email: string;
  status: ProjectMembershipStatus;
  project_party_team: number | null;
  job_title: string;
  team_position: string;
  invited_by: number | null;
  invited_at: string | null;
  joined_at: string | null;
  removed_at: string | null;
  metadata: JsonObject;
}

export interface ProjectMembershipWritePayload {
  project?: number;
  project_party?: number;
  user: number;
  status?: ProjectMembershipStatus;
  project_party_team?: number | null;
  job_title?: string;
  team_position?: string;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectMembershipUpdatePayload = Partial<
  Omit<ProjectMembershipWritePayload, "user">
> & {
  user?: number;
};

export interface UserProjectMembership extends AuditFields, ActiveFields {
  id: number;
  user: number;
  user_email: string;
  project: number;
  project_name: string;
  organization: number;
  organization_name: string;
  organization_unit: number | null;
  organization_unit_name: string | null;
  organization_membership: number | null;
  organization_unit_scope: number | null;
  organization_unit_scope_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  notes: string;
  is_current: boolean;
}

export interface UserProjectMembershipWritePayload {
  user: number;
  project: number;
  organization_membership?: number | null;
  organization_unit_scope?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  notes?: string;
  is_active?: boolean;
}

export type UserProjectMembershipUpdatePayload = Partial<
  UserProjectMembershipWritePayload
>;

export interface ProjectPartyModuleAccess extends AuditFields, ActiveFields {
  id: number;
  project_party: number;
  project_module_access: number;
  party_name?: string;
  module_code: string;
  metadata: JsonObject;
}

export interface ProjectPartyModuleAccessWritePayload {
  project_party: number;
  project_module_access: number;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectPartyModuleAccessUpdatePayload = Partial<
  Omit<ProjectPartyModuleAccessWritePayload, "project_party">
>;

export interface ProjectPartyRoleGrant extends AuditFields, ActiveFields {
  id: number;
  project_party_module_access: number;
  role: number;
  role_code: string;
  role_name: string;
  module_code: string;
  party_name?: string;
  project?: number;
  metadata: JsonObject;
}

export interface ProjectPartyRoleGrantWritePayload {
  project_party_module_access: number;
  role: number;
  metadata?: JsonObject;
  is_active?: boolean;
}

export type ProjectPartyRoleGrantUpdatePayload = Partial<
  Omit<ProjectPartyRoleGrantWritePayload, "project_party_module_access">
>;

/* ── Release policies ────────────────────────────────────────────────────── */

export interface ProjectReleasePolicy extends AuditFields, ActiveFields {
  id: number;
  project: number;
  project_name: string;
  organization: number;
  organization_module: number;
  organization_module_status: string;
  module: number;
  module_code: string;
  module_name: string;
  release_level: ReleaseLevel;
  physical_scope_type: PhysicalScopeType;
  structure_level: number | null;
  structure_level_name: string | null;
  include_physical_descendants: boolean;
  execution_scope_type: ExecutionScopeType;
  execution_level: number | null;
  execution_level_name: string | null;
  include_execution_descendants: boolean;
  completion_rules: JsonObject;
  priority: number;
}

export interface ProjectReleasePolicyWritePayload {
  project: number;
  organization_module: number;
  release_level: ReleaseLevel;
  physical_scope_type?: PhysicalScopeType;
  structure_level?: number | null;
  include_physical_descendants?: boolean;
  execution_scope_type?: ExecutionScopeType;
  execution_level?: number | null;
  include_execution_descendants?: boolean;
  completion_rules?: JsonObject;
  priority?: number;
  is_active?: boolean;
}

export type ProjectReleasePolicyUpdatePayload = Partial<
  Omit<ProjectReleasePolicyWritePayload, "project">
>;

/* ── List params ─────────────────────────────────────────────────────────── */

export interface BaseListParams {
  is_active?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface MasterRoomTypeListParams extends BaseListParams {
  owner_organization?: number;
  is_global?: boolean;
}

export interface MasterFlatTypeListParams extends BaseListParams {
  owner_organization?: number;
  is_global?: boolean;
}

export interface MasterRoomTypeAvailabilityListParams extends BaseListParams {
  master_room_type?: number;
  organization?: number;
  organization_unit?: number;
  project?: number;
}

export interface MasterFlatTypeAvailabilityListParams extends BaseListParams {
  master_flat_type?: number;
  organization?: number;
  organization_unit?: number;
  project?: number;
}

export interface ProjectRoomTypeListParams extends BaseListParams {
  project?: number;
  source_master?: number;
}

export interface ProjectFlatTypeListParams extends BaseListParams {
  project?: number;
  source_master?: number;
}

export interface ProjectFlatTemplateListParams extends BaseListParams {
  project?: number;
  flat_type?: number;
  is_default?: boolean;
}

export interface ProjectFlatTemplateItemListParams extends BaseListParams {
  template?: number;
  room_type?: number;
}

export interface ProjectStructureLevelListParams extends BaseListParams {
  project?: number;
}

export interface ProjectStructureLevelTransitionListParams extends BaseListParams {
  parent_level?: number | null;
  child_level?: number;
  root_only?: boolean;
  level?: number;
}

export interface ProjectLocationNodeListParams extends BaseListParams {
  project?: number;
  level?: number;
  parent?: number | null | "null";
  area_type?: ProjectAreaType;
}

export interface ProjectModuleAccessListParams extends BaseListParams {
  project?: number;
  organization_module?: number;
}

export interface ProjectPartyListParams extends BaseListParams {
  project?: number;
  partner_organization?: number;
  party_kind?: string;
  status?: ProjectPartyStatus;
  project_role?: ProjectPartyRole;
}

export interface ProjectPartyTeamListParams extends BaseListParams {
  project_party?: number;
}

export interface ProjectMembershipListParams extends BaseListParams {
  project?: number;
  project_party?: number;
  project_party_team?: number;
  user?: number;
  status?: ProjectMembershipStatus;
}

export interface UserProjectMembershipListParams extends BaseListParams {
  user?: number;
  project?: number;
  organization?: number;
  organization_unit?: number;
}

export interface ProjectPartyModuleAccessListParams extends BaseListParams {
  project_party?: number;
  project_module_access?: number;
}

export interface ProjectPartyRoleGrantListParams extends BaseListParams {
  project_party_module_access?: number;
  role?: number;
}

export interface ProjectReleasePolicyListParams extends BaseListParams {
  project?: number;
  organization_module?: number;
  module?: number;
  module_code?: string;
  release_level?: ReleaseLevel;
  physical_scope_type?: PhysicalScopeType;
  execution_scope_type?: ExecutionScopeType;
  structure_level?: number;
  execution_level?: number;
}
