import type {
  OrganizationModuleStatus,
  ProductModule,
  ProductModuleClassification,
} from "@/features/platformModules";

export type ProvisioningGroupKey = "core" | "optional" | "platform_only";

export interface ModuleDraftState {
  moduleId: number;
  assignmentId: number | null;
  status: OrganizationModuleStatus | null;
  configuration: Record<string, unknown>;
  dirty: boolean;
}

export interface ProvisioningGroupMeta {
  key: ProvisioningGroupKey;
  title: string;
  badge: string;
  description: string;
}

export const PROVISIONING_GROUPS: ProvisioningGroupMeta[] = [
  {
    key: "core",
    title: "Core Organization Modules",
    badge: "Always enabled",
    description:
      "These modules are required for every organization and cannot be disabled.",
  },
  {
    key: "optional",
    title: "Optional Organization Modules",
    badge: "Configurable",
    description:
      "Enable, set read-only, or disable optional modules based on organization needs.",
  },
  {
    key: "platform_only",
    title: "Platform-only Modules",
    badge: "Not assignable to organizations",
    description:
      "These modules are platform-level only and cannot be assigned to organizations.",
  },
];

export function resolveModuleClassification(
  module: ProductModule
): ProductModuleClassification {
  if (module.classification) {
    return module.classification;
  }
  if (module.availability === "platform" || module.is_platform_only) {
    return "platform_only";
  }
  if (module.is_core || module.is_core_module) {
    return "core";
  }
  return "optional";
}

export function groupModules(modules: ProductModule[]) {
  const groups: Record<ProvisioningGroupKey, ProductModule[]> = {
    core: [],
    optional: [],
    platform_only: [],
  };

  for (const module of modules) {
    groups[resolveModuleClassification(module)].push(module);
  }

  return groups;
}
