import type { ProductModule } from "@/features/platformModules";
import type { OrganizationModuleStatus } from "@/features/platformModules";
import { ModuleGridSkeleton } from "@/components/ui/skeletonPatterns";
import { ProvisioningModuleCard } from "./ProvisioningModuleCard";
import type { ProvisioningGroupMeta } from "./types";

export function ModuleGroupSection({
  group,
  modules,
  getStatus,
  isDirty,
  loading,
  onStatusChange,
  onConfigure,
  onAssignEnabled,
}: {
  group: ProvisioningGroupMeta;
  modules: ProductModule[];
  getStatus: (moduleId: number) => OrganizationModuleStatus | null;
  isDirty: (moduleId: number) => boolean;
  loading?: boolean;
  onStatusChange: (module: ProductModule, status: OrganizationModuleStatus) => void;
  onConfigure: (module: ProductModule) => void;
  onAssignEnabled: (module: ProductModule) => void;
}) {
  if (loading) {
    return <ModuleGridSkeleton count={3} />;
  }

  if (modules.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-base font-semibold text-foreground">
            {group.title}
          </h2>
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.badge}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <ProvisioningModuleCard
            key={module.id}
            module={module}
            status={getStatus(module.id)}
            dirty={isDirty(module.id)}
            onStatusChange={(status) => onStatusChange(module, status)}
            onConfigure={() => onConfigure(module)}
            onAssignEnabled={() => onAssignEnabled(module)}
          />
        ))}
      </div>
    </section>
  );
}
