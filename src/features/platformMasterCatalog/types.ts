export interface CatalogOrganization {
  id: number;
  organization_id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface CatalogOrganizationUnit {
  id: number;
  name: string;
  code: string;
  unit_type: string;
  parent: number | null;
  is_active: boolean;
}

export interface CatalogAvailabilityMapping {
  id: number;
  is_active: boolean;
  target_type: "organization" | "organization_unit";
  organization: CatalogOrganization | null;
  organization_unit: CatalogOrganizationUnit | null;
  metadata: Record<string, unknown>;
}

export interface CatalogProjectUsage {
  project_type_id: number;
  project: number;
  project_name: string;
  project_code: string;
  organization: CatalogOrganization | null;
  organization_unit: Pick<CatalogOrganizationUnit, "id" | "name" | "code"> | null;
  name: string;
  code: string;
  is_active: boolean;
}

export interface PlatformMasterCatalogItem {
  id: number;
  name: string;
  code: string;
  is_global: boolean;
  is_active: boolean;
  owner_organization: CatalogOrganization | null;
  availability_count: number;
  availability_mappings: CatalogAvailabilityMapping[];
  project_usage_count: number;
  project_usage: CatalogProjectUsage[];
}

export interface PlatformMasterCatalogResponse {
  summary: {
    room_types: number;
    flat_types: number;
    room_availability_mappings: number;
    flat_availability_mappings: number;
  };
  room_types: PlatformMasterCatalogItem[];
  flat_types: PlatformMasterCatalogItem[];
}
