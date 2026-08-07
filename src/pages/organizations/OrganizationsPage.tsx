import { useMemo, useState } from "react";
import { ChevronRight, Grid3X3, List, Plus, Search } from "lucide-react";
import {
  useOrganizationModules,
  useOrganizationOverview,
  useOrganizations,
  type OrganizationFlow,
  type OrganizationStatus,
} from "@/features/organizations";
import { OrganizationCreateDrawer } from "@/components/organizations/OrganizationCreateDrawer";
import { OrganizationDetailPanel } from "@/components/organizations/OrganizationDetailPanel";
import { OrganizationListCard } from "@/components/organizations/OrganizationListCard";
import { moduleCountsFromList } from "@/components/organizations/organizationUi";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { ModuleGridSkeleton } from "@/components/ui/skeletonPatterns";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "list";

export function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrganizationStatus | "">("");
  const [flow, setFlow] = useState<OrganizationFlow | "">("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const orgsQuery = useOrganizations({
    page_size: 200,
    ordering: "-created_at",
    search: search.trim() || undefined,
    status: status || undefined,
    flow: flow || undefined,
  });

  const overviewQuery = useOrganizationOverview(selectedId);
  const modulesQuery = useOrganizationModules(selectedId);

  const organizations = orgsQuery.data?.results ?? [];
  const selectedOrg =
    organizations.find((org) => org.id === selectedId) ??
    overviewQuery.data?.organization ??
    null;

  const moduleCounts = useMemo(() => {
    if (overviewQuery.data?.module_status) {
      return overviewQuery.data.module_status;
    }
    const modules = modulesQuery.data ?? [];
    if (!modules.length) return undefined;
    return moduleCountsFromList(modules);
  }, [modulesQuery.data, overviewQuery.data?.module_status]);

  const loading = orgsQuery.isLoading && !orgsQuery.data;

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Platform</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Organizations</span>
      </nav>

      <section className="relative isolate min-h-[240px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-32 h-[430px] w-[430px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-48 right-[18%] h-[390px] w-[390px] rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-[-4%] hidden w-[58%] md:block">
          <img
            src="/superadmin-invites-org.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="h-full w-full select-none object-contain object-center drop-shadow-[0_28px_42px_rgba(37,99,235,0.2)]"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card from-0% via-card/95 via-42% to-transparent to-77%" />

        <div className="relative z-10 flex min-h-[240px] items-center px-6 py-8 sm:px-8">
          <div className="max-w-[560px]">
            <h1 className="font-logo text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.2rem]">
              Organizations
            </h1>
            <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-muted-foreground sm:text-sm">
              Provision and manage customer workspaces.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              New organization
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Search organizations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrganizationStatus | "")}
        >
          <option value="">All statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="closed">Closed</option>
        </select>
        <select
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          value={flow}
          onChange={(e) => setFlow(e.target.value as OrganizationFlow | "")}
        >
          <option value="">All flows</option>
          <option value="self">Self</option>
          <option value="partner_company">Partner company</option>
          <option value="both">Both</option>
        </select>
        <div className="flex rounded-lg border border-border p-0.5">
          <ViewToggle
            active={viewMode === "cards"}
            onClick={() => setViewMode("cards")}
            icon={Grid3X3}
            label="Grid"
          />
          <ViewToggle
            active={viewMode === "list"}
            onClick={() => setViewMode("list")}
            icon={List}
            label="List"
          />
        </div>
      </div>

      <ApiErrorBanner error={orgsQuery.error} />

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-3">
          {loading ? (
            <ModuleGridSkeleton count={4} />
          ) : organizations.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No organizations found. Create one to get started.
            </div>
          ) : viewMode === "cards" ? (
            organizations.map((org) => (
              <OrganizationListCard
                key={org.id}
                organization={org}
                selected={selectedId === org.id}
                onSelect={() => setSelectedId(org.id)}
              />
            ))
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Flow</th>
                    <th className="px-4 py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => setSelectedId(org.id)}
                      className={cn(
                        "cursor-pointer border-b border-border/70 last:border-0 hover:bg-muted/20",
                        selectedId === org.id && "bg-primary/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.code}</p>
                      </td>
                      <td className="px-4 py-3">{org.status_display}</td>
                      <td className="px-4 py-3">{org.flow_display}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {org.primary_admin?.email ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedOrg ? (
          <OrganizationDetailPanel
            organization={selectedOrg}
            moduleCounts={moduleCounts}
            overviewCounts={overviewQuery.data?.counts}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <aside className="hidden rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground lg:flex lg:w-[400px] lg:shrink-0 lg:items-center lg:justify-center">
            Select an organization to view details and open the command center.
          </aside>
        )}
      </div>

      <OrganizationCreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
