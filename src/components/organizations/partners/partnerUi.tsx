import type { PartnerType } from "@/features/organizations";

export const PARTNER_TYPES: PartnerType[] = [
  "contractor",
  "subcontractor",
  "consultant",
  "supplier",
  "architect",
  "engineer",
  "client_representative",
  "government_agency",
  "vendor",
  "other",
];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  contractor: "Contractor",
  subcontractor: "Subcontractor",
  consultant: "Consultant",
  supplier: "Supplier",
  architect: "Architect",
  engineer: "Engineer",
  client_representative: "Client Representative",
  government_agency: "Government Agency",
  vendor: "Vendor",
  other: "Other",
};

const ICON_TONES = [
  "bg-orange-500 text-white",
  "bg-blue-700 text-white",
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-sky-600 text-white",
  "bg-rose-600 text-white",
  "bg-amber-600 text-white",
  "bg-indigo-600 text-white",
];

export function partnerIconTone(seed: string | number): string {
  const text = String(seed);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % ICON_TONES.length;
  }
  return ICON_TONES[Math.abs(hash) % ICON_TONES.length];
}

export function partnerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-70";
