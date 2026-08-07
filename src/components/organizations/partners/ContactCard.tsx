import { Mail, MoreHorizontal, Phone } from "lucide-react";
import type { PartnerOrganizationContact } from "@/features/organizations";
import {
  partnerIconTone,
  partnerInitials,
} from "@/components/organizations/partners/partnerUi";
import { cn } from "@/lib/utils";

export function ContactCard({
  contact,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  contact: PartnerOrganizationContact;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            partnerIconTone(contact.email || contact.name)
          )}
        >
          {partnerInitials(contact.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {contact.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {contact.designation || "—"}
              </p>
            </div>
            <div className="relative">
              <details className="group">
                <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="block w-full px-3 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={onToggleActive}
                    className="block w-full px-3 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    {contact.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="block w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/5"
                  >
                    Delete
                  </button>
                </div>
              </details>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {contact.is_primary ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Primary Contact
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                contact.is_active
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {contact.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          {contact.department ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Dept: {contact.department}
            </p>
          ) : null}

          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {contact.email ? (
              <p className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                {contact.email}
              </p>
            ) : null}
            {contact.phone ? (
              <p className="flex items-center gap-1.5 truncate">
                <Phone className="h-3 w-3 shrink-0" />
                {contact.phone}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
