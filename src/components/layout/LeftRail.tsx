import {
  Building2,
  ClipboardCheck,
  GitBranch,
  Home,
  Landmark,
  Minus,
  Package,
  Route,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Shield,
  Tags,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  canAccessPlatformRoutes,
  canAccessWorkspaceRoutes,
  isPlatformSuperuser,
  useAuth,
} from "@/features/auth";
import { cn } from "@/lib/utils";

const PLATFORM_NAV = [
  {
    to: "/modules",
    label: "Module Studio",
    icon: Package,
  },
  {
    to: "/organization-provisioning",
    label: "Organization Provisioning",
    icon: Building2,
  },
  {
    to: "/organizations",
    label: "Organizations",
    icon: Landmark,
  },
] as const;

const PLATFORM_SUPERUSER_NAV = [
  { to: "/platform-setup", label: "Organization Setup", icon: Route },
  { to: "/taxonomy", label: "Taxonomy", icon: Tags },
  { to: "/workflows", label: "Workflow", icon: GitBranch },
  { to: "/checklists", label: "Checklist", icon: ClipboardCheck },
  { to: "/room-catalog", label: "Room & Flat Catalog", icon: Home },
] as const;

const WORKSPACE_NAV = [
  {
    to: "/workspace/organization",
    label: "Organization",
    icon: Building2,
  },
  {
    to: "/workspace/access",
    label: "People & Access",
    icon: Users,
  },
  {
    to: "/workspace/modules",
    label: "My Modules",
    icon: Package,
  },
] as const;

export function LeftRail() {
  const { user, organization } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);

  const showPlatform = canAccessPlatformRoutes(user);
  const showPlatformSetup = isPlatformSuperuser(user);
  const showWorkspace = canAccessWorkspaceRoutes(user, organization);
  const navItems = showPlatform
    ? showPlatformSetup
      ? [...PLATFORM_SUPERUSER_NAV, ...PLATFORM_NAV]
      : [...PLATFORM_NAV]
    : showWorkspace
      ? [...WORKSPACE_NAV]
      : [];
  const sectionLabel = showPlatform
    ? "Platform-Admin-Configurations"
    : showWorkspace
      ? "Workspace"
      : "Navigation";

  return (
    <aside
      aria-label="Primary"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "app-sidebar flex h-full shrink-0 flex-col transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[64px]" : "w-[232px]"
      )}
    >
      <div
        className={cn(
          "relative z-10 flex h-12 shrink-0 items-center",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-3"
        )}
      >
        {!collapsed && (
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
            {showWorkspace ? "Workspace" : "Platform"}
          </p>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className={cn("app-sidebar__rule relative z-10 shrink-0", collapsed ? "mx-2" : "mx-3")} />

      <nav
        className={cn(
          "app-sidebar-scroll relative z-10 flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-3",
          collapsed ? "px-2" : "px-2.5"
        )}
      >
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setSectionOpen((value) => !value)}
            className="mb-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-primary/5"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/40">
              {sectionLabel}
            </span>
            {sectionOpen ? (
              <Minus className="h-3.5 w-3.5 text-sidebar-foreground/40" />
            ) : (
              <Plus className="h-3.5 w-3.5 text-sidebar-foreground/40" />
            )}
          </button>
        ) : null}

        {!showPlatform && !showWorkspace && !collapsed ? (
          <div className="mx-1 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-3 text-[11px] leading-4 text-sidebar-foreground/60">
            <Shield className="mb-1.5 h-3.5 w-3.5" />
            Sign in with membership ID to open your organization workspace.
          </div>
        ) : null}

        {(collapsed || sectionOpen) &&
          navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "app-sidebar__item group relative flex items-center rounded-lg text-[13px] font-medium transition-colors",
                    collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2",
                    isActive
                      ? "is-active bg-primary/12 text-primary"
                      : "text-sidebar-foreground/70"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="app-sidebar__active-rail absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full z-50 ml-2.5 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
      </nav>
    </aside>
  );
}
