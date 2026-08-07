import { Box, GitBranch, Layers, Link2 } from "lucide-react";
import type { ProductModuleCatalogItem } from "@/features/platformModules";
import {
  ActivePublishedBadges,
  ClassificationBadge,
  MaturityBadge,
} from "@/components/modules/shared/moduleBadges";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  module: ProductModuleCatalogItem;
  onClick?: () => void;
  selected?: boolean;
}

export function ModuleCard({ module, onClick, selected }: ModuleCardProps) {
  const accent = module.theme_color || undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/35 hover:shadow-sm",
        selected ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-primary"
          style={{
            backgroundColor: accent ? `${accent}22` : undefined,
            color: accent,
          }}
        >
          {module.image_url ? (
            <img
              src={module.image_url}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Box className="h-5 w-5" />
            </div>
          )}
        </div>
        <ActivePublishedBadges
          isActive={module.is_active}
          isPublished={module.is_published}
        />
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <h3 className="truncate font-display text-[13.5px] font-semibold text-foreground">
          {module.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground">{module.code}</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="font-mono text-[10px] text-muted-foreground">v{module.version}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <MaturityBadge maturity={module.maturity} label={module.maturity_display} />
          <ClassificationBadge classification={module.classification} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1" title="Dependencies">
          <GitBranch className="h-3 w-3" />
          {module.dependency_count}
        </span>
        <span className="inline-flex items-center gap-1" title="Lifecycle phases">
          <Layers className="h-3 w-3" />
          {module.lifecycle_phase_count}
        </span>
        {module.frontend_route ? (
          <span className="inline-flex min-w-0 items-center gap-1 truncate" title={module.frontend_route}>
            <Link2 className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{module.frontend_route}</span>
          </span>
        ) : null}
      </div>
    </button>
  );
}
