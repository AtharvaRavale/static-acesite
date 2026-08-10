import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Layers3,
  Loader2,
  LogOut,
} from "lucide-react";
import { authApi, useAuth } from "@/features/auth";
import {
  useWorkspace,
  type WorkspaceOrganization,
  type WorkspaceUnitNode,
} from "@/features/workspace";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function WorkspaceTopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const workspace = useWorkspace();
  const [openMenu, setOpenMenu] = useState<"org" | "role" | "project" | null>(
    null
  );
  const [expandedOrganizations, setExpandedOrganizations] = useState<Set<number>>(
    new Set()
  );
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!workspace.organization) return;
    setExpandedOrganizations((current) => {
      if (current.has(workspace.organization!.id)) return current;
      const next = new Set(current);
      next.add(workspace.organization!.id);
      return next;
    });
  }, [workspace.organization]);

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      "U"
    : "U";

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await authApi.logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="relative z-50 flex min-h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 shadow-sm">
      {openMenu ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setOpenMenu(null)}
        />
      ) : null}

      <div className="relative z-40 flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="hidden items-center gap-2 md:flex"
          onClick={() => navigate("/workspace")}
        >
          <Logo size={28} />
          <span className="font-logo text-lg tracking-tight text-foreground">
            Ace<span className="font-semibold text-muted-foreground/70">Site</span>
          </span>
        </button>

        <div className="hidden h-7 w-px bg-border md:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((value) => (value === "org" ? null : "org"))}
            className="flex h-11 min-w-0 max-w-[330px] items-center gap-2 rounded-xl border border-border bg-background px-2.5 text-left transition hover:border-primary/30 hover:bg-muted/40"
          >
            <OrgAvatar organization={workspace.organization} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                Organization
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">
                {workspace.organization?.name ?? "Select organization"}
                {workspace.organizationUnit
                  ? ` / ${workspace.organizationUnit.name}`
                  : ""}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                openMenu === "org" && "rotate-180"
              )}
            />
          </button>

          {openMenu === "org" ? (
            <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-[min(420px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
              <div className="border-b border-border px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Organization context
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick an organization root or one of your available units.
                </p>
              </div>
              <div className="max-h-[65vh] overflow-y-auto p-2">
                {workspace.organizations.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No active organization membership found.
                  </p>
                ) : (
                  workspace.organizations.map((organization) => {
                    const expanded = expandedOrganizations.has(organization.id);
                    const selected =
                      workspace.organization?.id === organization.id &&
                      workspace.organizationUnit === null;
                    return (
                      <div key={organization.id} className="mb-1 last:mb-0">
                        <div
                          className={cn(
                            "flex items-center rounded-xl",
                            selected ? "bg-primary/10" : "hover:bg-muted/60"
                          )}
                        >
                          <button
                            type="button"
                            aria-label={expanded ? "Collapse units" : "Expand units"}
                            disabled={organization.organization_units.length === 0}
                            onClick={() => {
                              setExpandedOrganizations((current) => {
                                const next = new Set(current);
                                if (next.has(organization.id)) next.delete(organization.id);
                                else next.add(organization.id);
                                return next;
                              });
                            }}
                            className="ml-1 flex h-9 w-8 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-25"
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              workspace.selectOrganizationContext(organization.id, null);
                              setOpenMenu(null);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2 px-1 py-2.5 pr-3 text-left"
                          >
                            <OrgAvatar organization={organization} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {organization.name}
                              </span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {organization.membership.membership_type === "owner"
                                  ? "Organization owner"
                                  : "Organization member"}
                              </span>
                            </span>
                            {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                          </button>
                        </div>
                        {expanded ? (
                          <UnitTree
                            nodes={organization.organization_units}
                            organization={organization}
                            selectedOrganizationId={workspace.organization?.id ?? null}
                            selectedUnitId={workspace.organizationUnit?.id ?? null}
                            canSelect={(unitId) =>
                              organization.id === workspace.organization?.id
                                ? workspace.isUnitSelectable(unitId)
                                : Boolean(findUnitById(organization.organization_units, unitId)?.selectable)
                            }
                            onSelect={(unitId) => {
                              workspace.selectOrganizationContext(organization.id, unitId);
                              setOpenMenu(null);
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
        </div>

        {workspace.organization && workspace.organization.top_roles.length > 0 ? (
          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() =>
                setOpenMenu((value) => (value === "role" ? null : "role"))
              }
              className="flex h-11 min-w-[190px] items-center gap-2 rounded-xl border border-border bg-background px-3 text-left transition hover:border-primary/30 hover:bg-muted/40"
            >
              <Layers3 className="h-4 w-4 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                  Access role
                </span>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {workspace.topRole?.name ?? "Select role"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {openMenu === "role" ? (
              <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-72 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
                {workspace.organization.top_roles.map((role) => (
                  <button
                    key={role.assignment_id}
                    type="button"
                    onClick={() => {
                      workspace.selectTopRole(role.assignment_id);
                      setOpenMenu(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted",
                      workspace.topRole?.assignment_id === role.assignment_id &&
                        "bg-primary/10"
                    )}
                  >
                    <Layers3 className="h-4 w-4 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {role.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {roleScopeLabel(role)}
                      </span>
                    </span>
                    {workspace.topRole?.assignment_id === role.assignment_id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative z-40 ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            disabled={!workspace.organization}
            onClick={() =>
              setOpenMenu((value) => (value === "project" ? null : "project"))
            }
            className="flex h-11 min-w-[190px] max-w-[320px] items-center gap-2 rounded-xl border border-border bg-background px-2.5 text-left transition hover:border-primary/30 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ProjectAvatar
              imageUrl={workspace.project?.image_url ?? null}
              name={workspace.project?.name ?? "Project"}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                Project
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">
                {workspace.isProjectsLoading
                  ? "Loading projects..."
                  : workspace.project?.name ?? "No project available"}
              </span>
            </span>
            {workspace.isProjectsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {openMenu === "project" ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl">
              <div className="border-b border-border px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Project context
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {workspace.organizationUnit
                    ? `${workspace.organization?.name} / ${workspace.organizationUnit.name}`
                    : workspace.organization?.name}
                </p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {workspace.projects.length === 0 ? (
                  <p className="px-3 py-7 text-center text-sm text-muted-foreground">
                    No accessible projects are available in this context.
                  </p>
                ) : (
                  workspace.projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        workspace.selectProject(project.id);
                        setOpenMenu(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted",
                        workspace.project?.id === project.id && "bg-primary/10"
                      )}
                    >
                      <ProjectAvatar imageUrl={project.image_url} name={project.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {project.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {project.project_number || project.code}
                          {project.organization_unit_name
                            ? ` • ${project.organization_unit_name}`
                            : ""}
                        </span>
                      </span>
                      {workspace.project?.id === project.id ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden h-7 w-px bg-border sm:block" />
        <div className="hidden min-w-0 text-right xl:block">
          <p className="max-w-40 truncate text-xs font-semibold text-foreground">
            {user?.first_name || user?.email}
          </p>
          <p className="max-w-40 truncate text-[10px] text-muted-foreground">
            {workspace.organization?.membership.membership_type === "owner"
              ? "Organization owner"
              : user?.email}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label="Logout"
          title="Logout"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </header>
  );
}

function OrgAvatar({ organization }: { organization: WorkspaceOrganization | null }) {
  if (organization?.logo_url) {
    return (
      <img
        src={organization.logo_url}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg border border-border object-cover"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Building2 className="h-4 w-4" />
    </span>
  );
}

function ProjectAvatar({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg border border-border object-cover"
      />
    );
  }
  return (
    <span
      title={name}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
    >
      <FolderKanban className="h-4 w-4" />
    </span>
  );
}

function findUnitById(nodes: WorkspaceUnitNode[], id: number): WorkspaceUnitNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findUnitById(node.children, id);
    if (child) return child;
  }
  return null;
}

function roleScopeLabel(role: import("@/features/workspace").WorkspaceTopRole) {
  const owner = role.partner_organization
    ? `Partner • ${role.partner_organization.name}`
    : "Organization";
  if (role.scope_type === "organization_unit") {
    return `${owner} • ${role.organization_unit_ids.length} unit${role.organization_unit_ids.length === 1 ? "" : "s"}`;
  }
  if (role.scope_type === "project") return `${owner} • One project`;
  return `${owner} • Entire scope`;
}

function UnitTree({
  nodes,
  organization,
  selectedOrganizationId,
  selectedUnitId,
  onSelect,
  canSelect,
  depth = 0,
}: {
  nodes: WorkspaceUnitNode[];
  organization: WorkspaceOrganization;
  selectedOrganizationId: number | null;
  selectedUnitId: number | null;
  onSelect: (unitId: number) => void;
  canSelect: (unitId: number) => boolean;
  depth?: number;
}) {
  return (
    <div className="ml-5 border-l border-border/70 pl-2">
      {nodes.map((node) => {
        const selected =
          selectedOrganizationId === organization.id && selectedUnitId === node.id;
        const selectable = canSelect(node.id);
        return (
          <div key={node.id}>
            <button
              type="button"
              disabled={!selectable}
              onClick={() => onSelect(node.id)}
              className={cn(
                "my-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left",
                selected ? "bg-primary/10 text-primary" : "hover:bg-muted/60",
                !selectable && "cursor-default opacity-55"
              )}
              style={{ paddingLeft: `${Math.min(depth, 4) * 10 + 10}px` }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-border" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {node.name}
                </span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {node.unit_type || node.code}
                  {!selectable ? " • outside selected role scope" : ""}
                </span>
              </span>
              {selected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </button>
            {node.children.length > 0 ? (
              <UnitTree
                nodes={node.children}
                organization={organization}
                selectedOrganizationId={selectedOrganizationId}
                selectedUnitId={selectedUnitId}
                onSelect={onSelect}
                canSelect={canSelect}
                depth={depth + 1}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
