import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  useCreateOrganization,
  useUploadOrganizationLogo,
  type OrganizationFlow,
  type OrganizationStatus,
  type OrganizationWritePayload,
} from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { getApiErrorMessage } from "@/lib/api";

const STATUS_OPTIONS: OrganizationStatus[] = [
  "trial",
  "active",
  "suspended",
  "closed",
];

const FLOW_OPTIONS: OrganizationFlow[] = ["self", "partner_company", "both"];

const EMPTY_FORM = {
  name: "",
  code: "",
  legal_name: "",
  status: "trial" as OrganizationStatus,
  flow: "self" as OrganizationFlow,
  email: "",
  phone: "",
  address: "",
  timezone: "UTC",
  brand_color: "#2F3BFF",
  owner_first_name: "",
  owner_last_name: "",
};

export function OrganizationCreateDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<unknown>(null);

  const createOrg = useCreateOrganization();
  const uploadLogo = useUploadOrganizationLogo();

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setLogoFile(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const payload: OrganizationWritePayload = {
        ...form,
        settings: {},
      };
      const created = await createOrg.mutateAsync(payload);
      if (logoFile) {
        await uploadLogo.mutateAsync({ id: created.id, logo: logoFile });
      }
      onCreated(created.id);
      onClose();
    } catch (submitError) {
      setError(submitError);
    }
  };

  const saving = createOrg.isPending || uploadLogo.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-label="Close create organization"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              New organization
            </p>
            <p className="text-xs text-muted-foreground">
              Create a customer workspace and assign an owner.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <ApiErrorBanner error={error} fallback="Failed to create organization." />

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
            <Field label="Legal name">
              <input
                className={inputClass}
                value={form.legal_name}
                onChange={(e) => update("legal_name", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Flow">
              <select
                className={inputClass}
                value={form.flow}
                onChange={(e) => update("flow", e.target.value)}
              >
                {FLOW_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
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
          <Field label="Address">
            <textarea
              className={`${inputClass} min-h-[72px] resize-y`}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timezone">
              <input
                className={inputClass}
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              />
            </Field>
            <Field label="Brand color">
              <input
                type="color"
                className="h-10 w-full rounded-lg border border-border bg-background px-1"
                value={form.brand_color}
                onChange={(e) => update("brand_color", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Owner first name">
              <input
                className={inputClass}
                value={form.owner_first_name}
                onChange={(e) => update("owner_first_name", e.target.value)}
              />
            </Field>
            <Field label="Owner last name">
              <input
                className={inputClass}
                value={form.owner_last_name}
                onChange={(e) => update("owner_last_name", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Logo">
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </Field>
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-border text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !form.name.trim() || !form.code.trim()}
            onClick={() => void handleSubmit()}
            className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create organization"}
          </button>
        </div>
        {error != null ? (
          <p className="px-5 pb-4 text-xs text-destructive">
            {getApiErrorMessage(error, "Failed to create organization.")}
          </p>
        ) : null}
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
