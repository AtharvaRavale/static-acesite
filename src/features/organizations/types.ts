/** Current organization API contract (Backend/core/organization). */

import type { OrganizationModule, ProductModule } from "@/features/platformModules";

export type OrganizationStatus = "trial" | "active" | "suspended" | "closed";
export type OrganizationFlow = "self" | "partner_company" | "both";
export type PartnerType =
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
export type MembershipStatus = "invited" | "active" | "suspended" | "removed";
export type MembershipType = "owner" | "member";
export type UnitType =
  | "holding_company"
  | "legal_entity"
  | "business_unit"
  | "region"
  | "zone"
  | "branch"
  | "site_office"
  | "other";
export type InviteStatus = "draft" | "sent" | "accepted" | "expired" | "revoked";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  user_type?: string;
  is_active?: boolean;
}

export interface Organization {
  id: number;
  organization_id: string;
  name: string;
  code: string;
  legal_name: string;
  status: OrganizationStatus;
  status_display: string;
  flow: OrganizationFlow;
  flow_display: string;
  primary_admin: UserSummary | null;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_membership_id: string | null;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  settings: Record<string, unknown>;
  brand_color: string;
  logo: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface PartnerOrganization {
  id: number;
  organization: number;
  organization_name: string;
  organization_flow: OrganizationFlow;
  parent: number | null;
  parent_name: string | null;
  child_count: number;
  name: string;
  legal_name: string;
  code: string;
  partner_type: PartnerType;
  partner_type_display: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  registration_number: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface PartnerOrganizationContact {
  id: number;
  partner_organization: number;
  partner_organization_name: string;
  organization_id: number;
  organization_name: string;
  organization_flow: OrganizationFlow;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  is_primary: boolean;
  notes: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface Department {
  id: number;
  organization: number;
  organization_name: string;
  organization_flow: OrganizationFlow;
  partner_organization: number | null;
  partner_organization_name: string | null;
  partner_type: PartnerType | null;
  name: string;
  code: string;
  description: string;
  image: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface DepartmentUnitAssignment {
  id: number;
  department: number;
  department_name: string;
  organization_id: number;
  organization_name: string;
  partner_organization_id: number | null;
  partner_organization_name: string | null;
  organization_unit: number;
  organization_unit_name: string;
  organization_unit_code: string;
  organization_unit_type: UnitType;
  image: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface OrganizationMembership {
  id: number;
  membership_id: string;
  organization: number;
  organization_name: string;
  user: UserSummary;
  membership_type: MembershipType;
  membership_type_display: string;
  status: MembershipStatus;
  status_display: string;
  primary_organization_unit: number | null;
  primary_organization_unit_name: string | null;
  primary_department: number | null;
  primary_department_name: string | null;
  is_primary: boolean;
  job_title: string;
  invited_at: string | null;
  joined_at: string | null;
  removed_at: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface OrganizationUnit {
  id: number;
  organization: number;
  organization_name: string;
  parent: number | null;
  parent_name: string | null;
  name: string;
  code: string;
  unit_type: UnitType;
  unit_type_display: string;
  description: string;
  image: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface UserOrganizationUnitScope {
  id: number;
  organization_membership: number;
  membership_id: string;
  membership_type: MembershipType;
  user_id: number;
  user_email: string;
  organization_id: number;
  organization_name: string;
  organization_unit: number;
  organization_unit_name: string;
  organization_unit_code: string;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface OrganizationAdminInvite {
  id: number;
  organization: number;
  organization_name: string;
  organization_code: string;
  user: UserSummary;
  membership: number | null;
  membership_id: string | null;
  membership_type: MembershipType | null;
  email: string;
  status: InviteStatus;
  status_display: string;
  subject: string;
  sent_at: string | null;
  last_sent_at: string | null;
  send_count: number;
  accepted_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  sent_by: UserSummary | null;
  revoked_by: UserSummary | null;
  is_expired: boolean;
  can_be_accepted: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

/* ── List params ─────────────────────────────────────────────────────────── */

export interface OrganizationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  status?: OrganizationStatus;
  flow?: OrganizationFlow;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

/** @deprecated Use OrganizationListParams */
export type OrganizationsListParams = OrganizationListParams;

export interface PartnerOrganizationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  partner_type?: PartnerType;
  parent?: number;
  root_only?: boolean;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface PartnerOrganizationContactListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  partner_organization?: number;
  is_primary?: boolean;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DepartmentListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  partner_organization?: number;
  department_scope?: "internal" | "partner";
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DepartmentUnitAssignmentListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  department?: number;
  organization_unit?: number;
  partner_organization?: number;
  assignment_type?: "internal" | "partner";
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OrganizationMembershipListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  membership_type?: MembershipType;
  status?: MembershipStatus;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OrganizationUnitListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  parent?: number;
  unit_type?: UnitType;
  root_only?: boolean;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface UserOrganizationUnitScopeListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  organization_membership?: number;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OrganizationInvitationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  organization?: number;
  membership?: number;
  status?: InviteStatus;
  email?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OrganizationActivityListParams {
  page?: number;
  page_size?: number;
  event_type?: string;
  intent?: string;
  severity?: string;
  actor?: number;
  date_from?: string;
  date_to?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface OrganizationTreeParams {
  include_inactive?: boolean;
}

export interface OrganizationInvitationsParams {
  status?: InviteStatus;
  is_active?: boolean;
}

export interface OrganizationModulesParams {
  status?: "enabled" | "read_only" | "disabled";
}

/* ── Write payloads ──────────────────────────────────────────────────────── */

export type OrganizationWritePayload = Partial<{
  name: string;
  code: string;
  legal_name: string;
  status: OrganizationStatus;
  flow: OrganizationFlow;
  owner_first_name: string;
  owner_last_name: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  settings: Record<string, unknown>;
  brand_color: string;
  logo: File | string | null;
  is_active: boolean;
}>;

export type PartnerOrganizationWritePayload = Partial<{
  organization: number;
  parent: number | null;
  name: string;
  legal_name: string;
  code: string;
  partner_type: PartnerType;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  registration_number: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
}>;

export type PartnerOrganizationContactWritePayload = Partial<{
  partner_organization: number;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  is_primary: boolean;
  notes: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
}>;

export type DepartmentWritePayload = Partial<{
  organization: number;
  partner_organization: number | null;
  name: string;
  code: string;
  description: string;
  image: File | string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
}>;

export type DepartmentUnitAssignmentWritePayload = Partial<{
  department: number;
  organization_unit: number;
  image: File | string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
}>;

export type OrganizationMembershipWritePayload = Partial<{
  organization: number;
  user_email: string;
  first_name: string;
  last_name: string;
  primary_organization_unit: number | null;
  primary_department: number | null;
  is_primary: boolean;
  job_title: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
}>;

export type OrganizationUnitWritePayload = Partial<{
  organization: number;
  parent: number | null;
  name: string;
  code: string;
  unit_type: UnitType;
  description: string;
  image: File | string | null;
  is_active: boolean;
}>;

export type UserOrganizationUnitScopeWritePayload = Partial<{
  organization_membership: number;
  organization_unit: number;
  is_active: boolean;
}>;

/* ── Action payloads ─────────────────────────────────────────────────────── */

export interface TransferOwnershipPayload {
  new_owner_membership_id?: string | number;
  new_owner?: string | number;
}

export interface BulkInviteMemberEntry {
  user_email: string;
  first_name?: string;
  last_name?: string;
  primary_organization_unit?: number | null;
  primary_department?: number | null;
  is_primary?: boolean;
  job_title?: string;
  metadata?: Record<string, unknown>;
}

export interface BulkInviteMembersPayload {
  members: BulkInviteMemberEntry[];
}

export interface ModuleConfigurationPayload {
  configuration: Record<string, unknown>;
}

export interface ValidateInvitePayload {
  invite_token: string;
  membership_id?: string;
}

export interface AcceptInvitePayload {
  invite_token: string;
  membership_id?: string;
  uid?: string;
  token?: string;
  new_password?: string;
}

/* ── Response types ──────────────────────────────────────────────────────── */

export interface OrganizationOverviewCounts {
  active_members: number;
  pending_invitations: number;
  organization_units: number;
  departments: number;
  partner_organizations: number;
  active_projects: number;
  enabled_modules: number;
}

export interface OrganizationModuleStatusCounts {
  enabled: number;
  read_only: number;
  disabled: number;
}

export interface OrganizationOverviewResponse {
  organization: Organization;
  counts: OrganizationOverviewCounts;
  owner: OrganizationMembership | null;
  module_status: OrganizationModuleStatusCounts;
}

export interface OrganizationUnitTreeNode extends OrganizationUnit {
  children: OrganizationUnitTreeNode[];
}

export interface OrganizationSetupTreeProject {
  id: number;
  organization: number;
  organization_unit: number | null;
  name: string;
  code: string;
  project_number: string;
  location: string;
  status: string;
  status_display: string;
  image_url: string | null;
  is_active: boolean;
}

export interface OrganizationSetupTreeUnit extends OrganizationUnit {
  projects: OrganizationSetupTreeProject[];
  children: OrganizationSetupTreeUnit[];
}

export interface OrganizationSetupTreeResponse {
  organization: Organization;
  projects: OrganizationSetupTreeProject[];
  children: OrganizationSetupTreeUnit[];
}

export interface PartnerOrganizationTreeNode extends PartnerOrganization {
  children: PartnerOrganizationTreeNode[];
}

export interface DepartmentStructureUnitAssignment {
  assignment_id: number;
  unit_id: number;
  unit_name: string;
  is_active: boolean;
}

export interface DepartmentStructureItem extends Department {
  unit_assignments: DepartmentStructureUnitAssignment[];
}

export interface DepartmentStructurePartnerGroup {
  partner_organization_id: number;
  partner_organization_name: string;
  departments: DepartmentStructureItem[];
}

export interface DepartmentStructureResponse {
  internal_departments: DepartmentStructureItem[];
  partner_organizations: DepartmentStructurePartnerGroup[];
}

export interface BulkInviteMemberResult {
  index: number;
  created: boolean;
  membership?: OrganizationMembership;
  errors?: Record<string, unknown>;
}

export interface BulkInviteMembersResponse {
  requested: number;
  created: number;
  failed: number;
  results: BulkInviteMemberResult[];
}

export interface TransferOwnershipResponse {
  detail: string;
  organization: Organization;
  new_owner_membership?: OrganizationMembership;
  previous_owner_membership?: OrganizationMembership | null;
}

export interface ProvisionCoreModulesResponse {
  count: number;
  assignments: OrganizationModule[];
}

export interface AvailableModuleItem extends ProductModule {
  organization_assignment: OrganizationModule | null;
}

export interface OrganizationModuleDetailResponse {
  module: ProductModule;
  organization_assignment: OrganizationModule | null;
}

export interface OrganizationActivityEvent {
  event_id: string;
  actor_id: number | null;
  actor_email: string | null;
  origin_module: string;
  project_id_snapshot: number | null;
  intent: string;
  event_type: string;
  object_id: string | null;
  state_delta: Record<string, unknown>;
  severity: string;
  is_anomaly: boolean;
  correlation_id: string | null;
  occurred_at: string;
}

export type OrganizationActivityResponse =
  | PaginatedResponse<OrganizationActivityEvent>
  | OrganizationActivityEvent[];

export interface MembershipAccessRoleAssignment {
  id: number;
  role: {
    id: number;
    name: string;
    code: string;
    module_code: string | null;
  };
  scope_type: string;
  organization_id: number | null;
  organization_unit_id: number | null;
  partner_organization_id: number | null;
  project_id: number | null;
  valid_from: string | null;
  valid_until: string | null;
  permission_codes: string[];
}

export interface MembershipAccessProjectMembership {
  id: number;
  project_id: number;
  project_name: string;
  project_code: string;
  organization_unit_id: number | null;
  is_active: boolean;
  is_current: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

export interface MembershipAccessSummaryResponse {
  membership: OrganizationMembership;
  primary_unit: OrganizationUnit | null;
  primary_department: Department | null;
  additional_unit_scopes: UserOrganizationUnitScope[];
  role_assignments: MembershipAccessRoleAssignment[];
  project_memberships: MembershipAccessProjectMembership[];
  organization_modules: OrganizationModule[];
  effective_permission_codes: string[];
  owner_full_access: boolean;
}

export interface ValidateInviteResponse {
  valid: boolean;
  invite_id: number;
  organization: {
    id: number;
    name: string;
    code: string;
  };
  membership_id: string;
  membership_type: MembershipType;
  email: string;
  needs_password: boolean;
  expires_at: string | null;
}

export interface AcceptInviteResponse {
  detail: string;
  membership: OrganizationMembership;
}

/** @deprecated Use PaginatedResponse<Organization> */
export type OrganizationsListResponse = PaginatedResponse<Organization>;
