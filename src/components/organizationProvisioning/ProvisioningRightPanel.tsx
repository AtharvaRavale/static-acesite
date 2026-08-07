import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Organization } from "@/features/organizations";

const RULES = [
  "Platform-only modules cannot be assigned to organizations.",
  "Core modules must remain enabled and cannot be disabled.",
  "Optional modules can be enabled, set to read-only, or disabled.",
];

export function ProvisioningRightPanel({
  organization,
  counts,
  pendingCount,
  saving,
  saveDisabled,
  saveMessage,
  onSave,
}: {
  organization: Organization | null;
  counts: { enabled: number; read_only: number; disabled: number };
  pendingCount: number;
  saving?: boolean;
  saveDisabled?: boolean;
  saveMessage?: string | null;
  onSave: () => void;
}) {
  const admin = organization?.primary_admin;
  const adminName = admin
    ? [admin.first_name, admin.last_name].filter(Boolean).join(" ") || admin.email
    : null;

  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:w-[400px] lg:shrink-0 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Selected organization
        </p>

        {organization ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border"
                style={
                  organization.brand_color
                    ? { backgroundColor: `${organization.brand_color}18` }
                    : undefined
                }
              >
                {organization.logo ? (
                  <img
                    src={organization.logo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{ color: organization.brand_color || undefined }}
                  >
                    {organization.code.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-foreground">
                  {organization.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {organization.code}
                  {organization.legal_name ? ` · ${organization.legal_name}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge>{organization.status_display || organization.status}</Badge>
                  <Badge muted>{organization.flow_display || organization.flow}</Badge>
                </div>
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <Row label="Primary admin" value={adminName || "—"} />
              <Row label="Timezone" value={organization.timezone || "—"} />
              <Row
                label="Provisioning started"
                value={organization.created_at || "—"}
              />
            </dl>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Select an organization to review module access.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Module access summary
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <CountCard label="Enabled" value={counts.enabled} tone="success" />
          <CountCard label="Read-only" value={counts.read_only} tone="warning" />
          <CountCard label="Disabled" value={counts.disabled} tone="destructive" />
        </div>
        {pendingCount > 0 && (
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
            {pendingCount} pending change{pendingCount === 1 ? "" : "s"} not saved
            yet.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Provisioning rules</p>
        </div>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {saveMessage && (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground">
          {saveMessage}
        </div>
      )}

      <button
        type="button"
        disabled={saveDisabled || saving || !organization}
        onClick={onSave}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {saving ? "Saving module access…" : "Save module access"}
        {!saving && <ArrowRight className="h-4 w-4" />}
      </button>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-right text-xs font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function Badge({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={
        muted
          ? "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground"
          : "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary"
      }
    >
      {children}
    </span>
  );
}

function CountCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-2 py-3 text-center">
      <p className={`font-display text-xl font-semibold ${toneClass}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
