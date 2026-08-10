import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  LockKeyhole,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getWorkspaceModuleRoute,
  useWorkspace,
  type WorkspaceModule,
} from "@/features/workspace";
import { cn } from "@/lib/utils";
import { canViewWorkspaceModule } from "@/features/workspace/modulePermissions";

const SETTINGS_MODULE_CODE = "__settings__";

interface SearchItem {
  code: string;
  name: string;
  description: string;
  module: WorkspaceModule | null;
  isSettings: boolean;
}

export function WorkspaceHomePage() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const searchItems = useMemo<SearchItem[]>(() => {
    const permissionCodes = new Set([...(workspace.bootstrap?.active_access_context?.permission_codes ?? []), ...(workspace.topRole?.permission_codes ?? [])]);
    const owner = Boolean(workspace.organization?.membership.is_owner);
    const modules: SearchItem[] = workspace.visibleModules
      .filter((module) => canViewWorkspaceModule(module.code, permissionCodes, owner))
      .map((module) => ({
        code: module.code,
        name: module.name,
        description: module.description,
        module,
        isSettings: false,
      }));
    if (workspace.canAccessSettings) {
      modules.push({
        code: SETTINGS_MODULE_CODE,
        name: "Settings",
        description: "Organization administration, people, roles and access settings.",
        module: null,
        isSettings: true,
      });
    }
    return modules;
  }, [workspace.visibleModules, workspace.canAccessSettings]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems;
    return searchItems.filter((item) =>
      `${item.name} ${item.code} ${item.description}`.toLowerCase().includes(normalized)
    );
  }, [query, searchItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, workspace.project?.id, workspace.organization?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showProjectRequiredToast = () => {
    setToast(
      "Pick a project first — the modules are ready, but they need a project context before they can work."
    );
  };

  const openItem = (item: SearchItem) => {
    if (item.isSettings) {
      navigate("/workspace/settings");
      return;
    }

    if (!workspace.project) {
      showProjectRequiredToast();
      return;
    }

    if (!item.module) return;
    const route = getWorkspaceModuleRoute(
      item.module.code,
      item.module.frontend_route
    );
    if (!route) {
      setToast(
        `${item.module.name} is enabled here, but its frontend route has not been onboarded yet.`
      );
      return;
    }
    navigate(route);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) =>
        filteredItems.length === 0 ? 0 : (value + 1) % filteredItems.length
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) =>
        filteredItems.length === 0
          ? 0
          : (value - 1 + filteredItems.length) % filteredItems.length
      );
      return;
    }
    if (event.key === "Enter" && filteredItems[activeIndex]) {
      event.preventDefault();
      openItem(filteredItems[activeIndex]);
    }
  };

  if (workspace.isLoading) {
    return <WorkspaceHomeSkeleton />;
  }

  if (workspace.error && !workspace.organization) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-destructive/20 bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-9 w-9 text-destructive" />
          <h1 className="mt-4 font-logo text-2xl text-foreground">
            Workspace could not be loaded
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {getApiErrorMessage(workspace.error, "Unable to load your organization memberships.")}
          </p>
          <button
            type="button"
            onClick={() => void workspace.refresh()}
            className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Retry workspace
          </button>
        </div>
      </div>
    );
  }

  if (!workspace.organization) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-logo text-2xl text-foreground">
            No active organization membership
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is active, but it is not currently connected to an active organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),transparent_62%)]" />

      {toast ? (
        <div className="fixed right-5 top-20 z-[80] w-[min(430px,calc(100vw-40px))] rounded-2xl border border-primary/20 bg-popover p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="flex-1 text-sm font-medium leading-5 text-foreground">{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto max-w-6xl">
        <div className="relative mx-auto max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoFocus
            placeholder="Search modules..."
            className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-20 text-base text-foreground shadow-lg shadow-black/5 outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted/70 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
            ENTER
          </span>
        </div>

        {workspace.projectError ? (
          <InlineError
            message={getApiErrorMessage(
              workspace.projectError,
              "Projects could not be loaded for this organization context."
            )}
          />
        ) : null}

        {workspace.project && workspace.projectModulesError ? (
          <InlineError
            message={getApiErrorMessage(
              workspace.projectModulesError,
              "Project modules could not be loaded."
            )}
          />
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {workspace.isProjectModulesLoading && workspace.project
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))
            : filteredItems.map((item, index) => (
                <ModuleTile
                  key={item.isSettings ? SETTINGS_MODULE_CODE : item.module!.module_id}
                  item={item}
                  disabled={!item.isSettings && !workspace.project}
                  highlighted={Boolean(query.trim()) && index === activeIndex}
                  onClick={() => openItem(item)}
                />
              ))}
        </div>

        {!workspace.isProjectModulesLoading && filteredItems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">No matching modules</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a module name or code available in your current context.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModuleTile({
  item,
  disabled,
  highlighted,
  onClick,
}: {
  item: SearchItem;
  disabled: boolean;
  highlighted: boolean;
  onClick: () => void;
}) {
  const Icon = item.isSettings ? Settings : Package;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      className={cn(
        "group relative min-h-40 overflow-hidden rounded-2xl border bg-card p-5 text-left shadow-sm transition-all",
        disabled
          ? "cursor-not-allowed border-border/80 opacity-70 hover:border-amber-500/30"
          : "border-border hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
        highlighted && "border-primary/50 ring-4 ring-primary/10"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        {disabled ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            <LockKeyhole className="h-3 w-3" /> Project required
          </span>
        ) : item.module?.read_only ? (
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
            Read only
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <p className="truncate text-base font-semibold text-foreground">{item.name}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {item.description || item.code}
        </p>
      </div>
      <ArrowRight
        className={cn(
          "absolute bottom-5 right-5 h-4 w-4 text-muted-foreground transition",
          !disabled && "group-hover:translate-x-1 group-hover:text-primary"
        )}
      />
    </button>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function WorkspaceHomeSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mx-auto h-8 w-72 animate-pulse rounded-lg bg-muted" />
      <div className="mx-auto mt-5 h-14 max-w-2xl animate-pulse rounded-2xl bg-muted" />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
