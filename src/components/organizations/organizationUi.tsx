import type { LucideIcon } from "lucide-react";
import {
  Box,
  Briefcase,
  Building2,
  GitBranch,
  Globe,
  Map,
  MapPin,
  Scale,
  Star,
} from "lucide-react";
import type {
  Organization,
  OrganizationFlow,
  OrganizationStatus,
  UnitType,
} from "@/features/organizations";
import type { OrganizationModule } from "@/features/platformModules";
import { cn } from "@/lib/utils";

export function formatPersonName(
  first?: string | null,
  last?: string | null,
  email?: string | null
): string {
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || email || "—";
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_TONE: Record<OrganizationStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-700",
  trial: "bg-amber-500/10 text-amber-700",
  suspended: "bg-orange-500/10 text-orange-700",
  closed: "bg-rose-500/10 text-rose-700",
};

const FLOW_TONE: Record<OrganizationFlow, string> = {
  self: "border-violet-200 bg-violet-500/5 text-violet-700",
  partner_company: "border-sky-200 bg-sky-500/5 text-sky-700",
  both: "border-indigo-200 bg-indigo-500/5 text-indigo-700",
};

export const UNIT_TYPE_META: Record<
  UnitType,
  { label: string; icon: LucideIcon; tone: string; ring: string }
> = {
  holding_company: {
    label: "Holding Company",
    icon: Building2,
    tone: "bg-blue-500/10 text-blue-700",
    ring: "ring-blue-500/20",
  },
  legal_entity: {
    label: "Legal Entity",
    icon: Scale,
    tone: "bg-emerald-500/10 text-emerald-700",
    ring: "ring-emerald-500/20",
  },
  business_unit: {
    label: "Business Unit",
    icon: Briefcase,
    tone: "bg-violet-500/10 text-violet-700",
    ring: "ring-violet-500/20",
  },
  region: {
    label: "Region",
    icon: Globe,
    tone: "bg-pink-500/10 text-pink-700",
    ring: "ring-pink-500/20",
  },
  zone: {
    label: "Zone",
    icon: Map,
    tone: "bg-orange-500/10 text-orange-700",
    ring: "ring-orange-500/20",
  },
  branch: {
    label: "Branch",
    icon: GitBranch,
    tone: "bg-teal-500/10 text-teal-700",
    ring: "ring-teal-500/20",
  },
  site_office: {
    label: "Site Office",
    icon: MapPin,
    tone: "bg-amber-500/10 text-amber-700",
    ring: "ring-amber-500/20",
  },
  other: {
    label: "Other",
    icon: Box,
    tone: "bg-slate-500/10 text-slate-700",
    ring: "ring-slate-500/20",
  },
};

export function OrganizationAvatar({
  organization,
  size = "md",
}: {
  organization: Pick<Organization, "name" | "code" | "logo" | "brand_color">;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-14 w-14 rounded-2xl text-base" : size === "sm" ? "h-9 w-9 rounded-lg text-[11px]" : "h-12 w-12 rounded-xl text-sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border font-bold",
        sizeClass
      )}
      style={
        organization.brand_color
          ? { backgroundColor: `${organization.brand_color}18` }
          : undefined
      }
    >
      {organization.logo ? (
        <img src={organization.logo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span style={{ color: organization.brand_color || undefined }}>
          {organization.code.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: OrganizationStatus;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_TONE[status]
      )}
    >
      {label || status}
    </span>
  );
}

export function FlowBadge({
  flow,
  label,
}: {
  flow: OrganizationFlow;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        FLOW_TONE[flow]
      )}
    >
      {label || flow}
    </span>
  );
}

export function ModuleAccessSnapshot({
  counts,
}: {
  counts: { enabled: number; read_only: number; disabled: number };
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <ModuleCountTile label="Enabled" value={counts.enabled} tone="success" />
      <ModuleCountTile label="Read-only" value={counts.read_only} tone="warning" />
      <ModuleCountTile label="Disabled" value={counts.disabled} tone="muted" />
    </div>
  );
}

export function moduleCountsFromList(modules: OrganizationModule[]) {
  return modules.reduce(
    (acc, row) => {
      acc[row.status] += 1;
      return acc;
    },
    { enabled: 0, read_only: 0, disabled: 0 }
  );
}

function ModuleCountTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-border bg-muted/15 px-2 py-3 text-center">
      <p className={cn("font-display text-xl font-semibold", toneClass)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="max-w-[58%] truncate text-right text-xs font-medium text-foreground">
        {href && typeof value === "string" ? (
          <a href={href} className="text-primary hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function BrandColorSwatch({ color }: { color?: string | null }) {
  if (!color) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-4 w-4 rounded border border-border"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-[11px] uppercase">{color}</span>
    </span>
  );
}

export function FavoriteStar({ active }: { active?: boolean }) {
  return (
    <Star
      className={cn(
        "h-4 w-4",
        active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"
      )}
    />
  );
}
