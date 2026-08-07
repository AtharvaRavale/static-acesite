import { useCallback, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Plus, Search } from "lucide-react";
import {
  organizationKeys,
  useOrganization,
  useOrganizationModules,
  useOrganizationOverview,
  useOrganizationUnitTree,
  useUpdateOrganization,
  useUploadOrganizationLogo,
  useRemoveOrganizationLogo,
  useCreateOrganizationUnit,
  useUpdateOrganizationUnit,
  useUploadOrganizationUnitImage,
  type OrganizationWritePayload,
  type OrganizationUnitWritePayload,
} from "@/features/organizations";
import {
  CanvasZoomControls,
  findUnitInTree,
  flattenUnits,
  OrganizationHierarchyCanvas,
  type CanvasSelection,
} from "@/components/organizations/OrganizationHierarchyCanvas";
import { OrganizationDetailPanel } from "@/components/organizations/OrganizationDetailPanel";
import { OrganizationUnitDetailPanel } from "@/components/organizations/OrganizationUnitDetailPanel";
import { OrganizationUnitFormPanel } from "@/components/organizations/OrganizationUnitFormPanel";
import { moduleCountsFromList } from "@/components/organizations/organizationUi";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { ModuleGridSkeleton } from "@/components/ui/skeletonPatterns";
import { getApiErrorMessage } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

type PanelMode =
  | "org-view"
  | "unit-view"
  | "unit-create"
  | "unit-edit"
  | "org-edit";

export function OrganizationCommandCenterPage() {
  const { organizationId } = useParams();
  const orgId = Number(organizationId);
  const validId = Number.isFinite(orgId) ? orgId : null;

  const [selected, setSelected] = useState<CanvasSelection | null>(
    validId ? { kind: "org", id: validId } : null
  );
  const [panelMode, setPanelMode] = useState<PanelMode>("org-view");
  const [zoom, setZoom] = useState(1);
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const orgQuery = useOrganization(validId);
  const treeQuery = useOrganizationUnitTree(validId, { include_inactive: true });
  const overviewQuery = useOrganizationOverview(validId);
  const modulesQuery = useOrganizationModules(validId);

  const updateOrg = useUpdateOrganization();
  const uploadOrgLogo = useUploadOrganizationLogo();
  const removeOrgLogo = useRemoveOrganizationLogo();
  const createUnit = useCreateOrganizationUnit();
  const updateUnit = useUpdateOrganizationUnit();
  const uploadUnitImage = useUploadOrganizationUnitImage();

  const organization = orgQuery.data ?? null;
  const tree = treeQuery.data ?? [];
  const flatUnits = useMemo(() => flattenUnits(tree), [tree]);

  const selectedUnit = useMemo(() => {
    if (selected?.kind !== "unit") return null;
    return findUnitInTree(tree, selected.id);
  }, [selected, tree]);

  const moduleCounts = useMemo(() => {
    if (overviewQuery.data?.module_status) return overviewQuery.data.module_status;
    const modules = modulesQuery.data ?? [];
    return modules.length ? moduleCountsFromList(modules) : undefined;
  }, [modulesQuery.data, overviewQuery.data?.module_status]);

  const defaultParentId =
    selected?.kind === "unit" ? selected.id : null;

  const refetchTree = async () => {
    if (!validId) return;
    await queryClient.invalidateQueries({
      queryKey: organizationKeys.unitTree(validId, { include_inactive: true }),
    });
  };

  const handleSelect = useCallback((next: CanvasSelection) => {
    setSelected(next);
    setPanelMode(next.kind === "org" ? "org-view" : "unit-view");
    setFormError(null);
  }, []);

  const handleAddUnit = useCallback(() => {
    setPanelMode("unit-create");
    setFormError(null);
  }, []);

  const handleUnitSubmit = async (
    payload: OrganizationUnitWritePayload,
    imageFile?: File | null
  ) => {
    if (!validId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (panelMode === "unit-create") {
        const created = await createUnit.mutateAsync(payload);
        if (imageFile) {
          await uploadUnitImage.mutateAsync({ id: created.id, image: imageFile });
        }
        await refetchTree();
        setSelected({ kind: "unit", id: created.id });
        setPanelMode("unit-view");
      } else if (panelMode === "unit-edit" && selectedUnit) {
        await updateUnit.mutateAsync({ id: selectedUnit.id, payload });
        if (imageFile) {
          await uploadUnitImage.mutateAsync({ id: selectedUnit.id, image: imageFile });
        }
        await refetchTree();
        setPanelMode("unit-view");
      }
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUnitActive = async () => {
    if (!selectedUnit) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateUnit.mutateAsync({
        id: selectedUnit.id,
        payload: { is_active: !selectedUnit.is_active },
      });
      await refetchTree();
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleOrgSubmit = async (
    payload: OrganizationWritePayload,
    logoFile?: File | null,
    removeLogo?: boolean
  ) => {
    if (!validId) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateOrg.mutateAsync({ id: validId, payload });
      if (removeLogo) {
        await removeOrgLogo.mutateAsync(validId);
      } else if (logoFile) {
        await uploadOrgLogo.mutateAsync({ id: validId, logo: logoFile });
      }
      setPanelMode("org-view");
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  if (!validId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Invalid organization id.
      </div>
    );
  }

  const loading =
    (orgQuery.isLoading && !organization) ||
    (treeQuery.isLoading && !treeQuery.data);

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Platform</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/organizations" className="hover:text-foreground">
          Organizations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">
          {organization?.name ?? "Command Center"}
        </span>
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-logo text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
            Organization Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual hierarchy for {organization?.name ?? "this organization"} and its
            organization units.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/organizations/${validId}/departments`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            View Departments
          </Link>
          <Link
            to={`/organizations/${validId}/partners`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            View Partners
          </Link>
          <button
            type="button"
            onClick={handleAddUnit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Unit
          </button>
        </div>
      </div>

      <ApiErrorBanner
        error={orgQuery.error || treeQuery.error || formError}
        fallback="Failed to load organization command center."
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          {loading || !organization ? (
            <ModuleGridSkeleton count={1} />
          ) : (
            <>
              <OrganizationHierarchyCanvas
                organization={organization}
                tree={tree}
                selected={selected}
                zoom={zoom}
                onSelect={handleSelect}
                onZoomChange={setZoom}
              />
              <CanvasZoomControls
                zoom={zoom}
                onZoomIn={() =>
                  setZoom((value) =>
                    Math.min(Number((value + 0.1).toFixed(2)), 1.65)
                  )
                }
                onZoomOut={() =>
                  setZoom((value) =>
                    Math.max(Number((value - 0.1).toFixed(2)), 0.35)
                  )
                }
                onReset={() => setZoom(1)}
              />
            </>
          )}
        </div>

        <aside className="flex min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:w-[400px] xl:shrink-0">
          {panelMode === "org-view" && organization ? (
            <OrganizationDetailPanel
              organization={organization}
              moduleCounts={moduleCounts}
              overviewCounts={overviewQuery.data?.counts}
              mode="center"
              onEdit={() => setPanelMode("org-edit")}
              className="h-full w-full border-0 shadow-none"
            />
          ) : null}

          {panelMode === "org-edit" && organization ? (
            <OrganizationEditForm
              organization={organization}
              saving={saving}
              error={formError}
              onCancel={() => setPanelMode("org-view")}
              onSubmit={handleOrgSubmit}
            />
          ) : null}

          {panelMode === "unit-view" && selectedUnit ? (
            <OrganizationUnitDetailPanel
              unit={selectedUnit}
              onEdit={() => setPanelMode("unit-edit")}
              onAddChild={() => {
                setSelected({ kind: "unit", id: selectedUnit.id });
                setPanelMode("unit-create");
              }}
              onToggleActive={() => void handleToggleUnitActive()}
              toggling={saving}
            />
          ) : null}

          {(panelMode === "unit-create" || panelMode === "unit-edit") && organization ? (
            <OrganizationUnitFormPanel
              mode={panelMode === "unit-create" ? "create" : "edit"}
              organizationId={organization.id}
              unit={panelMode === "unit-edit" ? selectedUnit : null}
              parentOptions={flatUnits}
              defaultParentId={defaultParentId}
              saving={saving}
              error={formError}
              onCancel={() =>
                setPanelMode(
                  selected?.kind === "unit" ? "unit-view" : "org-view"
                )
              }
              onSubmit={(payload, imageFile) =>
                void handleUnitSubmit(payload, imageFile)
              }
            />
          ) : null}

          {!organization && !loading ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              Organization not found.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function OrganizationEditForm({
  organization,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  organization: NonNullable<ReturnType<typeof useOrganization>["data"]>;
  saving?: boolean;
  error?: unknown;
  onCancel: () => void;
  onSubmit: (
    payload: OrganizationWritePayload,
    logoFile?: File | null,
    removeLogo?: boolean
  ) => void;
}) {
  const [form, setForm] = useState({
    name: organization.name,
    code: organization.code,
    legal_name: organization.legal_name,
    email: organization.email,
    phone: organization.phone,
    address: organization.address,
    timezone: organization.timezone,
    brand_color: organization.brand_color || "#2F3BFF",
    status: organization.status,
    flow: organization.flow,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const inputClass =
    "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="font-display text-base font-semibold">Edit organization</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <ApiErrorBanner error={error} />
        {Object.entries({
          name: "Name",
          code: "Code",
          legal_name: "Legal name",
          email: "Email",
          phone: "Phone",
          address: "Address",
          timezone: "Timezone",
        }).map(([key, label]) => (
          <label key={key} className="block space-y-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <input
              className={inputClass}
              value={form[key as keyof typeof form] as string}
              onChange={(e) =>
                setForm((current) => ({ ...current, [key]: e.target.value }))
              }
            />
          </label>
        ))}
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Brand color</span>
          <input
            type="color"
            className="h-10 w-full rounded-lg border border-border bg-background px-1"
            value={form.brand_color}
            onChange={(e) =>
              setForm((current) => ({ ...current, brand_color: e.target.value }))
            }
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Logo</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm"
            onChange={(e) => {
              setLogoFile(e.target.files?.[0] ?? null);
              setRemoveLogo(false);
            }}
          />
        </label>
        {organization.logo ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={removeLogo}
              onChange={(e) => setRemoveLogo(e.target.checked)}
            />
            Remove current logo
          </label>
        ) : null}
        {error != null ? (
          <p className="text-xs text-destructive">
            {getApiErrorMessage(error, "Failed to update organization.")}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 flex-1 rounded-xl border border-border text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onSubmit(form, logoFile, removeLogo)}
          className="h-10 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save organization"}
        </button>
      </div>
    </div>
  );
}