import { useEffect, useMemo, useState } from "react";
import type {
  OrganizationUnitTreeNode,
  OrganizationUnitWritePayload,
  UnitType,
} from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { UNIT_TYPE_META } from "@/components/organizations/organizationUi";

const UNIT_TYPES = Object.keys(UNIT_TYPE_META) as UnitType[];

type FormState = {
  name: string;
  code: string;
  unit_type: UnitType;
  description: string;
  parent: number | null;
  is_active: boolean;
};

export function OrganizationUnitFormPanel({
  mode,
  organizationId,
  unit,
  parentOptions,
  defaultParentId,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  organizationId: number;
  unit?: OrganizationUnitTreeNode | null;
  parentOptions: OrganizationUnitTreeNode[];
  defaultParentId?: number | null;
  saving?: boolean;
  error?: unknown;
  onCancel: () => void;
  onSubmit: (payload: OrganizationUnitWritePayload, imageFile?: File | null) => void;
}) {
  const initial = useMemo<FormState>(
    () => ({
      name: unit?.name ?? "",
      code: unit?.code ?? "",
      unit_type: unit?.unit_type ?? "business_unit",
      description: unit?.description ?? "",
      parent: unit?.parent ?? defaultParentId ?? null,
      is_active: unit?.is_active ?? true,
    }),
    [unit, defaultParentId]
  );

  const [form, setForm] = useState<FormState>(initial);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    setForm(initial);
    setImageFile(null);
  }, [initial, mode]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit(
      {
        organization: organizationId,
        name: form.name.trim(),
        code: form.code.trim(),
        unit_type: form.unit_type,
        description: form.description,
        parent: form.parent,
        is_active: form.is_active,
      },
      imageFile
    );
  };

  const filteredParents = parentOptions.filter(
    (option) => mode !== "edit" || option.id !== unit?.id
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-display text-base font-semibold text-foreground">
          {mode === "create" ? "Add organization unit" : "Edit organization unit"}
        </p>
        <p className="text-xs text-muted-foreground">
          {mode === "create"
            ? "Create a child unit under the selected node."
            : "Update unit details and hierarchy placement."}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <ApiErrorBanner error={error} />

        <Field label="Name" required>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Code" required>
          <input
            className={inputClass}
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
          />
        </Field>
        <Field label="Unit type">
          <select
            className={inputClass}
            value={form.unit_type}
            onChange={(e) => update("unit_type", e.target.value as UnitType)}
          >
            {UNIT_TYPES.map((type) => (
              <option key={type} value={type}>
                {UNIT_TYPE_META[type].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Parent">
          <select
            className={inputClass}
            value={form.parent ?? ""}
            onChange={(e) =>
              update("parent", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">Organization root</option>
            {filteredParents.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-[88px] resize-y`}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <Field label="Image">
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          Active unit
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
          disabled={saving || !form.name.trim() || !form.code.trim()}
          onClick={handleSubmit}
          className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : mode === "create" ? "Create unit" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
