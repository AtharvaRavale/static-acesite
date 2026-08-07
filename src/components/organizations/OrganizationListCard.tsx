import type { Organization } from "@/features/organizations";
import {
  FavoriteStar,
  FlowBadge,
  formatPersonName,
  OrganizationAvatar,
  StatusBadge,
} from "@/components/organizations/organizationUi";
import { cn } from "@/lib/utils";

export function OrganizationListCard({
  organization,
  selected,
  onSelect,
}: {
  organization: Organization;
  selected?: boolean;
  onSelect: () => void;
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
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-primary/40 ring-2 ring-primary/15"
          : "border-border hover:border-primary/20"
      )}
    >
      <div className="mt-1 flex shrink-0 flex-col items-center gap-2">
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
          )}
        >
          {selected ? <span className="text-[10px]">✓</span> : null}
        </span>
      </div>

      <OrganizationAvatar organization={organization} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-base font-semibold text-foreground">
                {organization.name}
              </p>
              <FavoriteStar />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {organization.code}
              {organization.legal_name ? ` · ${organization.legal_name}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusBadge
            status={organization.status}
            label={organization.status_display}
          />
          <FlowBadge flow={organization.flow} label={organization.flow_display} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Primary admin:{" "}
            <span className="font-medium text-foreground">{adminName}</span>
          </span>
          {organization.timezone ? <span>{organization.timezone}</span> : null}
        </div>
      </div>
    </button>
  );
}
