import { useEffect, useMemo, useState } from "react";
import type {
  Department,
  DepartmentWritePayload,
  PartnerOrganization,
} from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";

type FormState = {
  name: string;
  code: string;
  description: string;
  partner_organization: number | null;
  metadataText: string;
  is_active: boolean;
};

export function DepartmentFormPanel({
  mode,
  organizationId,
  department,
  partners,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  organizationId: number;
  department?: Department | null;
  partners: PartnerOrganization[];
  saving?: boolean;
  error?: unknown;
  onCancel: () => void;
  onSubmit: (
    payload: DepartmentWritePayload,
    imageFile?: File | null,
    removeImage?: boolean
  ) => void;
}) {
  const initial = useMemo<FormState>(
    () => ({
      name: department?.name ?? "",
      code: department?.code ?? "",
      description: department?.description ?? "",
      partner_organization: department?.partner_organization ?? null,
      metadataText: JSON.stringify(department?.metadata ?? {}, null, 2),
      is_active: department?.is_active ?? true,
    }),
    [department]
  );

  const [form, setForm] = useState(initial);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
    setImageFile(null);
    setRemoveImage(false);
    setJsonError(null);
  }, [initial, mode]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
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
        organization: organizationId,
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description,
        partner_organization: form.partner_organization,
        metadata,
        is_active: form.is_active,
      },
      imageFile,
      removeImage
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-display text-base font-semibold text-foreground">
          {mode === "create" ? "Add Department" : "Edit Department"}
        </p>
        <p className="text-xs text-muted-foreground">
          Define a department and optionally link a partner organization.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <ApiErrorBanner error={error} />
        {jsonError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {jsonError}
          </p>
        ) : null}

        <Field label="Name" required>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Code">
          <input
            className={inputClass}
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            placeholder="Optional — backend can generate"
          />
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-[88px] resize-y`}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <Field label="Partner organization">
          <select
            className={inputClass}
            value={form.partner_organization ?? ""}
            onChange={(e) =>
              update(
                "partner_organization",
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">None (internal)</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name} ({partner.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Metadata (JSON)">
          <textarea
            className={`${inputClass} min-h-[100px] resize-y font-mono text-xs`}
            value={form.metadataText}
            onChange={(e) => update("metadataText", e.target.value)}
          />
        </Field>
        <Field label="Image">
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            onChange={(e) => {
              setImageFile(e.target.files?.[0] ?? null);
              setRemoveImage(false);
            }}
          />
        </Field>
        {mode === "edit" && department?.image ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
            />
            Remove current image
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          Active department
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
          disabled={saving || !form.name.trim()}
          onClick={handleSubmit}
          className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create department"
              : "Save changes"}
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
