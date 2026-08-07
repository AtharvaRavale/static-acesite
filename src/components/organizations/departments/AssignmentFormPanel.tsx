import { useEffect, useMemo, useState } from "react";
import type {
  Department,
  DepartmentUnitAssignmentWritePayload,
  OrganizationUnit,
} from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { UNIT_TYPE_META } from "@/components/organizations/organizationUi";

type FormState = {
  organization_unit: number | "";
  metadataText: string;
  is_active: boolean;
};

export function AssignmentFormPanel({
  department,
  units,
  assignedUnitIds,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  department: Department;
  units: OrganizationUnit[];
  assignedUnitIds: Set<number>;
  saving?: boolean;
  error?: unknown;
  onCancel: () => void;
  onSubmit: (
    payload: DepartmentUnitAssignmentWritePayload,
    imageFile?: File | null
  ) => void;
}) {
  const availableUnits = useMemo(
    () =>
      units.filter(
        (unit) => unit.is_active && !assignedUnitIds.has(unit.id)
      ),
    [units, assignedUnitIds]
  );

  const [form, setForm] = useState<FormState>({
    organization_unit: "",
    metadataText: "{}",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      organization_unit: "",
      metadataText: "{}",
      is_active: true,
    });
    setImageFile(null);
    setJsonError(null);
  }, [department.id]);

  const handleSubmit = () => {
    if (!form.organization_unit) return;

    let metadata: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(form.metadataText || "{}");
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("Metadata must be a JSON object.");
        return;
      }
      metadata = parsed as Record<string, unknown>;
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON in metadata.");
      return;
    }

    onSubmit(
      {
        department: department.id,
        organization_unit: Number(form.organization_unit),
        metadata,
        is_active: form.is_active,
      },
      imageFile
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-display text-base font-semibold text-foreground">
          Assign to Unit
        </p>
        <p className="text-xs text-muted-foreground">
          Map <strong>{department.name}</strong> to an organization unit.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <ApiErrorBanner error={error} />
        {jsonError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {jsonError}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Department
          </span>
          <input
            className={inputClass}
            value={department.name}
            disabled
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Organization unit *
          </span>
          <select
            className={inputClass}
            value={form.organization_unit}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                organization_unit: e.target.value
                  ? Number(e.target.value)
                  : "",
              }))
            }
          >
            <option value="">Select a unit</option>
            {availableUnits.map((unit) => {
              const meta = UNIT_TYPE_META[unit.unit_type];
              return (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code}) · {unit.unit_type_display || meta.label}
                </option>
              );
            })}
          </select>
          {availableUnits.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No available active units left to assign.
            </p>
          ) : null}
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Metadata (JSON)
          </span>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y font-mono text-xs`}
            value={form.metadataText}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                metadataText: e.target.value,
              }))
            }
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Image</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                is_active: e.target.checked,
              }))
            }
          />
          Active assignment
        </label>
      </div>

      <div className="flex gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 rounded-xl border border-border text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !form.organization_unit}
          onClick={handleSubmit}
          className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Assigning…" : "Create assignment"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-70";
