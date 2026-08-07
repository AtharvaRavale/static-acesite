import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { useProductModule } from "@/features/platformModules";
import { OverviewTab } from "@/components/modules/studio/OverviewTab";
import { LifecycleTab } from "@/components/modules/studio/LifecycleTab";
import { DependenciesTab } from "@/components/modules/studio/DependenciesTab";
import { VersionsTab } from "@/components/modules/studio/VersionsTab";
import { PublishTab } from "@/components/modules/studio/PublishTab";
import { ImpactTab } from "@/components/modules/studio/ImpactTab";
import {
  ActivePublishedBadges,
  ClassificationBadge,
  MaturityBadge,
} from "@/components/modules/shared/moduleBadges";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { DrawerSkeleton } from "@/components/ui/skeletonPatterns";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "dependencies", label: "Dependencies" },
  { id: "versions", label: "Versions" },
  { id: "publish", label: "Publish" },
  { id: "impact", label: "Impact" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function ModuleStudioDetailPage() {
  const { moduleId: moduleIdParam } = useParams<{ moduleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleId = Number(moduleIdParam);
  const validId = Number.isFinite(moduleId) && moduleId > 0;

  const tabParam = searchParams.get("tab");
  const activeTab: TabId = isTabId(tabParam) ? tabParam : "overview";

  const moduleQuery = useProductModule(validId ? moduleId : null);
  const module = moduleQuery.data;
  const isLoading = moduleQuery.isLoading && !module;

  const setTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "overview") params.delete("tab");
    else params.set("tab", tab);
    setSearchParams(params, { replace: true });
  };

  if (!validId) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">Invalid module id</p>
        <Link to="/modules" className="mt-3 inline-flex text-sm font-medium text-primary">
          Back to modules
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/modules"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Modules
        </Link>
      </div>

      {moduleQuery.error && (
        <ApiErrorBanner error={moduleQuery.error} fallback="Failed to load module." />
      )}

      {isLoading && (
        <div className="rounded-xl border border-border bg-card">
          <DrawerSkeleton />
        </div>
      )}

      {!isLoading && !moduleQuery.error && !module && (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">Module not found</p>
          <Link to="/modules" className="mt-3 inline-flex text-sm font-medium text-primary">
            Back to modules
          </Link>
        </div>
      )}

      {module && (
        <>
          <header className="rounded-xl border border-border bg-card px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-logo text-[1.5rem] font-normal tracking-tight text-foreground">
                    {module.name}
                  </h1>
                  <span className="font-mono text-xs text-muted-foreground">{module.code}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <MaturityBadge maturity={module.maturity} label={module.maturity_display} />
                  <ClassificationBadge classification={module.classification} />
                  <ActivePublishedBadges
                    isActive={module.is_active}
                    isPublished={module.is_published}
                  />
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    v{module.version}
                  </span>
                </div>
              </div>

              <Link
                to={`/modules/${module.id}/edit`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>
          </header>

          <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0">
            {activeTab === "overview" && <OverviewTab module={module} />}
            {activeTab === "lifecycle" && (
              <LifecycleTab moduleId={module.id} module={module} />
            )}
            {activeTab === "dependencies" && (
              <DependenciesTab moduleId={module.id} module={module} />
            )}
            {activeTab === "versions" && <VersionsTab moduleId={module.id} />}
            {activeTab === "publish" && (
              <PublishTab moduleId={module.id} module={module} />
            )}
            {activeTab === "impact" && <ImpactTab moduleId={module.id} />}
          </div>
        </>
      )}
    </div>
  );
}
