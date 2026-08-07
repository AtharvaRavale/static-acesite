import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Package, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useOrganizationModules } from "@/features/organizations";
import type { OrganizationModule } from "@/features/platformModules";
import { getWorkspaceModuleRoute } from "@/features/workspace/moduleRoutes";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { ModuleGridSkeleton } from "@/components/ui/skeletonPatterns";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "enabled" | "read_only" | "disabled";

export function MyModulesPage() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [unavailable, setUnavailable] = useState<OrganizationModule | null>(
    null
  );

  const orgId = organization?.id ?? null;
  const modulesQuery = useOrganizationModules(orgId);

  const modules = modulesQuery.data ?? [];

  const filtered = useMemo(() => {
    if (filter === "all") return modules;
    return modules.filter((row) => row.status === filter);
  }, [modules, filter]);

  const handleOpen = (row: OrganizationModule) => {
    if (row.status === "disabled") return;
    const route = getWorkspaceModuleRoute(row.module_code);
    if (route) {
      navigate(route);
      return;
    }
    setUnavailable(row);
  };

  if (!organization) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Organization context is missing. Sign in with your membership ID.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="font-logo text-[1.65rem] font-normal tracking-tight text-foreground">
          My Modules
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modules assigned to {organization.name}. Open a workspace when
          available.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
        {(
          [
            ["all", "All"],
            ["enabled", "Enabled"],
            ["read_only", "Read-only"],
            ["disabled", "Disabled"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={cn(
              "h-9 rounded-lg px-3 text-sm font-medium",
              filter === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ApiErrorBanner error={modulesQuery.error} />

      {modulesQuery.isLoading && !modulesQuery.data ? (
        <ModuleGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No modules are assigned to your workspace yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <ModuleCard key={row.id} module={row} onOpen={() => handleOpen(row)} />
          ))}
        </div>
      )}

      {unavailable ? (
        <UnavailableDrawer
          module={unavailable}
          onClose={() => setUnavailable(null)}
        />
      ) : null}
    </div>
  );
}

function ModuleCard({
  module,
  onOpen,
}: {
  module: OrganizationModule;
  onOpen: () => void;
}) {
  const disabled = module.status === "disabled";
  const readOnly = module.status === "read_only";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className={cn(
        "rounded-2xl border bg-card p-4 text-left shadow-sm transition",
        disabled
          ? "cursor-not-allowed border-border opacity-55"
          : "border-border hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {disabled || readOnly ? (
            <Lock className="h-5 w-5" />
          ) : (
            <Package className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-foreground">
            {module.module_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {module.module_code}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge status={module.status} label={module.status_display} />
            {module.module_classification ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                {module.module_classification.replaceAll("_", " ")}
              </span>
            ) : null}
            {readOnly ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                Read-only
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: OrganizationModule["status"];
  label?: string;
}) {
  const tone =
    status === "enabled"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "read_only"
        ? "bg-amber-500/10 text-amber-700"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
        tone
      )}
    >
      {label || status}
    </span>
  );
}

function UnavailableDrawer({
  module,
  onClose,
}: {
  module: OrganizationModule;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {module.module_name}
            </p>
            <p className="text-xs text-muted-foreground">{module.module_code}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 px-5 py-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            Module workspace is not available in this frontend yet.
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{module.status_display || module.status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Classification</dt>
              <dd className="font-medium">
                {module.module_classification?.replaceAll("_", " ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-medium">{module.module_version || "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
