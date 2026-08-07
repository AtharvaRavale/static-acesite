import { Lock, Settings2 } from "lucide-react";
import type { ProductModule } from "@/features/platformModules";
import type { OrganizationModuleStatus } from "@/features/platformModules";
import { ModuleStatusSegment } from "./ModuleStatusSegment";
import { resolveModuleClassification } from "./types";
import { cn } from "@/lib/utils";

export function ProvisioningModuleCard({
  module,
  status,
  dirty,
  onStatusChange,
  onConfigure,
  onAssignEnabled,
}: {
  module: ProductModule;
  status: OrganizationModuleStatus | null;
  dirty?: boolean;
  onStatusChange?: (status: OrganizationModuleStatus) => void;
  onConfigure?: () => void;
  onAssignEnabled?: () => void;
}) {
  const classification = resolveModuleClassification(module);
  const isPlatformOnly = classification === "platform_only";
  const isCore = classification === "core";
  const assigned = status != null;

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-shadow",
        dirty && "border-primary/40 ring-1 ring-primary/15",
        isPlatformOnly
          ? "border-border/70 opacity-75"
          : "border-border hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: module.theme_color || "#2563EB" }}
        >
          {(module.icon || module.name.slice(0, 1)).slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-medium text-foreground">{module.name}</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              {classification.replace("_", " ")}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {module.code} · {module.maturity_display}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground">
        {module.description || "No description provided."}
      </p>

      <div className="mt-4 border-t border-border pt-3">
        {isPlatformOnly ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Not assignable
          </p>
        ) : isCore ? (
          <div className="space-y-2">
            {assigned && status === "enabled" ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <Lock className="h-3.5 w-3.5" />
                Always enabled
              </p>
            ) : (
              <button
                type="button"
                onClick={onAssignEnabled}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Assign as enabled
              </button>
            )}
          </div>
        ) : assigned ? (
          <div className="space-y-2">
            <ModuleStatusSegment
              value={status}
              onChange={(next) => onStatusChange?.(next)}
            />
            {onConfigure && (
              <button
                type="button"
                onClick={onConfigure}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Configuration
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onStatusChange?.("enabled")}
            className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            Assign module
          </button>
        )}
      </div>
    </article>
  );
}
