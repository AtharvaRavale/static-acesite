import { ArrowRight, Pencil, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { Organization } from "@/features/organizations";
import type { OrganizationModuleStatusCounts } from "@/features/organizations";
import {
  BrandColorSwatch,
  DetailRow,
  FlowBadge,
  formatDate,
  formatPersonName,
  ModuleAccessSnapshot,
  OrganizationAvatar,
  StatusBadge,
} from "@/components/organizations/organizationUi";
import { cn } from "@/lib/utils";

export function OrganizationDetailPanel({
  organization,
  moduleCounts,
  overviewCounts,
  onClose,
  onEdit,
  mode = "list",
  className,
}: {
  organization: Organization;
  moduleCounts?: OrganizationModuleStatusCounts;
  overviewCounts?: {
    organization_units?: number;
    departments?: number;
    active_members?: number;
    partner_organizations?: number;
    enabled_modules?: number;
  };
  onClose?: () => void;
  onEdit?: () => void;
  mode?: "list" | "center";
  className?: string;
}) {
  const admin = organization.primary_admin;
  const adminName = admin
    ? formatPersonName(admin.first_name, admin.last_name, admin.email)
    : formatPersonName(
        organization.owner_first_name,
        organization.owner_last_name,
        organization.email
      );

  return (
    <aside
      className={cn(
        "flex w-full flex-col rounded-2xl border border-border bg-card shadow-sm lg:w-[400px] lg:shrink-0",
        mode === "list" && "lg:sticky lg:top-4 lg:self-start",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <OrganizationAvatar organization={organization} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-foreground">
              {organization.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {organization.code}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge
                status={organization.status}
                label={organization.status_display}
              />
              <FlowBadge flow={organization.flow} label={organization.flow_display} />
            </div>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <dl>
          <DetailRow label="Legal name" value={organization.legal_name || "—"} />
          <DetailRow label="Primary admin" value={adminName} />
          <DetailRow
            label="Contact email"
            value={organization.email || "—"}
            href={organization.email ? `mailto:${organization.email}` : undefined}
          />
          <DetailRow label="Phone" value={organization.phone || "—"} />
          <DetailRow label="Address" value={organization.address || "—"} />
          <DetailRow label="Timezone" value={organization.timezone || "—"} />
          <DetailRow
            label="Brand color"
            value={<BrandColorSwatch color={organization.brand_color} />}
          />
          <DetailRow label="Created" value={formatDate(organization.created_at)} />
        </dl>

        {overviewCounts ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Workspace snapshot
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Metric label="Units" value={overviewCounts.organization_units} />
              <Metric label="Departments" value={overviewCounts.departments} />
              <Metric label="Members" value={overviewCounts.active_members} />
              <Metric
                label="Partner orgs"
                value={overviewCounts.partner_organizations}
              />
            </div>
          </div>
        ) : null}

        {moduleCounts ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Module access
            </p>
            <ModuleAccessSnapshot counts={moduleCounts} />
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-border px-5 py-4">
        {mode === "center" && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
            Edit organization
          </button>
        ) : null}

        {mode === "list" ? (
          <Link
            to={`/organizations/${organization.id}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Open Organization
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}

        <Link
          to={`/organization-provisioning?organization=${organization.id}`}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted",
            mode === "center" && !onEdit && "h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          Open Provisioning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/15 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-lg font-semibold text-foreground">
        {value == null ? "—" : value}
      </p>
    </div>
  );
}
