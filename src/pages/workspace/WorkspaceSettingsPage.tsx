import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ContactRound,
  Eye,
  EyeOff,
  GripVertical,
  KeyRound,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/features/workspace";
import {
  useCreateTenantAssignment,
  useCreateTenantRole,
  useCreateTenantUser,
  useDeleteTenantAssignment,
  useDeleteTenantRole,
  useDeleteTenantUser,
  useReplaceTenantRolePermissions,
  useTenantAssignmentAction,
  useTenantAssignments,
  useTenantPermissionCatalog,
  useTenantRoles,
  useTenantRoleAction,
  useTenantRoleScopeOptions,
  useTenantSettingsBootstrap,
  useTenantUserAction,
  useTenantUsers,
  useUpdateTenantAssignment,
  useUpdateTenantRole,
  useUpdateTenantUser,
  type TenantMembershipRow,
  type TenantPermissionItem,
  type TenantPermissionModule,
  type TenantRole,
  type TenantRoleAssignmentScope,
  type TenantRoleKind,
} from "@/features/tenantSettings";
import {
  useCreateDepartment,
  useCreateOrganizationUnit,
  useCreatePartnerOrganization,
  useCreatePartnerOrganizationContact,
  useDeleteDepartment,
  useDepartmentAction,
  useDeleteOrganizationUnit,
  useOrganizationUnitAction,
  useDeletePartnerOrganization,
  usePartnerOrganizationAction,
  useDeletePartnerOrganizationContact,
  useSetPrimaryPartnerOrganizationContact,
  useDepartments,
  useOrganizationUnits,
  usePartnerOrganizationContacts,
  usePartnerOrganizations,
  useUpdateDepartment,
  useUpdateOrganizationUnit,
  useUpdatePartnerOrganization,
  useUpdatePartnerOrganizationContact,
  type PartnerType,
  type OrganizationUnit,
  type UnitType,
} from "@/features/organizations";

type Section =
  | "overview"
  | "people"
  | "roles"
  | "units"
  | "departments"
  | "partners";

const UNIT_TYPES: { value: UnitType; label: string }[] = [
  ["holding_company", "Holding company"],
  ["legal_entity", "Legal entity"],
  ["business_unit", "Business unit"],
  ["region", "Region"],
  ["zone", "Zone"],
  ["branch", "Branch"],
  ["site_office", "Site office"],
  ["other", "Other"],
].map(([value, label]) => ({ value: value as UnitType, label }));

const PARTNER_TYPES: { value: PartnerType; label: string }[] = [
  ["contractor", "Contractor"],
  ["subcontractor", "Subcontractor"],
  ["consultant", "Consultant"],
  ["supplier", "Supplier"],
  ["architect", "Architect"],
  ["engineer", "Engineer"],
  ["client_representative", "Client representative"],
  ["government_agency", "Government agency"],
  ["vendor", "Vendor"],
  ["other", "Other"],
].map(([value, label]) => ({ value: value as PartnerType, label }));

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function WorkspaceSettingsPage() {
  const navigate = useNavigate();
  const { settingsSection } = useParams<{ settingsSection?: string }>();
  const workspace = useWorkspace();
  const organizationId = workspace.organization?.id ?? null;
  const bootstrap = useTenantSettingsBootstrap(organizationId);
  const allowedSections: Section[] = [
    "overview",
    "people",
    "roles",
    "units",
    "departments",
    "partners",
  ];
  const requestedSection = (settingsSection || "overview") as Section;
  const section: Section = allowedSections.includes(requestedSection)
    ? requestedSection
    : "overview";
  const openSection = (next: Section) => {
    navigate(next === "overview" ? "/workspace/settings" : `/workspace/settings/${next}`);
  };

  if (!workspace.canAccessSettings) {
    return (
      <CenteredMessage
        icon={<ShieldCheck className="h-9 w-9" />}
        title="Settings access is not available"
        message="Your selected organization role does not grant access to tenant settings."
        action={() => navigate("/workspace")}
        actionLabel="Back to workspace"
      />
    );
  }

  if (!organizationId || !workspace.organization) {
    return (
      <CenteredMessage
        icon={<Building2 className="h-9 w-9" />}
        title="Select an organization"
        message="Choose an organization from the navbar before opening settings."
        action={() => navigate("/workspace")}
        actionLabel="Back to workspace"
      />
    );
  }

  if (bootstrap.isLoading) {
    return <SettingsSkeleton />;
  }

  if (bootstrap.error || !bootstrap.data) {
    return (
      <CenteredMessage
        icon={<ShieldCheck className="h-9 w-9" />}
        title="Settings could not be loaded"
        message={getApiErrorMessage(bootstrap.error, "Unable to load organization settings access.")}
        action={() => void bootstrap.refetch()}
        actionLabel="Retry"
      />
    );
  }

  const permissionMap = bootstrap.data.permissions;
  const partnersEnabled = bootstrap.data.organization.partners_enabled;
  const menu = [
    { id: "overview" as const, label: "Overview", icon: Settings2, visible: true },
    {
      id: "people" as const,
      label: "People & Access",
      icon: UsersRound,
      visible: Boolean(permissionMap["account.user.view"]),
    },
    {
      id: "roles" as const,
      label: "Roles & Permissions",
      icon: ShieldCheck,
      visible: Boolean(permissionMap["account.role.view"]),
    },
    {
      id: "units" as const,
      label: "Organization Units",
      icon: Building2,
      visible: Boolean(permissionMap["organization.unit.view"]),
    },
    {
      id: "departments" as const,
      label: "Departments",
      icon: Layers3,
      visible: Boolean(permissionMap["organization.department.view"]),
    },
    {
      id: "partners" as const,
      label: "Partner Directory",
      icon: ContactRound,
      visible:
        partnersEnabled &&
        Boolean(permissionMap["organization.partner.view"]),
    },
  ].filter((item) => item.visible);
  const sectionAllowed = menu.some((item) => item.id === section);

  return (
    <div className="flex min-h-full bg-muted/20">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <div className="border-b border-border p-4">
          <button
            type="button"
            onClick={() => navigate("/workspace")}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Workspace
          </button>
          <p className="mt-4 truncate font-logo text-xl text-foreground">
            {workspace.organization.name}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.13em] text-muted-foreground">
            Organization settings
          </p>
        </div>
        <nav className="space-y-1 p-3">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => openSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                  section === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-border bg-card px-5 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {menu.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => openSection(item.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-xs font-semibold",
                  section === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-9">
          {!sectionAllowed ? (
            <CenteredMessage
              icon={<ShieldCheck className="h-9 w-9" />}
              title="Permission required"
              message="Your selected organization role does not grant view access to this settings page."
              action={() => openSection("overview")}
              actionLabel="Back to settings"
            />
          ) : section === "overview" ? (
            <OverviewPanel
              organizationName={workspace.organization.name}
              flow={bootstrap.data.organization.flow}
              permissionMap={permissionMap}
            />
          ) : null}
          {sectionAllowed && section === "people" ? (
            <PeoplePanel organizationId={organizationId} permissions={permissionMap} />
          ) : null}
          {sectionAllowed && section === "roles" ? (
            <RolesPanel organizationId={organizationId} permissions={permissionMap} partnersEnabled={partnersEnabled} />
          ) : null}
          {sectionAllowed && section === "units" ? (
            <UnitsPanel organizationId={organizationId} organizationName={workspace.organization.name} permissions={permissionMap} />
          ) : null}
          {sectionAllowed && section === "departments" ? (
            <DepartmentsPanel organizationId={organizationId} permissions={permissionMap} partnersEnabled={partnersEnabled} />
          ) : null}
          {sectionAllowed && section === "partners" && partnersEnabled ? (
            <PartnersPanel organizationId={organizationId} permissions={permissionMap} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel({
  organizationName,
  flow,
  permissionMap,
}: {
  organizationName: string;
  flow: string;
  permissionMap: Record<string, boolean>;
}) {
  const grants = Object.entries(permissionMap).filter(([, allowed]) => allowed).length;
  return (
    <PanelHeader
      eyebrow="Settings"
      title={organizationName}
      description="Tenant administration is isolated to this organization and your active organization-level permission scope."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Organization flow" value={flow.replaceAll("_", " ")} />
        <Stat title="Admin grants" value={String(grants)} />
        <Stat title="Permission boundary" value="Current organization" />
      </div>
    </PanelHeader>
  );
}

function roleKindFor(role: TenantRole | null | undefined): TenantRoleKind {
  if (role?.scope_kind === "partner_organization") return "partner_organization";
  if (role?.scope_kind === "organization_module") return "organization_module";
  return "organization";
}

function PeoplePanel({
  organizationId,
  permissions,
}: {
  organizationId: number;
  permissions: Record<string, boolean>;
}) {
  const canCreate = Boolean(permissions["account.user.create"]);
  const canUpdate = Boolean(permissions["account.user.update"]);
  const canDelete = Boolean(permissions["account.user.delete"]);
  const canActivate = Boolean(permissions["account.user.activate"]);
  const canDeactivate = Boolean(permissions["account.user.deactivate"]);
  const canResetPassword = Boolean(permissions["account.user.reset_password"]);
  const canViewRoles = Boolean(permissions["account.role.view"]);
  const canViewAssignments = Boolean(permissions["account.role_assignment.view"]);

  const users = useTenantUsers(organizationId, true);
  const roles = useTenantRoles(organizationId, canViewRoles);
  const assignments = useTenantAssignments(organizationId, canViewAssignments);
  const createUser = useCreateTenantUser();
  const updateUser = useUpdateTenantUser();
  const deleteUser = useDeleteTenantUser();
  const userAction = useTenantUserAction();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "", password: "" });
  const [editingMembershipId, setEditingMembershipId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [resetMembershipId, setResetMembershipId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const selectedUserId = Number(searchParams.get("user") || 0) || null;
  const selectedRoleId = Number(searchParams.get("role") || 0) || null;

  const openUser = (userId: number) => {
    const next = new URLSearchParams(searchParams);
    if (selectedUserId === userId) {
      next.delete("user");
      next.delete("role");
    } else {
      next.set("user", String(userId));
      next.delete("role");
    }
    setSearchParams(next, { replace: true });
  };

  const openRole = (userId: number, roleId: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("user", String(userId));
    if (selectedRoleId === roleId) next.delete("role");
    else next.set("role", String(roleId));
    setSearchParams(next, { replace: true });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createUser.mutateAsync({ organization: organizationId, ...form });
    setForm({ email: "", first_name: "", last_name: "", phone: "", password: "" });
    setShowCreate(false);
  };

  const startEdit = (row: TenantMembershipRow) => {
    setEditingMembershipId(row.membership_id);
    setEditForm({
      first_name: row.user.first_name || "",
      last_name: row.user.last_name || "",
      phone: row.user.phone || "",
    });
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingMembershipId) return;
    await updateUser.mutateAsync({
      organization: organizationId,
      membershipId: editingMembershipId,
      payload: editForm,
    });
    setEditingMembershipId(null);
  };

  const submitPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetMembershipId || !resetPassword) return;
    await userAction.mutateAsync({
      organization: organizationId,
      membershipId: resetMembershipId,
      action: "reset-password",
      payload: { password: resetPassword },
    });
    setResetMembershipId(null);
    setResetPassword("");
  };

  return (
    <PanelHeader
      eyebrow="People & Access"
      title="Organization users"
      description="Every control is permission-driven. CRUD permissions govern the membership/user record; explicit actions such as deactivate or reset password use separate action permissions."
    >
      <ActionRow canManage={canCreate} label="Add user" onClick={() => setShowCreate((v) => !v)} />

      {showCreate && canCreate ? (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Email" required value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} type="email" />
          <Field label="First name" value={form.first_name} onChange={(first_name) => setForm((f) => ({ ...f, first_name }))} />
          <Field label="Last name" value={form.last_name} onChange={(last_name) => setForm((f) => ({ ...f, last_name }))} />
          <Field label="Phone" value={form.phone} onChange={(phone) => setForm((f) => ({ ...f, phone }))} />
          <PasswordField label="Initial password (optional)" value={form.password} onChange={(password) => setForm((f) => ({ ...f, password }))} />
          <div className="flex items-end"><PrimaryButton pending={createUser.isPending} label="Create membership" /></div>
          {createUser.error ? <FormError error={createUser.error} /> : null}
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {users.isLoading || (canViewRoles && roles.isLoading) || (canViewAssignments && assignments.isLoading) ? <RowLoading /> : null}
        {!users.isLoading && (users.data ?? []).map((row) => {
          const isOpen = selectedUserId === row.user.id;
          const userAssignments = canViewAssignments
            ? (assignments.data ?? []).filter((assignment) => assignment.user === row.user.id)
            : [];
          const isOwner = row.membership_type === "owner";
          const active = row.status === "active" && row.is_active;
          return (
            <div key={row.membership_id} className="border-b border-border last:border-b-0">
              <div className={cn("flex items-center gap-2 px-4 py-3 transition hover:bg-muted/40", isOpen && "bg-primary/5")}>
                <button type="button" onClick={() => openUser(row.user.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleUserRound className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{row.user.full_name || row.user.email}</span>
                    <span className="block truncate text-xs text-muted-foreground">{row.user.email}</span>
                  </span>
                  <span className={cn("hidden rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase sm:inline-flex", active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>{row.status}</span>
                  <span className="hidden rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase text-muted-foreground md:inline-flex">{row.membership_type}</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {!isOwner ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {canUpdate ? <IconButton title="Edit user" onClick={() => startEdit(row)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
                    {active && canDeactivate ? <IconButton title="Deactivate membership" onClick={() => userAction.mutate({ organization: organizationId, membershipId: row.membership_id, action: "deactivate" })}><PowerOff className="h-3.5 w-3.5" /></IconButton> : null}
                    {!active && canActivate ? <IconButton title="Activate membership" onClick={() => userAction.mutate({ organization: organizationId, membershipId: row.membership_id, action: "activate" })}><Power className="h-3.5 w-3.5" /></IconButton> : null}
                    {canResetPassword ? <IconButton title="Reset password" onClick={() => { setResetMembershipId(row.membership_id); setResetPassword(""); }}><KeyRound className="h-3.5 w-3.5" /></IconButton> : null}
                    {canDelete ? <IconButton destructive title="Remove from organization" onClick={() => { if (window.confirm(`Remove ${row.user.email} from this organization?`)) deleteUser.mutate({ organization: organizationId, membershipId: row.membership_id }); }}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
                  </div>
                ) : null}
              </div>

              {editingMembershipId === row.membership_id && canUpdate ? (
                <form onSubmit={submitEdit} className="grid gap-3 border-t border-border bg-muted/10 p-4 md:grid-cols-4">
                  <Field label="First name" value={editForm.first_name} onChange={(first_name) => setEditForm((f) => ({ ...f, first_name }))} />
                  <Field label="Last name" value={editForm.last_name} onChange={(last_name) => setEditForm((f) => ({ ...f, last_name }))} />
                  <Field label="Phone" value={editForm.phone} onChange={(phone) => setEditForm((f) => ({ ...f, phone }))} />
                  <div className="flex items-end gap-2"><PrimaryButton pending={updateUser.isPending} label="Save user" /><SecondaryButton label="Cancel" onClick={() => setEditingMembershipId(null)} /></div>
                  {updateUser.error ? <FormError error={updateUser.error} /> : null}
                </form>
              ) : null}

              {resetMembershipId === row.membership_id && canResetPassword ? (
                <form onSubmit={submitPasswordReset} className="grid gap-3 border-t border-border bg-muted/10 p-4 md:grid-cols-[1fr_auto]">
                  <PasswordField label="New password" value={resetPassword} onChange={setResetPassword} />
                  <div className="flex items-end gap-2"><PrimaryButton pending={userAction.isPending} label="Reset password" /><SecondaryButton label="Cancel" onClick={() => setResetMembershipId(null)} /></div>
                  {userAction.error ? <FormError error={userAction.error} /> : null}
                </form>
              ) : null}

              {isOpen ? (
                <div className="border-t border-border bg-muted/15 px-4 py-4 sm:px-6">
                  {isOwner ? <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">Organization Owner access is membership-based and bypasses tenant Settings permission checks inside this organization.</div> : null}
                  {!canViewAssignments ? <Empty label="You do not have permission to view role assignments." /> : null}
                  {canViewAssignments ? (
                    <div className="space-y-2">
                      {userAssignments.map((assignment) => {
                        const role = (roles.data ?? []).find((item) => item.id === assignment.role);
                        const roleOpen = selectedRoleId === assignment.role;
                        return (
                          <div key={assignment.id} className="overflow-hidden rounded-xl border border-border bg-card">
                            <button type="button" disabled={!canViewRoles} onClick={() => canViewRoles && openRole(row.user.id, assignment.role)} className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/40 disabled:cursor-default">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-foreground">{assignment.role_name}</span>
                                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{assignment.scope_type === "organization_unit" ? assignment.organization_unit_names.join(", ") || "Selected units" : assignment.scope_type === "project" ? assignment.scoped_project_name || "Selected project" : assignment.partner_organization_name ? `Partner scope • ${assignment.partner_organization_name}` : "Entire organization"}</span>
                              </span>
                              {canViewRoles ? (roleOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />) : null}
                            </button>
                            {roleOpen && canViewRoles ? <PeopleRolePermissions organizationId={organizationId} role={role ?? null} roleId={assignment.role} /> : null}
                          </div>
                        );
                      })}
                      {userAssignments.length === 0 ? <Empty label="No role assignments for this user." /> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
        {!users.isLoading && users.data?.length === 0 ? <Empty label="No organization users yet." /> : null}
      </div>
    </PanelHeader>
  );
}

function PeopleRolePermissions({
  organizationId,
  role,
  roleId,
}: {
  organizationId: number;
  role: TenantRole | null;
  roleId: number;
}) {
  const catalog = useTenantPermissionCatalog(
    organizationId,
    roleId,
    roleKindFor(role),
    true
  );

  if (catalog.isLoading) {
    return <div className="border-t border-border p-4"><RowLoading /></div>;
  }
  if (catalog.error) {
    return <div className="border-t border-border p-4"><FormError error={catalog.error} /></div>;
  }

  const modules = (catalog.data?.modules ?? [])
    .map((module) => ({
      ...module,
      groups: module.groups
        .map((group) => ({ ...group, permissions: group.permissions.filter((permission) => permission.selected) }))
        .filter((group) => group.permissions.length > 0),
    }))
    .filter((module) => module.groups.length > 0);

  return (
    <div className="border-t border-border bg-background p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Granted permissions</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {modules.map((module) => (
          <div key={module.module_id} className="rounded-xl border border-border bg-muted/15 p-3">
            <p className="text-xs font-bold text-foreground">{module.module_name}</p>
            <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{module.module_code}</p>
            <div className="mt-3 space-y-3">
              {module.groups.map((group) => (
                <div key={`${module.module_id}-${group.name}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {group.permissions.map((permission) => (
                      <span key={permission.id} title={permission.description} className="rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-semibold text-foreground">
                        {permission.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {modules.length === 0 ? <Empty label="This role currently has no allowed permissions." /> : null}
      </div>
    </div>
  );
}

function RolesPanel({
  organizationId,
  permissions,
  partnersEnabled,
}: {
  organizationId: number;
  permissions: Record<string, boolean>;
  partnersEnabled: boolean;
}) {
  const canCreateRole = Boolean(permissions["account.role.create"]);
  const canUpdateRole = Boolean(permissions["account.role.update"]);
  const canDeleteRole = Boolean(permissions["account.role.delete"]);
  const canAssignPermission = Boolean(permissions["account.role.permission.assign"]);
  const canRemovePermission = Boolean(permissions["account.role.permission.remove"]);
  const canActivateRole = Boolean(permissions["account.role.activate"]);
  const canDeactivateRole = Boolean(permissions["account.role.deactivate"]);
  const canViewAssignments = Boolean(permissions["account.role_assignment.view"]);
  const canViewUsers = Boolean(permissions["account.user.view"]);
  const canCreateAssignment = Boolean(permissions["account.role_assignment.create"]);
  const canUpdateAssignment = Boolean(permissions["account.role_assignment.update"]);
  const canDeleteAssignment = Boolean(permissions["account.role_assignment.delete"]);
  const canRevokeAssignment = Boolean(permissions["account.role_assignment.revoke"]);
  const canActivateAssignment = Boolean(permissions["account.role_assignment.activate"]);
  const canDeactivateAssignment = Boolean(permissions["account.role_assignment.deactivate"]);

  const roles = useTenantRoles(organizationId);
  const users = useTenantUsers(organizationId, canViewUsers && (canCreateAssignment || canUpdateAssignment));
  const assignments = useTenantAssignments(organizationId, canViewAssignments);
  const canViewPartnersForRole = partnersEnabled && Boolean(permissions["organization.partner.view"]);
  const partners = usePartnerOrganizations(
    { organization: organizationId, page_size: 200, is_active: true },
    canViewPartnersForRole
  );
  const createRole = useCreateTenantRole();
  const updateRole = useUpdateTenantRole();
  const deleteRole = useDeleteTenantRole();
  const roleAction = useTenantRoleAction();
  const savePermissions = useReplaceTenantRolePermissions();
  const createAssignment = useCreateTenantAssignment();
  const updateAssignment = useUpdateTenantAssignment();
  const deleteAssignment = useDeleteTenantAssignment();
  const assignmentAction = useTenantAssignmentAction();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const selectedRole = roles.data?.find((role) => role.id === selectedRoleId) ?? null;
  const roleKind: TenantRoleKind = selectedRole?.scope_kind === "partner_organization"
    ? "partner_organization"
    : selectedRole?.scope_kind === "organization_module"
      ? "organization_module"
      : "organization";
  const catalog = useTenantPermissionCatalog(organizationId, selectedRoleId, roleKind, Boolean(selectedRoleId));
  // Always load the organization permission/module library. The previous
  // !selectedRoleId condition disabled this request as soon as the first role
  // auto-selected, which made the Create Role module dropdown depend on the
  // selected role instead of the organization's complete enabled module set.
  const libraryCatalog = useTenantPermissionCatalog(organizationId, null, "organization", true);
  const permissionModules = catalog.data?.modules ?? libraryCatalog.data?.modules ?? [];
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [initialPermissionIds, setInitialPermissionIds] = useState<number[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editRoleForm, setEditRoleForm] = useState({ name: "", description: "" });
  const [roleForm, setRoleForm] = useState({ role_kind: "organization" as TenantRoleKind, name: "", description: "", module: "", partner: "" });

  const [assignmentForm, setAssignmentForm] = useState({ user: "", role: "", scope: "organization" as TenantRoleAssignmentScope, units: [] as number[], project: "" });
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [assignmentRoleType, setAssignmentRoleType] = useState<"system" | "module" | "partner">("system");
  const [assignmentModule, setAssignmentModule] = useState("");
  const assignmentRoleId = assignmentForm.role ? Number(assignmentForm.role) : null;
  const scopeOptions = useTenantRoleScopeOptions(organizationId, assignmentRoleId, Boolean(assignmentRoleId));

  useEffect(() => {
    if (!selectedRoleId && roles.data?.length) setSelectedRoleId(roles.data[0].id);
  }, [roles.data, selectedRoleId]);

  useEffect(() => {
    if (!catalog.data || !selectedRoleId) return;
    const ids = catalog.data.modules.flatMap((module) =>
      module.groups.flatMap((group) => group.permissions.filter((permission) => permission.selected).map((permission) => permission.id))
    );
    setSelectedPermissionIds(ids);
    setInitialPermissionIds(ids);
  }, [catalog.data, selectedRoleId]);

  const permissionIndex = useMemo(() => {
    const map = new Map<number, TenantPermissionItem>();
    permissionModules.forEach((module) => module.groups.forEach((group) => group.permissions.forEach((permission) => map.set(permission.id, permission))));
    return map;
  }, [permissionModules]);

  const addPermissions = (ids: number[]) => {
    if (!canAssignPermission) return;
    setSelectedPermissionIds((current) => Array.from(new Set([...current, ...ids])));
  };

  const submitRole = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await createRole.mutateAsync({
      organization: organizationId,
      role_kind: roleForm.role_kind,
      name: roleForm.name,
      code: slug(roleForm.name),
      description: roleForm.description,
      module: roleForm.role_kind === "organization_module" ? Number(roleForm.module) : undefined,
      partner_organization: roleForm.role_kind === "partner_organization" ? Number(roleForm.partner) : undefined,
    });
    setSelectedRoleId(created.id);
    setRoleForm({ role_kind: "organization", name: "", description: "", module: "", partner: "" });
    setShowCreateRole(false);
  };

  const startRoleEdit = () => {
    if (!selectedRole) return;
    setEditingRoleId(selectedRole.id);
    setEditRoleForm({ name: selectedRole.name, description: selectedRole.description || "" });
  };

  const submitRoleEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRole || editingRoleId !== selectedRole.id) return;
    await updateRole.mutateAsync({
      organization: organizationId,
      role: selectedRole.id,
      payload: {
        name: editRoleForm.name,
        code: slug(editRoleForm.name),
        description: editRoleForm.description,
      },
    });
    setEditingRoleId(null);
  };

  const submitAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      organization: organizationId,
      user: Number(assignmentForm.user),
      role: Number(assignmentForm.role),
      scope_type: assignmentForm.scope,
      organization_units: assignmentForm.scope === "organization_unit" ? assignmentForm.units : [],
      scoped_project: assignmentForm.scope === "project" ? Number(assignmentForm.project) : null,
      is_active: true,
    };
    if (editingAssignmentId) {
      await updateAssignment.mutateAsync({ organization: organizationId, assignment: editingAssignmentId, payload });
    } else {
      await createAssignment.mutateAsync(payload);
    }
    setEditingAssignmentId(null);
    setAssignmentRoleType("system");
    setAssignmentModule("");
    setAssignmentForm({ user: "", role: "", scope: "organization", units: [], project: "" });
    setAssignmentDrawerOpen(false);
  };

  const startAssignmentEdit = (assignment: { id: number; user: number; role: number; scope_type: string; organization_units: number[]; scoped_project: number | null }) => {
    if (!canUpdateAssignment) return;
    const assignedRole = roles.data?.find((role) => role.id === assignment.role) ?? null;
    const nextRoleType = assignedRole?.scope_kind === "organization_module"
      ? "module"
      : assignedRole?.scope_kind === "partner_organization"
        ? "partner"
        : "system";
    setAssignmentRoleType(nextRoleType);
    setAssignmentModule(assignedRole?.module ? String(assignedRole.module) : "");
    setEditingAssignmentId(assignment.id);
    setAssignmentDrawerOpen(true);
    setAssignmentForm({
      user: String(assignment.user),
      role: String(assignment.role),
      scope: assignment.scope_type as TenantRoleAssignmentScope,
      units: assignment.organization_units ?? [],
      project: assignment.scoped_project ? String(assignment.scoped_project) : "",
    });
  };

  // User-role assignment supports both organization top roles and organization-module roles.
  // Do not filter module roles out here: Inspector / Repairer / Reviewer etc. are valid
  // UserRoleAssignment targets and are intentionally scoped by their ProductModule.
  const assignableRoles = (roles.data ?? []).filter((role) => role.is_active !== false);
  const topRoles = assignableRoles.filter((role) => role.scope_kind === "organization" && role.module === null);
  const moduleRoles = assignableRoles.filter((role) => role.scope_kind === "organization_module" && role.module !== null);
  const partnerRoles = assignableRoles.filter((role) => role.scope_kind === "partner_organization");
  // The Create Organization Module Role dropdown must come directly from
  // OrganizationModule, never from the selected role's filtered permission tree.
  // The backend exposes this as available_modules so every enabled/read-only
  // module owned by the organization is always selectable.
  const moduleChoices = (libraryCatalog.data?.available_modules ?? []).map((module) => ({
    id: module.module_id,
    name: module.module_name,
    code: module.module_code,
    status: module.status,
  }));
  const assignmentModuleChoices = moduleChoices.filter((module) =>
    moduleRoles.some((role) => role.module === module.id)
  );
  const filteredAssignmentRoles = assignmentRoleType === "module"
    ? moduleRoles.filter((role) => assignmentModule && role.module === Number(assignmentModule))
    : assignmentRoleType === "partner"
      ? partnerRoles
      : topRoles;

  const initialPermissionSet = new Set(initialPermissionIds);
  const selectedPermissionSet = new Set(selectedPermissionIds);
  const addedPermissionIds = selectedPermissionIds.filter((id) => !initialPermissionSet.has(id));
  const removedPermissionIds = initialPermissionIds.filter((id) => !selectedPermissionSet.has(id));
  const hasPermissionChanges = addedPermissionIds.length > 0 || removedPermissionIds.length > 0;
  const canSavePermissionChanges =
    hasPermissionChanges &&
    (addedPermissionIds.length === 0 || canAssignPermission) &&
    (removedPermissionIds.length === 0 || canRemovePermission);

  return (
    <PanelHeader eyebrow="Roles & Permissions" title="Tenant RBAC" description="Build roles from only this organization's enabled modules, then assign each role at organization, multi-unit, or project scope.">
      <div className="flex flex-wrap items-center gap-2">
        <ActionRow canManage={canCreateRole} label="Create role" onClick={() => setShowCreateRole((v) => !v)} />
        {canCreateAssignment ? (
          <button
            type="button"
            onClick={() => {
              setEditingAssignmentId(null);
              setAssignmentRoleType("system");
              setAssignmentModule("");
              setAssignmentForm({ user: "", role: "", scope: "organization", units: [], project: "" });
              setAssignmentDrawerOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <UserPlus className="h-3.5 w-3.5" /> Assign role to user
          </button>
        ) : null}
      </div>
      {showCreateRole && canCreateRole ? (
        <form onSubmit={submitRole} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField label="Role type" value={roleForm.role_kind} onChange={(role_kind) => setRoleForm((f) => ({ ...f, role_kind: role_kind as TenantRoleKind }))} options={[
            { value: "organization", label: "Organization top role" },
            { value: "organization_module", label: "Organization module role" },
            ...(partnersEnabled ? [{ value: "partner_organization", label: "Partner organization role" }] : []),
          ]} />
          <Field label="Role name" required value={roleForm.name} onChange={(name) => setRoleForm((f) => ({ ...f, name }))} />
          {roleForm.role_kind === "organization_module" ? (
            <SelectField label="Module" required value={roleForm.module} onChange={(module) => setRoleForm((f) => ({ ...f, module }))} options={moduleChoices.map((item) => ({ value: String(item.id), label: `${item.name} (${item.code})` }))} />
          ) : null}
          {roleForm.role_kind === "partner_organization" ? (
            <SelectField label="Partner organization" required value={roleForm.partner} onChange={(partner) => setRoleForm((f) => ({ ...f, partner }))} options={(partners.data?.results ?? []).map((item) => ({ value: String(item.id), label: item.name }))} />
          ) : null}
          <Field label="Description" value={roleForm.description} onChange={(description) => setRoleForm((f) => ({ ...f, description }))} />
          <div className="flex items-end"><PrimaryButton pending={createRole.isPending} label="Create role" /></div>
          {createRole.error ? <FormError error={createRole.error} /> : null}
        </form>
      ) : null}

      <div className="grid min-h-[590px] gap-4 xl:grid-cols-[260px_minmax(340px,1fr)_minmax(360px,1fr)]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Roles</p>
          <div className="space-y-1">
            {roles.data?.map((role) => (
              <button
                key={role.id}
                type="button"
                draggable={canCreateAssignment}
                onDragStart={(event) => event.dataTransfer.setData("application/x-acesite-role", String(role.id))}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left", selectedRoleId === role.id ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{role.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{role.partner_organization_name ? `Partner • ${role.partner_organization_name}` : role.module_code ? `Module • ${role.module_code}` : "Organization top role"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Permission library</p>
          <p className="px-2 pb-3 text-xs text-muted-foreground">Permissions are loaded only from ProductModules enabled for this organization. Drag a group or one permission onto the selected role.</p>
          <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
            {permissionModules.map((module) => (
              <PermissionLibraryModule
                key={module.module_id}
                module={module}
                expanded={expandedModules.has(module.module_id)}
                expandedGroups={expandedGroups}
                onToggleModule={() => setExpandedModules((current) => toggleSet(current, module.module_id))}
                onToggleGroup={(key) => setExpandedGroups((current) => toggleSet(current, key))}
                onAdd={addPermissions}
                draggable={canAssignPermission && Boolean(selectedRole)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="order-2 rounded-2xl border border-dashed border-primary/30 bg-card p-4"
            onDragOver={(event) => { if (canAssignPermission && selectedRole) event.preventDefault(); }}
            onDrop={(event) => {
              event.preventDefault();
              const raw = event.dataTransfer.getData("application/x-acesite-permissions");
              if (!raw) return;
              try { addPermissions(JSON.parse(raw)); } catch { /* ignore bad drag payload */ }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedRole?.name ?? "Select a role"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedRole ? `${selectedPermissionIds.length} permissions attached` : "Choose a role before editing permissions."}</p>
                {selectedRole ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {canUpdateRole ? <SmallAction label="Edit" icon={<Pencil className="h-3 w-3" />} onClick={startRoleEdit} /> : null}
                    {selectedRole.is_active && canDeactivateRole ? <SmallAction label="Deactivate" icon={<PowerOff className="h-3 w-3" />} onClick={() => roleAction.mutate({ organization: organizationId, role: selectedRole.id, action: "deactivate" })} /> : null}
                    {!selectedRole.is_active && canActivateRole ? <SmallAction label="Activate" icon={<Power className="h-3 w-3" />} onClick={() => roleAction.mutate({ organization: organizationId, role: selectedRole.id, action: "activate" })} /> : null}
                    {canDeleteRole ? <SmallAction destructive label="Delete" icon={<Trash2 className="h-3 w-3" />} onClick={() => { if (window.confirm(`Delete role ${selectedRole.name}?`)) deleteRole.mutate({ organization: organizationId, role: selectedRole.id }); }} /> : null}
                  </div>
                ) : null}
              </div>
              {selectedRole && (canAssignPermission || canRemovePermission) ? (
                <button type="button" disabled={savePermissions.isPending || !canSavePermissionChanges} onClick={() => savePermissions.mutate({ organization: organizationId, role: selectedRole.id, permissionIds: selectedPermissionIds })} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {savePermissions.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                </button>
              ) : null}
            </div>
            {selectedRole && editingRoleId === selectedRole.id && canUpdateRole ? (
              <form onSubmit={submitRoleEdit} className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/15 p-3">
                <Field label="Role name" required value={editRoleForm.name} onChange={(name) => setEditRoleForm((f) => ({ ...f, name }))} />
                <Field label="Description" value={editRoleForm.description} onChange={(description) => setEditRoleForm((f) => ({ ...f, description }))} />
                <div className="flex gap-2"><PrimaryButton pending={updateRole.isPending} label="Save role" /><SecondaryButton label="Cancel" onClick={() => setEditingRoleId(null)} /></div>
                {updateRole.error ? <FormError error={updateRole.error} /> : null}
              </form>
            ) : null}
            <div className="mt-4 flex min-h-28 flex-wrap content-start gap-2 rounded-xl bg-muted/40 p-3">
              {selectedPermissionIds.map((id) => {
                const permission = permissionIndex.get(id);
                if (!permission) return null;
                return (
                  <span key={id} className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
                    {permission.label}
                    {canRemovePermission ? <button type="button" onClick={() => setSelectedPermissionIds((current) => current.filter((item) => item !== id))} className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button> : null}
                  </span>
                );
              })}
              {selectedRole && selectedPermissionIds.length === 0 ? <p className="text-xs text-muted-foreground">Drop permission groups here.</p> : null}
            </div>
            {savePermissions.error ? <FormError error={savePermissions.error} /> : null}
          </div>

          {canViewAssignments ? (
          <div className="order-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-foreground">Current assignments</p>
            <div className="mt-3 space-y-2">
              {assignments.data?.map((assignment) => (
                <div key={assignment.id} className="flex items-start gap-3 rounded-xl bg-muted/40 px-3 py-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{assignment.user_email} • {assignment.role_name}</p>
                    <p className="mt-1 text-muted-foreground">{assignment.scope_type === "organization_unit" ? `${assignment.organization_unit_names.join(", ") || "Units"}` : assignment.scope_type === "project" ? assignment.scoped_project_name || "Project" : assignment.partner_organization_name ? `Entire partner scope • ${assignment.partner_organization_name}` : "Entire organization"}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {canUpdateAssignment ? <IconButton label="Edit assignment" onClick={() => startAssignmentEdit(assignment)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
                    {assignment.is_active && canDeactivateAssignment ? <IconButton label="Deactivate assignment" onClick={() => assignmentAction.mutate({ organization: organizationId, assignment: assignment.id, action: "deactivate" })}><PowerOff className="h-3.5 w-3.5" /></IconButton> : null}
                    {!assignment.is_active && canActivateAssignment ? <IconButton label="Activate assignment" onClick={() => assignmentAction.mutate({ organization: organizationId, assignment: assignment.id, action: "activate" })}><Power className="h-3.5 w-3.5" /></IconButton> : null}
                    {assignment.is_active && canRevokeAssignment ? <SmallAction label="Revoke" onClick={() => assignmentAction.mutate({ organization: organizationId, assignment: assignment.id, action: "revoke" })} /> : null}
                    {canDeleteAssignment ? <IconButton label="Delete assignment" destructive onClick={() => { if (window.confirm("Delete this role assignment?")) deleteAssignment.mutate({ organization: organizationId, assignment: assignment.id }); }}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
                  </div>
                </div>
              ))}
              {!assignments.isLoading && assignments.data?.length === 0 ? <Empty label="No role assignments yet." /> : null}
            </div>
          </div>
          ) : null}
        </div>
      </div>

      {assignmentDrawerOpen && canViewUsers && (canCreateAssignment || canUpdateAssignment) ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55" onMouseDown={() => setAssignmentDrawerOpen(false)}>
          <aside
            className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <form onSubmit={submitAssignment} className="flex min-h-full flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Tenant RBAC</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{editingAssignmentId ? "Edit role assignment" : "Assign role to user"}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Choose the role type first. Module roles are then narrowed by ProductModule before selecting the role.</p>
                </div>
                <button type="button" onClick={() => setAssignmentDrawerOpen(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">Close</button>
              </div>

              <div className="flex-1 space-y-5 px-6 py-5">
                <SelectField
                  label="Role type"
                  required
                  value={assignmentRoleType}
                  onChange={(value) => {
                    const nextType = value as "system" | "module" | "partner";
                    setAssignmentRoleType(nextType);
                    setAssignmentModule("");
                    setAssignmentForm((f) => ({ ...f, role: "", units: [], project: "" }));
                  }}
                  options={[
                    { value: "system", label: "System / organization role" },
                    { value: "module", label: "Module role" },
                    ...(partnersEnabled && partnerRoles.length ? [{ value: "partner", label: "Partner organization role" }] : []),
                  ]}
                />

                {assignmentRoleType === "module" ? (
                  <SelectField
                    label="Module"
                    required
                    value={assignmentModule}
                    onChange={(module) => {
                      setAssignmentModule(module);
                      setAssignmentForm((f) => ({ ...f, role: "", units: [], project: "" }));
                    }}
                    options={assignmentModuleChoices.map((module) => ({
                      value: String(module.id),
                      label: `${module.name} (${module.code})`,
                    }))}
                  />
                ) : null}

                <SelectField
                  label="Role"
                  required
                  value={assignmentForm.role}
                  onChange={(role) => setAssignmentForm((f) => ({ ...f, role, units: [], project: "" }))}
                  options={filteredAssignmentRoles.map((role) => ({
                    value: String(role.id),
                    label: role.name,
                  }))}
                />

                {assignmentRoleType === "module" && assignmentModule && filteredAssignmentRoles.length === 0 ? (
                  <p className="-mt-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                    No active roles have been created for this module yet.
                  </p>
                ) : null}

                <SelectField
                  label="User"
                  required
                  value={assignmentForm.user}
                  onChange={(user) => setAssignmentForm((f) => ({ ...f, user }))}
                  options={(users.data ?? []).map((row) => ({ value: String(row.user.id), label: row.user.full_name || row.user.email }))}
                />

                <SelectField
                  label="Scope"
                  value={assignmentForm.scope}
                  onChange={(scope) => setAssignmentForm((f) => ({ ...f, scope: scope as TenantRoleAssignmentScope, units: [], project: "" }))}
                  options={[
                    { value: "organization", label: "Entire organization" },
                    { value: "organization_unit", label: "Selected organization units" },
                    { value: "project", label: "One project" },
                  ]}
                />

                {assignmentForm.scope === "organization_unit" ? (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-foreground">Organization units</p>
                    <UnitMultiSelect options={scopeOptions.data?.organization_units ?? []} selected={assignmentForm.units} onChange={(units) => setAssignmentForm((f) => ({ ...f, units }))} />
                  </div>
                ) : null}

                {assignmentForm.scope === "project" ? (
                  <SelectField
                    label="Project"
                    required
                    value={assignmentForm.project}
                    onChange={(project) => setAssignmentForm((f) => ({ ...f, project }))}
                    options={(scopeOptions.data?.projects ?? []).map((project) => ({ value: String(project.id), label: project.name }))}
                  />
                ) : null}

                {createAssignment.error ? <FormError error={createAssignment.error} /> : null}
                {updateAssignment.error ? <FormError error={updateAssignment.error} /> : null}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
                <SecondaryButton label="Cancel" onClick={() => {
                  setAssignmentDrawerOpen(false);
                  setEditingAssignmentId(null);
                  setAssignmentRoleType("system");
                  setAssignmentModule("");
                  setAssignmentForm({ user: "", role: "", scope: "organization", units: [], project: "" });
                }} />
                <PrimaryButton pending={createAssignment.isPending || updateAssignment.isPending} label={editingAssignmentId ? "Save assignment" : "Assign role"} />
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </PanelHeader>
  );
}

function PermissionLibraryModule({
  module,
  expanded,
  expandedGroups,
  onToggleModule,
  onToggleGroup,
  onAdd,
  draggable,
}: {
  module: TenantPermissionModule;
  expanded: boolean;
  expandedGroups: Set<string>;
  onToggleModule: () => void;
  onToggleGroup: (key: string) => void;
  onAdd: (ids: number[]) => void;
  draggable: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <button type="button" onClick={onToggleModule} className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2.5 text-left">
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="min-w-0 flex-1 text-xs font-bold text-foreground">{module.module_name}</span>
        <span className="text-[10px] text-muted-foreground">{module.module_code}</span>
      </button>
      {expanded ? (
        <div className="p-2">
          {module.groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-3 py-3 text-[10px] leading-4 text-muted-foreground">
              This module is enabled for the organization, but no permissions have been onboarded for it yet.
            </div>
          ) : null}
          {module.groups.map((group) => {
            const key = `${module.module_id}:${group.name}`;
            const open = expandedGroups.has(key);
            const ids = group.permissions.map((permission) => permission.id);
            const crud = group.permissions.filter((permission) => !permission.is_action);
            const actions = group.permissions.filter((permission) => permission.is_action);
            return (
              <div key={key} className="mb-1 last:mb-0">
                <div draggable={draggable} onDragStart={(event) => event.dataTransfer.setData("application/x-acesite-permissions", JSON.stringify(ids))} className="flex items-center rounded-lg hover:bg-muted/60">
                  <button type="button" onClick={() => onToggleGroup(key)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left">
                    {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <span className="truncate text-xs font-semibold text-foreground">{group.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{ids.length}</span>
                  </button>
                  {draggable ? <button type="button" onClick={() => onAdd(ids)} className="mr-1 rounded-md p-1.5 text-primary hover:bg-primary/10" title="Attach group"><Plus className="h-3.5 w-3.5" /></button> : null}
                </div>
                {open ? (
                  <div className="ml-4 space-y-3 border-l border-border pl-2">
                    {crud.length ? <PermissionKindBlock title="CRUD" permissions={crud} draggable={draggable} onAdd={onAdd} /> : null}
                    {actions.length ? <PermissionKindBlock title="Actions" permissions={actions} draggable={draggable} onAdd={onAdd} action /> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function PermissionKindBlock({
  title,
  permissions,
  draggable,
  onAdd,
  action = false,
}: {
  title: string;
  permissions: TenantPermissionItem[];
  draggable: boolean;
  onAdd: (ids: number[]) => void;
  action?: boolean;
}) {
  return (
    <div>
      <p className={cn("mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.14em]", action ? "text-amber-600" : "text-muted-foreground")}>{title}</p>
      <div className="space-y-1">
        {permissions.map((permission) => (
          <div key={permission.id} draggable={draggable} onDragStart={(event) => event.dataTransfer.setData("application/x-acesite-permissions", JSON.stringify([permission.id]))} className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/50">
            <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-foreground">{permission.label}</p>
                <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-bold uppercase", action ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary")}>{action ? "Action" : permission.action.split(".").at(-1)}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{permission.description}</p>
              <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">{permission.code}</p>
            </div>
            {draggable ? <button type="button" onClick={() => onAdd([permission.id])} className="rounded-md p-1 text-primary hover:bg-primary/10"><Plus className="h-3 w-3" /></button> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitMultiSelect({ options, selected, onChange }: { options: Array<{ id: number; name: string; code: string; unit_type: string }>; selected: number[]; onChange: (ids: number[]) => void }) {
  return (
    <div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2 sm:grid-cols-2">
      {options.map((unit) => {
        const checked = selected.includes(unit.id);
        return (
          <button type="button" key={unit.id} onClick={() => onChange(checked ? selected.filter((id) => id !== unit.id) : [...selected, unit.id])} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs", checked ? "border-primary/40 bg-primary/10" : "border-border bg-card")}>
            <span className={cn("flex h-4 w-4 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{checked ? <Check className="h-3 w-3" /> : null}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{unit.name}</span><span className="block truncate text-[10px] text-muted-foreground">{unit.unit_type} • {unit.code}</span></span>
          </button>
        );
      })}
      {options.length === 0 ? <p className="col-span-full p-3 text-center text-xs text-muted-foreground">No organization units are available for this role.</p> : null}
    </div>
  );
}

type OrganizationUnitTreeNode = OrganizationUnit & {
  children: OrganizationUnitTreeNode[];
};

function buildOrganizationUnitTree(units: OrganizationUnit[]): OrganizationUnitTreeNode[] {
  const map = new Map<number, OrganizationUnitTreeNode>();
  units.forEach((unit) => map.set(unit.id, { ...unit, children: [] }));
  const roots: OrganizationUnitTreeNode[] = [];
  map.forEach((unit) => {
    if (unit.parent && map.has(unit.parent)) map.get(unit.parent)!.children.push(unit);
    else roots.push(unit);
  });
  const sortNodes = (nodes: OrganizationUnitTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
}

function UnitsPanel({
  organizationId,
  organizationName,
  permissions,
}: {
  organizationId: number;
  organizationName: string;
  permissions: Record<string, boolean>;
}) {
  const canCreate = Boolean(permissions["organization.unit.create"]);
  const canUpdate = Boolean(permissions["organization.unit.update"]);
  const canDelete = Boolean(permissions["organization.unit.delete"]);
  const canActivate = Boolean(permissions["organization.unit.activate"]);
  const canDeactivate = Boolean(permissions["organization.unit.deactivate"]);
  const units = useOrganizationUnits({ organization: organizationId, page_size: 200 });
  const create = useCreateOrganizationUnit();
  const update = useUpdateOrganizationUnit();
  const remove = useDeleteOrganizationUnit();
  const unitAction = useOrganizationUnitAction();
  const [form, setForm] = useState({ name: "", parent: "", unit_type: "business_unit" as UnitType, description: "" });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const rows = units.data?.results ?? [];
  const tree = useMemo(() => buildOrganizationUnitTree(rows), [rows]);

  useEffect(() => {
    if (!rows.length) return;
    setExpanded((current) => current.size ? current : new Set(rows.map((unit) => unit.id)));
  }, [rows]);

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", parent: "", unit_type: "business_unit", description: "" });
    setOpen(true);
  };

  const startEdit = (unit: OrganizationUnit) => {
    setEditingId(unit.id);
    setForm({
      name: unit.name,
      parent: unit.parent ? String(unit.parent) : "",
      unit_type: unit.unit_type,
      description: unit.description || "",
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      organization: organizationId,
      name: form.name,
      code: slug(form.name),
      parent: form.parent ? Number(form.parent) : null,
      unit_type: form.unit_type,
      description: form.description,
      is_active: true,
    };
    if (editingId) await update.mutateAsync({ id: editingId, payload });
    else await create.mutateAsync(payload);
    setForm({ name: "", parent: "", unit_type: "business_unit", description: "" });
    setEditingId(null);
    setOpen(false);
  };

  const deleteUnit = (unit: OrganizationUnit) => {
    if (!canDelete) return;
    if (window.confirm(`Delete organization unit ${unit.name}?`)) remove.mutate(unit.id);
  };

  return (
    <PanelHeader eyebrow="Organization Units" title="Organization hierarchy" description="The organization is the hierarchy root. View, create, update and delete controls are shown only when the selected top role grants the matching permission.">
      <ActionRow canManage={canCreate} label="Add organization unit" onClick={startCreate} />
      {open && ((editingId && canUpdate) || (!editingId && canCreate)) ? (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
          <ReadOnlyField label="Code" value={slug(form.name)} />
          <SelectField label="Parent" value={form.parent} onChange={(parent) => setForm((f) => ({ ...f, parent }))} options={[
            { value: "", label: `${organizationName} (organization root)` },
            ...rows.filter((unit) => unit.id !== editingId).map((unit) => ({ value: String(unit.id), label: unit.name })),
          ]} />
          <SelectField label="Unit type" value={form.unit_type} onChange={(unit_type) => setForm((f) => ({ ...f, unit_type: unit_type as UnitType }))} options={UNIT_TYPES} />
          <Field label="Description" value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} />
          <div className="flex items-end gap-2"><PrimaryButton pending={create.isPending || update.isPending} label={editingId ? "Save unit" : "Create unit"} /><SecondaryButton label="Cancel" onClick={() => { setOpen(false); setEditingId(null); }} /></div>
          {create.error ? <FormError error={create.error} /> : null}
          {update.error ? <FormError error={update.error} /> : null}
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5 sm:p-7">
        {units.isLoading ? <RowLoading /> : (
          <div className="flex min-w-max flex-col items-center px-4 py-3">
            <OrganizationHierarchyRoot name={organizationName} childCount={tree.length} />
            {tree.length ? (
              <>
                <div className="h-7 w-px bg-border" />
                <div className="relative flex items-start justify-center gap-6 border-t border-border px-4 pt-7">
                  {tree.map((unit) => (
                    <OrganizationHierarchyBranch
                      key={unit.id}
                      unit={unit}
                      expanded={expanded}
                      setExpanded={setExpanded}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onEdit={startEdit}
                      onDelete={deleteUnit}
                      canActivate={canActivate}
                      canDeactivate={canDeactivate}
                      onActivate={(unit) => unitAction.mutate({ id: unit.id, action: "activate" })}
                      onDeactivate={(unit) => unitAction.mutate({ id: unit.id, action: "deactivate" })}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-6 rounded-xl border border-dashed border-border px-5 py-4 text-xs text-muted-foreground">No organization units yet. The organization root is ready for its first child unit.</p>
            )}
          </div>
        )}
      </div>
    </PanelHeader>
  );
}

function OrganizationHierarchyRoot({ name, childCount }: { name: string; childCount: number }) {
  return (
    <div className="w-[230px] rounded-2xl border border-primary/40 bg-card p-3 shadow-sm ring-2 ring-primary/10">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Organization root</span>
          <span className="mt-2 block text-[10px] text-muted-foreground">{childCount} direct child unit{childCount === 1 ? "" : "s"}</span>
        </span>
      </div>
    </div>
  );
}

function OrganizationHierarchyBranch({
  unit,
  expanded,
  setExpanded,
  canUpdate,
  canDelete,
  canActivate,
  canDeactivate,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: {
  unit: OrganizationUnitTreeNode;
  expanded: Set<number>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<number>>>;
  canUpdate: boolean;
  canDelete: boolean;
  canActivate: boolean;
  canDeactivate: boolean;
  onEdit: (unit: OrganizationUnit) => void;
  onDelete: (unit: OrganizationUnit) => void;
  onActivate: (unit: OrganizationUnit) => void;
  onDeactivate: (unit: OrganizationUnit) => void;
}) {
  const isExpanded = expanded.has(unit.id);
  const hasChildren = unit.children.length > 0;
  return (
    <div className="relative flex min-w-[230px] flex-col items-center">
      <div className="absolute -top-7 left-1/2 h-7 w-px -translate-x-1/2 bg-border" />
      <div className="w-[230px] rounded-2xl border border-border bg-card p-3 shadow-sm transition hover:border-primary/30">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{unit.name}</span>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{unit.unit_type_display}</span>
            <span className="mt-1 block truncate font-mono text-[9px] text-muted-foreground">{unit.code}</span>
          </span>
          {(canUpdate || canDelete) ? (
            <span className="flex shrink-0 gap-1">
              {unit.is_active && canDeactivate ? <IconButton label="Deactivate unit" onClick={() => onDeactivate(unit)}><PowerOff className="h-3.5 w-3.5" /></IconButton> : null}
              {!unit.is_active && canActivate ? <IconButton label="Activate unit" onClick={() => onActivate(unit)}><Power className="h-3.5 w-3.5" /></IconButton> : null}
              {canUpdate ? <IconButton label="Edit unit" onClick={() => onEdit(unit)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
              {canDelete ? <IconButton label="Delete unit" destructive onClick={() => onDelete(unit)}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!hasChildren}
          onClick={() => {
            if (!hasChildren) return;
            setExpanded((current) => toggleSet(current, unit.id));
          }}
          className="mt-3 flex w-full items-center justify-between rounded-lg bg-muted/40 px-2.5 py-2 text-[10px] font-semibold text-muted-foreground disabled:cursor-default"
        >
          <span>Child units</span>
          <span className="flex items-center gap-1 text-foreground">
            {hasChildren ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-primary" /> : <ChevronRight className="h-3.5 w-3.5 text-primary" />) : null}
            {unit.children.length}
          </span>
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <>
          <div className="h-7 w-px bg-border" />
          <div className="relative flex items-start justify-center gap-6 border-t border-border px-4 pt-7">
            {unit.children.map((child) => (
              <OrganizationHierarchyBranch
                key={child.id}
                unit={child}
                expanded={expanded}
                setExpanded={setExpanded}
                canUpdate={canUpdate}
                canDelete={canDelete}
                canActivate={canActivate}
                canDeactivate={canDeactivate}
                onEdit={onEdit}
                onDelete={onDelete}
                onActivate={onActivate}
                onDeactivate={onDeactivate}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DepartmentsPanel({
  organizationId,
  permissions,
  partnersEnabled,
}: {
  organizationId: number;
  permissions: Record<string, boolean>;
  partnersEnabled: boolean;
}) {
  const canCreate = Boolean(permissions["organization.department.create"]);
  const canUpdate = Boolean(permissions["organization.department.update"]);
  const canDelete = Boolean(permissions["organization.department.delete"]);
  const canActivate = Boolean(permissions["organization.department.activate"]);
  const canDeactivate = Boolean(permissions["organization.department.deactivate"]);
  const canViewPartners = partnersEnabled && Boolean(permissions["organization.partner.view"]);
  const departments = useDepartments({ organization: organizationId, page_size: 200 });
  const partners = usePartnerOrganizations(
    { organization: organizationId, page_size: 200, is_active: true },
    canViewPartners
  );
  const create = useCreateDepartment();
  const update = useUpdateDepartment();
  const remove = useDeleteDepartment();
  const departmentAction = useDepartmentAction();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", partner: "" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "", partner: "" });
    setOpen(true);
  };
  const startEdit = (department: { id: number; name: string; description: string; partner_organization: number | null }) => {
    setEditingId(department.id);
    setForm({
      name: department.name,
      description: department.description || "",
      partner: department.partner_organization ? String(department.partner_organization) : "",
    });
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      organization: organizationId,
      name: form.name,
      code: slug(form.name),
      description: form.description,
      partner_organization: form.partner ? Number(form.partner) : null,
      is_active: true,
    };
    if (editingId) await update.mutateAsync({ id: editingId, payload });
    else await create.mutateAsync(payload);
    setForm({ name: "", description: "", partner: "" });
    setEditingId(null);
    setOpen(false);
  };
  const deleteDepartment = (id: number, name: string) => {
    if (!canDelete) return;
    if (window.confirm(`Delete department ${name}?`)) remove.mutate(id);
  };

  return (
    <PanelHeader eyebrow="Departments" title="Department directory" description="Every control is permission-driven. Create, update and delete are independent CRUD permissions; special business actions use their own action permission.">
      <ActionRow canManage={canCreate} label="Add department" onClick={startCreate} />
      {open && ((editingId && canUpdate) || (!editingId && canCreate)) ? (
        <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Name" required value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))} />
          <ReadOnlyField label="Code" value={slug(form.name)} />
          {canViewPartners ? <SelectField label="Partner (optional)" value={form.partner} onChange={(partner) => setForm((f) => ({ ...f, partner }))} options={[{ value: "", label: "Internal department" }, ...(partners.data?.results ?? []).map((partner) => ({ value: String(partner.id), label: partner.name }))]} /> : null}
          <Field label="Description" value={form.description} onChange={(description) => setForm((f) => ({ ...f, description }))} />
          <div className="flex items-end gap-2"><PrimaryButton pending={create.isPending || update.isPending} label={editingId ? "Save department" : "Create department"} /><SecondaryButton label="Cancel" onClick={() => { setOpen(false); setEditingId(null); }} /></div>
          {create.error ? <FormError error={create.error} /> : null}
          {update.error ? <FormError error={update.error} /> : null}
        </form>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(departments.data?.results ?? []).map((department) => (
          <div key={department.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{department.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{department.partner_organization_name ? `${department.partner_organization_name} • ${department.code}` : `Internal • ${department.code}`}</p></div>
              <div className="flex shrink-0 gap-1">
                {department.is_active && canDeactivate ? <IconButton label="Deactivate department" onClick={() => departmentAction.mutate({ id: department.id, action: "deactivate" })}><PowerOff className="h-3.5 w-3.5" /></IconButton> : null}
                {!department.is_active && canActivate ? <IconButton label="Activate department" onClick={() => departmentAction.mutate({ id: department.id, action: "activate" })}><Power className="h-3.5 w-3.5" /></IconButton> : null}
                {canUpdate ? <IconButton label="Edit department" onClick={() => startEdit(department)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
                {canDelete ? <IconButton label="Delete department" destructive onClick={() => deleteDepartment(department.id, department.name)}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      {!departments.isLoading && !(departments.data?.results ?? []).length ? <Empty label="No departments yet." /> : null}
    </PanelHeader>
  );
}

function PartnersPanel({
  organizationId,
  permissions,
}: {
  organizationId: number;
  permissions: Record<string, boolean>;
}) {
  const canCreatePartner = Boolean(permissions["organization.partner.create"]);
  const canUpdatePartner = Boolean(permissions["organization.partner.update"]);
  const canDeletePartner = Boolean(permissions["organization.partner.delete"]);
  const canActivatePartner = Boolean(permissions["organization.partner.activate"]);
  const canDeactivatePartner = Boolean(permissions["organization.partner.deactivate"]);
  const canViewContacts = Boolean(permissions["organization.partner_contact.view"]);
  const canCreateContact = Boolean(permissions["organization.partner_contact.create"]);
  const canUpdateContact = Boolean(permissions["organization.partner_contact.update"]);
  const canDeleteContact = Boolean(permissions["organization.partner_contact.delete"]);
  const canSetPrimary = Boolean(permissions["organization.partner_contact.set_primary"]);

  const partners = usePartnerOrganizations({ organization: organizationId, page_size: 200 }, true);
  const contacts = usePartnerOrganizationContacts(
    { organization: organizationId, page_size: 200 },
    canViewContacts
  );
  const createPartner = useCreatePartnerOrganization();
  const updatePartner = useUpdatePartnerOrganization();
  const deletePartner = useDeletePartnerOrganization();
  const partnerAction = usePartnerOrganizationAction();
  const createContact = useCreatePartnerOrganizationContact();
  const updateContact = useUpdatePartnerOrganizationContact();
  const deleteContact = useDeletePartnerOrganizationContact();
  const setPrimaryContact = useSetPrimaryPartnerOrganizationContact();
  const [openPartner, setOpenPartner] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [partnerForm, setPartnerForm] = useState({ name: "", partner_type: "other" as PartnerType, email: "", phone: "" });
  const [contactForm, setContactForm] = useState({ partner: "", name: "", email: "", phone: "", designation: "", is_primary: false });

  const startPartnerCreate = () => { setEditingPartnerId(null); setPartnerForm({ name: "", partner_type: "other", email: "", phone: "" }); setOpenPartner(true); };
  const startPartnerEdit = (partner: { id: number; name: string; partner_type: PartnerType; email: string; phone: string }) => { setEditingPartnerId(partner.id); setPartnerForm({ name: partner.name, partner_type: partner.partner_type, email: partner.email || "", phone: partner.phone || "" }); setOpenPartner(true); };
  const startContactCreate = () => { setEditingContactId(null); setContactForm({ partner: "", name: "", email: "", phone: "", designation: "", is_primary: false }); setOpenContact(true); };
  const startContactEdit = (contact: { id: number; partner_organization: number; name: string; email: string; phone: string; designation: string; is_primary: boolean }) => { setEditingContactId(contact.id); setContactForm({ partner: String(contact.partner_organization), name: contact.name, email: contact.email || "", phone: contact.phone || "", designation: contact.designation || "", is_primary: contact.is_primary }); setOpenContact(true); };

  const submitPartner = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { organization: organizationId, name: partnerForm.name, code: slug(partnerForm.name), partner_type: partnerForm.partner_type, email: partnerForm.email, phone: partnerForm.phone, is_active: true };
    if (editingPartnerId) await updatePartner.mutateAsync({ id: editingPartnerId, payload });
    else await createPartner.mutateAsync(payload);
    setOpenPartner(false); setEditingPartnerId(null);
  };
  const submitContact = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { partner_organization: Number(contactForm.partner), name: contactForm.name, email: contactForm.email, phone: contactForm.phone, designation: contactForm.designation, is_primary: contactForm.is_primary, is_active: true };
    if (editingContactId) await updateContact.mutateAsync({ id: editingContactId, payload });
    else await createContact.mutateAsync(payload);
    setOpenContact(false); setEditingContactId(null);
  };
  const removePartner = (id: number, name: string) => { if (canDeletePartner && window.confirm(`Delete partner ${name}?`)) deletePartner.mutate(id); };
  const removeContact = (id: number, name: string) => { if (canDeleteContact && window.confirm(`Delete contact ${name}?`)) deleteContact.mutate(id); };
  const setPrimary = (contact: { id: number }) => {
    if (!canSetPrimary) return;
    setPrimaryContact.mutate(contact.id);
  };

  return (
    <PanelHeader eyebrow="Partner Directory" title="External organizations" description="Partner Directory is shown only for partner_company/both flows and only with partner.view. CRUD and business actions are permissioned separately.">
      <div className="flex flex-wrap gap-2">
        {canCreatePartner ? <button type="button" onClick={startPartnerCreate} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Add partner</button> : null}
        {canCreateContact ? <button type="button" onClick={startContactCreate} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"><UserPlus className="h-3.5 w-3.5" /> Add contact</button> : null}
      </div>
      {openPartner && ((editingPartnerId && canUpdatePartner) || (!editingPartnerId && canCreatePartner)) ? (
        <form onSubmit={submitPartner} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Partner name" required value={partnerForm.name} onChange={(name) => setPartnerForm((f) => ({ ...f, name }))} />
          <ReadOnlyField label="Code" value={slug(partnerForm.name)} />
          <SelectField label="Partner type" value={partnerForm.partner_type} onChange={(partner_type) => setPartnerForm((f) => ({ ...f, partner_type: partner_type as PartnerType }))} options={PARTNER_TYPES} />
          <Field label="Email" value={partnerForm.email} onChange={(email) => setPartnerForm((f) => ({ ...f, email }))} type="email" />
          <Field label="Phone" value={partnerForm.phone} onChange={(phone) => setPartnerForm((f) => ({ ...f, phone }))} />
          <div className="flex gap-2"><PrimaryButton pending={createPartner.isPending || updatePartner.isPending} label={editingPartnerId ? "Save partner" : "Create partner"} /><SecondaryButton label="Cancel" onClick={() => { setOpenPartner(false); setEditingPartnerId(null); }} /></div>
          {createPartner.error ? <FormError error={createPartner.error} /> : null}{updatePartner.error ? <FormError error={updatePartner.error} /> : null}
        </form>
      ) : null}
      {openContact && ((editingContactId && canUpdateContact) || (!editingContactId && canCreateContact)) ? (
        <form onSubmit={submitContact} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
          <SelectField label="Partner" required value={contactForm.partner} onChange={(partner) => setContactForm((f) => ({ ...f, partner }))} options={(partners.data?.results ?? []).map((partner) => ({ value: String(partner.id), label: partner.name }))} />
          <Field label="Contact name" required value={contactForm.name} onChange={(name) => setContactForm((f) => ({ ...f, name }))} />
          <Field label="Designation" value={contactForm.designation} onChange={(designation) => setContactForm((f) => ({ ...f, designation }))} />
          <Field label="Email" value={contactForm.email} onChange={(email) => setContactForm((f) => ({ ...f, email }))} type="email" />
          <Field label="Phone" value={contactForm.phone} onChange={(phone) => setContactForm((f) => ({ ...f, phone }))} />
          <label className="flex items-center gap-2 text-xs font-semibold text-foreground"><input type="checkbox" checked={contactForm.is_primary} onChange={(e) => setContactForm((f) => ({ ...f, is_primary: e.target.checked }))} /> Primary contact</label>
          <div className="flex gap-2"><PrimaryButton pending={createContact.isPending || updateContact.isPending} label={editingContactId ? "Save contact" : "Create contact"} /><SecondaryButton label="Cancel" onClick={() => { setOpenContact(false); setEditingContactId(null); }} /></div>
          {createContact.error ? <FormError error={createContact.error} /> : null}{updateContact.error ? <FormError error={updateContact.error} /> : null}
        </form>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Partner organizations</p>
          {(partners.data?.results ?? []).map((partner) => <div key={partner.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{partner.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{partner.partner_type_display} • {partner.code}</p></div><div className="flex gap-1">{partner.is_active && canDeactivatePartner ? <IconButton label="Deactivate partner" onClick={() => partnerAction.mutate({ id: partner.id, action: "deactivate" })}><PowerOff className="h-3.5 w-3.5" /></IconButton> : null}{!partner.is_active && canActivatePartner ? <IconButton label="Activate partner" onClick={() => partnerAction.mutate({ id: partner.id, action: "activate" })}><Power className="h-3.5 w-3.5" /></IconButton> : null}{canUpdatePartner ? <IconButton label="Edit partner" onClick={() => startPartnerEdit(partner)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}{canDeletePartner ? <IconButton label="Delete partner" destructive onClick={() => removePartner(partner.id, partner.name)}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}</div></div></div>)}
          {!partners.isLoading && !(partners.data?.results ?? []).length ? <Empty label="No partner organizations yet." /> : null}
        </div>
        {canViewContacts ? <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contacts</p>{(contacts.data?.results ?? []).map((contact) => <div key={contact.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{contact.name}{contact.is_primary ? " • Primary" : ""}</p><p className="mt-1 truncate text-xs text-muted-foreground">{contact.partner_organization_name}{contact.designation ? ` • ${contact.designation}` : ""}</p></div><div className="flex gap-1">{canSetPrimary && !contact.is_primary ? <SmallAction label="Set primary" onClick={() => setPrimary(contact)} /> : null}{canUpdateContact ? <IconButton label="Edit contact" onClick={() => startContactEdit(contact)}><Pencil className="h-3.5 w-3.5" /></IconButton> : null}{canDeleteContact ? <IconButton label="Delete contact" destructive onClick={() => removeContact(contact.id, contact.name)}><Trash2 className="h-3.5 w-3.5" /></IconButton> : null}</div></div></div>)}{!contacts.isLoading && !(contacts.data?.results ?? []).length ? <Empty label="No partner contacts yet." /> : null}</div> : null}
      </div>
    </PanelHeader>
  );
}

function PanelHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h1 className="mt-1 font-logo text-2xl text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ActionRow({ canManage, label, onClick }: { canManage: boolean; label: string; onClick: () => void }) {
  if (!canManage) return null;
  return <button type="button" onClick={onClick} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> {label}</button>;
}

function IconButton({ label, title, onClick, destructive = false, children }: { label?: string; title?: string; onClick: () => void; destructive?: boolean; children: React.ReactNode }) {
  const text = label ?? title ?? "Action";
  return <button type="button" onClick={onClick} title={text} aria-label={text} className={cn("flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground", destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive")}>{children}</button>;
}

function SecondaryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted">{label}</button>;
}

function SmallAction({
  label,
  onClick,
  icon,
  destructive = false,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted",
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs font-semibold text-muted-foreground">{title}</p><p className="mt-2 text-xl font-semibold capitalize text-foreground">{value}</p></div>;
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" /></label>;
}


function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span><input readOnly value={value} className="h-10 w-full rounded-lg border border-border bg-muted/60 px-3 text-sm text-muted-foreground" /></label>;
}

function SelectField({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span><select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"><option value="" disabled={required}>Select...</option>{options.map((option) => <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>)}</select></label>;
}

function PrimaryButton({ pending, label }: { pending: boolean; label: string }) {
  return <button type="submit" disabled={pending} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{label}</button>;
}

function FormError({ error }: { error: unknown }) {
  const rawMessage = getApiErrorMessage(error, "The request could not be completed.");
  const message = /<!doctype|<html[\s>]/i.test(rawMessage)
    ? "The server returned an unexpected error. Please retry; if it continues, check the backend log for the first Python exception."
    : rawMessage;
  return <div className="col-span-full rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{message}</div>;
}


function Empty({ label }: { label: string }) { return <p className="p-6 text-center text-xs text-muted-foreground">{label}</p>; }
function RowLoading() { return <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div>; }

function toggleSet<T>(current: Set<T>, value: T) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}

function CenteredMessage({ icon, title, message, action, actionLabel }: { icon: React.ReactNode; title: string; message: string; action: () => void; actionLabel: string }) {
  return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6"><div className="max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div><h1 className="mt-4 font-logo text-2xl text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p><button type="button" onClick={action} className="mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">{actionLabel}</button></div></div>;
}

function SettingsSkeleton() { return <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[260px_1fr]"><div className="animate-pulse border-r border-border bg-card" /><div className="space-y-4 p-9"><div className="h-8 w-72 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-72 animate-pulse rounded-2xl bg-muted" /></div></div>; }
