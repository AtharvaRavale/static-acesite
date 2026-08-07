import { useEffect, useMemo, useState } from "react";
import type {
  PartnerOrganization,
  PartnerOrganizationWritePayload,
  PartnerType,
} from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import {
  PARTNER_TYPE_LABELS,
  PARTNER_TYPES,
  inputClass,
} from "@/components/organizations/partners/partnerUi";

type FormState = {
  name: string;
  legal_name: string;
  code: string;
  partner_type: PartnerType;
  parent: number | null;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  registration_number: string;
  metadataText: string;
  is_active: boolean;
};

export function PartnerFormPanel({
  mode,
  organizationId,
  partner,
  parentOptions,
  defaultParentId,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  organizationId: number;
  partner?: PartnerOrganization | null;
  parentOptions: PartnerOrganization[];
  defaultParentId?: number | null;
  saving?: boolean;
  error?: unknown;
  onCancel: () => void;
  onSubmit: (payload: PartnerOrganizationWritePayload) => void;
}) {
  const initial = useMemo<FormState>(
    () => ({
      name: partner?.name ?? "",
      legal_name: partner?.legal_name ?? "",
      code: partner?.code ?? "",
      partner_type: partner?.partner_type ?? "contractor",
      parent: partner?.parent ?? defaultParentId ?? null,
      email: partner?.email ?? "",
      phone: partner?.phone ?? "",
      address: partner?.address ?? "",
      tax_id: partner?.tax_id ?? "",
      registration_number: partner?.registration_number ?? "",
      metadataText: JSON.stringify(partner?.metadata ?? {}, null, 2),
      is_active: partner?.is_active ?? true,
    }),
    [partner, defaultParentId]
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

    onSubmit({
      organization: organizationId,
      parent: form.parent,
      name: form.name.trim(),
      legal_name: form.legal_name.trim(),
      code: form.code.trim(),
      partner_type: form.partner_type,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      tax_id: form.tax_id.trim(),
      registration_number: form.registration_number.trim(),
      metadata,
      is_active: form.is_active,
    });
  };

  const filteredParents = parentOptions.filter(
    (option) => mode !== "edit" || option.id !== partner?.id
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-display text-base font-semibold text-foreground">
          {mode === "create"
            ? "Add Partner Organization"
            : "Edit Partner Organization"}
        </p>
        <p className="text-xs text-muted-foreground">
          Directory entity only — does not grant login or module access.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Code" required>
            <input
              className={inputClass}
              value={form.code}
              onChange={(e) => update("code", e.target.value)}
            />
          </Field>
          <Field label="Partner type">
            <select
              className={inputClass}
              value={form.partner_type}
              onChange={(e) =>
                update("partner_type", e.target.value as PartnerType)
              }
            >
              {PARTNER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PARTNER_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Legal name">
          <input
            className={inputClass}
            value={form.legal_name}
            onChange={(e) => update("legal_name", e.target.value)}
          />
        </Field>
        <Field label="Parent partner">
          <select
            className={inputClass}
            value={form.parent ?? ""}
            onChange={(e) =>
              update("parent", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">None (root under organization)</option>
            {filteredParents.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.code})
              </option>
            ))}
          </select>
        </Field>
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
        <Field label="Address">
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tax ID">
            <input
              className={inputClass}
              value={form.tax_id}
              onChange={(e) => update("tax_id", e.target.value)}
            />
          </Field>
          <Field label="Registration No.">
            <input
              className={inputClass}
              value={form.registration_number}
              onChange={(e) => update("registration_number", e.target.value)}
            />
          </Field>
        </div>
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
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          Active partner
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
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create partner"
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
