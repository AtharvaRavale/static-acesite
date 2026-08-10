import type { ExecutionLevel, ExecutionScheme } from "@/features/execution";
import type { Organization, OrganizationUnit } from "@/features/organizations";
import type {
  Project,
  ProjectModuleAccess,
  ProjectStructureLevel,
} from "@/features/projects";

export type SetupBranch = "new" | "existing";
export type SetupStepId =
  | "organization"
  | "modules"
  | "unit"
  | "structure"
  | "availability"
  | "execution"
  | "access"
  | "complete";

export interface SetupStepDefinition {
  id: SetupStepId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface PlatformSetupState {
  branch: SetupBranch | null;
  organization: Organization | null;
  organizationUnit: OrganizationUnit | null;
  project: Project | null;
  structureLevels: ProjectStructureLevel[];
  executionScheme: ExecutionScheme | null;
  executionLevels: ExecutionLevel[];
  projectModuleAccesses: ProjectModuleAccess[];
}
