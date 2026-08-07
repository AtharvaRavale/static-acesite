import {
  Building2,
  ChevronDown,
  ChevronRight,
  Network,
} from "lucide-react";
import type { KeyboardEvent } from "react";

import type { LayoutNode } from "@/components/organizations/OrganizationHierarchyCanvas";
import type {
  Organization,
  OrganizationUnitTreeNode,
} from "@/features/organizations";
import { UNIT_TYPE_META } from "@/components/organizations/organizationUi";
import { cn } from "@/lib/utils";

function activateWithKeyboard(
  event: KeyboardEvent<HTMLDivElement>,
  onClick: () => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick();
  }
}

export function OrganizationNodeCard({
  node,
  selected,
  collapsed,
  onToggleCollapsed,
  onClick,
}: {
  node: LayoutNode;
  selected?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onClick: () => void;
}) {
  if (node.kind === "org") {
    const org = node.data as Organization;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => activateWithKeyboard(event, onClick)}
        className="group relative flex h-full w-full flex-col items-center justify-center text-center outline-none"
      >
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-[84px] h-[154px] w-[154px] -translate-x-1/2 -translate-y-1/2 rounded-full border transition duration-300",
            selected
              ? "border-primary/35 bg-primary/[0.045] shadow-[0_0_55px_hsl(var(--primary)/0.20)]"
              : "border-primary/15 bg-primary/[0.02]"
          )}
        />
        <div className="pointer-events-none absolute left-1/2 top-[84px] h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />

        <div
          className={cn(
            "relative z-10 flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-full border-[6px] border-white/90 text-white shadow-[0_20px_45px_-18px_rgba(37,99,235,0.75)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03]",
            selected && "ring-4 ring-primary/20"
          )}
          style={{
            background:
              org.brand_color ||
              "radial-gradient(circle at 35% 28%, #8b5cf6 0%, #4f46e5 45%, #2510a5 100%)",
          }}
        >
          {org.logo ? (
            <img src={org.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-9 w-9" />
          )}
        </div>

        <div className="relative z-10 mt-3 max-w-[230px]">
          <p className="line-clamp-2 text-[15px] font-bold leading-5 text-foreground">
            {org.name}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Organization
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {org.status_display || org.status}
          </span>
        </div>

        {node.childCount > 0 && onToggleCollapsed ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapsed();
            }}
            className="nodrag nopan absolute right-2 top-2 z-20 flex h-7 items-center gap-1 rounded-full border border-border bg-card/95 px-2 text-[10px] font-semibold text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-primary"
            title={collapsed ? "Show child units" : "Hide child units"}
          >
            <Network className="h-3 w-3" />
            {node.childCount}
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : null}
      </div>
    );
  }

  const unit = node.data as OrganizationUnitTreeNode;
  const meta = UNIT_TYPE_META[unit.unit_type] ?? {
    icon: Building2,
    label: unit.unit_type_display || "Organization Unit",
    tone: "bg-primary/10 text-primary",
    ring: "ring-primary/15",
  };
  const Icon = meta.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => activateWithKeyboard(event, onClick)}
      className={cn(
        "group relative flex h-full w-full flex-col items-center justify-center rounded-2xl text-center outline-none transition duration-200",
        selected && "bg-primary/[0.025]"
      )}
    >
      <div
        className={cn(
          "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-[0_14px_30px_-17px_rgba(15,23,42,0.65)] transition duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 dark:border-slate-900",
          meta.tone,
          selected && cn("ring-4", meta.ring)
        )}
      >
        {unit.image ? (
          <img src={unit.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      <div className="mt-2 max-w-[174px]">
        <p className="line-clamp-2 text-xs font-bold leading-4 text-foreground">
          {unit.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">
          {unit.unit_type_display || meta.label}
        </p>
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        {!unit.is_active ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
            Inactive
          </span>
        ) : null}

        {node.childCount > 0 && onToggleCollapsed ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapsed();
            }}
            className="nodrag nopan inline-flex h-5 items-center gap-1 rounded-full border border-border bg-card px-1.5 text-[9px] font-semibold text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-primary"
            title={collapsed ? "Show child units" : "Hide child units"}
          >
            {node.childCount}
            {collapsed ? (
              <ChevronRight className="h-2.5 w-2.5" />
            ) : (
              <ChevronDown className="h-2.5 w-2.5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}