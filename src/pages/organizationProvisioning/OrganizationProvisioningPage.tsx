import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import {
  useOrganization,
  useOrganizationModules,
  useOrganizations,
} from "@/features/organizations";
import {
  useCreateOrganizationModuleAssignment,
  useOrganizationModuleAssignments,
  useProductModules,
  useUpdateOrganizationModuleAssignment,
  type OrganizationModule,
  type OrganizationModuleStatus,
  type ProductModule,
} from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { ModuleConfigDrawer } from "@/components/organizationProvisioning/ModuleConfigDrawer";
import { ModuleGroupSection } from "@/components/organizationProvisioning/ModuleGroupSection";
import { OrganizationSelector } from "@/components/organizationProvisioning/OrganizationSelector";
import { ProvisioningRightPanel } from "@/components/organizationProvisioning/ProvisioningRightPanel";
import {
  groupModules,
  PROVISIONING_GROUPS,
  resolveModuleClassification,
  type ModuleDraftState,
} from "@/components/organizationProvisioning/types";
import { ModuleGridSkeleton } from "@/components/ui/skeletonPatterns";
import { getApiErrorMessage } from "@/lib/api";

function buildDraftMap(assignments: OrganizationModule[]): Map<number, ModuleDraftState> {
  const map = new Map<number, ModuleDraftState>();
  for (const row of assignments) {
    map.set(row.module, {
      moduleId: row.module,
      assignmentId: row.id,
      status: row.status,
      configuration: row.configuration ?? {},
      dirty: false,
    });
  }
  return map;
}

export function OrganizationProvisioningPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orgParam = searchParams.get("organization");
  const initialOrgId =
    orgParam && Number.isFinite(Number(orgParam)) ? Number(orgParam) : null;

  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(initialOrgId);
  const [drafts, setDrafts] = useState<Map<number, ModuleDraftState>>(new Map());
  const [configAssignment, setConfigAssignment] =
    useState<OrganizationModule | null>(null);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [configError, setConfigError] = useState<unknown>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const orgsQuery = useOrganizations({ page_size: 200, ordering: "name" });
  const orgQuery = useOrganization(selectedOrgId);
  const productsQuery = useProductModules({
    page_size: 200,
    ordering: "menu_order,name",
    is_active: true,
  });
  const assignmentsQuery = useOrganizationModuleAssignments(
    selectedOrgId ? { organization: selectedOrgId, page_size: 500 } : {},
    selectedOrgId != null
  );
  const orgModulesQuery = useOrganizationModules(selectedOrgId);

  const createAssignment = useCreateOrganizationModuleAssignment();
  const updateAssignment = useUpdateOrganizationModuleAssignment();

  const organizations = orgsQuery.data?.results ?? [];
  const products = productsQuery.data?.results ?? [];
  const assignments = assignmentsQuery.data?.results ?? [];
  const grouped = useMemo(() => groupModules(products), [products]);

  useEffect(() => {
    if (!assignmentsQuery.data) return;
    setDrafts(buildDraftMap(assignmentsQuery.data.results));
    setSaveMessage(null);
  }, [assignmentsQuery.data]);

  const selectOrganization = useCallback(
    (id: number) => {
      setSelectedOrgId(id);
      setDrafts(new Map());
      setSaveMessage(null);
      setSaveError(null);
      const params = new URLSearchParams(searchParams);
      params.set("organization", String(id));
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const savedByModule = useMemo(() => {
    const map = new Map<number, OrganizationModule>();
    for (const row of assignments) {
      map.set(row.module, row);
    }
    return map;
  }, [assignments]);

  const getStatus = useCallback(
    (moduleId: number): OrganizationModuleStatus | null => {
      const draft = drafts.get(moduleId);
      if (draft) return draft.status;
      return savedByModule.get(moduleId)?.status ?? null;
    },
    [drafts, savedByModule]
  );

  const isDirty = useCallback(
    (moduleId: number) => drafts.get(moduleId)?.dirty ?? false,
    [drafts]
  );

  const pendingCount = useMemo(
    () => Array.from(drafts.values()).filter((draft) => draft.dirty).length,
    [drafts]
  );

  const counts = useMemo(() => {
    const tally = { enabled: 0, read_only: 0, disabled: 0 };
    for (const module of products) {
      if (resolveModuleClassification(module) === "platform_only") continue;
      const status = getStatus(module.id);
      if (status === "enabled") tally.enabled += 1;
      if (status === "read_only") tally.read_only += 1;
      if (status === "disabled") tally.disabled += 1;
    }
    return tally;
  }, [products, getStatus]);

  const setDraftStatus = useCallback(
    (module: ProductModule, status: OrganizationModuleStatus) => {
      const classification = resolveModuleClassification(module);
      if (classification === "platform_only") return;
      if (classification === "core" && status !== "enabled") return;

      setDrafts((prev) => {
        const next = new Map(prev);
        const existing = next.get(module.id);
        const saved = savedByModule.get(module.id);
        const baselineStatus = saved?.status ?? null;

        next.set(module.id, {
          moduleId: module.id,
          assignmentId: existing?.assignmentId ?? saved?.id ?? null,
          status,
          configuration:
            existing?.configuration ?? saved?.configuration ?? {},
          dirty: status !== baselineStatus || existing?.assignmentId == null,
        });
        return next;
      });
      setSaveMessage(null);
    },
    [savedByModule]
  );

  const openConfig = useCallback(
    (module: ProductModule) => {
      const saved = savedByModule.get(module.id);
      if (!saved) return;
      setConfigAssignment(saved);
      setConfigError(null);
    },
    [savedByModule]
  );

  const handleSave = async () => {
    if (!selectedOrgId) return;
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const dirtyDrafts = Array.from(drafts.values()).filter((draft) => draft.dirty);

      for (const draft of dirtyDrafts) {
        if (!draft.status) continue;

        if (draft.assignmentId) {
          await updateAssignment.mutateAsync({
            id: draft.assignmentId,
            payload: {
              status: draft.status,
              configuration: draft.configuration,
            },
          });
        } else {
          await createAssignment.mutateAsync({
            organization: selectedOrgId,
            module: draft.moduleId,
            status: draft.status,
            configuration: draft.configuration,
          });
        }
      }

      await Promise.all([
        assignmentsQuery.refetch(),
        orgModulesQuery.refetch(),
      ]);

      setSaveMessage("Module access saved successfully.");
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigSave = async (configuration: Record<string, unknown>) => {
    if (!configAssignment) return;
    setConfigSaving(true);
    setConfigError(null);

    try {
      await updateAssignment.mutateAsync({
        id: configAssignment.id,
        payload: { configuration },
      });
      await Promise.all([
        assignmentsQuery.refetch(),
        orgModulesQuery.refetch(),
      ]);
      setConfigAssignment(null);
      setSaveMessage("Module configuration saved.");
    } catch (error) {
      setConfigError(error);
    } finally {
      setConfigSaving(false);
    }
  };

  const loadingModules =
    (productsQuery.isLoading && !productsQuery.data) ||
    (selectedOrgId != null &&
      assignmentsQuery.isLoading &&
      !assignmentsQuery.data);

  const organization = orgQuery.data ?? null;
  const hasAssignables = products.some(
    (module) => resolveModuleClassification(module) !== "platform_only"
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Platform</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Organizations</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Provisioning</span>
      </nav>

      {/* Hero — Module Catalog style */}
      <section className="relative isolate min-h-[280px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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

        <div className="pointer-events-none absolute inset-y-0 right-[-4%] hidden w-[66%] md:block">
          <img
            src="/superadmin-modules-assign.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="h-full w-full select-none object-contain object-center drop-shadow-[0_28px_42px_rgba(37,99,235,0.2)]"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card from-0% via-card/95 via-42% to-transparent to-77%" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/50 to-transparent" />

        <div className="relative z-10 flex min-h-[280px] items-center px-6 py-8 sm:px-8">
          <div className="max-w-[570px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Organization Provisioning
              </span>
            </div>

            <h1 className="font-logo text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.35rem]">
              Organization Provisioning
            </h1>

            <p className="mt-3 max-w-[530px] text-[13px] leading-6 text-muted-foreground sm:text-sm">
              Grant module access to organizations. You control what each client
              workspace can use.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={!selectedOrgId || pendingCount === 0 || saving}
                onClick={() => void handleSave()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
              >
                Save module access
                {pendingCount > 0 && (
                  <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[11px]">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/80 px-4 text-sm font-medium text-muted-foreground backdrop-blur transition duration-200 hover:bg-muted hover:text-foreground"
                title="Provisioning guide"
              >
                <BookOpen className="h-4 w-4" />
                Provisioning Guide
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-10 block h-[210px] w-full px-5 pb-5 md:hidden">
          <img
            src="/superadmin-modules-assign.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="h-full w-full select-none object-contain drop-shadow-[0_20px_35px_rgba(37,99,235,0.2)]"
          />
        </div>
      </section>

      <div className="flex flex-col gap-5 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-5">
          <OrganizationSelector
            organizations={organizations}
            selectedId={selectedOrgId}
            onSelect={selectOrganization}
            loading={orgsQuery.isLoading && !orgsQuery.data}
          />

          {selectedOrgId && organization && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              You are granting module access to{" "}
              <strong>{organization.name}</strong>. Core modules are required;
              optional modules can be enabled, read-only, or disabled.
            </div>
          )}

          <ApiErrorBanner
            error={
              saveError ||
              orgsQuery.error ||
              orgQuery.error ||
              productsQuery.error ||
              assignmentsQuery.error ||
              orgModulesQuery.error
            }
          />

          {!selectedOrgId ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Select an organization to assign product modules.
            </div>
          ) : loadingModules ? (
            <ModuleGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No product modules found in the catalog.
            </div>
          ) : !hasAssignables ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No assignable modules are available for this organization.
            </div>
          ) : (
            PROVISIONING_GROUPS.map((group) => (
              <ModuleGroupSection
                key={group.key}
                group={group}
                modules={grouped[group.key]}
                getStatus={getStatus}
                isDirty={isDirty}
                onStatusChange={setDraftStatus}
                onConfigure={openConfig}
                onAssignEnabled={(module) => setDraftStatus(module, "enabled")}
              />
            ))
          )}

          {saveError != null && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(saveError, "Failed to save module access.")}
            </p>
          )}
        </div>

        <ProvisioningRightPanel
          organization={organization}
          counts={counts}
          pendingCount={pendingCount}
          saving={saving}
          saveDisabled={pendingCount === 0}
          saveMessage={saveMessage}
          onSave={() => void handleSave()}
        />
      </div>

      {configAssignment && (
        <ModuleConfigDrawer
          assignment={configAssignment}
          saving={configSaving}
          error={configError}
          onClose={() => setConfigAssignment(null)}
          onSave={(configuration) => void handleConfigSave(configuration)}
        />
      )}
    </div>
  );
}
