import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronDown, ChevronRight, ClipboardCheck, Eye, Layers3 } from "lucide-react";
import { api } from "@/lib/api";
import { useWorkspace } from "@/features/workspace";

const INPUT = "h-10 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary";
type Page<T> = { count: number; results: T[] };
type Scheme = { id: number; name: string; is_current: boolean };
type ExecNode = { id: number; name: string; full_path: string; level_name: string };
type Question = { id: number; sequence: number; question: string; is_required: boolean; options?: Array<{ id?: number; label: string; behavior: string }> };
type Mapping = { id: number; project: number; project_name: string; checklist: number; checklist_name: string; execution_node: number | null; execution_node_name: string | null; status: string; structure_scope: string; structure_level: number | null; applied_flat_template: number | null; applied_flat_template_name?: string | null; checklist_items?: Question[] };
type Instance = { id: number; reference: string; status: string; checklist: number; checklist_name: string; location_node: number | null; location_name: string | null; location_path: string | null; execution_node: number | null; execution_node_name: string | null; item_count: number; release_policy_snapshot: Record<string, unknown> };

export function ChecklistProjectExplorer() {
  const workspace = useWorkspace();
  const [projectId, setProjectId] = useState<number | null>(workspace.project?.id ?? workspace.projects[0]?.id ?? null);
  const [stageId, setStageId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const schemeQuery = useQuery({
    queryKey: ["checklist-project-explorer", "scheme", projectId], enabled: Boolean(projectId),
    queryFn: async () => (await api.get<Page<Scheme>>(`/execution-schemes/?project=${projectId}&is_current=true&page_size=10`)).data,
  });
  const schemeId = schemeQuery.data?.results?.[0]?.id ?? null;
  const stagesQuery = useQuery({
    queryKey: ["checklist-project-explorer", "stages", projectId, schemeId], enabled: Boolean(projectId && schemeId),
    queryFn: async () => (await api.get<Page<ExecNode>>(`/execution-nodes/?project=${projectId}&scheme=${schemeId}&page_size=500`)).data,
  });
  const mappingsQuery = useQuery({
    queryKey: ["checklist-project-explorer", "mappings", projectId, stageId], enabled: Boolean(projectId),
    queryFn: async () => (await api.get<Page<Mapping>>(`/checklist-mappings/?project=${projectId}${stageId ? `&execution_node=${stageId}` : ""}&page_size=500`)).data,
  });
  const instancesQuery = useQuery({
    queryKey: ["checklist-project-explorer", "instances", projectId, stageId], enabled: Boolean(projectId),
    queryFn: async () => (await api.get<Page<Instance>>(`/checklist-instances/?project=${projectId}${stageId ? `&execution_node=${stageId}` : ""}&page_size=500`)).data,
  });

  const instanceByChecklist = useMemo(() => {
    const map = new Map<number, Instance[]>();
    for (const row of instancesQuery.data?.results ?? []) map.set(row.checklist, [...(map.get(row.checklist) ?? []), row]);
    return map;
  }, [instancesQuery.data]);

  return <section className="rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border p-5">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Eye className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold text-foreground">Project checklist explorer</h2><p className="mt-1 text-xs text-muted-foreground">Read-only preview of submitted mappings, generated instances and checklist questions by project and execution stage.</p></div></div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <select className={INPUT} value={projectId ?? ""} onChange={(e) => { setProjectId(e.target.value ? Number(e.target.value) : null); setStageId(null); }}><option value="">Select project</option>{workspace.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={INPUT} value={stageId ?? ""} onChange={(e) => setStageId(e.target.value ? Number(e.target.value) : null)} disabled={!schemeId}><option value="">All execution stages</option>{(stagesQuery.data?.results ?? []).map((n) => <option key={n.id} value={n.id}>{n.full_path || n.name}</option>)}</select>
      </div>
    </div>
    {!projectId ? <Empty text="Select a project to inspect its checklist runtime." /> : mappingsQuery.isLoading || instancesQuery.isLoading ? <Empty text="Loading checklist runtime…" /> : (mappingsQuery.data?.results ?? []).length === 0 ? <Empty text="No checklist mappings are available for this project/stage." /> : <div className="divide-y divide-border">
      {(mappingsQuery.data?.results ?? []).map((m) => {
        const open = expanded.has(m.id); const instances = instanceByChecklist.get(m.checklist) ?? [];
        return <div key={m.id}>
          <button type="button" onClick={() => setExpanded((current) => { const next = new Set(current); next.has(m.id) ? next.delete(m.id) : next.add(m.id); return next; })} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/20">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-foreground">{m.checklist_name}</p><Badge>{m.status}</Badge></div><p className="mt-1 text-[10px] text-muted-foreground">{m.execution_node_name || "All execution stages"} · {m.structure_scope.replaceAll("_", " ")} · {instances.length} generated instance{instances.length === 1 ? "" : "s"}</p></div>
          </button>
          {open ? <div className="border-t border-border bg-muted/10 p-4">
            <div className="grid gap-3 xl:grid-cols-2"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Questions</p><div className="space-y-2">{(m.checklist_items ?? []).map((q) => <div key={q.id} className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold">{q.sequence}. {q.question}</p><div className="mt-2 flex flex-wrap gap-1.5">{(q.options ?? []).map((o, i) => <span key={`${q.id}-${i}`} className="rounded-lg border border-border px-2 py-1 text-[10px]">{o.label} · {o.behavior.replaceAll("_", " ")}</span>)}</div></div>)}{!(m.checklist_items ?? []).length ? <Empty text="No questions found." compact /> : null}</div></div>
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Generated instances</p><div className="space-y-2">{instances.map((i) => <div key={i.id} className="rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between gap-2"><p className="font-mono text-[10px] font-semibold text-foreground">{i.reference}</p><Badge>{i.status}</Badge></div><p className="mt-1 text-[10px] text-muted-foreground">{i.location_path || i.location_name || "Project scope"}</p>{Object.keys(i.release_policy_snapshot ?? {}).length ? <p className="mt-2 rounded-lg bg-muted/40 px-2 py-1 text-[9px] text-muted-foreground">Release: {String(i.release_policy_snapshot.release_level ?? "default")}</p> : null}</div>)}{instances.length === 0 ? <Empty text="Mapping exists, but no runtime instance has been generated yet." compact /> : null}</div></div></div>
          </div> : null}
        </div>;
      })}
    </div>}
  </section>;
}
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-primary">{children}</span>; }
function Empty({ text, compact = false }: { text: string; compact?: boolean }) { return <div className={`${compact ? "p-3" : "p-8"} text-center text-xs text-muted-foreground`}><Layers3 className="mx-auto mb-2 h-5 w-5 opacity-60" />{text}</div>; }
