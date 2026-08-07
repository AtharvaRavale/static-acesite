import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Plus } from "lucide-react";
import {
  useCreateDepartment,
  useCreateDepartmentUnitAssignment,
  useDeleteDepartmentUnitAssignment,
  useDepartments,
  useDepartmentUnitAssignments,
  useOrganization,
  useOrganizationUnits,
  usePartnerOrganizations,
  useRemoveDepartmentImage,
  useUpdateDepartment,
  useUploadDepartmentImage,
  useUploadDepartmentUnitAssignmentImage,
  type DepartmentUnitAssignmentWritePayload,
  type DepartmentWritePayload,
} from "@/features/organizations";
import { AssignmentFormPanel } from "@/components/organizations/departments/AssignmentFormPanel";
import { DepartmentAssignmentMap } from "@/components/organizations/departments/DepartmentAssignmentMap";
import { DepartmentDetailPanel } from "@/components/organizations/departments/DepartmentDetailPanel";
import { DepartmentFormPanel } from "@/components/organizations/departments/DepartmentFormPanel";
import { DepartmentListPanel } from "@/components/organizations/departments/DepartmentListPanel";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";

type PanelMode = "detail" | "create-dept" | "edit-dept" | "assign";

export function DepartmentsPage() {
  const { organizationId } = useParams();
  const orgId = Number(organizationId);
  const validId = Number.isFinite(orgId) ? orgId : null;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(
    null
  );
  const [panelMode, setPanelMode] = useState<PanelMode>("detail");
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const orgQuery = useOrganization(validId);
  const departmentsQuery = useDepartments({
    organization: validId ?? undefined,
    page_size: 200,
    ordering: "name",
    search: search.trim() || undefined,
    is_active:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
  });
  const unitsQuery = useOrganizationUnits({
    organization: validId ?? undefined,
    page_size: 500,
    ordering: "name",
  });
  const assignmentsQuery = useDepartmentUnitAssignments({
    organization: validId ?? undefined,
    page_size: 500,
  });
  const partnersQuery = usePartnerOrganizations({
    organization: validId ?? undefined,
    page_size: 200,
    ordering: "name",
  });

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const uploadDeptImage = useUploadDepartmentImage();
  const removeDeptImage = useRemoveDepartmentImage();
  const createAssignment = useCreateDepartmentUnitAssignment();
  const deleteAssignment = useDeleteDepartmentUnitAssignment();
  const uploadAssignmentImage = useUploadDepartmentUnitAssignmentImage();

  const organization = orgQuery.data ?? null;
  const departments = departmentsQuery.data?.results ?? [];
  const units = unitsQuery.data?.results ?? [];
  const allAssignments = assignmentsQuery.data?.results ?? [];
  const partners = partnersQuery.data?.results ?? [];

  const unitsById = useMemo(() => {
    const map = new Map(units.map((unit) => [unit.id, unit]));
    return map;
  }, [units]);

  const assignmentCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const row of allAssignments) {
      map.set(row.department, (map.get(row.department) ?? 0) + 1);
    }
    return map;
  }, [allAssignments]);

  const selectedDepartment =
    departments.find((dept) => dept.id === selectedDeptId) ?? null;

  const departmentAssignments = useMemo(
    () =>
      selectedDeptId == null
        ? []
        : allAssignments.filter((row) => row.department === selectedDeptId),
    [allAssignments, selectedDeptId]
  );

  const selectedAssignment =
    departmentAssignments.find((row) => row.id === selectedAssignmentId) ?? null;

  const assignedUnitIds = useMemo(
    () => new Set(departmentAssignments.map((row) => row.organization_unit)),
    [departmentAssignments]
  );

  const selectDepartment = (id: number) => {
    setSelectedDeptId(id);
    setSelectedAssignmentId(null);
    setPanelMode("detail");
    setFormError(null);
  };

  const handleDepartmentSubmit = async (
    payload: DepartmentWritePayload,
    imageFile?: File | null,
    removeImage?: boolean
  ) => {
    if (!validId) return;
    setSaving(true);
    setFormError(null);
    try {
      if (panelMode === "create-dept") {
        const created = await createDepartment.mutateAsync(payload);
        if (imageFile) {
          await uploadDeptImage.mutateAsync({ id: created.id, image: imageFile });
        }
        setSelectedDeptId(created.id);
        setPanelMode("detail");
      } else if (panelMode === "edit-dept" && selectedDepartment) {
        await updateDepartment.mutateAsync({
          id: selectedDepartment.id,
          payload,
        });
        if (removeImage) {
          await removeDeptImage.mutateAsync(selectedDepartment.id);
        } else if (imageFile) {
          await uploadDeptImage.mutateAsync({
            id: selectedDepartment.id,
            image: imageFile,
          });
        }
        setPanelMode("detail");
      }
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignmentSubmit = async (
    payload: DepartmentUnitAssignmentWritePayload,
    imageFile?: File | null
  ) => {
    setSaving(true);
    setFormError(null);
    try {
      const created = await createAssignment.mutateAsync(payload);
      if (imageFile) {
        await uploadAssignmentImage.mutateAsync({
          id: created.id,
          image: imageFile,
        });
      }
      setSelectedAssignmentId(created.id);
      setPanelMode("detail");
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDepartment = async () => {
    if (!selectedDepartment) return;
    setSaving(true);
    setFormError(null);
    try {
      await updateDepartment.mutateAsync({
        id: selectedDepartment.id,
        payload: { is_active: !selectedDepartment.is_active },
      });
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async () => {
    if (!selectedAssignment) return;
    setSaving(true);
    setFormError(null);
    try {
      await deleteAssignment.mutateAsync(selectedAssignment.id);
      setSelectedAssignmentId(null);
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
    (departmentsQuery.isLoading && !departmentsQuery.data) ||
    (orgQuery.isLoading && !organization);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Platform</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/organizations" className="hover:text-foreground">
          Organizations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          to={`/organizations/${validId}`}
          className="hover:text-foreground"
        >
          {organization?.name ?? "Organization"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Departments</span>
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-logo text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
            Departments & Unit Assignments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Map departments to organization units and manage operational coverage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/organizations/${validId}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organization
          </Link>
          <button
            type="button"
            onClick={() => {
              setPanelMode("create-dept");
              setFormError(null);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
          <button
            type="button"
            disabled={!selectedDepartment}
            onClick={() => {
              if (!selectedDepartment) return;
              setPanelMode("assign");
              setFormError(null);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Assign to Unit
          </button>
        </div>
      </div>

      <ApiErrorBanner
        error={
          formError ||
          orgQuery.error ||
          departmentsQuery.error ||
          unitsQuery.error ||
          assignmentsQuery.error
        }
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <DepartmentListPanel
          departments={departments}
          assignmentCounts={assignmentCounts}
          selectedId={selectedDeptId}
          search={search}
          statusFilter={statusFilter}
          loading={loading}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onSelect={selectDepartment}
        />

        <DepartmentAssignmentMap
          department={selectedDepartment}
          assignments={departmentAssignments}
          unitsById={unitsById}
          selectedAssignmentId={selectedAssignmentId}
          onSelectAssignment={(id) => {
            setSelectedAssignmentId(id);
            setPanelMode("detail");
          }}
        />

        <aside className="flex min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-4 xl:w-[380px] xl:shrink-0 xl:self-start">
          {panelMode === "create-dept" ? (
            <DepartmentFormPanel
              mode="create"
              organizationId={validId}
              partners={partners}
              saving={saving}
              error={formError}
              onCancel={() => setPanelMode(selectedDepartment ? "detail" : "detail")}
              onSubmit={(payload, imageFile, removeImage) =>
                void handleDepartmentSubmit(payload, imageFile, removeImage)
              }
            />
          ) : null}

          {panelMode === "edit-dept" && selectedDepartment ? (
            <DepartmentFormPanel
              mode="edit"
              organizationId={validId}
              department={selectedDepartment}
              partners={partners}
              saving={saving}
              error={formError}
              onCancel={() => setPanelMode("detail")}
              onSubmit={(payload, imageFile, removeImage) =>
                void handleDepartmentSubmit(payload, imageFile, removeImage)
              }
            />
          ) : null}

          {panelMode === "assign" && selectedDepartment ? (
            <AssignmentFormPanel
              department={selectedDepartment}
              units={units}
              assignedUnitIds={assignedUnitIds}
              saving={saving}
              error={formError}
              onCancel={() => setPanelMode("detail")}
              onSubmit={(payload, imageFile) =>
                void handleAssignmentSubmit(payload, imageFile)
              }
            />
          ) : null}

          {panelMode === "detail" && selectedDepartment ? (
            <DepartmentDetailPanel
              department={selectedDepartment}
              assignments={departmentAssignments}
              selectedAssignment={selectedAssignment}
              onEdit={() => {
                setPanelMode("edit-dept");
                setFormError(null);
              }}
              onAssign={() => {
                setPanelMode("assign");
                setFormError(null);
              }}
              onRemoveAssignment={() => void handleRemoveAssignment()}
              onToggleActive={() => void handleToggleDepartment()}
              toggling={saving}
              removingAssignment={saving}
            />
          ) : null}

          {panelMode === "detail" && !selectedDepartment ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              Select a department to review details and manage unit assignments.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
