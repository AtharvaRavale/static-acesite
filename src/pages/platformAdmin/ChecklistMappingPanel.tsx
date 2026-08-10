import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  GitBranch,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { EntityPicker, type EntityPickerPage } from "@/components/common/EntityPicker";
import { ToastNotice } from "@/components/ui/ToastNotice";
import { useWorkspace } from "@/features/workspace";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type ChecklistPickerRow = {
  id: number;
  name: string;
  code: string;
  scope_type: string;
  template: number | null;
  template_name: string | null;
  taxonomy_name: string | null;
  category_name: string | null;
  version: number;
  structure_type: string;
  item_count: number;
  is_active: boolean;
};

type ExecutionNodeRow = {
  id: number;
  project: number;
  scheme: number;
  scheme_name: string;
  level: number;
  level_name: string;
  name: string;
  code: string;
  full_path: string;
  is_active: boolean;
};

type StructureLevelRow = {
  id: number;
  project: number;
  name: string;
  code: string;
  sequence: number;
  checklist_allowed: boolean;
  is_active: boolean;
};

type LocationNode = {
  id: number;
  project: number;
  level: number;
  level_name: string;
  parent: number | null;
  name: string;
  code: string;
  full_path: string;
  area_type: string;
  checklist_allowed: boolean;
  depth: number;
  children?: LocationNode[];
  is_active: boolean;
};

type CompatibleModule = {
  project_module_access: number;
  organization_module: number;
  module: number;
  module_code: string;
  module_name: string;
};

type MappingRow = {
  id: number;
  project: number;
  project_name: string;
  checklist: number;
  checklist_name: string;
  execution_node: number;
  execution_node_name: string;
  structure_scope: "all_structures" | "structure_level" | "specific_nodes";
  structure_level: number | null;
  applies_to_descendants: boolean;
  area_type: string;
  status: "draft" | "submitted" | "archived";
  submitted_at: string | null;
  resolved_locations?: Array<{ id: number }>;
  module_links?: Array<{ id: number; module_name: string; module_code: string }>;
};

type WorkflowStepReview = {
  workflow_step: number;
  workflow_step_name: string;
  workflow_step_code: string;
  group: number;
  group_name: string;
  group_display_order: number;
  display_order: number;
  step_kind: string;
  pool_resolution: string;
  default: {
    assignment_type: string;
    named_user: number | null;
    named_user_email: string | null;
    target_role: number | null;
    target_role_name: string | null;
    target_team: number | null;
    target_team_name: string | null;
    pool_resolution: string;
  };
  effective: {
    assignment_type: string;
    named_user: number | null;
    named_user_email: string | null;
    target_role: number | null;
    target_role_name: string | null;
    target_team: number | null;
    target_team_name: string | null;
    source: string;
  };
  has_mapping_override: boolean;
};

type WorkflowSelectionReview = {
  id: number;
  mapping_module: number;
  location_node: number | null;
  workflow_applicability: number;
  workflow_template: number;
  workflow_template_name: string;
  workflow_template_code: string;
  is_default: boolean;
  assignments?: Array<{
    workflow_step: number;
    workflow_step_name: string;
    assignment_type: string;
    named_user?: number | null;
    named_user_email?: string | null;
    target_role?: number | null;
    target_role_name?: string | null;
    target_team?: number | null;
    target_team_name?: string | null;
  }>;
  steps?: WorkflowStepReview[];
};

type AssignmentOptions = {
  roles: Array<{ id: number; name: string; code: string; module_id: number | null; scope: string }>;
  users: Array<{ id: number; name: string; email: string; membership_type: string; role_ids: number[] }>;
  teams: Array<{ id: number; name: string; project_id: number; project_name: string; party_name: string }>;
};

type MappingResult = {
  mapping: {
    id: number;
    status: string;
    project_name: string;
    checklist_name: string;
    execution_node_name: string;
    structure_scope: string;
    structure_level: number | null;
    applies_to_descendants: boolean;
    area_type: string;
  };
  summary: {
    target_count: number;
    mapping_module_count: number;
    workflow_selection_count: number;
    checklist_instance_count: number;
    workflow_instance_count: number;
  };
  can_submit: boolean;
  validation_warnings: string[];
  resolved_locations: Array<{
    location_node: number;
    name: string;
    full_path: string;
    level_name: string;
    area_type: string;
  }>;
  workflow_selections?: WorkflowSelectionReview[];
  instances?: Array<{
    id: number;
    reference: string;
    status: string;
    location_node: number;
    workflow_instance?: { id: number; status: string; steps?: Array<{ workflow_step_name: string; status: string; assigned_user?: number | null; assigned_role?: number | null; assigned_team?: number | null }> } | null;
  }>;
};

type Props = {
  organizationId: number;
  canView: boolean;
  canManage: boolean;
  canSubmit: boolean;
};

const field = "h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary";
const areaTypes = ["general", "private_area", "common_area", "amenity_area", "service_area", "external_area"];

const normalizePage = <T,>(data: EntityPickerPage<T> | T[]): EntityPickerPage<T> => Array.isArray(data)
  ? { count: data.length, results: data }
  : data;

const flattenTree = (rows: LocationNode[]): LocationNode[] => rows.flatMap((row) => [row, ...flattenTree(row.children ?? [])]);

export function ChecklistMappingPanel({ organizationId, canView, canManage, canSubmit }: Props) {
  const workspace = useWorkspace();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState<number | null>(workspace.projects[0]?.id ?? null);
  const [checklists, setChecklists] = useState<ChecklistPickerRow[]>([]);
  const [executionNodes, setExecutionNodes] = useState<ExecutionNodeRow[]>([]);
  const [structureScope, setStructureScope] = useState<"all_structures" | "structure_level" | "specific_nodes">("all_structures");
  const [structureLevelId, setStructureLevelId] = useState<number | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<number>>(new Set());
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [areaType, setAreaType] = useState("general");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reviewedWorkflowSelections, setReviewedWorkflowSelections] = useState<Set<number>>(new Set());

  useEffect(() => {
    setReviewedWorkflowSelections(new Set());
  }, [detailId]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const mappings = useQuery({
    queryKey: ["checklist-mappings", organizationId, page],
    enabled: canView,
    queryFn: async () => normalizePage((await api.get<EntityPickerPage<MappingRow>>(`/checklist-mappings/?organization=${organizationId}&page=${page}&page_size=20&ordering=-created_at`)).data),
  });

  const structureLevels = useQuery({
    queryKey: ["checklist-mapping-structure-levels", projectId],
    enabled: Boolean(projectId && drawerOpen),
    queryFn: async () => normalizePage((await api.get<EntityPickerPage<StructureLevelRow>>(`/project-structure-levels/?project=${projectId}&ordering=sequence&page_size=100&is_active=true`)).data),
  });

  const locationTree = useQuery({
    queryKey: ["checklist-mapping-location-tree", projectId],
    enabled: Boolean(projectId && drawerOpen),
    queryFn: async () => (await api.get<LocationNode[]>(`/project-location-nodes/tree/?project=${projectId}`)).data,
  });

  const compatibleModules = useQuery({
    queryKey: ["checklist-mapping-compatible-modules", projectId, checklists.map((row) => row.id).join(",")],
    enabled: Boolean(projectId && checklists.length && drawerOpen),
    queryFn: async () => (await api.get<{ results: CompatibleModule[] }>(`/checklist-mappings/compatible-modules/?project=${projectId}&checklists=${checklists.map((row) => row.id).join(",")}`)).data.results,
  });

  useEffect(() => {
    const allowed = new Set((compatibleModules.data ?? []).map((row) => row.organization_module));
    setSelectedModuleIds((current) => current.filter((id) => allowed.has(id)));
  }, [compatibleModules.data]);

  useEffect(() => {
    setChecklists([]);
    setExecutionNodes([]);
    setStructureLevelId(null);
    setSelectedNodeIds(new Set());
    setSelectedModuleIds([]);
  }, [projectId]);

  useEffect(() => {
    if (structureScope !== "structure_level") setStructureLevelId(null);
    if (structureScope !== "specific_nodes") setSelectedNodeIds(new Set());
  }, [structureScope]);

  const loadChecklistPage = useCallback(async ({ page, search, pageSize }: { page: number; search: string; pageSize: number }) => {
    if (!projectId) return { count: 0, results: [] } as EntityPickerPage<ChecklistPickerRow>;
    const params = new URLSearchParams({ project: String(projectId), page: String(page), page_size: String(pageSize) });
    if (search) params.set("search", search);
    return normalizePage((await api.get<EntityPickerPage<ChecklistPickerRow>>(`/checklist-picker/?${params}`)).data);
  }, [projectId]);

  const loadExecutionPage = useCallback(async ({ page, search, pageSize }: { page: number; search: string; pageSize: number }) => {
    if (!projectId) return { count: 0, results: [] } as EntityPickerPage<ExecutionNodeRow>;
    const params = new URLSearchParams({ project: String(projectId), page: String(page), page_size: String(pageSize), is_active: "true" });
    if (search) params.set("search", search);
    return normalizePage((await api.get<EntityPickerPage<ExecutionNodeRow>>(`/execution-nodes/?${params}`)).data);
  }, [projectId]);

  const createMappings = useMutation({
    mutationFn: async () => {
      if (!projectId || !checklists.length || !executionNodes[0] || !selectedModuleIds.length) throw new Error("Complete all required mapping fields.");
      if (structureScope === "structure_level" && !structureLevelId) throw new Error("Select a structure level.");
      if (structureScope === "specific_nodes" && selectedNodeIds.size === 0) throw new Error("Select at least one physical node from the hierarchy.");
      const rootNodes = structureScope === "specific_nodes"
        ? Array.from(selectedNodeIds).map((id) => ({ location_node: id, include_descendants: includeDescendants, is_active: true }))
        : [];
      return (await api.post("/checklist-mappings/bulk-create/", {
        organization: organizationId,
        project: projectId,
        checklist_ids: checklists.map((row) => row.id),
        execution_node: executionNodes[0].id,
        structure_scope: structureScope,
        structure_level: structureScope === "structure_level" ? structureLevelId : null,
        root_nodes: rootNodes,
        applies_to_descendants: includeDescendants,
        area_type: areaType,
        organization_module_ids: selectedModuleIds,
        is_active: true,
      })).data as { count: number; results: MappingResult[] };
    },
    onSuccess: async (result) => {
      setToast(`${result.count} draft mapping${result.count === 1 ? "" : "s"} created.`);
      setDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["checklist-mappings", organizationId] });
    },
    onError: setError,
  });

  const submitMapping = useMutation({
    mutationFn: async (id: number) => (await api.post<MappingResult>(`/checklist-mappings/${id}/submit/`, { assignment_reviewed: true })).data,
    onSuccess: async () => {
      setToast("Mapping submitted and instances created.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["checklist-mappings", organizationId] }),
        queryClient.invalidateQueries({ queryKey: ["checklist-mapping-result", detailId] }),
      ]);
    },
    onError: setError,
  });

  const detail = useQuery({
    queryKey: ["checklist-mapping-result", detailId],
    enabled: Boolean(detailId),
    queryFn: async () => (await api.get<MappingResult>(`/checklist-mappings/${detailId}/result/?include_tree=true&include_workflows=true&include_instances=true&include_suitable_workflows=true`)).data,
  });

  const tree = locationTree.data ?? [];
  const flatNodes = useMemo(() => flattenTree(tree), [tree]);
  const selectedLevel = (structureLevels.data?.results ?? []).find((row) => row.id === structureLevelId) ?? null;
  const levelNodeCount = selectedLevel ? flatNodes.filter((node) => node.level === selectedLevel.id && node.is_active).length : 0;
  const pageCount = Math.max(1, Math.ceil((mappings.data?.count ?? 0) / 20));

  const resetDrawer = () => {
    setProjectId(workspace.projects[0]?.id ?? null);
    setChecklists([]);
    setExecutionNodes([]);
    setStructureScope("all_structures");
    setStructureLevelId(null);
    setSelectedNodeIds(new Set());
    setIncludeDescendants(true);
    setSelectedModuleIds([]);
    setAreaType("general");
    setError(null);
  };

  const openNew = () => { resetDrawer(); setDrawerOpen(true); };

  if (!canView) return null;

  return <div className="space-y-5">
    <ToastNotice message={toast} onClose={() => setToast(null)} />
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Mappings</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Checklist mappings</h1><p className="mt-1 text-xs text-muted-foreground">Map one or many checklist definitions to execution context and physical project structure.</p></div>{canManage ? <button type="button" onClick={openNew} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New mapping</button> : null}</div>
    {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(error, "Checklist mapping operation failed.")}</div> : null}

    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[minmax(0,1fr)_150px_120px_100px_44px] border-b border-border bg-muted/20 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><span>Mapping</span><span>Physical scope</span><span>Targets</span><span>Status</span><span /></div>
      {mappings.isLoading ? <LoadingBlock label="Loading checklist mappings..." /> : !(mappings.data?.results.length) ? <div className="p-10 text-center"><ClipboardCheck className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No mappings yet</p><p className="mt-1 text-xs text-muted-foreground">Create a draft mapping to resolve physical targets and workflows.</p></div> : mappings.data.results.map((row, index) => <button key={row.id} type="button" onClick={() => setDetailId(row.id)} className={cn("grid w-full grid-cols-[minmax(0,1fr)_150px_120px_100px_44px] items-center px-4 py-3 text-left hover:bg-muted/20", index > 0 && "border-t border-border")}><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{row.checklist_name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{row.project_name} · {row.execution_node_name}</span></span><span className="text-xs text-foreground">{scopeLabel(row.structure_scope)}</span><span className="text-xs text-foreground">{row.resolved_locations?.length ?? 0}</span><span><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase", row.status === "submitted" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>{row.status}</span></span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>)}
      <div className="flex items-center justify-between border-t border-border px-4 py-3"><span className="text-[10px] text-muted-foreground">{mappings.data?.count ?? 0} mappings</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-border px-3 py-1.5 text-[10px] disabled:opacity-40">Previous</button><span className="text-[10px] text-muted-foreground">{page}/{pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-border px-3 py-1.5 text-[10px] disabled:opacity-40">Next</button></div></div>
    </section>

    {drawerOpen ? <div className="fixed inset-0 z-[80] bg-black/35" onMouseDown={(event) => { if (event.currentTarget === event.target && !createMappings.isPending) setDrawerOpen(false); }}><div className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Checklist mapping</p><h2 className="mt-1 text-lg font-bold">New mapping</h2></div><button type="button" disabled={createMappings.isPending} onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-40"><X className="h-4 w-4" /></button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project</span><select className={`${field} w-full`} value={projectId ?? ""} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}><option value="">Select project</option>{workspace.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <EntityPicker<ExecutionNodeRow> label="Execution context" placeholder="Select execution node" modalTitle="Select execution node" value={executionNodes} onChange={setExecutionNodes} getId={(row) => row.id} getLabel={(row) => row.full_path || row.name} loadPage={loadExecutionPage} columns={[{ key: "node", label: "Execution node", render: (row) => row.full_path || row.name }, { key: "scheme", label: "Scheme", render: (row) => row.scheme_name }, { key: "level", label: "Level", render: (row) => row.level_name }]} disabled={!projectId} />
        </div>
        <div className="mt-4"><EntityPicker<ChecklistPickerRow> label="Checklists" placeholder="Select one or multiple checklists" modalTitle="Select checklists" value={checklists} onChange={setChecklists} getId={(row) => row.id} getLabel={(row) => row.name} loadPage={loadChecklistPage} multiple columns={[{ key: "name", label: "Checklist", render: (row) => <span><b>{row.name}</b><span className="ml-2 font-mono text-[9px] text-muted-foreground">{row.code}</span></span> }, { key: "template", label: "Template", render: (row) => row.template_name || "Custom" }, { key: "category", label: "Taxonomy / category", render: (row) => `${row.taxonomy_name || "—"} / ${row.category_name || "—"}` }, { key: "questions", label: "Questions", render: (row) => row.item_count }]} disabled={!projectId} /></div>

        <div className="mt-6 rounded-2xl border border-border bg-muted/10 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Physical structure scope</p><div className="mt-3 grid gap-2 md:grid-cols-3">{([
          ["all_structures", "Entire project", "All eligible physical nodes"],
          ["structure_level", "Structure level", "All nodes at one level"],
          ["specific_nodes", "Specific nodes", "Pick nodes across the hierarchy"],
        ] as const).map(([value, title, description]) => <button key={value} type="button" onClick={() => setStructureScope(value)} className={cn("rounded-xl border p-3 text-left transition", structureScope === value ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30")}><div className="flex items-center gap-2"><span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", structureScope === value ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{structureScope === value ? <Check className="h-3 w-3" /> : null}</span><span className="text-xs font-semibold">{title}</span></div><p className="mt-1 pl-6 text-[10px] text-muted-foreground">{description}</p></button>)}</div>

          {structureScope === "structure_level" ? <div className="mt-4"><label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Structure level</span><select className={`${field} w-full`} value={structureLevelId ?? ""} onChange={(e) => setStructureLevelId(e.target.value ? Number(e.target.value) : null)}><option value="">Select level</option>{(structureLevels.data?.results ?? []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>{selectedLevel ? <><div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs"><b>{levelNodeCount}</b> active {selectedLevel.name} node{levelNodeCount === 1 ? "" : "s"} will be used automatically. This scope means <b>all {selectedLevel.name}</b>, not selected {selectedLevel.name} nodes.</div>{locationTree.isLoading ? <LoadingBlock label="Loading project architecture..." /> : <div className="mt-3 max-h-[320px] overflow-y-auto rounded-xl border border-border bg-background p-2">{tree.map((node) => <ArchitectureLevelPreviewNode key={node.id} node={node} levelId={selectedLevel.id} />)}</div>}</> : null}</div> : null}

          {structureScope === "specific_nodes" ? <div className="mt-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold">Select physical nodes</p><p className="mt-0.5 text-[10px] text-muted-foreground">Select Tower nodes, Floor nodes, Flat/Unit nodes—or any combination—before submitting.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{selectedNodeIds.size} selected</span></div>{locationTree.isLoading ? <LoadingBlock label="Loading project architecture..." /> : <div className="mt-3 max-h-[430px] overflow-y-auto rounded-xl border border-border bg-background p-2">{tree.length ? tree.map((node) => <ArchitectureSelectNode key={node.id} node={node} selected={selectedNodeIds} onToggle={(id) => setSelectedNodeIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} />) : <p className="p-6 text-center text-xs text-muted-foreground">No project architecture nodes found.</p>}</div>}</div> : null}

          {structureScope !== "all_structures" ? <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3"><input className="mt-0.5" type="checkbox" checked={includeDescendants} onChange={(e) => setIncludeDescendants(e.target.checked)} /><span><span className="block text-xs font-semibold">Include descendants</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{structureScope === "structure_level" ? "ON: every node at the selected level plus eligible lower descendants. OFF: only all nodes at the selected level." : "ON: each selected node plus eligible descendants. OFF: only the exact selected nodes."}</span></span></label> : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2"><label><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Area type</span><select className={`${field} w-full`} value={areaType} onChange={(e) => setAreaType(e.target.value)}>{areaTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label><div><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Receiving modules</p>{compatibleModules.isLoading ? <div className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Checking compatibility...</div> : !checklists.length ? <div className="flex h-10 items-center rounded-xl border border-dashed border-border px-3 text-xs text-muted-foreground">Select checklists first.</div> : !(compatibleModules.data?.length) ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">The selected checklists do not share a compatible active project module.</div> : <div className="flex flex-wrap gap-2">{compatibleModules.data.map((row) => { const checked = selectedModuleIds.includes(row.organization_module); return <label key={row.organization_module} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs", checked ? "border-primary bg-primary/5" : "border-border bg-background")}><input type="checkbox" checked={checked} onChange={() => setSelectedModuleIds(checked ? selectedModuleIds.filter((id) => id !== row.organization_module) : [...selectedModuleIds, row.organization_module])} />{row.module_name}<span className="font-mono text-[9px] text-muted-foreground">{row.module_code}</span></label>; })}</div>}</div></div>
      </div>
      <div className="border-t border-border p-4"><button type="button" disabled={createMappings.isPending || !projectId || !checklists.length || !executionNodes.length || !selectedModuleIds.length || (structureScope === "structure_level" && !structureLevelId) || (structureScope === "specific_nodes" && selectedNodeIds.size === 0)} onClick={() => { setError(null); createMappings.mutate(); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-40">{createMappings.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Creating drafts, resolving locations and workflows...</> : <><Plus className="h-4 w-4" />Create {checklists.length || ""} draft mapping{checklists.length === 1 ? "" : "s"}</>}</button></div>
    </div></div> : null}

    {detailId ? <MappingReviewDrawer
      mappingId={detailId}
      detail={detail}
      canManage={canManage}
      canSubmit={canSubmit}
      submitPending={submitMapping.isPending}
      reviewedSelections={reviewedWorkflowSelections}
      onReviewed={(selectionId) => setReviewedWorkflowSelections((current) => new Set(current).add(selectionId))}
      onClose={() => setDetailId(null)}
      onSubmit={() => { setError(null); submitMapping.mutate(detailId); }}
      onError={setError}
      onSaved={async () => {
        await queryClient.invalidateQueries({ queryKey: ["checklist-mapping-result", detailId] });
      }}
    /> : null}
  </div>;
}


type StepChoice = {
  mode: "default" | "role" | "named_user" | "team";
  role: number | null;
  user: number | null;
  team: number | null;
  roleFilter: number | null;
};

function initialStepChoices(row: WorkflowSelectionReview): Record<number, StepChoice> {
  const values: Record<number, StepChoice> = {};
  for (const step of row.steps ?? []) {
    values[step.workflow_step] = {
      mode: step.has_mapping_override
        ? (step.effective.assignment_type as StepChoice["mode"])
        : "default",
      role: step.has_mapping_override ? step.effective.target_role : null,
      user: step.has_mapping_override ? step.effective.named_user : null,
      team: step.has_mapping_override ? step.effective.target_team : null,
      roleFilter: null,
    };
  }
  return values;
}

function assignmentSummary(step: WorkflowStepReview) {
  const row = step.default;
  if (row.assignment_type === "role") return row.target_role_name ? `Role pool · ${row.target_role_name}` : "Role pool · not configured";
  if (row.assignment_type === "named_user") return row.named_user_email ? `Named user · ${row.named_user_email}` : "Named user · not configured";
  if (row.assignment_type === "team") return row.target_team_name ? `Team · ${row.target_team_name}` : "Team · not configured";
  if (row.assignment_type === "manager") return "Manager resolution";
  return row.assignment_type || "Not configured";
}

function MappingReviewDrawer({
  mappingId,
  detail,
  canManage,
  canSubmit,
  submitPending,
  reviewedSelections,
  onReviewed,
  onClose,
  onSubmit,
  onError,
  onSaved,
}: {
  mappingId: number;
  detail: { isLoading: boolean; data?: MappingResult };
  canManage: boolean;
  canSubmit: boolean;
  submitPending: boolean;
  reviewedSelections: Set<number>;
  onReviewed: (selectionId: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  onError: (error: unknown) => void;
  onSaved: () => Promise<void>;
}) {
  const data = detail.data;
  const selections = data?.workflow_selections ?? [];
  const allReviewed = selections.length > 0 && selections.every((row) => reviewedSelections.has(row.id));

  return <div className="fixed inset-0 z-[80] bg-black/35" onMouseDown={(event) => { if (event.currentTarget === event.target && !submitPending) onClose(); }}>
    <div className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Review mapping</p>
          <h2 className="mt-1 text-lg font-bold">{data?.mapping.checklist_name || "Checklist mapping"}</h2>
        </div>
        <button type="button" disabled={submitPending} onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted disabled:opacity-40"><X className="h-4 w-4" /></button>
      </div>

      {detail.isLoading ? <LoadingBlock label="Loading mapping, targets and workflow assignments..." /> : data ? <>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-3"><Stat label="Targets" value={data.summary.target_count} /><Stat label="Workflows" value={data.summary.workflow_selection_count} /><Stat label="Instances" value={data.summary.checklist_instance_count} /></div>

          <div className="mt-5 rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold">1. Mapping context</p>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p><b className="text-foreground">Project:</b> {data.mapping.project_name}</p>
              <p><b className="text-foreground">Execution:</b> {data.mapping.execution_node_name}</p>
              <p><b className="text-foreground">Physical scope:</b> {scopeLabel(data.mapping.structure_scope)} · descendants {data.mapping.applies_to_descendants ? "on" : "off"}</p>
            </div>
          </div>

          {data.validation_warnings.length ? <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700">{data.validation_warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}

          <div className="mt-5">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold">2. Resolved physical targets</p><span className="text-[10px] text-muted-foreground">{data.resolved_locations.length} locations</span></div>
            <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-border">{data.resolved_locations.map((row) => <div key={row.location_node} className="border-b border-border/70 px-3 py-2 last:border-b-0"><p className="text-xs font-medium">{row.full_path || row.name}</p><p className="text-[10px] text-muted-foreground">{row.level_name} · {row.area_type.replaceAll("_", " ")}</p></div>)}</div>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold">3. Workflow step assignments</p><p className="mt-1 text-[10px] text-muted-foreground">Every workflow step shows its configured default. Keep the default, use another role pool, pick a specific user, or select a project team.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-bold text-muted-foreground">{reviewedSelections.size}/{selections.length} reviewed</span></div>
            <div className="mt-3 space-y-3">{selections.length ? selections.map((row) => <WorkflowAssignmentReviewCard key={row.id} mappingId={mappingId} row={row} canManage={canManage && data.mapping.status === "draft"} reviewed={reviewedSelections.has(row.id)} onReviewed={() => onReviewed(row.id)} onError={onError} onSaved={onSaved} />) : <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">No workflow is selected. Resolve a workflow before submitting this mapping.</div>}</div>
          </div>

          {data.instances?.length ? <div className="mt-6"><p className="text-xs font-semibold">Generated instances</p><div className="mt-2 space-y-2">{data.instances.map((instance) => <div key={instance.id} className="rounded-xl border border-border p-3"><p className="text-xs font-semibold">{instance.reference}</p><p className="mt-1 text-[10px] text-muted-foreground">{instance.status} · Workflow {instance.workflow_instance?.status || "—"}</p></div>)}</div></div> : null}
        </div>

        {data.mapping.status === "draft" && canSubmit ? <div className="border-t border-border bg-card p-4">
          {!allReviewed ? <p className="mb-2 text-[10px] text-amber-600">Review every workflow selection before final submit. Defaults do not need to be overridden, but they must be visibly reviewed.</p> : <p className="mb-2 flex items-center gap-1.5 text-[10px] text-emerald-600"><Check className="h-3.5 w-3.5" />All workflow step assignments reviewed.</p>}
          <button type="button" disabled={!data.can_submit || !allReviewed || submitPending} onClick={onSubmit} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-40">{submitPending ? <><Loader2 className="h-4 w-4 animate-spin" />Creating checklist and workflow instances...</> : <><Send className="h-4 w-4" />Final submit mapping</>}</button>
        </div> : null}
      </> : null}
    </div>
  </div>;
}

function WorkflowAssignmentReviewCard({ mappingId, row, canManage, reviewed, onReviewed, onError, onSaved }: {
  mappingId: number;
  row: WorkflowSelectionReview;
  canManage: boolean;
  reviewed: boolean;
  onReviewed: () => void;
  onError: (error: unknown) => void;
  onSaved: () => Promise<void>;
}) {
  const [choices, setChoices] = useState<Record<number, StepChoice>>(() => initialStepChoices(row));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => { setChoices(initialStepChoices(row)); }, [row.id, row.steps]);

  const options = useQuery({
    queryKey: ["checklist-mapping-assignment-options", mappingId, row.id],
    enabled: Boolean(row.id),
    queryFn: async () => (await api.get<AssignmentOptions>(`/checklist-mappings/${mappingId}/assignment-options/?workflow_selection=${row.id}`)).data,
  });

  const save = useMutation({
    mutationFn: async () => {
      const assignments = (row.steps ?? []).flatMap((step) => {
        const choice = choices[step.workflow_step] ?? { mode: "default", role: null, user: null, team: null, roleFilter: null };
        if (choice.mode === "default") return [];
        if (choice.mode === "role" && !choice.role) throw new Error(`${step.workflow_step_name}: select a role pool.`);
        if (choice.mode === "named_user" && (!choice.roleFilter || !choice.user)) throw new Error(`${step.workflow_step_name}: select a role first, then a user.`);
        if (choice.mode === "team" && !choice.team) throw new Error(`${step.workflow_step_name}: select a project team.`);
        return [{
          workflow_step: step.workflow_step,
          assignment_type: choice.mode,
          named_user: choice.mode === "named_user" ? choice.user : null,
          target_role: choice.mode === "role" ? choice.role : null,
          target_team: choice.mode === "team" ? choice.team : null,
          is_active: true,
        }];
      });
      return (await api.post(`/checklist-mappings/${mappingId}/workflow-selections/`, {
        selections: [{
          mapping_module: row.mapping_module,
          location_node: row.location_node,
          workflow_applicability: row.workflow_applicability,
          assignments,
          is_active: true,
        }],
      })).data;
    },
    onSuccess: async () => {
      setLocalError(null);
      onReviewed();
      await onSaved();
    },
    onError: (error) => {
      setLocalError(getApiErrorMessage(error, "Could not save workflow assignments."));
      onError(error);
    },
  });

  const opts = options.data ?? { roles: [], users: [], teams: [] };
  const update = (stepId: number, patch: Partial<StepChoice>) => setChoices((current) => ({ ...current, [stepId]: { ...(current[stepId] ?? { mode: "default", role: null, user: null, team: null, roleFilter: null }), ...patch } }));

  return <div className={cn("rounded-2xl border p-4", reviewed ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-border bg-background")}>
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /><p className="text-xs font-semibold">{row.workflow_template_name}</p>{row.is_default ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-bold text-primary">DEFAULT WORKFLOW</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-[8px] font-bold text-muted-foreground">LOCATION OVERRIDE</span>}</div><p className="mt-1 text-[10px] text-muted-foreground">{row.workflow_template_code}{row.location_node ? ` · location ${row.location_node}` : " · applies to all resolved targets unless overridden"}</p></div>{reviewed ? <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600"><Check className="h-3.5 w-3.5" />REVIEWED</span> : null}</div>

    {options.isLoading ? <LoadingBlock label="Loading eligible roles, users and teams..." /> : options.isError ? <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(options.error, "Could not load assignment options.")}</div> : <div className="mt-4 space-y-3">{(row.steps ?? []).map((step) => {
      const choice = choices[step.workflow_step] ?? { mode: "default", role: null, user: null, team: null, roleFilter: null };
      const eligibleUsers = choice.roleFilter ? opts.users.filter((user) => user.role_ids.includes(choice.roleFilter!)) : [];
      return <div key={step.workflow_step} className="rounded-xl border border-border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold">{step.group_name} · {step.workflow_step_name}</p><p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{step.step_kind} · pool {step.pool_resolution.replaceAll("_", " ")}</p></div><div className="text-right"><p className="text-[9px] font-bold uppercase text-muted-foreground">Workflow default</p><p className="mt-0.5 text-[10px] font-medium text-foreground">{assignmentSummary(step)}</p></div></div>
        <div className="mt-3 grid gap-3 md:grid-cols-[190px_1fr]">
          <label><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Use for this mapping</span><select disabled={!canManage} className={`${field} w-full`} value={choice.mode} onChange={(e) => update(step.workflow_step, { mode: e.target.value as StepChoice["mode"], role: null, user: null, team: null, roleFilter: null })}><option value="default">Workflow default</option><option value="role">Role pool override</option><option value="named_user">Specific user override</option><option value="team">Project team override</option></select></label>
          <div>
            {choice.mode === "default" ? <div className="flex h-10 items-center rounded-xl border border-dashed border-border px-3 text-[10px] text-muted-foreground">Runtime uses the published workflow default shown above.</div> : null}
            {choice.mode === "role" ? <label><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Role pool</span><select disabled={!canManage} className={`${field} w-full`} value={choice.role ?? ""} onChange={(e) => update(step.workflow_step, { role: e.target.value ? Number(e.target.value) : null })}><option value="">Select eligible role</option>{opts.roles.map((role) => <option key={role.id} value={role.id}>{role.name} · {role.scope}</option>)}</select></label> : null}
            {choice.mode === "named_user" ? <div className="grid gap-2 md:grid-cols-2"><label><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Role</span><select disabled={!canManage} className={`${field} w-full`} value={choice.roleFilter ?? ""} onChange={(e) => update(step.workflow_step, { roleFilter: e.target.value ? Number(e.target.value) : null, user: null })}><option value="">Select role first</option>{opts.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Specific user</span><select disabled={!canManage || !choice.roleFilter} className={`${field} w-full`} value={choice.user ?? ""} onChange={(e) => update(step.workflow_step, { user: e.target.value ? Number(e.target.value) : null })}><option value="">Select user</option>{eligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select></label></div> : null}
            {choice.mode === "team" ? <label><span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Project team</span><select disabled={!canManage} className={`${field} w-full`} value={choice.team ?? ""} onChange={(e) => update(step.workflow_step, { team: e.target.value ? Number(e.target.value) : null })}><option value="">Select project team</option>{opts.teams.map((team) => <option key={team.id} value={team.id}>{team.name} · {team.party_name}</option>)}</select></label> : null}
          </div>
        </div>
      </div>;
    })}</div>}

    {localError ? <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{localError}</div> : null}
    <button type="button" disabled={save.isPending || options.isLoading} onClick={() => { setLocalError(null); if (canManage) save.mutate(); else onReviewed(); }} className={cn("mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-semibold", reviewed ? "border-emerald-500/30 text-emerald-600" : "border-primary/30 text-primary")}>{save.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving assignment review...</> : reviewed ? <><Check className="h-4 w-4" />Reviewed · save again</> : <><Check className="h-4 w-4" />{canManage ? "Save & mark assignments reviewed" : "Mark assignments reviewed"}</>}</button>
  </div>;
}

function ArchitectureLevelPreviewNode({ node, levelId }: { node: LocationNode; levelId: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(node.children?.length);
  const activeLevel = node.level === levelId;
  return <div><div className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", activeLevel && "bg-primary/10 ring-1 ring-primary/20")} style={{ paddingLeft: `${Math.max(8, node.depth * 18 + 8)}px` }}><button type="button" onClick={() => setOpen((current) => !current)} className="flex h-6 w-6 items-center justify-center text-muted-foreground">{hasChildren ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />}</button><span className="min-w-0 flex-1"><span className={cn("block truncate text-xs font-semibold", activeLevel ? "text-primary" : "text-foreground")}>{node.name}</span><span className="block truncate text-[9px] text-muted-foreground">{node.level_name} · {node.full_path || node.code}</span></span>{activeLevel ? <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-bold uppercase text-primary-foreground">Included level</span> : null}</div>{hasChildren && open ? node.children!.map((child) => <ArchitectureLevelPreviewNode key={child.id} node={child} levelId={levelId} />) : null}</div>;
}

function ArchitectureSelectNode({ node, selected, onToggle }: { node: LocationNode; selected: Set<number>; onToggle: (id: number) => void }) {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(node.children?.length);
  const checked = selected.has(node.id);
  return <div><div className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", checked && "bg-primary/5")} style={{ paddingLeft: `${Math.max(8, node.depth * 18 + 8)}px` }}><button type="button" onClick={() => setOpen((current) => !current)} className="flex h-6 w-6 items-center justify-center text-muted-foreground">{hasChildren ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />}</button><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"><input type="checkbox" checked={checked} onChange={() => onToggle(node.id)} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-foreground">{node.name}</span><span className="block truncate text-[9px] text-muted-foreground">{node.level_name} · {node.full_path || node.code}</span></span></label><span className={cn("rounded-full px-2 py-0.5 text-[8px] font-bold uppercase", node.checklist_allowed ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>{node.checklist_allowed ? "Checklist" : "Container"}</span></div>{hasChildren && open ? node.children!.map((child) => <ArchitectureSelectNode key={child.id} node={child} selected={selected} onToggle={onToggle} />) : null}</div>;
}

function LoadingBlock({ label }: { label: string }) { return <div className="flex min-h-32 items-center justify-center gap-2 p-6 text-xs text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-background p-3"><p className="text-lg font-bold text-foreground">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>; }
function scopeLabel(scope: string) { return scope === "all_structures" ? "Entire project" : scope === "structure_level" ? "Structure level" : "Specific nodes"; }
