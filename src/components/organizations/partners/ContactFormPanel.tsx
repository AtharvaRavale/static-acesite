import { useEffect, useMemo, useState } from "react";
import type {
  PartnerOrganization,
  PartnerOrganizationContact,
  PartnerOrganizationContactWritePayload,
} from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { inputClass } from "@/components/organizations/partners/partnerUi";

type FormState = {
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  is_primary: boolean;
  notes: string;
  metadataText: string;
  is_active: boolean;
};

export function ContactFormPanel({
  mode,
  partner,
  contact,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  partner: PartnerOrganization;
  contact?: PartnerOrganizationContact | null;
  saving?: boolean;
  error?: unknown;
  onCancel: () => void;
  onSubmit: (payload: PartnerOrganizationContactWritePayload) => void;
}) {
  const initial = useMemo<FormState>(
    () => ({
      name: contact?.name ?? "",
      designation: contact?.designation ?? "",
      department: contact?.department ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      is_primary: contact?.is_primary ?? false,
      notes: contact?.notes ?? "",
      metadataText: JSON.stringify(contact?.metadata ?? {}, null, 2),
      is_active: contact?.is_active ?? true,
    }),
    [contact]
  );

  const [form, setForm] = useState(initial);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
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

    const payload: PartnerOrganizationContactWritePayload = {
      name: form.name.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      is_primary: form.is_primary,
      notes: form.notes.trim(),
      metadata,
      is_active: form.is_active,
    };

    if (mode === "create") {
      payload.partner_organization = partner.id;
    }

    onSubmit(payload);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-display text-base font-semibold text-foreground">
          {mode === "create" ? "Add Contact" : "Edit Contact"}
        </p>
        <p className="text-xs text-muted-foreground">
          Contact for <strong>{partner.name}</strong>
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <ApiErrorBanner error={error} />
        {jsonError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {jsonError}
          </p>
        ) : null}

        <Field label="Partner organization">
          <input className={inputClass} value={partner.name} disabled />
        </Field>
        <Field label="Name" required>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Designation">
            <input
              className={inputClass}
              value={form.designation}
              onChange={(e) => update("designation", e.target.value)}
            />
          </Field>
          <Field label="Department">
            <input
              className={inputClass}
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              placeholder="Text field, not a FK"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </Field>
        <Field label="Metadata (JSON)">
          <textarea
            className={`${inputClass} min-h-[90px] resize-y font-mono text-xs`}
            value={form.metadataText}
            onChange={(e) => update("metadataText", e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => update("is_primary", e.target.checked)}
          />
          Primary contact
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          Active contact
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
              ? "Create contact"
              : "Save changes"}
        </button>
      </div>
    </div>
  );
}

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
