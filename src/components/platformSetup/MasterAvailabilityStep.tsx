import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  DoorOpen,
  Home,
  Layers3,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import type { Organization, OrganizationUnit } from "@/features/organizations";
import {
  useCreateMasterFlatTypeAvailability,
  useCreateMasterRoomTypeAvailability,
  useMasterFlatTypeAvailabilities,
  useMasterFlatTypes,
  useMasterRoomTypeAvailabilities,
  useMasterRoomTypes,
  useUpdateMasterFlatTypeAvailability,
  useUpdateMasterRoomTypeAvailability,
  type MasterFlatType,
  type MasterRoomType,
} from "@/features/projects";
import type { Project } from "@/features/projects";
import { projectWorkspaceKeys, useProjectMasterAvailability } from "@/features/projectWorkspace";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { inputClass, PrimaryButton, SecondaryButton, StepCard } from "./ui";

type Props = {
  organization: Organization;
  organizationUnit: OrganizationUnit | null;
  project: Project;
  onBack: () => void;
  onComplete: () => void;
};

type AvailabilityTarget = "organization" | "organization_unit";

export function MasterAvailabilityStep({
  organization,
  organizationUnit,
  project,
  onBack,
  onComplete,
}: Props) {
  const queryClient = useQueryClient();
  const availabilityQuery = useProjectMasterAvailability(project.id, true, true);
  const availability = availabilityQuery.data;
  const roomTypes = availability?.room_types.results ?? [];
  const flatTypes = availability?.flat_types.results ?? [];
  const loading = availabilityQuery.isLoading || availabilityQuery.isFetching;
  const canContinue = !loading && !availabilityQuery.error && roomTypes.length > 0 && flatTypes.length > 0;

  const [roomTarget, setRoomTarget] = useState<AvailabilityTarget>(organizationUnit ? "organization_unit" : "organization");
  const [flatTarget, setFlatTarget] = useState<AvailabilityTarget>(organizationUnit ? "organization_unit" : "organization");
  const [roomMasterToAdd, setRoomMasterToAdd] = useState<number | null>(null);
  const [flatMasterToAdd, setFlatMasterToAdd] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<unknown>(null);

  useEffect(() => {
    if (!availability) return;
    setRoomTarget(availability.room_types.scope === "organization_unit" && organizationUnit ? "organization_unit" : "organization");
    setFlatTarget(availability.flat_types.scope === "organization_unit" && organizationUnit ? "organization_unit" : "organization");
  }, [availability?.room_types.scope, availability?.flat_types.scope, organizationUnit?.id]);

  const roomTargetParams = roomTarget === "organization_unit" && organizationUnit
    ? { organization_unit: organizationUnit.id, page_size: 500, ordering: "master_name" }
    : { organization: organization.id, page_size: 500, ordering: "master_name" };
  const flatTargetParams = flatTarget === "organization_unit" && organizationUnit
    ? { organization_unit: organizationUnit.id, page_size: 500, ordering: "master_name" }
    : { organization: organization.id, page_size: 500, ordering: "master_name" };

  const targetRoomAvailability = useMasterRoomTypeAvailabilities(roomTargetParams);
  const targetFlatAvailability = useMasterFlatTypeAvailabilities(flatTargetParams);
  const masterRooms = useMasterRoomTypes({ is_active: true, page_size: 500, ordering: "name" });
  const masterFlats = useMasterFlatTypes({ is_active: true, page_size: 500, ordering: "name" });
  const createRoomAvailability = useCreateMasterRoomTypeAvailability();
  const updateRoomAvailability = useUpdateMasterRoomTypeAvailability();
  const createFlatAvailability = useCreateMasterFlatTypeAvailability();
  const updateFlatAvailability = useUpdateMasterFlatTypeAvailability();

  const eligibleRooms = useMemo(
    () => (masterRooms.data?.results ?? []).filter((master) => master.owner_organization === null || master.owner_organization === organization.id),
    [masterRooms.data, organization.id]
  );
  const eligibleFlats = useMemo(
    () => (masterFlats.data?.results ?? []).filter((master) => master.owner_organization === null || master.owner_organization === organization.id),
    [masterFlats.data, organization.id]
  );

  const roomSource = availability?.room_types.scope === "organization_unit"
    ? organizationUnit?.name ?? `Organization unit #${availability?.room_types.target_id ?? ""}`
    : organization.name;
  const flatSource = availability?.flat_types.scope === "organization_unit"
    ? organizationUnit?.name ?? `Organization unit #${availability?.flat_types.target_id ?? ""}`
    : organization.name;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: projectWorkspaceKeys.availability(project.id) }),
      targetRoomAvailability.refetch(),
      targetFlatAvailability.refetch(),
    ]);
  };

  const addRoom = async () => {
    if (!roomMasterToAdd) return;
    setMutationError(null);
    try {
      const existing = (targetRoomAvailability.data?.results ?? []).find((row) => row.master_room_type === roomMasterToAdd);
      if (existing) {
        await updateRoomAvailability.mutateAsync({ id: existing.id, payload: { is_active: true } });
      } else {
        await createRoomAvailability.mutateAsync({
          master_room_type: roomMasterToAdd,
          organization: roomTarget === "organization" ? organization.id : null,
          organization_unit: roomTarget === "organization_unit" ? organizationUnit?.id ?? null : null,
          is_active: true,
        });
      }
      setRoomMasterToAdd(null);
      await refresh();
    } catch (error) {
      setMutationError(error);
    }
  };

  const addFlat = async () => {
    if (!flatMasterToAdd) return;
    setMutationError(null);
    try {
      const existing = (targetFlatAvailability.data?.results ?? []).find((row) => row.master_flat_type === flatMasterToAdd);
      if (existing) {
        await updateFlatAvailability.mutateAsync({ id: existing.id, payload: { is_active: true } });
      } else {
        await createFlatAvailability.mutateAsync({
          master_flat_type: flatMasterToAdd,
          organization: flatTarget === "organization" ? organization.id : null,
          organization_unit: flatTarget === "organization_unit" ? organizationUnit?.id ?? null : null,
          is_active: true,
        });
      }
      setFlatMasterToAdd(null);
      await refresh();
    } catch (error) {
      setMutationError(error);
    }
  };

  const deactivateRoom = async (id: number) => {
    setMutationError(null);
    try {
      await updateRoomAvailability.mutateAsync({ id, payload: { is_active: false } });
      await refresh();
    } catch (error) {
      setMutationError(error);
    }
  };

  const deactivateFlat = async (id: number) => {
    setMutationError(null);
    try {
      await updateFlatAvailability.mutateAsync({ id, payload: { is_active: false } });
      await refresh();
    } catch (error) {
      setMutationError(error);
    }
  };

  const busy = createRoomAvailability.isPending || updateRoomAvailability.isPending || createFlatAvailability.isPending || updateFlatAvailability.isPending;

  return (
    <StepCard
      eyebrow="Project master availability"
      title="Room and flat masters available to this project"
      description={`Existing effective masters for ${project.name} are loaded first. You can also add or deactivate availability at the project's organization/unit scope without leaving setup.`}
    >
      <div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Layers3 className="h-5 w-5" /></div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{project.name}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Placement</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{organization.name} {organizationUnit ? `→ ${organizationUnit.name}` : "→ Organization root"}</p>
          <div className="mt-5 space-y-2 rounded-xl border border-border bg-background p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Effective for this project</p>
            <SourceRow icon={DoorOpen} label="Room types" source={roomSource} count={roomTypes.length} />
            <SourceRow icon={Home} label="Flat types" source={flatSource} count={flatTypes.length} />
          </div>
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">If the unit has at least one active availability row for a type, that unit list is authoritative for that type. Otherwise organization availability is used as fallback.</p>
        </aside>

        <div className="space-y-4">
          {loading ? <div className="flex items-center gap-2 rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Resolving project master availability…</div> : null}
          {availabilityQuery.error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">{getApiErrorMessage(availabilityQuery.error, "Unable to resolve project availability.")}</div> : null}
          {mutationError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">{getApiErrorMessage(mutationError, "Unable to update master availability.")}</div> : null}

          <AvailabilityEditor
            icon={DoorOpen}
            title="Master Room Type Availability"
            description={`Effective source right now: ${roomSource}. Add more masters to the selected target below.`}
            target={roomTarget}
            setTarget={setRoomTarget}
            organization={organization}
            organizationUnit={organizationUnit}
            rows={(targetRoomAvailability.data?.results ?? []).map((row) => ({ id: row.id, masterId: row.master_room_type, name: row.master_name, active: row.is_active }))}
            masters={eligibleRooms}
            selectedMaster={roomMasterToAdd}
            setSelectedMaster={setRoomMasterToAdd}
            onAdd={addRoom}
            onDeactivate={deactivateRoom}
            busy={busy || targetRoomAvailability.isFetching}
          />

          <AvailabilityEditor
            icon={Home}
            title="Master Flat Type Availability"
            description={`Effective source right now: ${flatSource}. Add more flat masters to the selected target below.`}
            target={flatTarget}
            setTarget={setFlatTarget}
            organization={organization}
            organizationUnit={organizationUnit}
            rows={(targetFlatAvailability.data?.results ?? []).map((row) => ({ id: row.id, masterId: row.master_flat_type, name: row.master_name, active: row.is_active }))}
            masters={eligibleFlats}
            selectedMaster={flatMasterToAdd}
            setSelectedMaster={setFlatMasterToAdd}
            onAdd={addFlat}
            onDeactivate={deactivateFlat}
            busy={busy || targetFlatAvailability.isFetching}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <SecondaryButton onClick={onBack} disabled={busy}>Back to structure</SecondaryButton>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!loading && !availabilityQuery.error && !canContinue ? <p className="text-right text-[11px] text-amber-600 dark:text-amber-300">At least one effective Room Type and one effective Flat Type are required before continuing.</p> : null}
          <PrimaryButton onClick={onComplete} disabled={!canContinue || busy} loading={loading}><CheckCircle2 className="h-4 w-4" />Continue to execution</PrimaryButton>
        </div>
      </div>
    </StepCard>
  );
}

function AvailabilityEditor<T extends MasterRoomType | MasterFlatType>({
  icon: Icon,
  title,
  description,
  target,
  setTarget,
  organization,
  organizationUnit,
  rows,
  masters,
  selectedMaster,
  setSelectedMaster,
  onAdd,
  onDeactivate,
  busy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  target: AvailabilityTarget;
  setTarget: (value: AvailabilityTarget) => void;
  organization: Organization;
  organizationUnit: OrganizationUnit | null;
  rows: Array<{ id: number; masterId: number; name: string; active: boolean }>;
  masters: T[];
  selectedMaster: number | null;
  setSelectedMaster: (value: number | null) => void;
  onAdd: () => void;
  onDeactivate: (id: number) => void;
  busy: boolean;
}) {
  const activeRows = rows.filter((row) => row.active);
  const activeMasterIds = new Set(activeRows.map((row) => row.masterId));
  const selectable = masters.filter((master) => !activeMasterIds.has(master.id));
  const targetName = target === "organization_unit" ? organizationUnit?.name : organization.name;

  return (
    <section className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
          <div><h3 className="text-sm font-semibold text-foreground">{title}</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p></div>
        </div>
        <div className="min-w-[210px]">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Configure target</p>
          <select className={inputClass} value={target} onChange={(event) => setTarget(event.target.value as AvailabilityTarget)}>
            {organizationUnit ? <option value="organization_unit">{organizationUnit.name} · Project unit</option> : null}
            <option value="organization">{organization.name} · Organization fallback</option>
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/10 p-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground"><Building2 className="h-3.5 w-3.5 text-primary" />Mapped at {targetName}</div>
        {activeRows.length === 0 ? <p className="mt-2 text-[11px] text-muted-foreground">No active masters at this target yet. Add one below.</p> : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {activeRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-2.5">
                <span className="truncate text-xs font-semibold text-foreground">{row.name}</span>
                <button type="button" disabled={busy} onClick={() => onDeactivate(row.id)} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" title="Deactivate availability"><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select className={cn(inputClass, "flex-1")} value={selectedMaster ?? ""} onChange={(event) => setSelectedMaster(event.target.value ? Number(event.target.value) : null)}>
          <option value="">Select another master…</option>
          {selectable.map((master) => <option key={master.id} value={master.id}>{master.name} · {master.is_global ? "Global" : "Organization master"}</option>)}
        </select>
        <button type="button" disabled={!selectedMaster || busy} onClick={onAdd} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4" />Add master</button>
      </div>
    </section>
  );
}

function SourceRow({ icon: Icon, label, source, count }: { icon: React.ComponentType<{ className?: string }>; label: string; source: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2.5">
      <div className="flex min-w-0 items-center gap-2"><Icon className="h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[11px] font-semibold text-foreground">{label}</p><p className="truncate text-[10px] text-muted-foreground">{source}</p></div></div>
      <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-foreground">{count}</span>
    </div>
  );
}
