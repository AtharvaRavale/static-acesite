import { ExternalLink, Info, Pencil, Plus, Power, Trash2 } from "lucide-react";
import type {
  Organization,
  PartnerOrganization,
  PartnerOrganizationContact,
} from "@/features/organizations";
import { ContactCard } from "@/components/organizations/partners/ContactCard";
import {
  PARTNER_TYPE_LABELS,
  partnerIconTone,
  partnerInitials,
} from "@/components/organizations/partners/partnerUi";
import {
  DetailRow,
  FlowBadge,
  formatDate,
} from "@/components/organizations/organizationUi";
import { cn } from "@/lib/utils";

export function PartnerDetailPanel({
  organization,
  partner,
  contacts,
  contactLoading,
  onEdit,
  onAddChild,
  onAddContact,
  onEditContact,
  onToggleContact,
  onDeleteContact,
  onToggleActive,
  onDelete,
  toggling,
  deleting,
}: {
  organization: Organization | null;
  partner: PartnerOrganization;
  contacts: PartnerOrganizationContact[];
  contactLoading?: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onAddContact: () => void;
  onEditContact: (contact: PartnerOrganizationContact) => void;
  onToggleContact: (contact: PartnerOrganizationContact) => void;
  onDeleteContact: (contact: PartnerOrganizationContact) => void;
  onToggleActive: () => void;
  onDelete: () => void;
  toggling?: boolean;
  deleting?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
              partnerIconTone(partner.code || partner.id)
            )}
          >
            {partnerInitials(partner.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold text-foreground">
              {partner.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {partner.partner_type_display ||
                  PARTNER_TYPE_LABELS[partner.partner_type]}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  partner.is_active
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {partner.is_active ? "Active" : "Inactive"}
              </span>
              <FlowBadge
                flow={partner.organization_flow}
                label={partner.organization_flow}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Code: {partner.code}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <DetailRow label="Legal name" value={partner.legal_name || "—"} />
          <DetailRow
            label="Partner type"
            value={
              partner.partner_type_display ||
              PARTNER_TYPE_LABELS[partner.partner_type]
            }
          />
          <DetailRow label="Tax ID" value={partner.tax_id || "—"} />
          <DetailRow
            label="Registration No."
            value={partner.registration_number || "—"}
          />
          <DetailRow
            label="Email"
            value={partner.email || "—"}
            href={partner.email ? `mailto:${partner.email}` : undefined}
          />
          <DetailRow label="Phone" value={partner.phone || "—"} />
          <DetailRow label="Address" value={partner.address || "—"} />
          <DetailRow label="Parent" value={partner.parent_name || "Root"} />
          <DetailRow label="Created" value={formatDate(partner.created_at)} />
          <DetailRow label="Updated" value={formatDate(partner.updated_at)} />
          <DetailRow
            label="Status"
            value={partner.is_active ? "Active" : "Inactive"}
          />
          <DetailRow
            label="Flow"
            value={partner.organization_flow || organization?.flow || "—"}
          />
        </div>

        {Object.keys(partner.metadata ?? {}).length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Metadata
            </p>
            <pre className="overflow-x-auto rounded-xl border border-border bg-muted/20 p-3 text-[11px] text-foreground">
              {JSON.stringify(partner.metadata, null, 2)}
            </pre>
          </div>
        ) : null}

        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              Contacts ({contacts.length})
            </p>
            <button
              type="button"
              onClick={onAddContact}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 px-2.5 text-xs font-medium text-primary hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </button>
          </div>

          {contactLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl border border-border bg-muted/30"
                />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No contacts yet. Add a contact for this partner.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onEdit={() => onEditContact(contact)}
                  onToggleActive={() => onToggleContact(contact)}
                  onDelete={() => onDeleteContact(contact)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>
              Partner organizations and contacts are directory entities only.
              They do not automatically grant login access or module access.
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-300">
              Learn more
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium"
        >
          <Pencil className="h-4 w-4" />
          Edit Partner
        </button>
        <button
          type="button"
          onClick={onAddChild}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Child
        </button>
        <button
          type="button"
          disabled={toggling}
          onClick={onToggleActive}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Power className="h-4 w-4" />
          {toggling
            ? "Updating…"
            : partner.is_active
              ? "Deactivate"
              : "Reactivate"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/5"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
