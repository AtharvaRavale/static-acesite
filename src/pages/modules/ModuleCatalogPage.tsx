import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FileUp,
  Grid3X3,
  List,
  Plus,
  Search,
} from "lucide-react";
import {
  useProductModuleCatalog,
  type LifecyclePhase,
  type ProductModuleCatalogItem,
  type ProductModuleClassification,
  type ProductModuleMaturity,
} from "@/features/platformModules";
import { ModuleCard } from "@/components/modules/ModuleCard";
import { ImportModuleDialog } from "@/components/modules/catalog/ImportModuleDialog";
import {
  ClassificationBadge,
  MaturityBadge,
  classificationLabels,
} from "@/components/modules/shared/moduleBadges";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { ModuleGridSkeleton, TableSkeleton } from "@/components/ui/skeletonPatterns";
import { cn } from "@/lib/utils";

type ViewMode = "cards" | "list";
type GroupBy = "classification" | "maturity" | "none";

const CLASSIFICATION_ORDER: ProductModuleClassification[] = [
  "platform_only",
  "core",
  "optional",
];

export function ModuleCatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const classification =
    (searchParams.get("classification") as ProductModuleClassification | "") || "";
  const maturity =
    (searchParams.get("maturity") as ProductModuleMaturity | "") || "";
  const lifecyclePhase =
    (searchParams.get("lifecycle_phase") as LifecyclePhase | "") || "";
  const isActiveParam = searchParams.get("is_active");
  const viewMode = (searchParams.get("view") as ViewMode) || "cards";
  const groupBy = (searchParams.get("group") as GroupBy) || "classification";
  const ordering = searchParams.get("ordering") || "menu_order,name";

  const catalogQuery = useProductModuleCatalog({
    search: search || undefined,
    classification: classification || undefined,
    maturity: maturity || undefined,
    lifecycle_phase: lifecyclePhase || undefined,
    is_active:
      isActiveParam === "true"
        ? true
        : isActiveParam === "false"
          ? false
          : undefined,
    ordering,
    page_size: 100,
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    setSearchParams(params, { replace: true });
  };

  const modules = catalogQuery.data?.results ?? [];
  const summary = catalogQuery.data?.summary;
  const recent = catalogQuery.data?.recent_activity ?? [];

  const grouped = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All Modules", items: modules }];
    }

    if (groupBy === "maturity") {
      const map = new Map<string, ProductModuleCatalogItem[]>();

      for (const mod of modules) {
        const key = mod.maturity;

        if (!map.has(key)) {
          map.set(key, []);
        }

        map.get(key)?.push(mod);
      }

      return Array.from(map.entries()).map(([key, items]) => ({
        key,
        label: items[0]?.maturity_display ?? key,
        items,
      }));
    }

    return CLASSIFICATION_ORDER.map((key) => ({
      key,
      label: classificationLabels[key],
      items: modules.filter((module) => module.classification === key),
    })).filter((group) => group.items.length > 0);
  }, [groupBy, modules]);

  const isLoading = catalogQuery.isLoading && !catalogQuery.data;

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-5">
        {/* Hero */}
        <section className="relative isolate min-h-[280px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Ambient background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-32 h-[430px] w-[430px] rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-48 right-[18%] h-[390px] w-[390px] rounded-full bg-violet-500/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, hsl(var(--muted-foreground) / 0.22) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
          </div>

          {/* Desktop artwork */}
          <div className="pointer-events-none absolute inset-y-0 right-[-4%] hidden w-[66%] md:block">
            <img
              src="/module-catalouge.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full select-none object-contain object-center drop-shadow-[0_28px_42px_rgba(37,99,235,0.2)]"
            />
          </div>

          {/* Artwork fade behind content */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card from-0% via-card/95 via-42% to-transparent to-77%" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/50 to-transparent" />

          {/* Hero content */}
          <div className="relative z-10 flex min-h-[280px] items-center px-6 py-8 sm:px-8">
            <div className="max-w-[570px]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Module Studio
                </span>
              </div>

              <h1 className="font-logo text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.35rem]">
                Module Catalog
              </h1>

              <p className="mt-3 max-w-[530px] text-[13px] leading-6 text-muted-foreground sm:text-sm">
                Browse product modules, review maturity and availability, then
                open a module to manage lifecycle, dependencies, publishing,
                and impact.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/modules/new"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Create Module
                </Link>

                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/90 px-4 text-sm font-medium text-foreground shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:bg-muted"
                >
                  <FileUp className="h-4 w-4" />
                  Import Module
                </button>

                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/80 px-4 text-sm font-medium text-muted-foreground backdrop-blur transition duration-200 hover:bg-muted hover:text-foreground"
                  title="Setup guide coming soon"
                >
                  <BookOpen className="h-4 w-4" />
                  Setup Guide
                </button>
              </div>
            </div>
          </div>

          {/* Mobile artwork */}
          <div className="relative z-10 mx-auto -mt-10 block h-[210px] w-full px-5 pb-5 md:hidden">
            <img
              src="/module-catalouge.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-full select-none object-contain drop-shadow-[0_20px_35px_rgba(37,99,235,0.2)]"
            />
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => updateParam("search", event.target.value)}
              placeholder="Search modules..."
              className="h-9 w-56 rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={classification}
            onChange={(event) => updateParam("classification", event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Classifications</option>
            <option value="platform_only">Platform Only</option>
            <option value="core">Core</option>
            <option value="optional">Optional</option>
          </select>

          <select
            value={maturity}
            onChange={(event) => updateParam("maturity", event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Maturities</option>
            <option value="alpha">Alpha</option>
            <option value="beta">Beta</option>
            <option value="ga">GA</option>
            <option value="deprecated">Deprecated</option>
            <option value="retired">Retired</option>
          </select>

          <select
            value={isActiveParam ?? ""}
            onChange={(event) => updateParam("is_active", event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={lifecyclePhase}
            onChange={(event) => updateParam("lifecycle_phase", event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All Lifecycles</option>
            <option value="pre_construction">Pre-construction</option>
            <option value="during_construction">During construction</option>
            <option value="post_construction">Post-construction</option>
          </select>

          <select
            value={groupBy}
            onChange={(event) => updateParam("group", event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="classification">Group: Classification</option>
            <option value="maturity">Group: Maturity</option>
            <option value="none">No grouping</option>
          </select>

          <select
            value={ordering}
            onChange={(event) => updateParam("ordering", event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="menu_order,name">Sort: Menu order</option>
            <option value="name">Sort: Name</option>
            <option value="-updated_at">Sort: Recently updated</option>
            <option value="-published_at">Sort: Recently published</option>
          </select>

          <div className="ml-auto flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => updateParam("view", "cards")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                viewMode === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Card view"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => updateParam("view", "list")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {catalogQuery.error && <ApiErrorBanner error={catalogQuery.error} />}

        {isLoading &&
          (viewMode === "cards" ? (
            <ModuleGridSkeleton count={8} />
          ) : (
            <TableSkeleton rows={8} columns={5} />
          ))}

        {!isLoading && !catalogQuery.error && modules.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">
              No modules match these filters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clear filters or create a module to populate the catalog.
            </p>
            <Link
              to="/modules/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              Create Module <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {!isLoading && modules.length > 0 && viewMode === "cards" && (
          <div className="space-y-7">
            {grouped.map((group) => (
              <section key={group.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {group.label}
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {group.items.length}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onClick={() => navigate(`/modules/${module.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!isLoading && modules.length > 0 && viewMode === "list" && (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Classification
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Maturity</th>
                  <th className="px-4 py-3 text-left font-medium">Version</th>
                  <th className="px-4 py-3 text-left font-medium">Route</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {modules.map((module) => (
                  <tr
                    key={module.id}
                    onClick={() => navigate(`/modules/${module.id}`)}
                    className="cursor-pointer bg-card hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{module.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {module.code}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ClassificationBadge
                        classification={module.classification}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <MaturityBadge
                        maturity={module.maturity}
                        label={module.maturity_display}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {module.version}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {module.frontend_route || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right rail */}
      <aside className="w-full shrink-0 space-y-4 lg:w-72">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Catalog Summary
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live
            </span>
          </div>

          {summary ? (
            <dl className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["All", summary.all],
                ["Platform", summary.platform_only],
                ["Core", summary.core],
                ["Optional", summary.optional],
                ["Published", summary.published],
                ["Draft", summary.unpublished],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-lg bg-muted/40 px-2.5 py-2"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-base font-semibold text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">
              Summary loads with the catalog.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Recently Updated
          </h3>

          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No recent module activity yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {recent.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/modules/${item.id}`)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left hover:bg-muted/50"
                  >
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <span className="text-[10px] font-bold">
                        {item.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        v{item.version} · {item.maturity_display}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <ImportModuleDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(id) => navigate(`/modules/${id}`)}
      />
    </div>
  );
}
