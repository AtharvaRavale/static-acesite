import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Circle,
  FilePenLine,
  Info,
  Link2,
  Save,
} from "lucide-react";
import {
  useCheckModuleCodeAvailability,
  useCreateProductModule,
  useModuleValidation,
  useProductModule,
  useUpdateProductModule,
  type ProductModuleAvailability,
  type ProductModuleClassification,
  type ProductModuleWritePayload,
} from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import {
  ClassificationBadge,
} from "@/components/modules/shared/moduleBadges";
import { DrawerSkeleton } from "@/components/ui/skeletonPatterns";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "basics", label: "Basics", hint: "Define the essentials" },
  { id: "appearance", label: "Appearance", hint: "Name, icon & visuals" },
  { id: "availability", label: "Availability", hint: "Where it will be used" },
  { id: "configuration", label: "Configuration", hint: "Settings & options" },
  { id: "review", label: "Review", hint: "Confirm & create" },
] as const;

const DESCRIPTION_MAX = 500;

const AVAILABILITY_OPTIONS: Array<{
  value: ProductModuleAvailability;
  label: string;
  description: string;
}> = [
  {
    value: "platform",
    label: "Platform",
    description: "Platform-only modules cannot be marked core.",
  },
  {
    value: "organization",
    label: "Organization",
    description: "Assignable to organizations from the catalog.",
  },
  {
    value: "both",
    label: "Both",
    description: "Available on platform and to organizations.",
  },
];

interface WizardFormState {
  name: string;
  code: string;
  description: string;
  version: string;
  icon: string;
  theme_color: string;
  image: File | null;
  banner_image: File | null;
  availability: ProductModuleAvailability;
  is_core: boolean;
  is_active: boolean;
  frontend_route: string;
  menu_order: string;
  settings_schema: string;
  is_lifecycle_specific: boolean;
}

const EMPTY_FORM: WizardFormState = {
  name: "",
  code: "",
  description: "",
  version: "1.0.0",
  icon: "",
  theme_color: "#2563eb",
  image: null,
  banner_image: null,
  availability: "organization",
  is_core: false,
  is_active: true,
  frontend_route: "",
  menu_order: "0",
  settings_schema: "{\n}",
  is_lifecycle_specific: false,
};

function deriveClassification(
  availability: ProductModuleAvailability,
  isCore: boolean
): ProductModuleClassification {
  if (availability === "platform") return "platform_only";
  if (isCore) return "core";
  return "optional";
}

function availabilityLabel(availability: ProductModuleAvailability): string {
  switch (availability) {
    case "platform":
      return "Platform only";
    case "organization":
      return "Organization only";
    case "both":
      return "Platform & organization";
  }
}

function parseSettingsSchema(raw: string):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: {} };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "settings_schema must be a JSON object." };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "settings_schema is not valid JSON." };
  }
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1.5 block text-xs font-medium text-foreground";
const helpClass = "mt-1 text-[11px] text-muted-foreground";

export function ModuleWizardPage() {
  const { moduleId: moduleIdParam } = useParams<{ moduleId?: string }>();
  const navigate = useNavigate();

  const parsedId = Number(moduleIdParam);
  const existingId =
    moduleIdParam && Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  const isEdit = existingId !== null;

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<WizardFormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [debouncedCode, setDebouncedCode] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const moduleQuery = useProductModule(existingId);
  const createModule = useCreateProductModule();
  const updateModule = useUpdateProductModule();
  const validationQuery = useModuleValidation(existingId);

  const imagePreview = useObjectUrl(form.image);
  const bannerPreview = useObjectUrl(form.banner_image);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedCode(form.code.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [form.code]);

  const codeAvailability = useCheckModuleCodeAvailability(
    debouncedCode,
    existingId ?? undefined,
    debouncedCode.length > 0
  );

  useEffect(() => {
    const module = moduleQuery.data;
    if (!module || hydrated) return;

    setForm({
      name: module.name ?? "",
      code: module.code ?? "",
      description: module.description ?? "",
      version: module.version || "1.0.0",
      icon: module.icon ?? "",
      theme_color: module.theme_color || "#2563eb",
      image: null,
      banner_image: null,
      availability: module.availability,
      is_core: module.availability === "platform" ? false : module.is_core,
      is_active: module.is_active,
      frontend_route: module.frontend_route ?? "",
      menu_order: String(module.menu_order ?? 0),
      settings_schema: JSON.stringify(module.settings_schema ?? {}, null, 2),
      is_lifecycle_specific: module.is_lifecycle_specific,
    });
    setDebouncedCode(module.code ?? "");
    setHydrated(true);
  }, [moduleQuery.data, hydrated]);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const classification = deriveClassification(form.availability, form.is_core);
  const isSaving = createModule.isPending || updateModule.isPending;

  const existingImageUrl = moduleQuery.data?.image_url ?? moduleQuery.data?.image;
  const existingBannerUrl =
    moduleQuery.data?.banner_image_url ?? moduleQuery.data?.banner_image;

  const previewImageSrc = imagePreview ?? existingImageUrl ?? null;
  const previewBannerSrc = bannerPreview ?? existingBannerUrl ?? null;

  const checklist = useMemo(
    () => [
      { label: "Choose a clear, descriptive name", done: form.name.trim().length >= 2 },
      { label: "Pick a unique module code", done: Boolean(codeAvailability.data?.available) },
      {
        label: "Add a useful description",
        done: form.description.trim().length >= 20,
      },
      { label: "Set the correct version", done: /^\d+\.\d+\.\d+/.test(form.version.trim()) },
    ],
    [form.name, form.description, form.version, codeAvailability.data?.available]
  );

  const updateField = <K extends keyof WizardFormState>(
    key: K,
    value: WizardFormState[K]
  ) => {
    setForm((prev) => {
      if (key === "availability" && value === "platform") {
        return { ...prev, availability: "platform", is_core: false };
      }
      return { ...prev, [key]: value };
    });
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
    setSaveNotice(null);
  };

  const buildPayload = (): ProductModuleWritePayload | null => {
    setSchemaError(null);
    const parsedSchema = parseSettingsSchema(form.settings_schema);
    if (!parsedSchema.ok) {
      setSchemaError(parsedSchema.error);
      setFieldErrors((prev) => ({ ...prev, settings_schema: parsedSchema.error }));
      return null;
    }

    const menuOrder = Number(form.menu_order);
    const payload: ProductModuleWritePayload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      version: form.version.trim(),
      icon: form.icon.trim(),
      theme_color: form.theme_color.trim() || "#2563eb",
      availability: form.availability,
      is_core: form.availability === "platform" ? false : form.is_core,
      is_active: form.is_active,
      frontend_route: form.frontend_route.trim(),
      menu_order: Number.isFinite(menuOrder) ? menuOrder : 0,
      settings_schema: parsedSchema.value,
      is_lifecycle_specific: form.is_lifecycle_specific,
    };

    if (form.image) payload.image = form.image;
    if (form.banner_image) payload.banner_image = form.banner_image;

    return payload;
  };

  const persist = async (mode: "draft" | "final") => {
    setSubmitError(null);
    setSaveNotice(null);
    setFieldErrors({});

    const payload = buildPayload();
    if (!payload) {
      if (step.id !== "configuration" && step.id !== "review") {
        setStepIndex(STEPS.findIndex((s) => s.id === "configuration"));
      }
      return;
    }

    try {
      if (existingId === null) {
        const created = await createModule.mutateAsync(payload);
        setSaveNotice(mode === "draft" ? "Draft created." : "Module created.");
        navigate(`/modules/${created.id}`);
        return;
      }

      await updateModule.mutateAsync({ id: existingId, payload });
      setSaveNotice(mode === "draft" ? "Draft saved." : "Module saved.");
      if (mode === "final") {
        void validationQuery.refetch();
      }
    } catch (error) {
      setSubmitError(error);
      setFieldErrors(getApiFieldErrors(error));
    }
  };

  const goNext = () => {
    if (isLastStep) {
      void persist("final");
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (stepIndex === 0) {
      navigate(isEdit && existingId ? `/modules/${existingId}` : "/modules");
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  if (isEdit && moduleQuery.isLoading && !moduleQuery.data) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <DrawerSkeleton />
      </div>
    );
  }

  if (isEdit && moduleQuery.error && !moduleQuery.data) {
    return (
      <div className="space-y-4">
        <ApiErrorBanner error={moduleQuery.error} fallback="Failed to load module." />
        <Link to="/modules" className="text-sm font-medium text-primary">
          Back to modules
        </Link>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to={isEdit && existingId ? `/modules/${existingId}` : "/modules"}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isEdit ? "Module" : "Modules"}
        </Link>
      </div>

      <header className="mb-5 space-y-1">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Module Studio
        </p>
        <h1 className="font-logo text-[1.7rem] font-normal tracking-tight text-foreground">
          {isEdit ? "Edit Module" : "Create Module"}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {isEdit
            ? "Update module identity, appearance, availability, and configuration."
            : "Build a reusable module for the platform catalog."}
        </p>
      </header>

      {/* Stepper */}
      <ol className="mb-5 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-5">
        {STEPS.map((item, index) => {
          const active = index === stepIndex;
          const complete = index < stepIndex;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setStepIndex(index)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  active && "bg-primary/10",
                  !active && "hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    active && "bg-primary text-primary-foreground",
                    complete && !active && "bg-success/15 text-success",
                    !active && !complete && "bg-muted text-muted-foreground"
                  )}
                >
                  {complete && !active ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-xs font-semibold",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {(submitError || saveNotice) && (
        <div className="mb-4 space-y-2">
          {submitError ? (
            <ApiErrorBanner
              error={submitError}
              fallback={getApiErrorMessage(submitError, "Failed to save module.")}
            />
          ) : null}
          {saveNotice ? (
            <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              {saveNotice}
            </div>
          ) : null}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {step.id === "basics" && (
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FilePenLine className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    Module Basics
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Identity fields used across the catalog and studio.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Field
                  label="Module Name"
                  required
                  error={fieldErrors.name}
                  htmlFor="module-name"
                >
                  <input
                    id="module-name"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Document Control"
                  />
                </Field>

                <Field
                  label="Unique Code"
                  required
                  error={fieldErrors.code}
                  htmlFor="module-code"
                  hint="Lowercase code used as the stable module identifier."
                >
                  <input
                    id="module-code"
                    className={cn(inputClass, "font-mono")}
                    value={form.code}
                    onChange={(e) => updateField("code", e.target.value)}
                    placeholder="document-control"
                  />
                  {debouncedCode ? (
                    <CodeAvailabilityStatus
                      loading={codeAvailability.isFetching}
                      available={codeAvailability.data?.available}
                      error={codeAvailability.error}
                    />
                  ) : null}
                </Field>

                <Field
                  label="Description"
                  error={fieldErrors.description}
                  htmlFor="module-description"
                >
                  <textarea
                    id="module-description"
                    rows={4}
                    maxLength={DESCRIPTION_MAX}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="What this module provides for operators and organizations."
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {form.description.length} / {DESCRIPTION_MAX}
                  </p>
                </Field>

                <Field
                  label="Version"
                  required
                  error={fieldErrors.version}
                  htmlFor="module-version"
                >
                  <input
                    id="module-version"
                    className={cn(inputClass, "font-mono")}
                    value={form.version}
                    onChange={(e) => updateField("version", e.target.value)}
                    placeholder="1.0.0"
                  />
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>
                      Use semantic versioning (e.g. 1.0.0). You can update this later.
                    </span>
                  </div>
                </Field>
              </div>
            </section>
          )}

          {step.id === "appearance" && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-1 font-display text-sm font-semibold text-foreground">
                Appearance
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Visual identity shown in the module catalog and studio.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Icon" error={fieldErrors.icon} htmlFor="module-icon">
                  <input
                    id="module-icon"
                    className={inputClass}
                    value={form.icon}
                    onChange={(e) => updateField("icon", e.target.value)}
                    placeholder="file-text / lucide name / emoji"
                  />
                </Field>

                <Field
                  label="Theme Color"
                  error={fieldErrors.theme_color}
                  htmlFor="module-theme-color"
                >
                  <div className="flex items-center gap-2">
                    <input
                      id="module-theme-color"
                      type="color"
                      value={form.theme_color || "#2563eb"}
                      onChange={(e) => updateField("theme_color", e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-input bg-background p-1"
                    />
                    <input
                      className={cn(inputClass, "font-mono")}
                      value={form.theme_color}
                      onChange={(e) => updateField("theme_color", e.target.value)}
                      placeholder="#2563eb"
                    />
                  </div>
                </Field>

                <Field label="Image" error={fieldErrors.image} htmlFor="module-image">
                  <input
                    id="module-image"
                    type="file"
                    accept="image/*"
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
                    onChange={(e) => updateField("image", e.target.files?.[0] ?? null)}
                  />
                  {form.image ? (
                    <p className={helpClass}>{form.image.name}</p>
                  ) : existingImageUrl ? (
                    <p className={helpClass}>Current image will be kept unless replaced.</p>
                  ) : null}
                </Field>

                <Field
                  label="Banner Image"
                  error={fieldErrors.banner_image}
                  htmlFor="module-banner"
                >
                  <input
                    id="module-banner"
                    type="file"
                    accept="image/*"
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
                    onChange={(e) =>
                      updateField("banner_image", e.target.files?.[0] ?? null)
                    }
                  />
                  {form.banner_image ? (
                    <p className={helpClass}>{form.banner_image.name}</p>
                  ) : existingBannerUrl ? (
                    <p className={helpClass}>Current banner will be kept unless replaced.</p>
                  ) : null}
                </Field>
              </div>

              {(previewImageSrc || previewBannerSrc) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {previewImageSrc ? (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <img
                        src={previewImageSrc}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                    </div>
                  ) : null}
                  {previewBannerSrc ? (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <img
                        src={previewBannerSrc}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          )}

          {step.id === "availability" && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-1 font-display text-sm font-semibold text-foreground">
                Availability
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Control where the module can be used and whether it is core.
              </p>

              <div className="space-y-4">
                <fieldset>
                  <legend className={labelClass}>Availability</legend>
                  <div className="grid gap-2">
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                          form.availability === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="availability"
                          className="mt-1"
                          checked={form.availability === option.value}
                          onChange={() => updateField("availability", option.value)}
                        />
                        <span>
                          <span className="block text-sm font-medium text-foreground">
                            {option.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.availability ? (
                    <p className="mt-1 text-[11px] text-destructive">
                      {fieldErrors.availability}
                    </p>
                  ) : null}
                </fieldset>

                <div className="rounded-lg border border-border px-3 py-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.is_core}
                      disabled={form.availability === "platform"}
                      onChange={(e) => updateField("is_core", e.target.checked)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Core module
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {form.availability === "platform"
                          ? "Platform-only modules cannot be core."
                          : "Core modules are expected for every organization."}
                      </span>
                    </span>
                  </label>
                  {fieldErrors.is_core ? (
                    <p className="mt-2 text-[11px] text-destructive">{fieldErrors.is_core}</p>
                  ) : null}
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.is_active}
                    onChange={(e) => updateField("is_active", e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">Active</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Inactive modules stay in the registry but are hidden from enablement.
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <span className="text-[11px] text-muted-foreground">Derived classification</span>
                  <ClassificationBadge classification={classification} />
                </div>
              </div>
            </section>
          )}

          {step.id === "configuration" && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-1 font-display text-sm font-semibold text-foreground">
                Configuration
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Routing, menu placement, and settings schema.
              </p>

              <div className="space-y-4">
                <Field
                  label="Frontend Route"
                  error={fieldErrors.frontend_route}
                  htmlFor="module-route"
                >
                  <input
                    id="module-route"
                    className={cn(inputClass, "font-mono")}
                    value={form.frontend_route}
                    onChange={(e) => updateField("frontend_route", e.target.value)}
                    placeholder="/core/document-control"
                  />
                </Field>

                <Field
                  label="Menu Order"
                  error={fieldErrors.menu_order}
                  htmlFor="module-menu-order"
                >
                  <input
                    id="module-menu-order"
                    type="number"
                    className={inputClass}
                    value={form.menu_order}
                    onChange={(e) => updateField("menu_order", e.target.value)}
                  />
                </Field>

                <Field
                  label="Settings Schema (JSON)"
                  error={fieldErrors.settings_schema || schemaError || undefined}
                  htmlFor="module-settings-schema"
                >
                  <textarea
                    id="module-settings-schema"
                    rows={10}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.settings_schema}
                    onChange={(e) => {
                      updateField("settings_schema", e.target.value);
                      setSchemaError(null);
                    }}
                    spellCheck={false}
                  />
                </Field>

                <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={form.is_lifecycle_specific}
                    onChange={(e) =>
                      updateField("is_lifecycle_specific", e.target.checked)
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Lifecycle specific
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Enable when this module maps to construction lifecycle phases.
                    </span>
                  </span>
                </label>
              </div>
            </section>
          )}

          {step.id === "review" && (
            <section className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-1 font-display text-sm font-semibold text-foreground">
                  Review
                </h2>
                <p className="mb-4 text-xs text-muted-foreground">
                  Confirm details before {isEdit ? "saving" : "creating"} this module.
                </p>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <ReviewItem label="Name" value={form.name || "—"} />
                  <ReviewItem label="Code" value={form.code || "—"} mono />
                  <ReviewItem label="Version" value={form.version || "—"} mono />
                  <ReviewItem
                    label="Availability"
                    value={availabilityLabel(form.availability)}
                  />
                  <ReviewItem label="Classification" value={
                    <ClassificationBadge classification={classification} />
                  } />
                  <ReviewItem label="Core" value={form.is_core ? "Yes" : "No"} />
                  <ReviewItem label="Active" value={form.is_active ? "Yes" : "No"} />
                  <ReviewItem
                    label="Frontend route"
                    value={form.frontend_route || "—"}
                    mono
                  />
                  <ReviewItem label="Menu order" value={form.menu_order || "0"} mono />
                  <ReviewItem
                    label="Lifecycle specific"
                    value={form.is_lifecycle_specific ? "Yes" : "No"}
                  />
                  <ReviewItem label="Icon" value={form.icon || "—"} />
                  <ReviewItem label="Theme color" value={form.theme_color || "—"} mono />
                </dl>

                {form.description ? (
                  <div className="mt-4 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-foreground">{form.description}</p>
                  </div>
                ) : null}
              </div>

              {existingId !== null && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Validation
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Live report from `/product-modules/{existingId}/validation/`.
                  </p>

                  {validationQuery.isLoading && (
                    <p className="mt-3 text-sm text-muted-foreground">Loading validation…</p>
                  )}
                  {validationQuery.error && (
                    <div className="mt-3">
                      <ApiErrorBanner
                        error={validationQuery.error}
                        fallback="Failed to load validation."
                      />
                    </div>
                  )}
                  {validationQuery.data && (
                    <div className="mt-3 space-y-3">
                      <div
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          validationQuery.data.is_valid
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {validationQuery.data.is_valid ? "Valid" : "Needs attention"}
                      </div>

                      {validationQuery.data.errors.length > 0 && (
                        <IssueList
                          title="Errors"
                          items={validationQuery.data.errors}
                          tone="error"
                        />
                      )}
                      {validationQuery.data.warnings.length > 0 && (
                        <IssueList
                          title="Warnings"
                          items={validationQuery.data.warnings}
                          tone="warning"
                        />
                      )}
                      {validationQuery.data.errors.length === 0 &&
                        validationQuery.data.warnings.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No validation issues reported.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right rail */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <LivePreviewCard
            name={form.name}
            code={form.code}
            version={form.version}
            icon={form.icon}
            themeColor={form.theme_color}
            imageSrc={previewImageSrc}
            bannerSrc={previewBannerSrc}
            classification={classification}
            availability={form.availability}
            frontendRoute={form.frontend_route}
            isCore={form.is_core}
            isActive={form.is_active}
          />

          {step.id === "basics" && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick Checklist
              </h3>
              <ul className="mt-3 space-y-2">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    ) : (
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/50" />
                    )}
                    <span
                      className={cn(
                        item.done ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void persist("draft")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving…" : "Save Draft"}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={goNext}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {isLastStep
                ? isSaving
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save"
                    : "Create"
                : (
                  <>
                    Next: {STEPS[stepIndex + 1]?.label}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      {children}
      {hint ? <p className={helpClass}>{hint}</p> : null}
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

function CodeAvailabilityStatus({
  loading,
  available,
  error,
}: {
  loading: boolean;
  available?: boolean;
  error: unknown;
}) {
  if (error) {
    return (
      <p className="mt-1.5 text-[11px] text-destructive">
        {getApiErrorMessage(error, "Could not check code availability.")}
      </p>
    );
  }
  if (loading) {
    return <p className="mt-1.5 text-[11px] text-muted-foreground">Checking availability…</p>;
  }
  if (available === undefined) return null;
  if (available) {
    return (
      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Great! This code is available.
      </p>
    );
  }
  return (
    <p className="mt-1.5 text-[11px] font-medium text-destructive">
      This code is already in use.
    </p>
  );
}

function ReviewItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-sm text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function IssueList({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ field: string | null; message: string }>;
  tone: "error" | "warning";
}) {
  return (
    <div>
      <p
        className={cn(
          "text-xs font-semibold",
          tone === "error" ? "text-destructive" : "text-warning"
        )}
      >
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li
            key={`${item.field ?? "general"}-${index}`}
            className="rounded-md border border-border bg-muted/20 px-2.5 py-1.5 text-xs text-foreground"
          >
            {item.field ? (
              <span className="font-mono text-muted-foreground">{item.field}: </span>
            ) : null}
            {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LivePreviewCard({
  name,
  code,
  version,
  icon,
  themeColor,
  imageSrc,
  bannerSrc,
  classification,
  availability,
  frontendRoute,
  isCore,
  isActive,
}: {
  name: string;
  code: string;
  version: string;
  icon: string;
  themeColor: string;
  imageSrc: string | null;
  bannerSrc: string | null;
  classification: ProductModuleClassification;
  availability: ProductModuleAvailability;
  frontendRoute: string;
  isCore: boolean;
  isActive: boolean;
}) {
  const accent = themeColor || "#2563eb";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Live Preview
        </p>
      </div>

      {bannerSrc ? (
        <div className="h-16 w-full overflow-hidden bg-muted">
          <img src={bannerSrc} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className="h-16 w-full"
          style={{
            background: `linear-gradient(135deg, ${accent}33, transparent)`,
          }}
        />
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            {imageSrc ? (
              <img src={imageSrc} alt="" className="h-full w-full object-cover" />
            ) : icon ? (
              <span className="text-sm font-semibold">{icon.slice(0, 2).toUpperCase()}</span>
            ) : (
              <Box className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-semibold text-foreground">
              {name || "Untitled module"}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {code || "module-code"}
              {version ? ` · v${version}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <ClassificationBadge classification={classification} />
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {availabilityLabel(availability)}
          </span>
          {isCore ? (
            <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              Core
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
              isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {frontendRoute ? (
          <p className="inline-flex min-w-0 items-center gap-1 truncate text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{frontendRoute}</span>
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">No frontend route yet</p>
        )}
      </div>
    </div>
  );
}
