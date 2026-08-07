import { Box } from "lucide-react";
import type { ProductModule } from "@/features/platformModules";
import {
  ActivePublishedBadges,
  ClassificationBadge,
  MaturityBadge,
} from "@/components/modules/shared/moduleBadges";
import { cn } from "@/lib/utils";

export function OverviewTab({ module }: { module: ProductModule }) {
  const schemaPreview =
    module.settings_schema && Object.keys(module.settings_schema).length > 0
      ? JSON.stringify(module.settings_schema, null, 2)
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              style={
                module.theme_color
                  ? { backgroundColor: `${module.theme_color}22`, color: module.theme_color }
                  : undefined
              }
            >
              {module.image_url ? (
                <img
                  src={module.image_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <Box className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0 space-y-1.5">
              <h2 className="text-sm font-semibold text-foreground">Identity</h2>
              <p className="text-sm text-foreground">{module.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{module.code}</p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <MaturityBadge maturity={module.maturity} label={module.maturity_display} />
                <ClassificationBadge classification={module.classification} />
                <ActivePublishedBadges
                  isActive={module.is_active}
                  isPublished={module.is_published}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {module.description || "No description provided."}
            </p>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <MetaField label="Frontend route" value={module.frontend_route || "—"} mono />
            <MetaField label="Icon" value={module.icon || "—"} mono />
            <MetaField label="Theme color" value={module.theme_color || "—"} mono />
            <MetaField label="Menu order" value={String(module.menu_order)} mono />
            <MetaField label="Availability" value={module.availability_display} />
            <MetaField label="Version" value={module.version} mono />
          </dl>
        </section>

        <aside className="space-y-3">
          <StatusCard label="Published" on={module.is_published} />
          <StatusCard label="Active" on={module.is_active} />
          <StatusCard label="Core" on={module.is_core || module.is_core_module} />
          <StatusCard label="Lifecycle specific" on={module.is_lifecycle_specific} />
        </aside>
      </div>

      {(module.banner_image_url || module.image_url) && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Imagery</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {module.banner_image_url && (
              <figure className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Banner
                </p>
                <img
                  src={module.banner_image_url}
                  alt=""
                  className="h-32 w-full rounded-lg border border-border object-cover"
                />
              </figure>
            )}
            {module.image_url && (
              <figure className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Image
                </p>
                <img
                  src={module.image_url}
                  alt=""
                  className="h-32 w-full rounded-lg border border-border object-cover"
                />
              </figure>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Settings schema</h2>
        {schemaPreview ? (
          <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed text-foreground">
            {schemaPreview}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">No settings schema defined.</p>
        )}
      </section>
    </div>
  );
}

function MetaField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-sm text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function StatusCard({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold",
          on ? "text-primary" : "text-muted-foreground"
        )}
      >
        {on ? "Yes" : "No"}
      </p>
    </div>
  );
}
