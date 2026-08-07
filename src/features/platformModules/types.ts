/** Current product-modules API contract (Backend/core/platform_modules). */

export type ProductModuleClassification = "platform_only" | "core" | "optional";
export type ProductModuleAvailability = "platform" | "organization" | "both";
export type ProductModuleMaturity = "alpha" | "beta" | "ga" | "deprecated" | "retired";
export type LifecyclePhase =
  | "pre_construction"
  | "during_construction"
  | "post_construction";
export type ModuleDependencyType = "required" | "optional" | "conflict";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductModule {
  id: number;
  code: string;
  name: string;
  description: string;
  version: string;
  maturity: ProductModuleMaturity;
  maturity_display: string;
  availability: ProductModuleAvailability;
  availability_display: string;
  is_core: boolean;
  classification: ProductModuleClassification;
  is_core_module: boolean;
  is_optional_module: boolean;
  is_platform_only: boolean;
  image: string | null;
  image_url: string | null;
  banner_image: string | null;
  banner_image_url: string | null;
  icon: string;
  theme_color: string;
  frontend_route: string;
  menu_order: number;
  settings_schema: Record<string, unknown>;
  is_lifecycle_specific: boolean;
  published_at: string | null;
  published_by: number | null;
  published_by_email: string | null;
  is_published: boolean;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface ProductModuleCatalogItem extends ProductModule {
  dependency_count: number;
  lifecycle_phase_count: number;
}

export interface ProductModuleCatalogSummary {
  all: number;
  platform_only: number;
  core: number;
  optional: number;
  published: number;
  unpublished: number;
}

export interface ProductModuleCatalogResponse {
  summary: ProductModuleCatalogSummary;
  maturity_counts: Partial<Record<ProductModuleMaturity, number>>;
  recent_activity: ProductModule[];
  supported_classifications: ProductModuleClassification[];
  supported_maturities: ProductModuleMaturity[];
  count: number;
  next?: string | null;
  previous?: string | null;
  results: ProductModuleCatalogItem[];
}

export interface ProductModuleListParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  classification?: ProductModuleClassification;
  is_published?: boolean;
  lifecycle_phase?: LifecyclePhase;
  dependency?: number;
  availability?: ProductModuleAvailability;
  maturity?: ProductModuleMaturity;
  is_core?: boolean;
  is_active?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export type ProductModuleWritePayload = Partial<{
  code: string;
  name: string;
  description: string;
  version: string;
  maturity: ProductModuleMaturity;
  availability: ProductModuleAvailability;
  is_core: boolean;
  image: File | string | null;
  banner_image: File | string | null;
  icon: string;
  theme_color: string;
  frontend_route: string;
  menu_order: number;
  settings_schema: Record<string, unknown>;
  is_lifecycle_specific: boolean;
  is_active: boolean;
}>;

export interface PublishModulePayload {
  version?: string;
  maturity?: ProductModuleMaturity;
  changelog?: string;
}

export interface ModuleCodeAvailabilityResponse {
  code: string;
  normalized_code: string;
  available: boolean;
}

export interface ModuleValidationIssue {
  field: string | null;
  message: string;
}

export interface ModuleValidationReport {
  module_id: number;
  module_code: string;
  version: string;
  is_valid: boolean;
  errors: ModuleValidationIssue[];
  warnings: ModuleValidationIssue[];
}

export interface PublishModuleResponse {
  module: ProductModule;
  published_version: ProductModuleVersion;
  validation: ModuleValidationReport;
}

export interface ModuleSummary {
  id: number;
  code: string;
  name: string;
  version: string;
  maturity: ProductModuleMaturity;
  maturity_display: string;
  availability: ProductModuleAvailability;
  classification: ProductModuleClassification;
  is_core: boolean;
  is_active: boolean;
  icon: string;
  theme_color: string;
  frontend_route: string;
}

export interface DependencyGraphEdge {
  id: number;
  source: number;
  target: number;
  dependency_type: ModuleDependencyType;
  dependency_type_display: string;
  version_constraint: string;
}

export interface DependencyGraphResponse {
  root_module_id: number;
  node_count: number;
  edge_count: number;
  nodes: ModuleSummary[];
  edges: DependencyGraphEdge[];
}

export interface DependencyGraphParams {
  include_required?: boolean;
  include_optional?: boolean;
  include_conflicts?: boolean;
  include_reverse?: boolean;
  transitive?: boolean;
  max_depth?: number;
}

export interface ImpactAnalysisResponse {
  module: ModuleSummary;
  direct_dependents: ModuleSummary[];
  transitive_dependents: ModuleSummary[];
  affected_organizations: Array<{
    organization_id: number;
    organization__code: string;
    organization__name: string;
    affected_module_count: number;
  }>;
  conflicts: Array<{
    id: number;
    source: ModuleSummary;
    target: ModuleSummary;
    version_constraint: string;
  }>;
  counts: {
    direct_dependents: number;
    transitive_dependents: number;
    affected_organizations: number;
    conflicts: number;
  };
}

export interface ImpactAnalysisParams {
  include_transitive?: boolean;
  include_inactive?: boolean;
  dependency_type?: string;
  organization?: number;
}

export interface ImportModuleResponse {
  module: ProductModule;
  created: {
    lifecycle_phases: number;
    dependencies: number;
  };
}

export interface ProductModuleVersion {
  id: number;
  module: number;
  module_code: string;
  module_name: string;
  version: string;
  maturity: ProductModuleMaturity;
  maturity_display: string;
  changelog: string;
  manifest: Record<string, unknown>;
  checksum: string;
  published_by: number | null;
  published_by_email: string | null;
  published_at: string;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface ProductModuleVersionListParams {
  page?: number;
  page_size?: number;
  module?: number;
  module_code?: string;
  version?: string;
  maturity?: ProductModuleMaturity;
  published_from?: string;
  published_to?: string;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ProductModuleLifecyclePhase {
  id: number;
  module: number;
  module_code: string;
  module_name: string;
  phase: LifecyclePhase;
  phase_display: string;
  sequence: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface LifecyclePhaseListParams {
  page?: number;
  page_size?: number;
  module?: number;
  module_code?: string;
  phase?: LifecyclePhase;
  is_active?: boolean;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export type LifecyclePhaseWritePayload = Partial<{
  module: number;
  phase: LifecyclePhase;
  sequence: number;
  is_active: boolean;
}>;

export interface LifecyclePhaseReorderItem {
  id?: number;
  module?: number;
  module_id?: number;
  phase?: LifecyclePhase | string;
  sequence: number;
}

export interface LifecyclePhaseReorderPayload {
  items: LifecyclePhaseReorderItem[];
}

export interface ModuleDependency {
  id: number;
  module: number;
  module_code: string;
  module_name: string;
  required_module: number;
  required_module_code: string;
  required_module_name: string;
  dependency_type: ModuleDependencyType;
  dependency_type_display: string;
  version_constraint: string;
  is_required: boolean;
  is_optional: boolean;
  is_conflict: boolean;
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

export interface ModuleDependencyListParams {
  page?: number;
  page_size?: number;
  module?: number;
  required_module?: number;
  module_code?: string;
  required_module_code?: string;
  dependency_type?: ModuleDependencyType;
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

export type ModuleDependencyWritePayload = Partial<{
  module: number;
  required_module: number;
  dependency_type: ModuleDependencyType;
  version_constraint: string;
}>;

export type OrganizationModuleStatus = "enabled" | "read_only" | "disabled";

export interface OrganizationModuleAutoInstalledDependency {
  assignment_id: number;
  module_id: number;
  module_code: string;
  created: boolean;
  status_changed: boolean;
}

export interface OrganizationModule {
  id: number;
  organization: number;
  organization_name: string;
  organization_code: string;
  module: number;
  module_code: string;
  module_name: string;
  module_classification: ProductModuleClassification;
  module_version: string;
  module_maturity: ProductModuleMaturity;
  module_maturity_display: string;
  status: OrganizationModuleStatus;
  status_display: string;
  configuration: Record<string, unknown>;
  enabled_by: number | null;
  enabled_by_email: string | null;
  enabled_at: string | null;
  disabled_by: number | null;
  disabled_by_email: string | null;
  disabled_at: string | null;
  is_enabled: boolean;
  is_available: boolean;
  is_locked: boolean;
  can_enable: boolean;
  can_set_read_only: boolean;
  can_disable: boolean;
  auto_installed_dependencies?: OrganizationModuleAutoInstalledDependency[];
  created_by: number | null;
  created_at: string;
  last_updated_by: number | null;
  updated_at: string;
}

/** Superadmin raw assignment resource: POST/PATCH /organization-modules/ */
export interface OrganizationModuleWritePayload {
  organization: number;
  module: number;
  status?: OrganizationModuleStatus;
  configuration?: Record<string, unknown>;
}

export type OrganizationModuleUpdatePayload = Partial<{
  organization: number;
  module: number;
  status: OrganizationModuleStatus;
  configuration: Record<string, unknown>;
}>;

export interface OrganizationModuleListParams {
  page?: number;
  page_size?: number;
  search?: string;
  organization?: number;
  module?: number;
  status?: OrganizationModuleStatus;
  classification?: ProductModuleClassification;
  availability?: ProductModuleAvailability;
  is_core?: boolean;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}
