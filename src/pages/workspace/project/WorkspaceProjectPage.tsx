import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  Boxes,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  GitBranch,
  GripVertical,
  Layers3,
  ListTree,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import type { ProjectFlatTemplate, ProjectStructureLevel, ProjectStructureLevelTransition } from "@/features/projects";
import type { ExecutionLevel, ExecutionScheme } from "@/features/execution";
import { useWorkspace } from "@/features/workspace";
import { ToastNotice } from "@/components/ui/ToastNotice";
import {
  projectWorkspaceApi,
  useComposeFlatTemplate,
  useExecutionExplorer,
  useLocationExplorer,
  useProjectMasterAvailability,
  useProjectWorkspaceMutation,
  useProjectWorkspaceSetup,
  type ExecutionExplorerNode,
  type FlatTemplateComposePayload,
  type LocationExplorerNode,
  type ProjectWorkspaceSetup,
  type ReleasePolicyPayload,
} from "@/features/projectWorkspace";

const INPUT = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";
const TEXTAREA = `${INPUT} min-h-24 py-2`;
const CARD = "rounded-2xl border border-border bg-card/70 shadow-sm";

const P = {
  masterAvailabilityView: "project.master_availability.view",
  roomTypeCreate: "project.room_type.create",
  flatTypeCreate: "project.flat_type.create",
  flatTemplateView: "project.flat_template.view",
  flatTemplateCreate: "project.flat_template.create",
  flatTemplateUpdate: "project.flat_template.update",
  flatTemplateDelete: "project.flat_template.delete",
  flatTemplateCompose: "project.flat_template.compose",
  flatTemplateItemCreate: "project.flat_template_item.create",
  flatTemplateItemUpdate: "project.flat_template_item.update",
  flatTemplateItemDelete: "project.flat_template_item.delete",
  structureLevelView: "project.structure_level.view",
  structureLevelCreate: "project.structure_level.create",
  structureLevelUpdate: "project.structure_level.update",
  structureLevelDelete: "project.structure_level.delete",
  transitionView: "project.structure_transition.view",
  transitionCreate: "project.structure_transition.create",
  transitionUpdate: "project.structure_transition.update",
  transitionDelete: "project.structure_transition.delete",
  nodeView: "project.location_node.view",
  nodeCreate: "project.location_node.create",
  nodeUpdate: "project.location_node.update",
  nodeDelete: "project.location_node.delete",
  nodeGenerateRooms: "project.location_node.generate_rooms",
  executionSchemeView: "project.execution_scheme.view",
  executionSchemeCreate: "project.execution_scheme.create",
  executionSchemeUpdate: "project.execution_scheme.update",
  executionSchemeDelete: "project.execution_scheme.delete",
  executionMakeCurrent: "project.execution_scheme.make_current",
  executionLevelView: "project.execution_level.view",
  executionLevelCreate: "project.execution_level.create",
  executionLevelUpdate: "project.execution_level.update",
  executionLevelDelete: "project.execution_level.delete",
  executionNodeView: "project.execution_node.view",
  executionNodeCreate: "project.execution_node.create",
  executionNodeUpdate: "project.execution_node.update",
  executionNodeDelete: "project.execution_node.delete",
  releaseView: "project.release_policy.view",
  releaseCreate: "project.release_policy.create",
  releaseUpdate: "project.release_policy.update",
  releaseDelete: "project.release_policy.delete",
} as const;

type Section = "architecture" | "execution" | "release-policy";

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string" && data.trim() && !data.trim().startsWith("<!DOCTYPE")) return data;
    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string") return data.detail;
      const rows = Object.entries(data as Record<string, unknown>)
        .map(([key, value]) => Array.isArray(value) ? `${key}: ${value.join(", ")}` : typeof value === "string" ? `${key}: ${value}` : null)
        .filter(Boolean);
      if (rows.length) return rows.join(" ");
    }
    if (error.response?.status === 403) return "Your selected role does not have permission for this operation.";
  }
  return error instanceof Error ? error.message : fallback;
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Button({ children, onClick, disabled, danger = false, type = "button", title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; type?: "button" | "submit"; title?: string }) {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "border-destructive/30 text-destructive hover:bg-destructive/5" : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{children}</button>;
}

function PermissionNote({ code }: { code: string }) {
  return <p className="mt-2 text-[11px] text-muted-foreground">Requires <span className="font-mono text-foreground">{code}</span></p>;
}

export function WorkspaceProjectPage() {
  const navigate = useNavigate();
  const { projectSection } = useParams<{ projectSection?: string }>();
  const workspace = useWorkspace();
  const projectId = workspace.project?.id ?? null;
  const setupQuery = useProjectWorkspaceSetup(projectId);
  const setup = setupQuery.data ?? null;
  const section = (["architecture", "execution", "release-policy"] as const).includes(projectSection as Section)
    ? projectSection as Section
    : null;

  const can = (code: string) => Boolean(setup?.capabilities[code]);
  const nav = useMemo(() => {
    if (!setup) return [] as { key: Section; label: string; icon: React.ReactNode; count: number }[];
    const items: { key: Section; label: string; icon: React.ReactNode; count: number }[] = [];
    if (can(P.structureLevelView) || can(P.flatTemplateView) || can(P.nodeView)) {
      items.push({ key: "architecture", label: "Architecture", icon: <Building2 className="h-4 w-4" />, count: setup.counts.location_nodes });
    }
    if (can(P.executionSchemeView) || can(P.executionLevelView) || can(P.executionNodeView)) {
      items.push({ key: "execution", label: "Execution", icon: <GitBranch className="h-4 w-4" />, count: setup.counts.execution_nodes });
    }
    if (can(P.releaseView)) {
      items.push({ key: "release-policy", label: "Release policy", icon: <ShieldCheck className="h-4 w-4" />, count: setup.counts.release_policies });
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup]);

  useEffect(() => {
    if (!setup || nav.length === 0) return;
    if (!section || !nav.some((item) => item.key === section)) {
      navigate(`/workspace/project/${nav[0].key}`, { replace: true });
    }
  }, [navigate, nav, section, setup]);

  if (!workspace.project) {
    return <EmptyState title="Select a project" text="Choose a project from the top navbar to open Project Setup." />;
  }
  if (setupQuery.isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading project configuration…</div>;
  }
  if (setupQuery.isError || !setup) {
    return <EmptyState title="Project Setup unavailable" text={errorMessage(setupQuery.error, "Unable to load this project's setup workspace.")} />;
  }
  if (nav.length === 0) {
    return <EmptyState title="No Project Setup permission" text="The project module is available, but the selected role has no Architecture, Execution, or Release Policy view permission." />;
  }

  return (
    <div className="min-h-full bg-muted/10">
      <div className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{setup.project.organization_name}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          {setup.project.organization_unit_name ? <><span>{setup.project.organization_unit_name}</span><ChevronRight className="h-3.5 w-3.5" /></> : null}
          <span className="font-semibold text-primary">{setup.project.name}</span>
          <span className="ml-auto rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] uppercase tracking-wider">{setup.project.status}</span>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1680px] gap-0 xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-background p-3 xl:min-h-[calc(100vh-112px)] xl:border-b-0 xl:border-r xl:p-4">
          <div className="mb-4 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Project Setup</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">{setup.project.name}</p>
          </div>
          <nav className="grid gap-1 sm:grid-cols-3 xl:grid-cols-1">
            {nav.map((item) => (
              <button key={item.key} type="button" onClick={() => navigate(`/workspace/project/${item.key}`)} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left transition ${section === item.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/10 bg-background/60">{item.icon}</span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-bold">{item.label}</span><span className="block text-[10px] opacity-70">{item.count.toLocaleString()} configured</span></span>
                <ChevronRight className="hidden h-3.5 w-3.5 xl:block" />
              </button>
            ))}
          </nav>
          <div className="mt-5 hidden rounded-xl border border-border bg-muted/20 p-3 xl:block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Configured</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <MiniCount label="Levels" value={setup.counts.structure_levels} />
              <MiniCount label="Templates" value={setup.counts.flat_templates} />
              <MiniCount label="Locations" value={setup.counts.location_nodes} />
              <MiniCount label="Exec nodes" value={setup.counts.execution_nodes} />
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 xl:p-7">
          {section === "architecture" ? <ArchitectureSection setup={setup} projectId={projectId!} /> : null}
          {section === "execution" ? <ExecutionSection setup={setup} projectId={projectId!} /> : null}
          {section === "release-policy" ? <ReleasePolicySection setup={setup} projectId={projectId!} /> : null}
        </main>
      </div>
    </div>
  );
}

function MiniCount({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-background p-2"><p className="text-sm font-bold text-foreground">{value}</p><p className="text-[9px] text-muted-foreground">{label}</p></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="flex min-h-[55vh] items-center justify-center p-6"><div className={`${CARD} max-w-lg p-8 text-center`}><Boxes className="mx-auto h-8 w-8 text-primary" /><h1 className="mt-4 text-lg font-bold text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>;
}

function ArchitectureSection({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const can = (code: string) => Boolean(setup.capabilities[code]);
  const hasFlatLevel = setup.structure_levels.some((level) => level.is_flat_template_applicable && level.is_active);
  const steps = [
    can(P.structureLevelView) ? { key: "levels" as const, label: "Structure levels", icon: <Layers3 className="h-4 w-4" /> } : null,
    hasFlatLevel && can(P.flatTemplateView) ? { key: "templates" as const, label: "Flat templates", icon: <Boxes className="h-4 w-4" /> } : null,
    can(P.nodeView) ? { key: "build" as const, label: "Build hierarchy", icon: <Network className="h-4 w-4" /> } : null,
    can(P.nodeView) ? { key: "explorer" as const, label: "Architecture explorer", icon: <ListTree className="h-4 w-4" /> } : null,
  ].filter(Boolean) as { key: "levels" | "templates" | "build" | "explorer"; label: string; icon: React.ReactNode }[];
  const [step, setStep] = useState(steps[0]?.key ?? "levels");
  useEffect(() => { if (!steps.some((item) => item.key === step)) setStep(steps[0]?.key ?? "levels"); }, [step, steps]);

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Architecture" title="Physical project structure" text="" />
      <div className="flex flex-wrap justify-center gap-2">{steps.map((item) => <button key={item.key} type="button" onClick={() => setStep(item.key)} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${step === item.key ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>{item.icon}{item.label}</button>)}</div>
      {step === "levels" ? <StructureLevelsPanel setup={setup} projectId={projectId} /> : null}
      {step === "templates" ? <FlatTemplatePanel setup={setup} projectId={projectId} /> : null}
      {step === "build" ? <BuildArchitecturePanel setup={setup} projectId={projectId} /> : null}
      {step === "explorer" ? <ArchitectureExplorer setup={setup} projectId={projectId} /> : null}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

type LevelDraft = { id: number | null; name: string; code: string; sequence: number; checklist: boolean; visible: boolean; flat: boolean; parentLevel: number | null };
function draftForLevel(level: ProjectStructureLevel | null, transitions: ProjectStructureLevelTransition[]): LevelDraft {
  const transition = level ? transitions.find((row) => row.child_level === level.id && row.is_active) : null;
  return level ? { id: level.id, name: level.name, code: level.code, sequence: level.sequence, checklist: level.checklist_allowed, visible: level.visible_in_navigation, flat: level.is_flat_template_applicable, parentLevel: transition?.parent_level ?? null } : { id: null, name: "", code: "", sequence: 1, checklist: true, visible: true, flat: false, parentLevel: null };
}

function StructureLevelsPanel({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const levels = [...setup.structure_levels].sort((a, b) => a.sequence - b.sequence);
  const [selectedId, setSelectedId] = useState<number | null>(levels[0]?.id ?? null);
  const selected = levels.find((item) => item.id === selectedId) ?? null;
  const [draft, setDraft] = useState<LevelDraft>(() => draftForLevel(selected, setup.structure_transitions));
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (!message) return; const id = window.setTimeout(() => setMessage(null), 3200); return () => window.clearTimeout(id); }, [message]);
  useEffect(() => { setDraft(draftForLevel(selected, setup.structure_transitions)); }, [selectedId, setup.structure_levels, setup.structure_transitions]);

  const canCreate = Boolean(setup.capabilities[P.structureLevelCreate] && setup.capabilities[P.transitionCreate]);
  const canUpdate = Boolean(setup.capabilities[P.structureLevelUpdate]);
  const canDelete = Boolean(setup.capabilities[P.structureLevelDelete]);

  const save = useProjectWorkspaceMutation(async () => {
    setMessage(null);
    const payload = { project: projectId, name: draft.name.trim(), code: draft.code.trim() || slug(draft.name), sequence: draft.sequence, checklist_allowed: draft.checklist, visible_in_navigation: draft.visible, is_flat_template_applicable: draft.flat, is_active: true };
    let level: ProjectStructureLevel;
    if (draft.id) level = await projectWorkspaceApi.updateStructureLevel(draft.id, payload);
    else level = await projectWorkspaceApi.createStructureLevel(payload);

    const transition = setup.structure_transitions.find((row) => row.child_level === level.id && row.is_active);
    if (transition) {
      if (transition.parent_level !== draft.parentLevel) {
        if (!setup.capabilities[P.transitionUpdate]) throw new Error(`Missing ${P.transitionUpdate}`);
        await projectWorkspaceApi.updateTransition(projectId, transition.id, { parent_level: draft.parentLevel, child_level: level.id, is_active: true });
      }
    } else {
      if (!setup.capabilities[P.transitionCreate]) throw new Error(`Missing ${P.transitionCreate}`);
      await projectWorkspaceApi.createTransition(projectId, { parent_level: draft.parentLevel, child_level: level.id, is_active: true });
    }
    setSelectedId(level.id);
    setMessage("Structure level saved.");
    return level;
  }, projectId);
  const remove = useProjectWorkspaceMutation(async (id: number) => projectWorkspaceApi.deleteStructureLevel(id), projectId);

  const chain = levels.map((level) => ({ level, transition: setup.structure_transitions.find((row) => row.child_level === level.id && row.is_active) }));
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <ToastNotice message={message} onClose={() => setMessage(null)} />
      <div className={`${CARD} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-foreground">Configured level chain</h2><p className="mt-1 text-xs text-muted-foreground">Existing setup is loaded first. Add more levels or edit the current chain.</p></div>{canCreate ? <Button onClick={() => { setSelectedId(null); setDraft({ id: null, name: "", code: "", sequence: levels.length + 1, checklist: true, visible: true, flat: false, parentLevel: levels.at(-1)?.id ?? null }); }}><Plus className="h-3.5 w-3.5" />Add level</Button> : null}</div>
        <div className="mt-5 overflow-x-auto pb-2"><div className="flex min-w-max items-center gap-2">{chain.map(({ level, transition }, index) => <div key={level.id} className="flex items-center gap-2"><button type="button" onClick={() => setSelectedId(level.id)} className={`min-w-36 rounded-xl border p-3 text-left transition ${selectedId === level.id ? "border-primary/50 bg-primary/8" : "border-border bg-background hover:border-primary/30"}`}><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/8 text-[10px] font-bold text-primary">{level.sequence}</span><span className="text-xs font-bold text-foreground">{level.name}</span></div><p className="mt-2 text-[10px] text-muted-foreground">{transition?.parent_level_name ? `under ${transition.parent_level_name}` : "ROOT"}</p>{level.is_flat_template_applicable ? <span className="mt-2 inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-300">Flat template</span> : null}</button>{index < chain.length - 1 ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}</div>)}</div></div>
        {levels.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No structure levels yet. Create the first root level.</p> : null}
      </div>
      <div className={`${CARD} p-4 sm:p-5`}>
        <h2 className="text-sm font-bold text-foreground">{draft.id ? "Edit structure level" : "Create structure level"}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input className={INPUT} value={draft.name} onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value, code: v.id ? v.code : slug(e.target.value) }))} /></Field>
          <Field label="Code"><input className={INPUT} value={draft.code} onChange={(e) => setDraft((v) => ({ ...v, code: slug(e.target.value) }))} /></Field>
          <Field label="Sequence"><input className={INPUT} type="number" min={1} value={draft.sequence} onChange={(e) => setDraft((v) => ({ ...v, sequence: Math.max(1, Number(e.target.value) || 1) }))} /></Field>
          <Field label="Parent level"><select className={INPUT} value={draft.parentLevel ?? ""} onChange={(e) => setDraft((v) => ({ ...v, parentLevel: e.target.value ? Number(e.target.value) : null }))}><option value="">ROOT</option>{levels.filter((level) => level.id !== draft.id).map((level) => <option key={level.id} value={level.id}>{level.sequence}. {level.name}</option>)}</select></Field>
        </div>
        <div className="mt-4 space-y-2"><Check label="Checklist allowed" checked={draft.checklist} onChange={(value) => setDraft((v) => ({ ...v, checklist: value }))} /><Check label="Visible in navigation" checked={draft.visible} onChange={(value) => setDraft((v) => ({ ...v, visible: value }))} /><Check label="Flat template applicable" checked={draft.flat} onChange={(value) => setDraft((v) => ({ ...v, flat: value }))} /></div>
        {save.isError ? <p className="mt-3 text-xs text-destructive">{errorMessage(save.error, "Unable to save level.")}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">{(draft.id ? canUpdate : canCreate) ? <PrimaryButton onClick={() => save.mutate(undefined)} disabled={!draft.name.trim() || save.isPending}><Save className="h-4 w-4" />{save.isPending ? "Saving…" : "Save level"}</PrimaryButton> : null}{draft.id && canDelete ? <Button danger onClick={() => { if (window.confirm("Delete this structure level? Existing nodes can prevent deletion.")) remove.mutate(draft.id!); }} disabled={remove.isPending}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : null}</div>
        {!draft.id && !canCreate ? <PermissionNote code={`${P.structureLevelCreate} + ${P.transitionCreate}`} /> : null}
      </div>
    </div>
  );
}

function FlatTemplatePanel({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const availability = useProjectMasterAvailability(projectId, Boolean(setup.capabilities[P.masterAvailabilityView]));
  const compose = useComposeFlatTemplate(projectId);
  const removeTemplate = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.deleteFlatTemplate(id), projectId);
  const templates = setup.flat_templates;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState<ProjectFlatTemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [flatMasterId, setFlatMasterId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [rooms, setRooms] = useState<{ masterId: number; name: string; quantity: number }[]>([]);
  const [masterSearch, setMasterSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(id); }, [toast]);

  const resetDraft = () => {
    setSelectedTemplateId(null);
    setFlatMasterId(availability.data?.flat_types.results[0]?.id ?? null);
    setName(""); setCode(""); setDescription(""); setIsDefault(true); setRooms([]);
  };
  const editTemplate = (template: ProjectFlatTemplate) => {
    setSelectedTemplateId(template.id);
    const flatType = setup.flat_types.find((row) => row.id === template.flat_type);
    setFlatMasterId(flatType?.source_master ?? null);
    setName(template.name); setCode(template.code); setDescription(template.description); setIsDefault(template.is_default);
    setRooms((template.items ?? []).map((item) => {
      const projectRoom = setup.room_types.find((row) => row.id === item.room_type);
      return projectRoom?.source_master ? { masterId: projectRoom.source_master, name: item.name, quantity: item.quantity } : null;
    }).filter(Boolean) as { masterId: number; name: string; quantity: number }[]);
    setDetailTemplate(null);
    setDrawerOpen(true);
  };
  const startCreate = () => { resetDraft(); setDetailTemplate(null); setDrawerOpen(true); };
  useEffect(() => { if (!flatMasterId && availability.data?.flat_types.results[0]) setFlatMasterId(availability.data.flat_types.results[0].id); }, [availability.data, flatMasterId]);

  const addRoom = (masterId: number) => {
    const master = availability.data?.room_types.results.find((row) => row.id === masterId);
    if (!master) return;
    setRooms((current) => current.some((row) => row.masterId === masterId) ? current.map((row) => row.masterId === masterId ? { ...row, quantity: row.quantity + 1 } : row) : [...current, { masterId, name: master.name, quantity: 1 }]);
  };
  const canSave = Boolean(setup.capabilities[P.flatTemplateCompose]);
  const save = () => {
    if (!flatMasterId || !name.trim() || rooms.length === 0) return;
    const updating = Boolean(selectedTemplateId);
    const payload: FlatTemplateComposePayload = { template_id: selectedTemplateId, master_flat_type: flatMasterId, name: name.trim(), code: code.trim() || slug(name), description, is_default: isDefault, rooms: rooms.map((room) => ({ master_room_type: room.masterId, name: room.name, quantity: room.quantity })) };
    compose.mutate(payload, { onSuccess: () => { setDrawerOpen(false); setToast(updating ? "Flat template updated successfully." : "Flat template created successfully."); resetDraft(); } });
  };
  const filteredRooms = (availability.data?.room_types.results ?? []).filter((room) => `${room.name} ${room.code}`.toLowerCase().includes(masterSearch.toLowerCase()));

  return (
    <div className="relative space-y-5">
      <ToastNotice message={toast} onClose={() => setToast(null)} />
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${CARD} self-start p-4 sm:p-5 xl:sticky xl:top-4`}>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Available master library</p><h3 className="mt-1 text-sm font-bold text-foreground">Flat & room types</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">These are inherited from the project unit first, then the organization.</p></div>
          {availability.data ? <>
            <div className="mt-4 flex flex-wrap gap-1"><ScopeBadge label={`Flat · ${availability.data.flat_types.scope.replace("_", " ")}`} /><ScopeBadge label={`Room · ${availability.data.room_types.scope.replace("_", " ")}`} /></div>
            <div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Flat types</p><div className="mt-2 space-y-2">{availability.data.flat_types.results.map((row) => <div key={row.id} className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold text-foreground">{row.name}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{row.code}</p></div>)}</div></div>
            <div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Room types</p><div className="relative mt-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${INPUT} pl-9`} value={masterSearch} onChange={(e) => setMasterSearch(e.target.value)} placeholder="Search room type" /></div><div className="mt-2 max-h-[360px] space-y-2 overflow-y-auto pr-1">{filteredRooms.map((room) => <button key={room.id} type="button" onClick={() => { if (!drawerOpen) startCreate(); window.setTimeout(() => addRoom(room.id), 0); }} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left hover:border-primary/30"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-foreground">{room.name}</p><p className="text-[10px] text-muted-foreground">{room.code}</p></div><Plus className="h-3.5 w-3.5 text-primary" /></button>)}</div></div>
          </> : null}
          {availability.isError ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{errorMessage(availability.error, "No master availability configured.")}</p> : null}
        </aside>

        <section className={`${CARD} min-h-[560px] p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Project templates</p><h2 className="mt-1 text-lg font-bold text-foreground">Flat templates</h2><p className="mt-1 text-xs text-muted-foreground">Reusable project-local flat compositions. Click a card to view details.</p></div>{setup.capabilities[P.flatTemplateCreate] && setup.capabilities[P.flatTemplateCompose] ? <PrimaryButton onClick={startCreate}><Plus className="h-4 w-4" />Create template</PrimaryButton> : null}</div>
          {templates.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{templates.map((template) => <button key={template.id} type="button" onClick={() => setDetailTemplate(template)} className="group rounded-2xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{template.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{template.flat_type_name}</p></div>{template.is_default ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">Default</span> : null}</div><div className="mt-4 flex flex-wrap gap-1">{(template.items ?? []).slice(0, 4).map((item) => <span key={item.id} className="rounded-lg bg-muted px-2 py-1 text-[10px] text-muted-foreground">{item.quantity}× {item.name}</span>)}{(template.items?.length ?? 0) > 4 ? <span className="rounded-lg bg-muted px-2 py-1 text-[10px] text-muted-foreground">+{(template.items?.length ?? 0) - 4}</span> : null}</div><p className="mt-4 text-[10px] font-semibold text-primary">View details →</p></button>)}</div> : <div className="flex min-h-[420px] items-center justify-center"><div className="max-w-sm text-center"><Boxes className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 text-sm font-bold text-foreground">No flat templates yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Create the first template from the button above. Available masters stay visible on the left while you work.</p></div></div>}
        </section>
      </div>

      {drawerOpen ? <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawerOpen(false); }}><aside className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between gap-3 border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{selectedTemplateId ? "Edit" : "Create"}</p><h3 className="mt-1 text-lg font-bold text-foreground">Flat template</h3></div><button type="button" onClick={() => setDrawerOpen(false)} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button></div>
        {availability.data ? <div className="mt-5 space-y-4"><Field label="Flat type"><select className={INPUT} value={flatMasterId ?? ""} onChange={(e) => { const id = Number(e.target.value); setFlatMasterId(id); const row = availability.data!.flat_types.results.find((item) => item.id === id); if (!selectedTemplateId && row && !name.trim()) { setName(`${row.name} Template`); setCode(`${row.code}-template`); } }}><option value="">Select flat type</option>{availability.data.flat_types.results.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Template name"><input className={INPUT} value={name} onChange={(e) => { setName(e.target.value); if (!selectedTemplateId) setCode(slug(e.target.value)); }} /></Field><Field label="Code"><input className={INPUT} value={code} onChange={(e) => setCode(slug(e.target.value))} /></Field></div><Field label="Description"><textarea className={TEXTAREA} value={description} onChange={(e) => setDescription(e.target.value)} /></Field><Check label="Default template for this flat type" checked={isDefault} onChange={setIsDefault} />
          <div><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rooms in template</p><span className="text-[10px] text-muted-foreground">Add from the master library below</span></div><div className="mt-2 space-y-2">{rooms.map((room, index) => <div key={room.masterId} className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[28px_minmax(0,1fr)_90px_auto] sm:items-center"><span className="text-center text-[10px] font-bold text-primary">{index + 1}</span><input className={INPUT} value={room.name} onChange={(e) => setRooms((current) => current.map((item) => item.masterId === room.masterId ? { ...item, name: e.target.value } : item))} /><input className={INPUT} type="number" min={1} value={room.quantity} onChange={(e) => setRooms((current) => current.map((item) => item.masterId === room.masterId ? { ...item, quantity: Math.max(1, Number(e.target.value) || 1) } : item))} /><button type="button" onClick={() => setRooms((current) => current.filter((item) => item.masterId !== room.masterId))} className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}{rooms.length === 0 ? <p className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">No rooms added yet.</p> : null}</div><div className="mt-3 flex flex-wrap gap-2">{availability.data.room_types.results.map((room) => <button key={room.id} type="button" onClick={() => addRoom(room.id)} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold text-foreground hover:border-primary/30">+ {room.name}</button>)}</div></div>
          {compose.isError ? <p className="text-xs text-destructive">{errorMessage(compose.error, "Unable to save flat template.")}</p> : null}<div className="sticky bottom-0 -mx-5 mt-6 flex items-center gap-2 border-t border-border bg-card px-5 pt-4">{canSave ? <PrimaryButton onClick={save} disabled={!flatMasterId || !name.trim() || rooms.length === 0 || compose.isPending}><Save className="h-4 w-4" />{compose.isPending ? "Saving…" : selectedTemplateId ? "Update template" : "Create template"}</PrimaryButton> : <PermissionNote code={P.flatTemplateCompose} />}<Button onClick={() => setDrawerOpen(false)}>Cancel</Button></div></div> : null}</aside></div> : null}

      {detailTemplate ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailTemplate(null); }}><div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Flat template details</p><h3 className="mt-1 text-xl font-bold text-foreground">{detailTemplate.name}</h3><p className="mt-1 text-xs text-muted-foreground">{detailTemplate.flat_type_name} · {detailTemplate.code}</p></div><button type="button" onClick={() => setDetailTemplate(null)} className="rounded-xl border border-border p-2 text-muted-foreground"><X className="h-4 w-4" /></button></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{detailTemplate.description || "No description added."}</p><div className="mt-5 grid gap-2 sm:grid-cols-2">{(detailTemplate.items ?? []).map((item) => <div key={item.id} className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold text-foreground">{item.name}</p><p className="mt-1 text-[10px] text-muted-foreground">Quantity: {item.quantity}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-2">{setup.capabilities[P.flatTemplateUpdate] ? <PrimaryButton onClick={() => editTemplate(detailTemplate)}><Pencil className="h-4 w-4" />Edit template</PrimaryButton> : null}{setup.capabilities[P.flatTemplateDelete] ? <Button danger disabled={removeTemplate.isPending} onClick={() => { if (!window.confirm("Delete this flat template?")) return; removeTemplate.mutate(detailTemplate.id, { onSuccess: () => { setDetailTemplate(null); setToast("Flat template deleted successfully."); } }); }}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : null}</div></div></div> : null}
    </div>
  );
}
function ScopeBadge({ label }: { label: string }) { return <span className="rounded-full bg-primary/8 px-2 py-1 text-[9px] font-semibold capitalize text-primary">{label}</span>; }

function parentLevelChain(levelId: number | null, transitions: ProjectStructureLevelTransition[]) {
  if (!levelId) return [] as number[];
  const chain: number[] = [];
  let current: number | null = levelId;
  const seen = new Set<number>();
  while (current && !seen.has(current)) {
    seen.add(current);
    chain.unshift(current);
    const transition = transitions.find((row) => row.child_level === current && row.is_active && row.parent_level !== null);
    current = transition?.parent_level ?? null;
  }
  return chain;
}

function ParentLevelSelector({ projectId, level, parentNodeId, value, onChange, searchable }: { projectId: number; level: ProjectStructureLevel; parentNodeId: number | null; value: number | null; onChange: (value: number | null) => void; searchable: boolean }) {
  const [search, setSearch] = useState("");
  const parentParam: number | "root" = parentNodeId ?? "root";
  const query = useLocationExplorer(projectId, { parent: parentParam, level: level.id, search: searchable ? search : undefined, page_size: 100 }, parentNodeId !== null || parentParam === "root");
  return <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{level.name}</span>{query.isFetching ? <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" /> : null}</div>{searchable ? <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${INPUT} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${level.name}`} /></div> : null}<select className={INPUT} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}><option value="">Select {level.name}</option>{(query.data?.results ?? []).map((row) => <option key={row.id} value={row.id}>{searchable ? (row.full_path || row.name) : row.name}</option>)}</select></div>;
}

function BuildArchitecturePanel({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const levels = [...setup.structure_levels].sort((a, b) => a.sequence - b.sequence);
  const [levelId, setLevelId] = useState<number | null>(levels[0]?.id ?? null);
  const level = levels.find((row) => row.id === levelId) ?? null;
  const allowedTransitions = setup.structure_transitions.filter((row) => row.child_level === levelId && row.is_active);
  const parentLevelOptions = allowedTransitions.filter((row) => row.parent_level !== null);
  const allowsRoot = allowedTransitions.some((row) => row.parent_level === null);
  const [parentLevelId, setParentLevelId] = useState<number | null>(parentLevelOptions[0]?.parent_level ?? null);
  const [parentSelections, setParentSelections] = useState<Record<number, number | null>>({});
  const levelNodes = useLocationExplorer(projectId, { parent: "any", level: levelId, page_size: 100 }, Boolean(levelId));
  const [editing, setEditing] = useState<LocationExplorerNode | null>(null);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [areaType, setAreaType] = useState("private_area");
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(id); }, [toast]);
  useEffect(() => { setParentLevelId(parentLevelOptions[0]?.parent_level ?? null); setParentSelections({}); setEditing(null); setName(""); setTemplateId(null); }, [levelId]);
  const chainIds = parentLevelChain(parentLevelId, setup.structure_transitions);
  const chainLevels = chainIds.map((id) => levels.find((row) => row.id === id)).filter(Boolean) as ProjectStructureLevel[];
  const immediateParentId = parentLevelId ? (parentSelections[parentLevelId] ?? null) : null;
  const save = useProjectWorkspaceMutation(async () => {
    if (!level) throw new Error("Select a structure level.");
    const payload = { project: projectId, level: level.id, parent: immediateParentId, name: name.trim(), applied_flat_template: level.is_flat_template_applicable ? templateId : null, checklist_allowed: level.checklist_allowed, area_type: areaType, is_active: true };
    return editing ? projectWorkspaceApi.updateLocationNode(editing.id, payload) : projectWorkspaceApi.createLocationNode(payload);
  }, projectId);
  const remove = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.deleteLocationNode(id), projectId);
  const generate = useProjectWorkspaceMutation((id: number) => {
    const roomLevel = levels.find((row) => row.code.toLowerCase().includes("room")) ?? levels.find((row) => row.sequence > (level?.sequence ?? 0));
    return projectWorkspaceApi.generateRooms(id, roomLevel?.id ?? null);
  }, projectId);
  const canSave = editing ? setup.capabilities[P.nodeUpdate] : setup.capabilities[P.nodeCreate];
  const selectParentAtLevel = (selectedLevelId: number, value: number | null) => {
    const index = chainIds.indexOf(selectedLevelId);
    setParentSelections((current) => {
      const next = { ...current, [selectedLevelId]: value };
      chainIds.slice(index + 1).forEach((id) => { next[id] = null; });
      return next;
    });
  };
  const beginEdit = (node: LocationExplorerNode) => {
    setEditing(node); setName(node.name); setTemplateId(node.applied_flat_template); setAreaType(node.area_type);
    if (node.parent && parentLevelId) setParentSelections((current) => ({ ...current, [parentLevelId]: node.parent }));
  };

  if (levels.length === 0) return <EmptyInline title="Create structure levels first" text="The hierarchy builder is generated from ProjectStructureLevel and ProjectStructureLevelTransition." />;
  return <div className="space-y-5">
    <ToastNotice message={toast} onClose={() => setToast(null)} />
    <div className={`${CARD} p-4 sm:p-5`}><div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Build hierarchy</p><h2 className="mt-1 text-sm font-bold text-foreground">Create the project structure level by level</h2></div><div className="mx-auto mt-5 flex max-w-4xl items-start justify-center overflow-x-auto pb-2">{levels.map((item, index) => <div key={item.id} className="flex flex-1 items-start last:flex-none"><button type="button" onClick={() => setLevelId(item.id)} className="flex min-w-28 flex-col items-center"><span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${item.id === levelId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>{index + 1}</span><span className={`mt-2 text-[11px] font-semibold ${item.id === levelId ? "text-foreground" : "text-muted-foreground"}`}>{item.name}</span></button>{index < levels.length - 1 ? <div className="mt-[17px] h-0.5 min-w-10 flex-1 bg-border" /> : null}</div>)}</div></div>
    <div className="grid gap-5 2xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
      <div className={`${CARD} p-4 sm:p-5`}><h3 className="text-sm font-bold text-foreground">{editing ? `Edit ${level?.name}` : `Create ${level?.name}`}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose each parent level separately. Only the final parent selector is searchable, and search results retain the full path for context.</p>
        {!allowsRoot && parentLevelOptions.length === 0 ? <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">No active parent transition exists for this level. Configure the transition first.</p> : null}
        {parentLevelOptions.length > 1 ? <Field label="Parent structure type" className="mt-4"><select className={INPUT} value={parentLevelId ?? ""} onChange={(e) => { setParentLevelId(e.target.value ? Number(e.target.value) : null); setParentSelections({}); }}><option value="">Root</option>{parentLevelOptions.map((row) => <option key={row.id} value={row.parent_level!}>{row.parent_level_name}</option>)}</select></Field> : null}
        {parentLevelId ? <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/15 p-3">{chainLevels.map((parentLevel, index) => { const previousLevel = chainLevels[index - 1]; const previousNodeId = previousLevel ? (parentSelections[previousLevel.id] ?? null) : null; return <ParentLevelSelector key={`${parentLevel.id}-${previousNodeId ?? "root"}`} projectId={projectId} level={parentLevel} parentNodeId={previousNodeId} value={parentSelections[parentLevel.id] ?? null} onChange={(value) => selectParentAtLevel(parentLevel.id, value)} searchable={index === chainLevels.length - 1} />; })}</div> : null}
        <Field label={`${level?.name ?? "Node"} name`} className="mt-4"><input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder={`Example ${level?.name ?? "node"} 01`} /></Field>
        <Field label="Area type" className="mt-3"><select className={INPUT} value={areaType} onChange={(e) => setAreaType(e.target.value)}><option value="private_area">Private area</option><option value="common_area">Common area</option><option value="amenity_area">Amenity area</option><option value="service_area">Service area</option><option value="external_area">External area</option><option value="general">General</option></select></Field>
        {level?.is_flat_template_applicable ? <Field label="Flat template" className="mt-3"><select className={INPUT} value={templateId ?? ""} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}><option value="">No template</option>{setup.flat_templates.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field> : null}
        {save.isError ? <p className="mt-3 text-xs text-destructive">{errorMessage(save.error, "Unable to save location node.")}</p> : null}
        <div className="mt-5 flex gap-2">{canSave ? <PrimaryButton onClick={() => save.mutate(undefined, { onSuccess: () => { setToast(editing ? `${level?.name ?? "Node"} updated successfully.` : `${level?.name ?? "Node"} created successfully.`); setEditing(null); setName(""); setTemplateId(null); } })} disabled={!name.trim() || (!allowsRoot && Boolean(parentLevelId) && !immediateParentId) || save.isPending}><Save className="h-4 w-4" />{editing ? "Update" : "Create"}</PrimaryButton> : null}{editing ? <Button onClick={() => { setEditing(null); setName(""); setTemplateId(null); }}><X className="h-3.5 w-3.5" />Cancel</Button> : null}</div>
      </div>
      <div className={`${CARD} p-4 sm:p-5`}><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-foreground">Existing {level?.name}</h3><p className="mt-1 text-xs text-muted-foreground">Compact list for setup; use Architecture Explorer for navigation.</p></div><span className="text-xs font-bold text-primary">{levelNodes.data?.count ?? 0}</span></div><div className="mt-4 max-h-[600px] space-y-2 overflow-y-auto pr-1">{levelNodes.data?.results.map((node) => <div key={node.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 text-primary"><CircleDot className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-foreground">{node.name}</p><p className="truncate text-[10px] text-muted-foreground">{node.full_path || (node.parent_name ? `under ${node.parent_name}` : "ROOT")}{node.applied_flat_template_name ? ` · ${node.applied_flat_template_name}` : ""}</p></div>{setup.capabilities[P.nodeUpdate] ? <button type="button" onClick={() => beginEdit(node)} className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button> : null}{node.applied_flat_template && setup.capabilities[P.nodeGenerateRooms] ? <button type="button" onClick={() => generate.mutate(node.id, { onSuccess: () => setToast(`Rooms generated for ${node.name}.`) })} title="Generate room nodes from template" className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Sparkles className="h-3.5 w-3.5" /></button> : null}{setup.capabilities[P.nodeDelete] ? <button type="button" onClick={() => { if (window.confirm(`Delete ${node.name}?`)) remove.mutate(node.id, { onSuccess: () => setToast(`${node.name} deleted successfully.`) }); }} className="rounded-lg p-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button> : null}</div>)}{!levelNodes.data?.results.length ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">No nodes at this level yet.</p> : null}</div></div>
    </div>
  </div>;
}
function ArchitectureExplorer({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const [explorerProjectId, setExplorerProjectId] = useState<number | null>(null);
  const explorerSetupQuery = useProjectWorkspaceSetup(explorerProjectId);
  const explorerSetup = explorerProjectId === projectId ? setup : explorerSetupQuery.data ?? null;
  const [search, setSearch] = useState("");
  const [projectExpanded, setProjectExpanded] = useState(true);
  const rootQuery = useLocationExplorer(explorerProjectId, { parent: "root", search: "", page: 1, page_size: 100 }, Boolean(explorerProjectId));
  const searchQuery = useLocationExplorer(explorerProjectId, { parent: "any", search: search.trim(), page: 1, page_size: 100 }, Boolean(explorerProjectId && search.trim()));

  useEffect(() => { setProjectExpanded(true); setSearch(""); }, [explorerProjectId]);

  if (!explorerProjectId) {
    return <div className={`${CARD} overflow-hidden`}><div className="border-b border-border bg-muted/15 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Architecture Explorer</p><h2 className="mt-1 text-base font-bold text-foreground">Projects</h2></div><div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{workspace.projects.map((project) => <button key={project.id} type="button" onClick={() => setExplorerProjectId(project.id)} className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:shadow-sm"><div className="flex items-start gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{project.name}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Open architecture</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></button>)}</div></div>;
  }

  if (!explorerSetup || explorerSetupQuery.isLoading) return <div className={`${CARD} p-6 text-xs text-muted-foreground`}><RefreshCw className="mr-2 inline h-3.5 w-3.5 animate-spin" />Loading architecture…</div>;
  const selectedProject = workspace.projects.find((p) => p.id === explorerProjectId);
  const hasArchitecture = explorerSetup.counts.location_nodes > 0;
  if (!hasArchitecture) {
    return <div className={`${CARD} p-8 text-center`}><Building2 className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 text-base font-bold text-foreground">No architecture found</h2><p className="mt-1 text-xs text-muted-foreground">{selectedProject?.name ?? explorerSetup.project.name} has no architecture nodes yet.</p><div className="mt-4 flex justify-center gap-2"><Button onClick={() => setExplorerProjectId(null)}><ChevronLeft className="h-3.5 w-3.5" />Projects</Button><PrimaryButton onClick={() => { workspace.selectProject(explorerProjectId); navigate("/workspace/project/architecture"); }}><Plus className="h-4 w-4" />Create architecture</PrimaryButton></div></div>;
  }

  return <div className={`${CARD} overflow-hidden`}>
    <div className="flex flex-col gap-3 border-b border-border bg-muted/15 p-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><button type="button" onClick={() => setExplorerProjectId(null)} className="mb-2 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground"><ChevronLeft className="h-3 w-3" />Projects</button><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Architecture Explorer</p><h2 className="mt-1 text-base font-bold text-foreground">Project architecture hierarchy</h2></div></div>
    <div className="border-b border-border p-4"><div className="relative max-w-2xl"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${INPUT} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search architecture nodes by name, code or hierarchy path" /></div></div>
    {search.trim() ? <div className="p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-foreground">Search results</p><span className="text-xs font-bold text-primary">{searchQuery.data?.count ?? 0}</span></div>{searchQuery.isFetching ? <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Searching architecture…</div> : searchQuery.data?.results.length ? <div className="space-y-2">{searchQuery.data.results.map((node) => <div key={node.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary"><Building2 className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold text-foreground">{node.name}</p><span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">{node.level_name}</span></div><p className="mt-1 truncate text-[10px] text-muted-foreground">{explorerSetup.project.name} / {node.full_path || node.name}</p></div><span className="shrink-0 text-[10px] text-muted-foreground">{node.children_count} children</span></div>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">No architecture nodes match “{search}”.</div>}</div> : <div className="p-4 sm:p-5"><div className="overflow-x-auto rounded-xl border border-border bg-background p-3 sm:p-4"><div className="min-w-[620px]"><button type="button" onClick={() => setProjectExpanded((v) => !v)} className="group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted/50"><span className="flex h-6 w-6 items-center justify-center text-muted-foreground"><ChevronDown className={`h-4 w-4 transition ${projectExpanded ? "rotate-0" : "-rotate-90"}`} /></span><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-foreground">{explorerSetup.project.name}</span><span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Project · architecture root</span></span><span className="rounded-full border border-border bg-muted/30 px-2 py-1 text-[9px] font-semibold text-muted-foreground">{rootQuery.data?.count ?? 0} root nodes</span></button>{projectExpanded ? <div className="relative ml-5 border-l border-border pl-7">{rootQuery.isFetching ? <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Loading project architecture…</div> : rootQuery.data?.results.length ? <div className="py-1">{rootQuery.data.results.map((node) => <ArchitectureTreeNode key={node.id} node={node} projectId={explorerProjectId} depth={0} />)}</div> : null}</div> : null}</div></div></div>}
  </div>;
}

function ArchitectureTreeNode({ node, projectId, depth }: { node: LocationExplorerNode; projectId: number; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = node.children_count > 0;
  const childrenQuery = useLocationExplorer(projectId, { parent: node.id, search: "", page: 1, page_size: 100 }, expanded && canExpand);
  return <div className="relative"><span className="absolute -left-7 top-5 h-px w-5 bg-border" /><button type="button" onClick={() => canExpand && setExpanded((v) => !v)} className={`group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition ${canExpand ? "hover:bg-muted/50" : "cursor-default"}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">{canExpand ? <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-0" : "-rotate-90"}`} /> : <span className="h-1.5 w-1.5 rounded-full bg-border" />}</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary"><Building2 className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-xs font-bold text-foreground">{node.name}</span><span className="rounded-full bg-primary/8 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary">{node.level_name}</span></span><span className="mt-0.5 block text-[9px] text-muted-foreground">{node.children_count} children</span></span></button>{expanded && canExpand ? <div className="relative ml-5 border-l border-border pl-7">{childrenQuery.isFetching ? <div className="flex items-center gap-2 py-3 text-[10px] text-muted-foreground"><RefreshCw className="h-3 w-3 animate-spin" />Loading children…</div> : childrenQuery.data?.results.map((child) => <ArchitectureTreeNode key={child.id} node={child} projectId={projectId} depth={depth + 1} />)}</div> : null}</div>;
}

function ExplorerCard({ node, onOpen }: { node: LocationExplorerNode; onOpen: () => void }) {
  const size = node.level_sequence <= 1 ? "min-h-28" : node.level_sequence <= 2 ? "min-h-24" : "min-h-20";
  return <button type="button" onClick={onOpen} disabled={node.children_count === 0} className={`${size} rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:shadow-sm disabled:cursor-default`}><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-primary/8 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">{node.level_name}</span><span className="text-[10px] text-muted-foreground">{node.children_count} child</span></div><p className="mt-3 truncate text-sm font-bold text-foreground">{node.name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{node.applied_flat_template_name ?? node.code}</p></button>;
}

function ExplorerShell({ title, text, filters, trail, onRoot, onTrail, children, loading, error, page, total, pageSize, onPage }: { title: string; text: string; filters: React.ReactNode; trail: { id: number; name: string }[]; onRoot: () => void; onTrail: (index: number) => void; children: React.ReactNode; loading: boolean; error: string | null; page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  return <div className={`${CARD} p-4 sm:p-5`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-foreground">{title}</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{text}</p></div>{loading ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : null}</div><div className="mt-4 flex flex-wrap gap-2">{filters}</div><div className="mt-4 flex items-center gap-1 overflow-x-auto rounded-xl bg-muted/25 p-2 text-xs"><button type="button" onClick={onRoot} className="rounded-lg px-2 py-1 font-semibold text-primary">Project root</button>{trail.map((row, index) => <span key={row.id} className="flex items-center gap-1"><ChevronRight className="h-3 w-3 text-muted-foreground" /><button type="button" onClick={() => onTrail(index)} className="max-w-40 truncate rounded-lg px-2 py-1 text-muted-foreground hover:text-foreground">{row.name}</button></span>)}</div>{error ? <p className="mt-4 text-xs text-destructive">{error}</p> : null}<div className="mt-4">{children}</div><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><p className="text-[10px] text-muted-foreground">{total.toLocaleString()} nodes in this result</p><div className="flex gap-1"><Button disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button><span className="flex h-9 items-center px-2 text-xs text-muted-foreground">Page {page}</span><Button disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button></div></div></div>;
}

function ExecutionSection({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const schemes = setup.execution_schemes;
  const [view, setView] = useState<"scheme" | "levels" | "tree">("scheme");
  const [schemeId, setSchemeId] = useState<number | null>(schemes.find((row) => row.is_current)?.id ?? schemes[0]?.id ?? null);
  const selectedScheme = schemes.find((row) => row.id === schemeId) ?? null;
  const levels = setup.execution_levels.filter((row) => row.scheme === schemeId).sort((a, b) => a.sequence - b.sequence);
  const [levelId, setLevelId] = useState<number | null>(levels[0]?.id ?? null);
  useEffect(() => { setLevelId(levels[0]?.id ?? null); }, [schemeId]);
  const canTree = Boolean(setup.capabilities[P.executionNodeView]);
  const steps = [
    { key: "scheme" as const, label: "Scheme", icon: <Workflow className="h-4 w-4" /> },
    { key: "levels" as const, label: "Levels", icon: <Layers3 className="h-4 w-4" /> },
    ...(canTree ? [{ key: "tree" as const, label: "Execution explorer", icon: <ListTree className="h-4 w-4" /> }] : []),
  ];
  return <div className="space-y-5"><SectionHeading eyebrow="Execution" title="Execution structure" text="" /><div className="flex flex-wrap justify-center gap-2">{steps.map((item) => <button key={item.key} type="button" onClick={() => setView(item.key)} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-bold transition ${view === item.key ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>{item.icon}{item.label}</button>)}</div>{view === "scheme" ? <ExecutionSchemePanel setup={setup} projectId={projectId} schemeId={schemeId} setSchemeId={setSchemeId} onNext={() => setView("levels")} /> : null}{view === "levels" ? <div className={`${CARD} p-4 sm:p-5`}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-primary">Step 2</p><h2 className="mt-1 text-sm font-bold text-foreground">Execution levels</h2></div><div className="flex gap-2"><Button onClick={() => setView("scheme")}><ChevronLeft className="h-3.5 w-3.5" />Scheme</Button>{canTree && levels.length ? <PrimaryButton onClick={() => setView("tree")}>Execution explorer<ChevronRight className="h-3.5 w-3.5" /></PrimaryButton> : null}</div></div>{selectedScheme ? <ExecutionLevelsAndNodes setup={setup} projectId={projectId} scheme={selectedScheme} levels={levels} selectedLevelId={levelId} setSelectedLevelId={setLevelId} /> : <EmptyInline title="Create a scheme first" text="Save an execution scheme before adding levels." />}</div> : null}{view === "tree" ? <ExecutionExplorer setup={setup} projectId={projectId} /> : null}</div>;
}

function ExecutionSchemePanel({ setup, projectId, schemeId, setSchemeId, onNext }: { setup: ProjectWorkspaceSetup; projectId: number; schemeId: number | null; setSchemeId: (id: number | null) => void; onNext: () => void }) {
  const schemes = setup.execution_schemes;
  const selectedScheme = schemes.find((row) => row.id === schemeId) ?? null;
  const [editing, setEditing] = useState(schemes.length === 0);
  const [draft, setDraft] = useState({ name: selectedScheme?.name ?? "Main Execution Scheme", code: selectedScheme?.code ?? "main-execution", description: selectedScheme?.description ?? "" });
  useEffect(() => { if (selectedScheme) { setDraft({ name: selectedScheme.name, code: selectedScheme.code, description: selectedScheme.description }); setEditing(false); } }, [schemeId, setup.execution_schemes]);
  const save = useProjectWorkspaceMutation(async () => selectedScheme ? projectWorkspaceApi.updateExecutionScheme(selectedScheme.id, draft) : projectWorkspaceApi.createExecutionScheme({ project: projectId, ...draft, is_current: schemes.length === 0, is_active: true }), projectId);
  const remove = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.deleteExecutionScheme(id), projectId);
  const makeCurrent = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.makeExecutionSchemeCurrent(id), projectId);
  const startNew = () => { setSchemeId(null); setDraft({ name: "", code: "", description: "" }); setEditing(true); };
  return <div className={`${CARD} p-4 sm:p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-primary">Step 1</p><h2 className="mt-1 text-sm font-bold text-foreground">Execution scheme</h2></div>{setup.capabilities[P.executionSchemeCreate] ? <Button onClick={startNew}><Plus className="h-3.5 w-3.5" />New scheme</Button> : null}</div>{schemes.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{schemes.map((row) => <button key={row.id} type="button" onClick={() => setSchemeId(row.id)} className={`rounded-2xl border p-4 text-left transition ${schemeId === row.id ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/25"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-foreground">{row.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{row.code}</p></div>{row.is_current ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">Current</span> : null}</div><p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{row.description || "No description"}</p></button>)}</div> : null}{selectedScheme && !editing ? <div className="mt-5 rounded-2xl border border-border bg-muted/10 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-bold text-foreground">{selectedScheme.name}</h3><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selectedScheme.code}</p><p className="mt-3 max-w-2xl text-xs leading-5 text-muted-foreground">{selectedScheme.description || "No description added."}</p></div><div className="flex flex-wrap gap-2">{setup.capabilities[P.executionSchemeUpdate] ? <Button onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5" />Edit</Button> : null}{!selectedScheme.is_current && setup.capabilities[P.executionMakeCurrent] ? <Button onClick={() => makeCurrent.mutate(selectedScheme.id)}><Sparkles className="h-3.5 w-3.5" />Make current</Button> : null}</div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">{setup.capabilities[P.executionSchemeDelete] ? <Button danger onClick={() => window.confirm("Delete this execution scheme?") && remove.mutate(selectedScheme.id)}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : <span /> }<PrimaryButton onClick={onNext}>Next: Levels<ChevronRight className="h-3.5 w-3.5" /></PrimaryButton></div></div> : null}{editing ? <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/[0.02] p-5"><div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><input className={INPUT} value={draft.name} onChange={(e) => setDraft((v) => ({ ...v, name: e.target.value, code: selectedScheme ? v.code : slug(e.target.value) }))} /></Field><Field label="Code"><input className={INPUT} value={draft.code} onChange={(e) => setDraft((v) => ({ ...v, code: slug(e.target.value) }))} /></Field><Field label="Description" className="sm:col-span-2"><textarea className={TEXTAREA} value={draft.description} onChange={(e) => setDraft((v) => ({ ...v, description: e.target.value }))} /></Field></div>{save.isError ? <p className="mt-3 text-xs text-destructive">{errorMessage(save.error, "Unable to save execution scheme.")}</p> : null}<div className="mt-4 flex gap-2"><PrimaryButton onClick={() => save.mutate(undefined, { onSuccess: (row: any) => { if (row?.id) setSchemeId(row.id); setEditing(false); } })} disabled={!draft.name.trim() || save.isPending}><Save className="h-4 w-4" />Save scheme</PrimaryButton>{selectedScheme ? <Button onClick={() => setEditing(false)}>Cancel</Button> : null}</div></div> : null}</div>;
}

function ExecutionBuilder({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const schemes = setup.execution_schemes;
  const [schemeId, setSchemeId] = useState<number | null>(schemes.find((row) => row.is_current)?.id ?? schemes[0]?.id ?? null);
  const selectedScheme = schemes.find((row) => row.id === schemeId) ?? null;
  const [schemeDraft, setSchemeDraft] = useState({ name: selectedScheme?.name ?? "Main Execution Scheme", code: selectedScheme?.code ?? "main-execution", description: selectedScheme?.description ?? "" });
  useEffect(() => { if (selectedScheme) setSchemeDraft({ name: selectedScheme.name, code: selectedScheme.code, description: selectedScheme.description }); }, [schemeId]);
  const saveScheme = useProjectWorkspaceMutation(async () => selectedScheme ? projectWorkspaceApi.updateExecutionScheme(selectedScheme.id, schemeDraft) : projectWorkspaceApi.createExecutionScheme({ project: projectId, ...schemeDraft, is_current: schemes.length === 0, is_active: true }), projectId);
  const deleteScheme = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.deleteExecutionScheme(id), projectId);
  const makeCurrent = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.makeExecutionSchemeCurrent(id), projectId);
  const levels = setup.execution_levels.filter((row) => row.scheme === schemeId).sort((a, b) => a.sequence - b.sequence);
  const [levelId, setLevelId] = useState<number | null>(levels[0]?.id ?? null);
  useEffect(() => { setLevelId(levels[0]?.id ?? null); }, [schemeId]);
  return <div className="space-y-5"><div className="grid gap-5 2xl:grid-cols-[0.85fr_1.15fr]"><div className={`${CARD} p-4 sm:p-5`}><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-foreground">Execution scheme</h2>{setup.capabilities[P.executionSchemeCreate] ? <Button onClick={() => { setSchemeId(null); setSchemeDraft({ name: "", code: "", description: "" }); }}><Plus className="h-3.5 w-3.5" />New</Button> : null}</div>{schemes.length ? <Field label="Existing scheme" className="mt-4"><select className={INPUT} value={schemeId ?? ""} onChange={(e) => setSchemeId(e.target.value ? Number(e.target.value) : null)}>{schemes.map((row) => <option key={row.id} value={row.id}>{row.name}{row.is_current ? " · Current" : ""}</option>)}</select></Field> : null}<Field label="Name" className="mt-3"><input className={INPUT} value={schemeDraft.name} onChange={(e) => setSchemeDraft((v) => ({ ...v, name: e.target.value, code: selectedScheme ? v.code : slug(e.target.value) }))} /></Field><Field label="Code" className="mt-3"><input className={INPUT} value={schemeDraft.code} onChange={(e) => setSchemeDraft((v) => ({ ...v, code: slug(e.target.value) }))} /></Field><Field label="Description" className="mt-3"><textarea className={TEXTAREA} value={schemeDraft.description} onChange={(e) => setSchemeDraft((v) => ({ ...v, description: e.target.value }))} /></Field>{saveScheme.isError ? <p className="mt-3 text-xs text-destructive">{errorMessage(saveScheme.error, "Unable to save execution scheme.")}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{(selectedScheme ? setup.capabilities[P.executionSchemeUpdate] : setup.capabilities[P.executionSchemeCreate]) ? <PrimaryButton onClick={() => saveScheme.mutate(undefined)} disabled={!schemeDraft.name.trim() || saveScheme.isPending}><Save className="h-4 w-4" />Save scheme</PrimaryButton> : null}{selectedScheme && !selectedScheme.is_current && setup.capabilities[P.executionMakeCurrent] ? <Button onClick={() => makeCurrent.mutate(selectedScheme.id)}><Sparkles className="h-3.5 w-3.5" />Make current</Button> : null}{selectedScheme && setup.capabilities[P.executionSchemeDelete] ? <Button danger onClick={() => window.confirm("Delete this execution scheme?") && deleteScheme.mutate(selectedScheme.id)}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : null}</div></div><div className={`${CARD} p-4 sm:p-5`}><ExecutionLevelsAndNodes setup={setup} projectId={projectId} scheme={selectedScheme} levels={levels} selectedLevelId={levelId} setSelectedLevelId={setLevelId} /></div></div></div>;
}

function ExecutionLevelsAndNodes({
  setup,
  projectId,
  scheme,
  levels,
  selectedLevelId,
  setSelectedLevelId,
}: {
  setup: ProjectWorkspaceSetup;
  projectId: number;
  scheme: ExecutionScheme | null;
  levels: ExecutionLevel[];
  selectedLevelId: number | null;
  setSelectedLevelId: (id: number | null) => void;
}) {
  const selected = levels.find((row) => row.id === selectedLevelId) ?? null;
  const [newLevel, setNewLevel] = useState(false);
  const [editingLevel, setEditingLevel] = useState(false);
  const [draft, setDraft] = useState({
    name: selected?.name ?? "",
    code: selected?.code ?? "",
    mode: (selected?.default_flow_mode ?? "manual") as "manual" | "automatic",
    visible: selected?.visible_in_navigation ?? true,
  });

  useEffect(() => {
    if (selected) {
      setDraft({
        name: selected.name,
        code: selected.code,
        mode: selected.default_flow_mode,
        visible: selected.visible_in_navigation,
      });
    }
    setNewLevel(false);
    setEditingLevel(false);
  }, [selectedLevelId]);

  const saveLevel = useProjectWorkspaceMutation(async () => {
    if (!scheme) throw new Error("Save an execution scheme first.");
    if (newLevel || !selected) {
      return projectWorkspaceApi.createExecutionLevel({
        scheme: scheme.id,
        name: draft.name.trim(),
        code: draft.code || slug(draft.name),
        sequence: levels.length + 1,
        default_flow_mode: draft.mode,
        visible_in_navigation: draft.visible,
        is_active: true,
      });
    }
    return projectWorkspaceApi.updateExecutionLevel(selected.id, {
      name: draft.name.trim(),
      code: draft.code,
      default_flow_mode: draft.mode,
      visible_in_navigation: draft.visible,
    });
  }, projectId);
  const deleteLevel = useProjectWorkspaceMutation(
    (id: number) => projectWorkspaceApi.deleteExecutionLevel(id),
    projectId
  );

  const previous = selected
    ? [...levels]
        .filter((row) => row.sequence < selected.sequence)
        .sort((a, b) => b.sequence - a.sequence)[0] ?? null
    : null;
  const parentNodes = useExecutionExplorer(
    projectId,
    scheme && previous
      ? { scheme: scheme.id, parent: "any", level: previous.id, page_size: 100 }
      : null,
    Boolean(scheme && previous)
  );
  const levelNodes = useExecutionExplorer(
    projectId,
    scheme && selected
      ? { scheme: scheme.id, parent: "any", level: selected.id, page_size: 100 }
      : null,
    Boolean(scheme && selected && setup.capabilities[P.executionNodeView])
  );

  const [nodeEditing, setNodeEditing] = useState<ExecutionExplorerNode | null>(null);
  const [nodeName, setNodeName] = useState("");
  const [nodeParent, setNodeParent] = useState<number | null>(null);
  useEffect(() => {
    setNodeEditing(null);
    setNodeName("");
    setNodeParent(null);
  }, [selectedLevelId, scheme?.id]);

  const saveNode = useProjectWorkspaceMutation(async () => {
    if (!scheme || !selected) throw new Error("Select an execution level.");
    if (nodeEditing) {
      return projectWorkspaceApi.updateExecutionNode(nodeEditing.id, {
        level: selected.id,
        parent: nodeParent,
        name: nodeName.trim(),
        code: nodeEditing.code || slug(nodeName),
      });
    }
    return projectWorkspaceApi.createExecutionNode({
      scheme: scheme.id,
      level: selected.id,
      parent: nodeParent,
      name: nodeName.trim(),
      code: slug(nodeName),
      sequence: (levelNodes.data?.count ?? 0) + 1,
      is_active: true,
    });
  }, projectId);
  const deleteNode = useProjectWorkspaceMutation(
    (id: number) => projectWorkspaceApi.deleteExecutionNode(id),
    projectId
  );

  const beginNodeEdit = (node: ExecutionExplorerNode) => {
    setNodeEditing(node);
    setNodeName(node.name);
    setNodeParent(node.parent);
  };
  const cancelNodeEdit = () => {
    setNodeEditing(null);
    setNodeName("");
    setNodeParent(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Execution levels</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Levels are shown as a sub-stepper below the scheme.
          </p>
        </div>
        {scheme && setup.capabilities[P.executionLevelCreate] ? (
          <Button
            onClick={() => {
              setNewLevel(true);
              setEditingLevel(true);
              setSelectedLevelId(null);
              setDraft({ name: "", code: "", mode: "manual", visible: true });
            }}
          >
            <Plus className="h-3.5 w-3.5" />Add level
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {levels.map((row, index) => (
          <button
            key={row.id}
            type="button"
            onClick={() => setSelectedLevelId(row.id)}
            className={`min-w-28 rounded-xl border p-2.5 text-left ${
              row.id === selectedLevelId
                ? "border-primary/50 bg-primary/8"
                : "border-border bg-background"
            }`}
          >
            <p className="text-[9px] text-muted-foreground">Step {index + 1}</p>
            <p className="mt-1 text-xs font-bold text-foreground">{row.name}</p>
          </button>
        ))}
      </div>

      {scheme && selected && !editingLevel && !newLevel ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">Step {selected.sequence}</span><h3 className="text-sm font-bold text-foreground">{selected.name}</h3></div><p className="mt-2 text-xs text-muted-foreground">{selected.code} · {selected.default_flow_mode} · {selected.visible_in_navigation ? "Visible in navigation" : "Hidden from navigation"}</p></div>{setup.capabilities[P.executionLevelUpdate] ? <Button onClick={() => setEditingLevel(true)}><Pencil className="h-3.5 w-3.5" />Edit level</Button> : null}</div></div>
      ) : null}

      {scheme && (newLevel || (selected && editingLevel)) ? (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.02] p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={INPUT} placeholder="Level name" value={draft.name} onChange={(e) => setDraft((value) => ({ ...value, name: e.target.value, code: selected ? value.code : slug(e.target.value) }))} />
            <input className={INPUT} placeholder="code" value={draft.code} onChange={(e) => setDraft((value) => ({ ...value, code: slug(e.target.value) }))} />
            <select className={INPUT} value={draft.mode} onChange={(e) => setDraft((value) => ({ ...value, mode: e.target.value as "manual" | "automatic" }))}><option value="manual">Manual</option><option value="automatic">Automatic</option></select>
            <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs"><input type="checkbox" checked={draft.visible} onChange={(e) => setDraft((value) => ({ ...value, visible: e.target.checked }))} />Visible in navigation</label>
          </div>
          <div className="mt-3 flex gap-2">{(newLevel ? setup.capabilities[P.executionLevelCreate] : setup.capabilities[P.executionLevelUpdate]) ? <Button onClick={() => saveLevel.mutate(undefined, { onSuccess: (row: any) => { if (row?.id) setSelectedLevelId(row.id); setNewLevel(false); setEditingLevel(false); } })} disabled={!draft.name.trim()}><Save className="h-3.5 w-3.5" />Save level</Button> : null}{selected && setup.capabilities[P.executionLevelDelete] ? <Button danger onClick={() => window.confirm("Delete this execution level?") && deleteLevel.mutate(selected.id)}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : null}<Button onClick={() => { setNewLevel(false); setEditingLevel(false); if (!selectedLevelId && levels[0]) setSelectedLevelId(levels[0].id); }}>Cancel</Button></div>
        </div>
      ) : null}

      {selected && setup.capabilities[P.executionNodeView] ? (
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">{selected.name} nodes</p>
              <p className="text-[10px] text-muted-foreground">
                Existing nodes are loaded first. Create or edit actual execution data inside this level.
              </p>
            </div>
            <span className="text-xs font-bold text-primary">{levelNodes.data?.count ?? 0}</span>
          </div>

          {(nodeEditing
            ? setup.capabilities[P.executionNodeUpdate]
            : setup.capabilities[P.executionNodeCreate]) ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className={INPUT}
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder={`${selected.name} name`}
              />
              {previous ? (
                <select
                  className={INPUT}
                  value={nodeParent ?? ""}
                  onChange={(e) =>
                    setNodeParent(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Select parent {previous.name}</option>
                  {parentNodes.data?.results.map((row) => (
                    <option key={row.id} value={row.id}>{row.full_path || row.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex h-10 items-center rounded-xl border border-border bg-muted/20 px-3 text-xs text-muted-foreground">
                  Root execution level
                </div>
              )}
              <div className="flex gap-1">
                <Button
                  onClick={() =>
                    saveNode.mutate(undefined, {
                      onSuccess: () => cancelNodeEdit(),
                    })
                  }
                  disabled={!nodeName.trim() || Boolean(previous && !nodeParent)}
                >
                  {nodeEditing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {nodeEditing ? "Save" : "Create"}
                </Button>
                {nodeEditing ? (
                  <Button onClick={cancelNodeEdit} title="Cancel edit">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {levelNodes.data?.results.slice(0, 12).map((row) => (
              <div key={row.id} className="flex items-center gap-2 rounded-xl border border-border bg-background p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{row.name}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">
                    {row.parent_name ? `under ${row.parent_name}` : "ROOT"}
                  </p>
                </div>
                {setup.capabilities[P.executionNodeUpdate] ? (
                  <button
                    type="button"
                    onClick={() => beginNodeEdit(row)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-primary"
                    title="Edit execution node"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                {setup.capabilities[P.executionNodeDelete] ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${row.name}?`)) deleteNode.mutate(row.id);
                    }}
                    className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
                    title="Delete execution node"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ExecutionExplorer({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const schemes = setup.execution_schemes;
  const [schemeId, setSchemeId] = useState<number | null>(schemes.find((row) => row.is_current)?.id ?? schemes[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [projectExpanded, setProjectExpanded] = useState(true);
  const rootQuery = useExecutionExplorer(
    projectId,
    schemeId ? { scheme: schemeId, parent: "root", page_size: 100 } : null
  );
  const searchQuery = useExecutionExplorer(
    projectId,
    schemeId && search.trim()
      ? { scheme: schemeId, parent: "any", search: search.trim(), page_size: 100 }
      : null,
    Boolean(schemeId && search.trim())
  );

  useEffect(() => {
    setProjectExpanded(true);
    setSearch("");
  }, [schemeId]);

  if (!schemeId) {
    return <EmptyInline title="No execution scheme" text="Create an execution scheme before opening the execution explorer." />;
  }

  return (
    <div className="space-y-4">
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-border bg-muted/15 p-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Execution Explorer</p>
            <h2 className="mt-1 text-base font-bold text-foreground">Project execution hierarchy</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The project is the root. Expand each execution node to inspect its children in true hierarchy order.
            </p>
          </div>
          <select
            className={`${INPUT} lg:w-64`}
            value={schemeId}
            onChange={(e) => setSchemeId(Number(e.target.value))}
          >
            {schemes.map((row) => (
              <option key={row.id} value={row.id}>{row.name}{row.is_current ? " · Current" : ""}</option>
            ))}
          </select>
        </div>

        <div className="border-b border-border p-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              className={`${INPUT} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search execution nodes by name, code or hierarchy path"
            />
          </div>
        </div>

        {search.trim() ? (
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Search results</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Full paths are shown so similarly named execution nodes remain clear.</p>
              </div>
              <span className="text-xs font-bold text-primary">{searchQuery.data?.count ?? 0}</span>
            </div>
            {searchQuery.isFetching ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-4 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Searching execution hierarchy…</div>
            ) : searchQuery.isError ? (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">{errorMessage(searchQuery.error, "Unable to search execution hierarchy.")}</p>
            ) : searchQuery.data?.results.length ? (
              <div className="space-y-2">
                {searchQuery.data.results.map((node) => (
                  <div key={node.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary"><GitBranch className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-foreground">{node.name}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">{node.level_name}</span>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-muted-foreground">{setup.project.name} / {node.full_path || node.name}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{node.children_count} children</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">No execution nodes match “{search}”.</div>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-5">
            <div className="overflow-x-auto rounded-xl border border-border bg-background p-3 sm:p-4">
              <div className="min-w-[620px]">
                <button
                  type="button"
                  onClick={() => setProjectExpanded((value) => !value)}
                  className="group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-muted/50"
                >
                  <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">
                    <ChevronDown className={`h-4 w-4 transition ${projectExpanded ? "rotate-0" : "-rotate-90"}`} />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">{setup.project.name}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Project · execution root</span>
                  </span>
                  <span className="rounded-full border border-border bg-muted/30 px-2 py-1 text-[9px] font-semibold text-muted-foreground">{rootQuery.data?.count ?? 0} root nodes</span>
                </button>

                {projectExpanded ? (
                  <div className="relative ml-5 border-l border-border pl-7">
                    {rootQuery.isFetching ? (
                      <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Loading project execution…</div>
                    ) : rootQuery.isError ? (
                      <p className="py-4 text-xs text-destructive">{errorMessage(rootQuery.error, "Unable to load project execution hierarchy.")}</p>
                    ) : rootQuery.data?.results.length ? (
                      <div className="py-1">
                        {rootQuery.data.results.map((node) => (
                          <ExecutionTreeNode key={node.id} node={node} projectId={projectId} schemeId={schemeId} depth={0} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-5 text-xs text-muted-foreground">No execution nodes have been created for this project yet.</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">Branches load only when expanded, so the hierarchy stays responsive even for large projects.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutionTreeNode({ node, projectId, schemeId, depth }: { node: ExecutionExplorerNode; projectId: number; schemeId: number; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = node.children_count > 0;
  const childrenQuery = useExecutionExplorer(
    projectId,
    expanded && canExpand ? { scheme: schemeId, parent: node.id, page_size: 100 } : null,
    expanded && canExpand
  );

  return (
    <div className="relative">
      <span className="absolute -left-7 top-5 h-px w-5 bg-border" />
      <button
        type="button"
        onClick={() => canExpand && setExpanded((value) => !value)}
        className={`group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition ${canExpand ? "hover:bg-muted/50" : "cursor-default"}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
          {canExpand ? <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-0" : "-rotate-90"}`} /> : <span className="h-1.5 w-1.5 rounded-full bg-border" />}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary"><GitBranch className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-xs font-bold text-foreground">{node.name}</span>
            <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary">{node.level_name}</span>
          </span>
          <span className="mt-0.5 block text-[9px] text-muted-foreground">{node.effective_flow_mode} flow · {node.children_count} children</span>
        </span>
      </button>

      {expanded && canExpand ? (
        <div className="relative ml-5 border-l border-border pl-7">
          {childrenQuery.isFetching ? (
            <div className="flex items-center gap-2 py-3 text-[10px] text-muted-foreground"><RefreshCw className="h-3 w-3 animate-spin" />Loading children…</div>
          ) : childrenQuery.isError ? (
            <p className="py-3 text-[10px] text-destructive">{errorMessage(childrenQuery.error, "Unable to load child nodes.")}</p>
          ) : childrenQuery.data?.results.map((child) => (
            <ExecutionTreeNode key={child.id} node={child} projectId={projectId} schemeId={schemeId} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReleasePolicySection({ setup, projectId }: { setup: ProjectWorkspaceSetup; projectId: number }) {
  const policies = setup.release_policies;
  const defaultModule = setup.project_modules[0]?.organization_module_id ?? null;
  const emptyDraft = (): ReleasePolicyPayload => ({ project: projectId, organization_module: defaultModule ?? 0, release_level: "record", physical_scope_type: "all_locations", structure_level: null, include_physical_descendants: false, execution_scope_type: "all_execution", execution_level: null, include_execution_descendants: false, completion_rules: {}, priority: 100, is_active: true });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = policies.find((row) => row.id === selectedId) ?? null;
  const [editing, setEditing] = useState(policies.length === 0);
  const [draft, setDraft] = useState<ReleasePolicyPayload>(emptyDraft);
  const loadPolicy = (policy: (typeof policies)[number]) => { setSelectedId(policy.id); setDraft({ project: projectId, organization_module: policy.organization_module, release_level: policy.release_level, physical_scope_type: policy.physical_scope_type, structure_level: policy.structure_level, include_physical_descendants: policy.include_physical_descendants, execution_scope_type: policy.execution_scope_type, execution_level: policy.execution_level, include_execution_descendants: policy.include_execution_descendants, completion_rules: policy.completion_rules, priority: policy.priority, is_active: policy.is_active }); setEditing(true); };
  const startNew = () => { setSelectedId(null); setDraft(emptyDraft()); setEditing(true); };
  const save = useProjectWorkspaceMutation(async () => selected ? projectWorkspaceApi.updateReleasePolicy(selected.id, draft) : projectWorkspaceApi.createReleasePolicy(draft), projectId);
  const remove = useProjectWorkspaceMutation((id: number) => projectWorkspaceApi.deleteReleasePolicy(id), projectId);
  const canSave = selected ? setup.capabilities[P.releaseUpdate] : setup.capabilities[P.releaseCreate];
  return <div className="space-y-5"><SectionHeading eyebrow="Release policy" title="Project release & visibility policy" text="" />{policies.length > 0 && !editing ? <div className={`${CARD} p-4 sm:p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-foreground">Release policies</h2><p className="mt-1 text-xs text-muted-foreground">Click a policy to edit it.</p></div>{setup.capabilities[P.releaseCreate] ? <Button onClick={startNew}><Plus className="h-3.5 w-3.5" />New policy</Button> : null}</div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{policies.map((policy) => <button key={policy.id} type="button" onClick={() => loadPolicy(policy)} className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/35 hover:shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-foreground">{policy.module_name}</p><span className="rounded-full bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground">#{policy.priority}</span></div><p className="mt-3 text-[10px] text-muted-foreground">{policy.release_level} · {policy.physical_scope_type}</p><p className="mt-1 text-[10px] text-muted-foreground">{policy.execution_scope_type}</p><span className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-primary">Edit policy<ChevronRight className="h-3 w-3" /></span></button>)}</div></div> : null}{editing ? <div className={`${CARD} p-4 sm:p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-bold text-foreground">{selected ? "Edit policy" : "Create policy"}</h2>{policies.length > 0 ? <Button onClick={() => setEditing(false)}><ChevronLeft className="h-3.5 w-3.5" />Back to policies</Button> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Project module"><select className={INPUT} value={draft.organization_module || ""} onChange={(e) => setDraft((v) => ({ ...v, organization_module: Number(e.target.value) }))}><option value="">Select module</option>{setup.project_modules.map((row) => <option key={row.organization_module_id} value={row.organization_module_id}>{row.name}</option>)}</select></Field><Field label="Release level"><select className={INPUT} value={draft.release_level} onChange={(e) => setDraft((v) => ({ ...v, release_level: e.target.value as ReleasePolicyPayload["release_level"] }))}><option value="item">Item / question</option><option value="record">Whole record</option><option value="block_node">Block / node</option><option value="hierarchy">Hierarchy</option></select></Field><Field label="Physical scope"><select className={INPUT} value={draft.physical_scope_type} onChange={(e) => setDraft((v) => ({ ...v, physical_scope_type: e.target.value as ReleasePolicyPayload["physical_scope_type"], structure_level: e.target.value === "all_locations" ? null : v.structure_level }))}><option value="all_locations">All locations</option><option value="structure_level">Structure level</option></select></Field>{draft.physical_scope_type === "structure_level" ? <Field label="Structure level"><select className={INPUT} value={draft.structure_level ?? ""} onChange={(e) => setDraft((v) => ({ ...v, structure_level: e.target.value ? Number(e.target.value) : null }))}><option value="">Select level</option>{setup.structure_levels.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field> : <div />}<Field label="Execution scope"><select className={INPUT} value={draft.execution_scope_type} onChange={(e) => setDraft((v) => ({ ...v, execution_scope_type: e.target.value as ReleasePolicyPayload["execution_scope_type"], execution_level: e.target.value === "all_execution" ? null : v.execution_level }))}><option value="all_execution">All execution</option><option value="execution_level">Execution level</option></select></Field>{draft.execution_scope_type === "execution_level" ? <Field label="Execution level"><select className={INPUT} value={draft.execution_level ?? ""} onChange={(e) => setDraft((v) => ({ ...v, execution_level: e.target.value ? Number(e.target.value) : null }))}><option value="">Select level</option>{setup.execution_levels.map((row) => <option key={row.id} value={row.id}>{row.scheme_name} / {row.name}</option>)}</select></Field> : <div />}<Field label="Priority"><input className={INPUT} type="number" min={1} value={draft.priority ?? 100} onChange={(e) => setDraft((v) => ({ ...v, priority: Math.max(1, Number(e.target.value) || 100) }))} /></Field></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><Check label="Include physical descendants" checked={Boolean(draft.include_physical_descendants)} onChange={(value) => setDraft((v) => ({ ...v, include_physical_descendants: value }))} /><Check label="Include execution descendants" checked={Boolean(draft.include_execution_descendants)} onChange={(value) => setDraft((v) => ({ ...v, include_execution_descendants: value }))} /></div>{save.isError ? <p className="mt-3 text-xs text-destructive">{errorMessage(save.error, "Unable to save release policy.")}</p> : null}<div className="mt-5 flex gap-2">{canSave ? <PrimaryButton onClick={() => save.mutate(undefined, { onSuccess: () => setEditing(false) })} disabled={!draft.organization_module || save.isPending}><Save className="h-4 w-4" />Save policy</PrimaryButton> : null}{selected && setup.capabilities[P.releaseDelete] ? <Button danger onClick={() => window.confirm("Delete this release policy?") && remove.mutate(selected.id, { onSuccess: () => { setEditing(false); setSelectedId(null); } })}><Trash2 className="h-3.5 w-3.5" />Delete</Button> : null}</div></div> : null}</div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block ${className}`}><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />{label}</label>; }
function EmptyInline({ title, text }: { title: string; text: string }) { return <div className={`${CARD} p-8 text-center`}><Route className="mx-auto h-6 w-6 text-primary" /><p className="mt-3 text-sm font-bold text-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>; }
