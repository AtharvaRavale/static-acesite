import { Pencil, Plus } from "lucide-react";
import type { OrganizationUnitTreeNode } from "@/features/organizations";
import {
  DetailRow,
  formatDate,
  UNIT_TYPE_META,
} from "@/components/organizations/organizationUi";
import { cn } from "@/lib/utils";

export function OrganizationUnitDetailPanel({
  unit,
  onEdit,
  onAddChild,
  onToggleActive,
  toggling,
}: {
  unit: OrganizationUnitTreeNode;
  onEdit: () => void;
  onAddChild: () => void;
  onToggleActive: () => void;
  toggling?: boolean;
}) {
  const meta = UNIT_TYPE_META[unit.unit_type];
  const Icon = meta.icon;
  const childCount = unit.children?.length ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl",
              meta.tone
            )}
          >
            {unit.image ? (
              <img src={unit.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-foreground">
              {unit.name}
            </p>
            <p className="text-xs text-muted-foreground">{unit.code}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                {unit.unit_type_display || meta.label}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  unit.is_active
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {unit.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <dl>
          <DetailRow label="Parent" value={unit.parent_name || "Organization root"} />
          <DetailRow label="Organization" value={unit.organization_name} />
          <DetailRow
            label="Description"
            value={unit.description?.trim() ? unit.description : "—"}
          />
          <DetailRow label="Child units" value={String(childCount)} />
          <DetailRow label="Created" value={formatDate(unit.created_at)} />
          <DetailRow label="Updated" value={formatDate(unit.updated_at)} />
        </dl>
      </div>

      <div className="space-y-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onAddChild}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add child unit
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium"
        >
          <Pencil className="h-4 w-4" />
          Edit unit
        </button>
        <button
          type="button"
          disabled={toggling}
          onClick={onToggleActive}
          className="flex h-10 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {toggling
            ? "Updating…"
            : unit.is_active
              ? "Deactivate unit"
              : "Reactivate unit"}
        </button>
      </div>
    </div>
  );
}
