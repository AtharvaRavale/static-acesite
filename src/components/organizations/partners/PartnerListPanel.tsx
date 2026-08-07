import { Building2, ChevronRight, Users } from "lucide-react";
import type {
  PartnerOrganization,
  PartnerType,
} from "@/features/organizations";
import {
  PARTNER_TYPE_LABELS,
  PARTNER_TYPES,
  partnerIconTone,
  partnerInitials,
} from "@/components/organizations/partners/partnerUi";
import { cn } from "@/lib/utils";

export function PartnerListPanel({
  partners,
  contactCounts,
  selectedId,
  search,
  partnerType,
  statusFilter,
  loading,
  onSearchChange,
  onPartnerTypeChange,
  onStatusFilterChange,
  onSelect,
}: {
  partners: PartnerOrganization[];
  contactCounts: Map<number, number>;
  selectedId: number | null;
  search: string;
  partnerType: PartnerType | "";
  statusFilter: "all" | "active" | "inactive";
  loading?: boolean;
  onSearchChange: (value: string) => void;
  onPartnerTypeChange: (value: PartnerType | "") => void;
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border px-3 py-3">
        <input
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="Search partners…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex gap-2">
          <select
            className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs"
            value={partnerType}
            onChange={(event) =>
              onPartnerTypeChange(event.target.value as PartnerType | "")
            }
          >
            <option value="">Partner type: All</option>
            {PARTNER_TYPES.map((type) => (
              <option key={type} value={type}>
                {PARTNER_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <select
            className="h-8 w-[110px] rounded-lg border border-border bg-background px-2 text-xs"
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(
                event.target.value as "all" | "active" | "inactive"
              )
            }
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))
        ) : partners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs leading-5 text-muted-foreground">
            No partner organizations found. Add a partner organization to start
            building your partner directory.
          </div>
        ) : (
          partners.map((partner) => {
            const selected = selectedId === partner.id;
            const contacts = contactCounts.get(partner.id) ?? 0;
            return (
              <button
                key={partner.id}
                type="button"
                onClick={() => onSelect(partner.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15"
                    : "border-border hover:border-primary/20 hover:bg-muted/20"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    partnerIconTone(partner.code || partner.id)
                  )}
                >
                  {partnerInitials(partner.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {partner.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {partner.code}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {partner.partner_type_display ||
                        PARTNER_TYPE_LABELS[partner.partner_type]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        partner.is_active
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {partner.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {contacts}
                    </span>
                    {partner.child_count > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {partner.child_count}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
