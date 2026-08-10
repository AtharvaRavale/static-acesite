import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth, useAuth, type AuthOrganization } from "@/features/auth";
import {
  useUpdateWorkspaceAccessContext,
  useWorkspaceBootstrap,
  useWorkspaceProjectModules,
  useWorkspaceProjects,
} from "./hooks";
import type {
  WorkspaceOrganization,
  WorkspaceState,
  WorkspaceTopRole,
  WorkspaceUnitNode,
} from "./types";

const WorkspaceContext = createContext<WorkspaceState | null>(null);

function findUnit(
  nodes: WorkspaceUnitNode[],
  unitId: number | null
): WorkspaceUnitNode | null {
  if (unitId === null) return null;
  for (const node of nodes) {
    if (node.id === unitId) return node;
    const child = findUnit(node.children, unitId);
    if (child) return child;
  }
  return null;
}

function collectSelectableUnits(nodes: WorkspaceUnitNode[], result = new Set<number>()) {
  for (const node of nodes) {
    if (node.selectable) result.add(node.id);
    collectSelectableUnits(node.children, result);
  }
  return result;
}

function roleAllowsUnit(role: WorkspaceTopRole | null, unitId: number) {
  return Boolean(role?.selectable_unit_ids.includes(unitId));
}

function chooseRoleForUnit(
  organization: WorkspaceOrganization,
  unitId: number | null,
  preferredAssignmentId?: number | null
): WorkspaceTopRole | null {
  const preferred = organization.top_roles.find(
    (role) => role.assignment_id === preferredAssignmentId
  );
  if (preferred && (unitId === null || roleAllowsUnit(preferred, unitId))) {
    return preferred;
  }
  if (unitId !== null) {
    const covering = organization.top_roles.find((role) => roleAllowsUnit(role, unitId));
    if (covering) return covering;
  }
  return organization.top_roles[0] ?? null;
}

function toAuthOrganization(org: WorkspaceOrganization): AuthOrganization {
  return {
    id: org.id,
    organization_id: org.organization_id,
    name: org.name,
    code: org.code,
    membership_type: org.membership.membership_type,
    status: org.membership.status,
  };
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const enabled = user?.user_type === "non_platform";
  const bootstrapQuery = useWorkspaceBootstrap(enabled);
  const syncMutation = useUpdateWorkspaceAccessContext();

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(
    null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTopRoleId, setSelectedTopRoleId] = useState<number | null>(null);

  const initializedRef = useRef(false);
  const preferredInitialProjectRef = useRef<number | null>(null);
  const lastSyncedKeyRef = useRef<string>("");

  const bootstrap = bootstrapQuery.data ?? null;
  const organizations = bootstrap?.organizations ?? [];
  const organization = useMemo(
    () => organizations.find((item) => item.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId]
  );
  const topRole = useMemo(
    () =>
      organization?.top_roles.find(
        (role) => role.assignment_id === selectedTopRoleId
      ) ?? null,
    [organization, selectedTopRoleId]
  );

  const selectableUnitIds = useMemo(() => {
    if (!organization) return [];
    if (organization.membership.is_owner) {
      return Array.from(collectSelectableUnits(organization.organization_units));
    }
    if (topRole) return topRole.selectable_unit_ids;
    return Array.from(collectSelectableUnits(organization.organization_units));
  }, [organization, topRole]);
  const selectableUnitSet = useMemo(
    () => new Set(selectableUnitIds),
    [selectableUnitIds]
  );
  const isUnitSelectable = (unitId: number) => selectableUnitSet.has(unitId);

  const organizationUnit = useMemo(() => {
    const unit = findUnit(organization?.organization_units ?? [], selectedUnitId);
    if (!unit) return null;
    return selectableUnitSet.has(unit.id) ? unit : null;
  }, [organization, selectedUnitId, selectableUnitSet]);

  useEffect(() => {
    if (!bootstrap || initializedRef.current) return;

    const active = bootstrap.active_access_context;
    const initialOrganization =
      bootstrap.organizations.find((item) => item.id === active?.organization) ??
      bootstrap.organizations[0] ??
      null;

    if (!initialOrganization) {
      initializedRef.current = true;
      return;
    }

    const initialRole = chooseRoleForUnit(
      initialOrganization,
      active?.organization === initialOrganization.id
        ? active.organization_unit
        : null,
      active?.selected_top_role_assignment
    );

    const activeUnit = findUnit(
      initialOrganization.organization_units,
      active?.organization === initialOrganization.id
        ? active.organization_unit
        : null
    );
    const unitAllowed = Boolean(
      activeUnit &&
        (initialOrganization.membership.is_owner ||
          (initialRole
            ? initialRole.selectable_unit_ids.includes(activeUnit.id)
            : activeUnit.selectable))
    );

    setSelectedOrganizationId(initialOrganization.id);
    setSelectedTopRoleId(initialRole?.assignment_id ?? null);
    setSelectedUnitId(unitAllowed ? activeUnit!.id : null);
    preferredInitialProjectRef.current =
      active?.organization === initialOrganization.id ? active.project : null;
    auth.setOrganization(toAuthOrganization(initialOrganization));
    initializedRef.current = true;
  }, [bootstrap]);

  // A role selection is resolved before project discovery. This is deliberate:
  // UserRoleAssignment scope is the first access source for the workspace.
  const projectParams = organization
    ? {
        organization: organization.id,
        organization_unit: organizationUnit?.id ?? null,
        role_assignment: topRole?.assignment_id ?? null,
      }
    : null;
  const projectsQuery = useWorkspaceProjects(projectParams);
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    if (!initializedRef.current || !organization || projectsQuery.isFetching) return;

    if (selectedProjectId && projects.some((item) => item.id === selectedProjectId)) {
      return;
    }

    const preferred = preferredInitialProjectRef.current;
    preferredInitialProjectRef.current = null;
    const next =
      (preferred ? projects.find((item) => item.id === preferred) : null) ??
      projects[0] ??
      null;
    setSelectedProjectId(next?.id ?? null);
  }, [organization, projects, projectsQuery.isFetching, selectedProjectId]);

  const project = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );
  const projectModulesQuery = useWorkspaceProjectModules(
    project
      ? {
          project: project.id,
          role_assignment: topRole?.assignment_id ?? null,
        }
      : null
  );
  const projectModules = projectModulesQuery.data ?? [];
  const organizationModules = organization?.organization_modules ?? [];

  useEffect(() => {
    if (!initializedRef.current || !organization || !user) return;

    const payload = {
      organization: organization.id,
      organization_unit: organizationUnit?.id ?? null,
      partner_organization: topRole?.partner_organization?.id ?? null,
      project: project?.id ?? null,
      selected_top_role_assignment: topRole?.assignment_id ?? null,
      selected_role_assignment: null,
      is_active: true as const,
    };
    const key = JSON.stringify(payload);
    if (lastSyncedKeyRef.current === key) return;
    lastSyncedKeyRef.current = key;

    syncMutation.mutate(payload, {
      onSuccess: (context) => {
        const current = auth.getUser();
        if (!current) return;
        auth.setUser({
          ...current,
          permissions: context.permission_codes,
          permission_codes: context.permission_codes,
          active_access_context: context,
        });
      },
      onError: () => {
        lastSyncedKeyRef.current = "";
      },
    });
  }, [
    organization,
    organizationUnit?.id,
    project?.id,
    topRole?.assignment_id,
    topRole?.partner_organization?.id,
    user,
  ]);

  const selectOrganizationContext = (
    organizationId: number,
    unitId: number | null
  ) => {
    const next = organizations.find((item) => item.id === organizationId);
    if (!next) return;

    const organizationChanged = next.id !== selectedOrganizationId;
    const nextRole = organizationChanged
      ? chooseRoleForUnit(next, unitId, null)
      : topRole;

    if (unitId !== null) {
      const unit = findUnit(next.organization_units, unitId);
      if (!unit) return;
      const allowed = next.membership.is_owner
        ? unit.selectable
        : nextRole
          ? nextRole.selectable_unit_ids.includes(unitId)
          : unit.selectable;
      if (!allowed) return;
    }

    const unitChanged = unitId !== selectedUnitId;
    if (!organizationChanged && !unitChanged) return;

    preferredInitialProjectRef.current = null;
    lastSyncedKeyRef.current = "";
    setSelectedOrganizationId(next.id);
    setSelectedUnitId(unitId);
    setSelectedProjectId(null);
    if (organizationChanged) {
      setSelectedTopRoleId(nextRole?.assignment_id ?? null);
      auth.setOrganization(toAuthOrganization(next));
    }
  };

  const selectOrganization = (organizationId: number) => {
    selectOrganizationContext(organizationId, null);
  };

  const selectOrganizationUnit = (unitId: number | null) => {
    if (!organization) return;
    selectOrganizationContext(organization.id, unitId);
  };

  const selectProject = (projectId: number | null) => {
    if (projectId !== null && !projects.some((item) => item.id === projectId)) return;
    lastSyncedKeyRef.current = "";
    setSelectedProjectId(projectId);
  };

  const selectTopRole = (assignmentId: number | null) => {
    if (!organization) return;
    const nextRole =
      assignmentId === null
        ? null
        : organization.top_roles.find(
            (role) => role.assignment_id === assignmentId
          ) ?? null;
    if (assignmentId !== null && !nextRole) return;
    if (assignmentId === selectedTopRoleId) return;

    // Changing the selected role changes the authoritative scope. Reset unit
    // and project so both lists are re-resolved from that assignment.
    preferredInitialProjectRef.current = null;
    lastSyncedKeyRef.current = "";
    setSelectedTopRoleId(assignmentId);
    setSelectedUnitId(null);
    setSelectedProjectId(null);
  };

  const settingsPermissionCode =
    bootstrap?.settings_permission_code ?? "account.settings.view";
  const canAccessSettings = Boolean(
    user?.is_superuser ||
      organization?.membership.is_owner ||
      (!topRole?.is_partner_role &&
        topRole?.scope_type === "organization" &&
        (topRole?.permission_codes.includes(settingsPermissionCode) ||
          topRole?.permission_codes.includes("account.settings.access")))
  );

  const value: WorkspaceState = {
    bootstrap,
    organizations,
    organization,
    organizationUnit,
    project,
    topRole,
    projects,
    organizationModules,
    projectModules,
    visibleModules: project ? projectModules : organizationModules,
    settingsPermissionCode,
    canAccessSettings,
    hasProject: project !== null,
    selectableUnitIds,
    isUnitSelectable,
    isLoading: bootstrapQuery.isLoading,
    isProjectsLoading: projectsQuery.isLoading || projectsQuery.isFetching,
    isProjectModulesLoading:
      projectModulesQuery.isLoading || projectModulesQuery.isFetching,
    isContextSyncing: syncMutation.isPending,
    error: bootstrapQuery.error ?? syncMutation.error,
    projectError: projectsQuery.error,
    projectModulesError: projectModulesQuery.error,
    selectOrganization,
    selectOrganizationContext,
    selectOrganizationUnit,
    selectProject,
    selectTopRole,
    refresh: bootstrapQuery.refetch,
  };

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useOptionalWorkspace(): WorkspaceState | null {
  return useContext(WorkspaceContext);
}

export function useWorkspace(): WorkspaceState {
  const context = useOptionalWorkspace();
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  return context;
}
