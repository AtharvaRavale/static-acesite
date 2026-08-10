import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";
export const textareaClass =
  "min-h-24 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function SetupField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function PrimaryButton({
  children,
  loading,
  disabled,
  className,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function StepCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/**
 * Generate the exact lowercase slug format expected by the backend code fields.
 * The result is always deterministic from the displayed name.
 */
export function slugifySetupValue(value: string, maxLength = 80): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/**
 * Generate a unique code against records already loaded for the relevant scope.
 * Django remains the final authority for uniqueness in case of concurrent writes.
 */
export function generateUniqueSetupCode(
  name: string,
  existingCodes: Array<string | null | undefined>,
  maxLength = 80
): string {
  const base = slugifySetupValue(name, maxLength);
  if (!base) return "";

  const used = new Set(
    existingCodes
      .filter((code): code is string => Boolean(code))
      .map((code) => code.trim().toLowerCase())
  );

  if (!used.has(base)) return base;

  let suffixNumber = 2;
  while (suffixNumber < 10000) {
    const suffix = `-${suffixNumber}`;
    const availableBaseLength = Math.max(1, maxLength - suffix.length);
    const prefix = base.slice(0, availableBaseLength).replace(/-+$/g, "");
    const candidate = `${prefix}${suffix}`;
    if (!used.has(candidate)) return candidate;
    suffixNumber += 1;
  }

  return "";
}

/**
 * Frontend validation for auto-generated codes before an API request is sent.
 */
export function getSetupCodeError(code: string, maxLength = 80): string | null {
  if (!code) return "Enter a name containing at least one letter or number.";
  if (code.length > maxLength) return `Code cannot exceed ${maxLength} characters.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
    return "Code must contain only lowercase letters, numbers and single hyphens.";
  }
  return null;
}
