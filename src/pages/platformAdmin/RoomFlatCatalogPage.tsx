import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, DoorOpen, Home, Layers3, Plus, RefreshCw, Search } from "lucide-react";
import { useOrganizationUnits, useOrganizations } from "@/features/organizations";
import {
  useCreateMasterFlatType,
  useCreateMasterFlatTypeAvailability,
  useCreateMasterRoomType,
  useCreateMasterRoomTypeAvailability,
  useUpdateMasterFlatTypeAvailability,
  useUpdateMasterRoomTypeAvailability,
} from "@/features/projects";
import {
  platformMasterCatalogKeys,
  usePlatformMasterCatalog,
  type CatalogAvailabilityMapping,
  type CatalogOrganization,
  type PlatformMasterCatalogItem,
} from "@/features/platformMasterCatalog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type Tab = "rooms" | "flats";
type Target = "organization" | "organization_unit";

export function RoomFlatCatalogPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("rooms");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [newName, setNewName] = useState("");
  const [mappingMasterId, setMappingMasterId] = useState<number | null>(null);
  const [target, setTarget] = useState<Target>("organization");
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);

  const catalog = usePlatformMasterCatalog({ search, include_inactive: includeInactive });
  const organizations = useOrganizations({ page_size: 500, ordering: "name", is_active: true });
  const units = useOrganizationUnits({ page_size: 500, ordering: "name", is_active: true, organization: organizationId ?? -1 });
  const createRoom = useCreateMasterRoomType();
  const createFlat = useCreateMasterFlatType();
  const createRoomAvailability = useCreateMasterRoomTypeAvailability();
  const createFlatAvailability = useCreateMasterFlatTypeAvailability();
  const updateRoomAvailability = useUpdateMasterRoomTypeAvailability();
  const updateFlatAvailability = useUpdateMasterFlatTypeAvailability();

  const rows = tab === "rooms" ? catalog.data?.room_types ?? [] : catalog.data?.flat_types ?? [];
  const selectedMaster = rows.find((row) => row.id === mappingMasterId) ?? null;
  const busy = createRoom.isPending || createFlat.isPending || createRoomAvailability.isPending || createFlatAvailability.isPending || updateRoomAvailability.isPending || updateFlatAvailability.isPending;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: platformMasterCatalogKeys.all });
  };

  const createMaster = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      const code = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
      if (tab === "rooms") {
        await createRoom.mutateAsync({ owner_organization: null, name: newName.trim(), code, is_global: true, is_active: true });
      } else {
        await createFlat.mutateAsync({ owner_organization: null, name: newName.trim(), code, is_global: true, is_active: true });
      }
      setNewName("");
      await refresh();
    } catch (err) {
      setError(err);
    }
  };

  const addMapping = async () => {
    if (!selectedMaster || !organizationId || (target === "organization_unit" && !unitId)) return;
    setError(null);
    try {
      const existing = selectedMaster.availability_mappings.find((mapping) =>
        target === "organization"
          ? mapping.target_type === "organization" && mapping.organization?.id === organizationId
          : mapping.target_type === "organization_unit" && mapping.organization_unit?.id === unitId
      );
      if (tab === "rooms") {
        if (existing) await updateRoomAvailability.mutateAsync({ id: existing.id, payload: { is_active: true } });
        else await createRoomAvailability.mutateAsync({ master_room_type: selectedMaster.id, organization: target === "organization" ? organizationId : null, organization_unit: target === "organization_unit" ? unitId : null, is_active: true });
      } else {
        if (existing) await updateFlatAvailability.mutateAsync({ id: existing.id, payload: { is_active: true } });
        else await createFlatAvailability.mutateAsync({ master_flat_type: selectedMaster.id, organization: target === "organization" ? organizationId : null, organization_unit: target === "organization_unit" ? unitId : null, is_active: true });
      }
      await refresh();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Platform master catalog</p>
            <h1 className="mt-1 font-logo text-2xl font-normal tracking-tight text-foreground">Room & Flat Catalog</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Global/organization Room and Flat masters, every Organization/Organization Unit availability mapping, and the projects already using each master.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Room types" value={catalog.data?.summary.room_types ?? 0} />
            <Stat label="Flat types" value={catalog.data?.summary.flat_types ?? 0} />
            <Stat label="Room mappings" value={catalog.data?.summary.room_availability_mappings ?? 0} />
            <Stat label="Flat mappings" value={catalog.data?.summary.flat_availability_mappings ?? 0} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-xl border border-border bg-muted/20 p-1">
            <TabButton active={tab === "rooms"} onClick={() => { setTab("rooms"); setMappingMasterId(null); }} icon={DoorOpen}>Room Types</TabButton>
            <TabButton active={tab === "flats"} onClick={() => { setTab("flats"); setMappingMasterId(null); }} icon={Home}>Flat Types</TabButton>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-[260px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary" placeholder="Search master name/code" /></label>
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground"><input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />Include inactive</label>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary" placeholder={`Create global ${tab === "rooms" ? "room" : "flat"} master…`} />
          <button type="button" disabled={!newName.trim() || busy} onClick={createMaster} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4" />Create master</button>
        </div>

        {error ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(error, "Unable to update the master catalog.")}</p> : null}

        {catalog.isLoading ? <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Loading catalog tree…</div> : null}
        <div className="mt-5 space-y-3">
          {rows.map((master) => <MasterTreeCard key={master.id} master={master} selected={mappingMasterId === master.id} onSelect={() => setMappingMasterId(master.id)} />)}
          {!catalog.isLoading && rows.length === 0 ? <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No masters match this filter.</div> : null}
        </div>
      </section>

      {selectedMaster ? (
        <section className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3"><Layers3 className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="text-sm font-semibold text-foreground">Map {selectedMaster.name}</h2><p className="mt-1 text-xs text-muted-foreground">Create or reactivate an availability row for an organization or one of its units.</p></div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select value={organizationId ?? ""} onChange={(e) => { setOrganizationId(e.target.value ? Number(e.target.value) : null); setUnitId(null); }} className="h-10 rounded-xl border border-border bg-background px-3 text-xs"><option value="">Select organization</option>{(organizations.data?.results ?? []).map((org) => <option key={org.id} value={org.id}>{org.name} · {org.organization_id}</option>)}</select>
            <select value={target} onChange={(e) => { setTarget(e.target.value as Target); setUnitId(null); }} className="h-10 rounded-xl border border-border bg-background px-3 text-xs"><option value="organization">Organization</option><option value="organization_unit">Organization unit</option></select>
            {target === "organization_unit" ? <select value={unitId ?? ""} onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : null)} disabled={!organizationId} className="h-10 rounded-xl border border-border bg-background px-3 text-xs disabled:opacity-40"><option value="">Select unit</option>{(units.data?.results ?? []).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select> : <div className="flex h-10 items-center rounded-xl border border-border bg-muted/20 px-3 text-xs text-muted-foreground"><Building2 className="mr-2 h-4 w-4" />Organization-level availability</div>}
          </div>
          <button type="button" disabled={!organizationId || (target === "organization_unit" && !unitId) || busy} onClick={addMapping} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4" />Add / reactivate mapping</button>
        </section>
      ) : null}
    </div>
  );
}

function MasterTreeCard({ master, selected, onSelect }: { master: PlatformMasterCatalogItem; selected: boolean; onSelect: () => void }) {
  const grouped = useMemo(() => {
    const map = new Map<number, { organization: CatalogOrganization; rows: CatalogAvailabilityMapping[] }>();
    for (const mapping of master.availability_mappings) {
      if (!mapping.organization) continue;
      const existing = map.get(mapping.organization.id) ?? { organization: mapping.organization, rows: [] };
      existing.rows.push(mapping);
      map.set(mapping.organization.id, existing);
    }
    return [...map.values()].sort((a, b) => a.organization.name.localeCompare(b.organization.name));
  }, [master.availability_mappings]);

  return (
    <details className={cn("rounded-xl border bg-background", selected ? "border-primary/40" : "border-border")}>
      <summary className="cursor-pointer list-none p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-foreground">{master.name}</span><span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{master.code}</span><span className="rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">{master.is_global ? "Global" : master.owner_organization?.name ?? "Organization"}</span>{!master.is_active ? <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] text-destructive">Inactive</span> : null}</div><p className="mt-1 text-[11px] text-muted-foreground">{master.availability_count} availability mappings · {master.project_usage_count} project copies</p></div>
          <button type="button" onClick={(e) => { e.preventDefault(); onSelect(); }} className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5">Map this master</button>
        </div>
      </summary>
      <div className="border-t border-border p-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Availability tree</p><div className="mt-2 space-y-2">{grouped.length ? grouped.map((group) => <div key={group.organization.id} className="rounded-lg border border-border bg-muted/10 p-3"><p className="text-xs font-semibold text-foreground">{group.organization.name} <span className="font-mono text-[10px] text-muted-foreground">{group.organization.organization_id}</span></p><div className="mt-2 flex flex-wrap gap-1.5">{group.rows.map((mapping) => <span key={mapping.id} className={cn("rounded-md border px-2 py-1 text-[10px]", mapping.is_active ? "border-primary/20 bg-primary/5 text-primary" : "border-border text-muted-foreground line-through")}>{mapping.target_type === "organization" ? "Organization" : mapping.organization_unit?.name ?? "Unit"}</span>)}</div></div>) : <p className="text-xs text-muted-foreground">No organization/unit mappings.</p>}</div></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Project usage</p><div className="mt-2 space-y-2">{master.project_usage.length ? master.project_usage.map((usage) => <div key={usage.project_type_id} className="rounded-lg border border-border bg-muted/10 p-3"><p className="text-xs font-semibold text-foreground">{usage.project_name}</p><p className="mt-1 text-[10px] text-muted-foreground">{usage.organization?.name}{usage.organization_unit ? ` → ${usage.organization_unit.name}` : ""} · local type {usage.name}</p></div>) : <p className="text-xs text-muted-foreground">Not copied into any project yet.</p>}</div></div>
        </div>
      </div>
    </details>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold", active ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}><Icon className="h-4 w-4" />{children}</button>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-muted/20 px-3 py-2"><p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold text-foreground">{value}</p></div>; }
