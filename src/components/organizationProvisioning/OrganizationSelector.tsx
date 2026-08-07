import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Organization } from "@/features/organizations";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

function formatOrgLabel(org: Organization): string {
  const code = org.code?.trim();
  if (code && code.toLowerCase() !== org.name.trim().toLowerCase()) {
    return `${org.name} · ${code}`;
  }
  return org.name;
}

export function OrganizationSelector({
  organizations,
  selectedId,
  onSelect,
  loading,
}: {
  organizations: Organization[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.code.toLowerCase().includes(q) ||
        org.legal_name?.toLowerCase().includes(q)
    );
  }, [organizations, search]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <Skeleton className="h-4 w-24 shrink-0" />
        <Skeleton className="h-9 w-full max-w-lg rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-sm font-medium text-foreground">
        Organization
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-0 overflow-hidden rounded-lg border border-border/80 bg-background sm:max-w-xl">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            className="h-9 w-full border-0 bg-transparent pl-8 pr-2 text-sm outline-none placeholder:text-muted-foreground/60"
            placeholder="Search organizations…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="hidden h-5 w-px shrink-0 bg-border/80 sm:block" />

        <div className="relative min-w-0 flex-1 border-t border-border/80 sm:border-0">
          <select
            className={cn(
              "h-9 w-full appearance-none border-0 bg-transparent py-0 pl-3 pr-8 text-sm outline-none",
              "text-foreground disabled:text-muted-foreground"
            )}
            value={selectedId ?? ""}
            onChange={(event) => onSelect(Number(event.target.value))}
          >
            <option value="" disabled>
              Choose organization
            </option>
            {filtered.map((org) => (
              <option key={org.id} value={org.id}>
                {formatOrgLabel(org)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground sm:ml-auto">
          No organizations match your search.
        </p>
      )}
    </div>
  );
}
