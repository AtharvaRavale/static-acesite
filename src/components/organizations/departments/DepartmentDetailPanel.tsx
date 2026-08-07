import { Link2, Pencil, Plus, Power } from "lucide-react";
import type {
  Department,
  DepartmentUnitAssignment,
} from "@/features/organizations";
import {
  DetailRow,
  formatDate,
} from "@/components/organizations/organizationUi";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function DepartmentDetailPanel({
  department,
  assignments,
  selectedAssignment,
  onEdit,
  onAssign,
  onRemoveAssignment,
  onToggleActive,
  toggling,
  removingAssignment,
}: {
  department: Department;
  assignments: DepartmentUnitAssignment[];
  selectedAssignment: DepartmentUnitAssignment | null;
  onEdit: () => void;
  onAssign: () => void;
  onRemoveAssignment: () => void;
  onToggleActive: () => void;
  toggling?: boolean;
  removingAssignment?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/5">
            {department.image ? (
              <img
                src={department.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-foreground">
              {department.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {department.code || "No code"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  department.is_active
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {department.is_active ? "Active" : "Inactive"}
              </span>
              {department.partner_organization_name ? (
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-700">
                  Partner
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <dl>
          <DetailRow
            label="Description"
            value={department.description?.trim() || "—"}
          />
          <DetailRow
            label="Partner org"
            value={department.partner_organization_name || "Internal"}
          />
          <DetailRow
            label="Partner type"
            value={department.partner_type || "—"}
          />
          <DetailRow label="Assigned units" value={String(assignments.length)} />
          <DetailRow label="Created" value={formatDate(department.created_at)} />
          <DetailRow label="Updated" value={formatDate(department.updated_at)} />
        </dl>

        {Object.keys(department.metadata ?? {}).length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Metadata
            </p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-muted/20 p-3 text-[11px] text-foreground">
              {JSON.stringify(department.metadata, null, 2)}
            </pre>
          </div>
        ) : null}

        {selectedAssignment ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Selected assignment
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {selectedAssignment.organization_unit_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedAssignment.organization_unit_code} ·{" "}
              {selectedAssignment.organization_unit_type}
            </p>
            <button
              type="button"
              disabled={removingAssignment}
              onClick={onRemoveAssignment}
              className="mt-3 h-9 w-full rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
            >
              {removingAssignment ? "Removing…" : "Remove assignment"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onAssign}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Assign to Unit
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium"
        >
          <Pencil className="h-4 w-4" />
          Edit Department
        </button>
        <button
          type="button"
          disabled={toggling}
          onClick={onToggleActive}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Power className="h-4 w-4" />
          {toggling
            ? "Updating…"
            : department.is_active
              ? "Deactivate"
              : "Reactivate"}
        </button>
        <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
          <Link2 className="h-3 w-3" />
          {assignments.length} mapped unit{assignments.length === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}
