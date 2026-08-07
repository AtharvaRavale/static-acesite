import { useAuth } from "@/features/auth";
import { useOrganization } from "@/features/organizations";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";

export function WorkspaceOrganizationPage() {
  const { organization: authOrg } = useAuth();
  const orgQuery = useOrganization(authOrg?.id ?? null);
  const organization = orgQuery.data ?? null;

  if (!authOrg) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Organization context is missing. Sign in with your membership ID.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="font-logo text-[1.65rem] font-normal tracking-tight text-foreground">
          Organization
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current organization membership context.
        </p>
      </div>

      <ApiErrorBanner error={orgQuery.error} />

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row label="Name" value={organization?.name || authOrg.name} />
          <Row label="Code" value={organization?.code || authOrg.code} />
          <Row label="Membership ID" value={authOrg.membership_id || "—"} />
          <Row
            label="Membership type"
            value={authOrg.membership_type || "—"}
          />
          <Row
            label="Status"
            value={
              organization?.status_display ||
              organization?.status ||
              authOrg.status ||
              "—"
            }
          />
          <Row
            label="Legal name"
            value={organization?.legal_name || "—"}
          />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
