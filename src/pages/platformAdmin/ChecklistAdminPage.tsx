import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckSquare2, ChevronDown, ChevronRight, ClipboardList, Link2, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { organizationsApi } from "@/features/organizations";
import { organizationModulesApi, productModulesApi } from "@/features/platformModules";
import { useWorkspace } from "@/features/workspace";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { ToastNotice } from "@/components/ui/ToastNotice";
import { ChecklistMappingPanel } from "@/pages/platformAdmin/ChecklistMappingPanel";

type Page<T> = { count: number; results: T[] };
type Template = { id: number; name: string; code: string; version: number; description: string; structure_type: string; checklist_count: number; is_active: boolean };
type Checklist = { id: number; scope_type: string; template: number; template_name: string; taxonomy_category: number; taxonomy: number; taxonomy_name: string; category: number; category_name: string; name: string; code: string; version: number; description: string; sequence: number; structure_type: string; items: Item[]; module_links?: Array<{ organization_module: number; is_active: boolean }>; is_active: boolean };
type ItemOption = { id?: number; label: string; value?: string; sequence: number; behavior: OptionBehavior; requires_remarks: boolean; requires_photo: boolean; is_active?: boolean };
type Item = { id: number; checklist: number; checklist_name: string; question: string; code: string; sequence: number; question_type: string; is_required: boolean; options?: ItemOption[]; is_active: boolean };
type OptionBehavior = "positive" | "negative" | "neutral" | "not_applicable";
type OptionDraft = {
  label: string;
  behavior: OptionBehavior;
  requires_remarks: boolean;
  requires_photo: boolean;
};
type QuestionDraft = { question: string; options: OptionDraft[]; is_required: boolean };
const makeOptionDraft = (label = "", behavior: OptionBehavior = "positive"): OptionDraft => ({
  label,
  behavior,
  requires_remarks: false,
  requires_photo: false,
});
const makeQuestionDraft = (): QuestionDraft => ({
  question: "",
  options: [
    makeOptionDraft("Pass", "positive"),
    makeOptionDraft("Fail", "negative"),
    makeOptionDraft("Neutral", "neutral"),
  ],
  is_required: true,
});
const resizeQuestionDrafts = (rows: QuestionDraft[], count: number) => {
  const nextCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  if (nextCount === rows.length) return rows;
  if (nextCount < rows.length) return rows.slice(0, nextCount);
  return [...rows, ...Array.from({ length: nextCount - rows.length }, () => makeQuestionDraft())];
};
type TaxonomyCategory = { id: number; taxonomy: number; taxonomy_name: string; category: number; category_name: string; full_path: string; is_active: boolean };
type TaxonomySelectorRow = { id: number; name: string; code: string; scope_type: "platform" | "organization"; owner_organization: number | null; categories: TaxonomyCategory[] };
const questionDraftsFromChecklist = (checklist: Checklist): QuestionDraft[] =>
  (checklist.items ?? []).map((item) => ({
    question: item.question ?? "",
    is_required: item.is_required !== false,
    options: (item.options ?? []).map((option) => ({
      label: option.label ?? "",
      behavior: option.behavior ?? "positive",
      requires_remarks: Boolean(option.requires_remarks),
      requires_photo: Boolean(option.requires_photo),
    })),
  }));

const checklistItemsPayload = (rows: QuestionDraft[]) => rows.map((row) => ({
  question: row.question.trim(),
  question_type: "single_choice",
  structure_type: "general",
  is_required: row.is_required,
  allow_observation: true,
  validation_rules: {},
  evidence_rules: {},
  options: row.options.filter((option) => option.label.trim()).map((option, index) => ({
    label: option.label.trim(),
    sequence: index + 1,
    behavior: option.behavior || "positive",
    requires_remarks: option.requires_remarks,
    requires_photo: option.requires_photo,
    is_active: true,
  })),
  is_active: true,
}));

type TemplateModule = { id: number; template: number; template_name: string; module: number; module_name: string; module_code: string; is_primary: boolean; is_active: boolean };
type ChecklistModule = { id: number; checklist: number; checklist_name: string; module: number; module_code: string; is_active: boolean };
type Tab = "templates" | "checklists" | "items" | "mappings" | "organizations";
type TemplateAccess = { id: number; organization: number; organization_module: number; module: number; module_code: string; template: number; is_active: boolean };
type ScopedTemplateModule = { id: number; organization_module: number; organization: number; module: number; module_code: string; module_name: string; is_primary: boolean; is_active: boolean };
type ScopedTemplate = Template & { scope_type: string; owner_organization: number | null; module_links: ScopedTemplateModule[] };
type TemplateLibrary = {
  organization: { id: number; name: string; code: string };
  organization_modules: Array<{ id: number; module_id: number; module_code: string; module_name: string; status: string }>;
  platform_assigned: Template[];
  organization_owned: ScopedTemplate[];
  access_grants: TemplateAccess[];
  available_checklists: Checklist[];
};
const qk = ["platform-checklist-admin"] as const;
const field = "h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary";
const structureTypes = ["general", "private_area", "common_area", "amenity_area", "service_area", "external_area"];

async function list<T>(path: string) { return (await api.get<Page<T>>(`${path}?page_size=500`)).data; }

export function ChecklistAdminPage() {
  const { user } = useAuth();
  if (user?.user_type === "non_platform") return <OrganizationChecklistTemplatePage />;
  return <PlatformChecklistAdminPage />;
}

function PlatformChecklistAdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("checklists");
  const [checklistMode, setChecklistMode] = useState<"list" | "create" | "edit">("list");
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [expandedChecklistIds, setExpandedChecklistIds] = useState<Set<number>>(new Set());
  const [taxonomyFilter, setTaxonomyFilter] = useState<string>("all");
  const [platformTemplateFilter, setPlatformTemplateFilter] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(id); }, [toast]);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateStructure, setTemplateStructure] = useState("general");
  const [checklistTemplate, setChecklistTemplate] = useState<number | null>(null);
  const [checklistTaxonomy, setChecklistTaxonomy] = useState<number | null>(null);
  const [checklistTaxonomyCategory, setChecklistTaxonomyCategory] = useState<number | null>(null);
  const [checklistName, setChecklistName] = useState("");
  const [checklistStructure, setChecklistStructure] = useState("general");
  const [checklistQuestions, setChecklistQuestions] = useState<QuestionDraft[]>([makeQuestionDraft()]);
  const [itemChecklist, setItemChecklist] = useState<number | null>(null);
  const [itemQuestion, setItemQuestion] = useState("");
  const [itemOptions, setItemOptions] = useState("Yes, No");
  const [itemOptionCount, setItemOptionCount] = useState(2);
  const [templateModuleTemplate, setTemplateModuleTemplate] = useState<number | null>(null);
  const [templateModuleModule, setTemplateModuleModule] = useState<number | null>(null);
  const [checklistModuleChecklist, setChecklistModuleChecklist] = useState<number | null>(null);
  const [checklistModuleModule, setChecklistModuleModule] = useState<number | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(null);
  const [assignTemplate, setAssignTemplate] = useState<number | null>(null);
  const [assignOrganizationModuleIds, setAssignOrganizationModuleIds] = useState<number[]>([]);

  const templates = useQuery({ queryKey: [...qk, "templates"], queryFn: () => list<Template>("/checklist-templates/") });
  const checklists = useQuery({ queryKey: [...qk, "checklists"], queryFn: () => list<Checklist>("/checklists/") });
  const items = useQuery({ queryKey: [...qk, "items"], queryFn: () => list<Item>("/checklist-items/") });
  const platformTaxonomySelector = useQuery({ queryKey: [...qk, "platform-taxonomy-selector"], queryFn: async () => (await api.get<{ results: TaxonomySelectorRow[] }>("/platform-taxonomy-selector/")).data });
  const templateModules = useQuery({ queryKey: [...qk, "template-modules"], queryFn: () => list<TemplateModule>("/checklist-template-modules/") });
  const checklistModules = useQuery({ queryKey: [...qk, "checklist-modules"], queryFn: () => list<ChecklistModule>("/checklist-modules/") });
  const modules = useQuery({ queryKey: [...qk, "modules"], queryFn: () => productModulesApi.list({ page_size: 500, ordering: "menu_order,name" }) });
  const organizations = useQuery({ queryKey: [...qk, "organizations"], queryFn: () => organizationsApi.list({ page_size: 500, ordering: "name" }) });
  const organizationModules = useQuery({
    queryKey: [...qk, "organization-modules", selectedOrganization],
    enabled: Boolean(selectedOrganization),
    queryFn: () => organizationModulesApi.list({ organization: selectedOrganization!, page_size: 500, ordering: "module__menu_order,module__name" }),
  });
  const templateLibrary = useQuery({
    queryKey: [...qk, "template-library", selectedOrganization],
    enabled: Boolean(selectedOrganization),
    queryFn: async () => (await api.get<TemplateLibrary>(`/checklist-template-library/?organization=${selectedOrganization}`)).data,
  });

  const write = useMutation({
    mutationFn: async ({ method, path, payload }: { method: "post" | "patch" | "delete"; path: string; payload?: Record<string, unknown> }) => method === "post" ? (await api.post(path, payload ?? {})).data : method === "patch" ? (await api.patch(path, payload ?? {})).data : (await api.delete(path)).data,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: qk }); setToast("Checklist changes saved successfully."); },
  });
  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); } catch (err) { setError(err); } };

  const createTemplate = () => run(async () => {
    if (!templateName.trim()) return;
    await write.mutateAsync({ method: "post", path: "/checklist-templates/", payload: { name: templateName.trim(), description: templateDescription.trim(), structure_type: templateStructure, version: 1, metadata: {}, is_active: true } });
    setTemplateName(""); setTemplateDescription("");
  });
  const createChecklist = () => run(async () => {
    if (!checklistTemplate || !checklistTaxonomyCategory || !checklistName.trim()) return;
    const validQuestions = checklistQuestions.filter((row) => row.question.trim());
    if (validQuestions.length !== checklistQuestions.length) return;
    const checklistItems = checklistItemsPayload(validQuestions);
    if (checklistItems.some((row) => row.options.length < 1)) return;
    await write.mutateAsync({ method: "post", path: "/checklists/", payload: { template: checklistTemplate, taxonomy_category: checklistTaxonomyCategory, name: checklistName.trim(), description: "", version: 1, structure_type: checklistStructure, metadata: {}, is_active: true, items: checklistItems } });
    setChecklistName(""); setChecklistQuestions([makeQuestionDraft()]); setChecklistMode("list"); setEditingChecklistId(null);
  });
  const createItem = () => run(async () => {
    if (!itemChecklist || !itemQuestion.trim()) return;
    const enteredOptions = itemOptions.split(",").map((value) => value.trim()).filter(Boolean);
    const options = Array.from({ length: Math.max(1, itemOptionCount) }, (_, index) => ({ label: enteredOptions[index] || `Option ${index + 1}`, sequence: index + 1, behavior: "positive", requires_remarks: false, requires_photo: false, is_active: true }));
    await write.mutateAsync({ method: "post", path: "/checklist-items/", payload: { checklist: itemChecklist, question: itemQuestion.trim(), question_type: "single_choice", structure_type: "general", is_required: true, allow_observation: true, validation_rules: {}, evidence_rules: {}, options, is_active: true } });
    setItemQuestion("");
  });
  const openPlatformChecklistEditor = (row?: Checklist) => {
    if (!row) {
      setEditingChecklistId(null); setChecklistTemplate(null); setChecklistTaxonomy(null); setChecklistTaxonomyCategory(null); setChecklistName(""); setChecklistStructure("general"); setChecklistQuestions([makeQuestionDraft()]); setChecklistMode("create"); return;
    }
    setEditingChecklistId(row.id); setChecklistTemplate(row.template); setChecklistTaxonomy(row.taxonomy); setChecklistTaxonomyCategory(row.taxonomy_category); setChecklistName(row.name); setChecklistStructure(row.structure_type || "general"); setChecklistQuestions(questionDraftsFromChecklist(row).length ? questionDraftsFromChecklist(row) : [makeQuestionDraft()]); setChecklistMode("edit");
  };
  const savePlatformChecklist = () => run(async () => {
    if (!editingChecklistId || !checklistTaxonomyCategory || !checklistName.trim()) return;
    const validQuestions = checklistQuestions.filter((row) => row.question.trim());
    if (validQuestions.length !== checklistQuestions.length) return;
    const items = checklistItemsPayload(validQuestions);
    if (items.some((row) => row.options.length < 1)) return;
    await write.mutateAsync({ method: "patch", path: `/checklists/${editingChecklistId}/`, payload: { taxonomy_category: checklistTaxonomyCategory, name: checklistName.trim(), structure_type: checklistStructure, items } });
    setChecklistMode("list"); setEditingChecklistId(null);
  });
  const toggleChecklistExpanded = (id: number) => setExpandedChecklistIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const mapTemplateModule = () => run(async () => {
    if (!templateModuleTemplate || !templateModuleModule) return;
    await write.mutateAsync({ method: "post", path: "/checklist-template-modules/", payload: { template: templateModuleTemplate, module: templateModuleModule, is_primary: false, is_active: true } });
    setTemplateModuleModule(null);
  });
  const mapChecklistModule = () => run(async () => {
    if (!checklistModuleChecklist || !checklistModuleModule) return;
    await write.mutateAsync({ method: "post", path: "/checklist-modules/", payload: { checklist: checklistModuleChecklist, module: checklistModuleModule, is_active: true } });
    setChecklistModuleModule(null);
  });
  const assignTemplateToOrganization = () => run(async () => {
    if (!selectedOrganization || !assignTemplate || assignOrganizationModuleIds.length === 0) return;
    await Promise.all(assignOrganizationModuleIds.map((organizationModuleId) => write.mutateAsync({
      method: "post",
      path: `/checklist-template-accesses/?organization=${selectedOrganization}`,
      payload: { template: assignTemplate, organization_module: organizationModuleId, organization_unit: null, include_descendant_units: true, is_active: true },
    })));
    setAssignOrganizationModuleIds([]);
  });

  const compatibleModuleIds = useMemo(() => new Set((templateModules.data?.results ?? []).filter((r) => r.template === assignTemplate && r.is_active).map((r) => r.module)), [templateModules.data, assignTemplate]);
  const assignableOrganizationModules = useMemo(() => (organizationModules.data?.results ?? []).filter((r) => r.is_available && compatibleModuleIds.has(r.module)), [organizationModules.data, compatibleModuleIds]);

  const platformTaxonomies = platformTaxonomySelector.data?.results ?? [];
  const platformCategoryRows = (platformTaxonomies.find((row) => row.id === checklistTaxonomy)?.categories ?? []).filter((row) => row.is_active);

  return <div className="space-y-5 pb-8">
    <ToastNotice message={toast} onClose={() => setToast(null)} />
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Platform administration</p><h1 className="mt-1 font-logo text-2xl font-normal text-foreground">Checklist Studio</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Create platform checklist templates, checklist definitions, questions/options and ProductModule mappings without leaving the Superadmin UI.</p></section>
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="self-start rounded-2xl border border-border bg-card p-3 shadow-sm lg:sticky lg:top-4"><p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Checklist settings</p><div className="grid gap-1"><TabButton active={tab === "templates"} onClick={() => setTab("templates")} icon={ClipboardList}>Templates</TabButton><TabButton active={tab === "checklists"} onClick={() => setTab("checklists")} icon={CheckSquare2}>Checklists</TabButton><TabButton active={tab === "mappings"} onClick={() => setTab("mappings")} icon={Link2}>Module mappings</TabButton><TabButton active={tab === "organizations"} onClick={() => setTab("organizations")} icon={Building2}>Organization assignment</TabButton></div></aside><main className="min-w-0 space-y-5">
    {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(error, "Checklist operation failed.")}</p> : null}

    {tab === "templates" ? <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_0.8fr_auto]"><input className={field} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" /><input className={field} value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Description" /><StructureSelect value={templateStructure} setValue={setTemplateStructure} /><CreateButton disabled={!templateName.trim() || write.isPending} onClick={createTemplate}>Create template</CreateButton></div><div className="mt-5 grid gap-3 lg:grid-cols-2">{(templates.data?.results ?? []).map((row) => <ResourceCard key={row.id} title={`${row.name} v${row.version}`} code={row.code} meta={`${row.structure_type} · ${row.checklist_count} checklists`} active={row.is_active} onToggle={() => run(() => write.mutateAsync({ method: "patch", path: `/checklist-templates/${row.id}/`, payload: { is_active: !row.is_active } }))} />)}</div></section> : null}

    {tab === "checklists" ? <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {checklistMode === "list" ? <>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-foreground">Checklists</h2><p className="mt-1 text-xs text-muted-foreground">Filter by template or taxonomy. Open a row to inspect its questions and options.</p></div><button type="button" onClick={() => openPlatformChecklistEditor()} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New checklist</button></div>
        <div className="mt-4 min-w-[220px] max-w-sm"><p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Template</p><select className={`${field} w-full`} value={platformTemplateFilter ?? ""} onChange={(e) => setPlatformTemplateFilter(e.target.value ? Number(e.target.value) : null)}><option value="">All templates</option>{(templates.data?.results ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        <TaxonomyFilter rows={(checklists.data?.results ?? []).filter((row) => !platformTemplateFilter || row.template === platformTemplateFilter)} value={taxonomyFilter} onChange={setTaxonomyFilter} />
        <ChecklistList rows={(checklists.data?.results ?? []).filter((row) => (!platformTemplateFilter || row.template === platformTemplateFilter) && (taxonomyFilter === "all" || row.taxonomy_name === taxonomyFilter))} expanded={expandedChecklistIds} onToggleExpand={toggleChecklistExpanded} onEdit={openPlatformChecklistEditor} onToggleActive={(row) => run(() => write.mutateAsync({ method: "patch", path: `/checklists/${row.id}/`, payload: { is_active: !row.is_active } }))} canEdit />
      </> : <>
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{checklistMode === "edit" ? "Update checklist" : "New checklist"}</p><h2 className="mt-1 text-base font-semibold text-foreground">{checklistMode === "edit" ? checklistName || "Checklist" : "Create checklist"}</h2></div><button type="button" onClick={() => { setChecklistMode("list"); setEditingChecklistId(null); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-5"><Select value={checklistTemplate} setValue={setChecklistTemplate} placeholder="Select template" rows={(templates.data?.results ?? []).filter((r) => r.is_active).map((r) => ({ id: r.id, label: r.name }))} disabled={checklistMode === "edit"} /><Select value={checklistTaxonomy} setValue={(value) => { setChecklistTaxonomy(value); setChecklistTaxonomyCategory(null); }} placeholder="Select platform taxonomy" rows={platformTaxonomies.map((r) => ({ id: r.id, label: r.name }))} /><Select value={checklistTaxonomyCategory} setValue={setChecklistTaxonomyCategory} placeholder={checklistTaxonomy ? "Select category" : "Select taxonomy first"} rows={platformCategoryRows.map((r) => ({ id: r.id, label: r.full_path || r.category_name }))} disabled={!checklistTaxonomy} /><input className={field} value={checklistName} onChange={(e) => setChecklistName(e.target.value)} placeholder="Checklist name" /><StructureSelect value={checklistStructure} setValue={setChecklistStructure} /></div>
        <QuestionCountControl rows={checklistQuestions} setRows={setChecklistQuestions} />
        <QuestionBuilder rows={checklistQuestions} setRows={setChecklistQuestions} />
        <CreateButton disabled={!checklistTemplate || !checklistTaxonomyCategory || !checklistName.trim() || checklistQuestions.length === 0 || checklistQuestions.some((row) => !row.question.trim() || row.options.filter((option) => option.label.trim()).length === 0) || write.isPending} onClick={checklistMode === "edit" ? savePlatformChecklist : createChecklist}>{checklistMode === "edit" ? "Save checklist" : "Create checklist"}</CreateButton>
      </>}
    </section> : null}

    {tab === "items" ? <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_0.8fr_1.2fr]"><Select value={itemChecklist} setValue={setItemChecklist} placeholder="Select checklist" rows={(checklists.data?.results ?? []).filter((r) => r.is_active).map((r) => ({ id: r.id, label: r.name }))} /><input className={field} value={itemQuestion} onChange={(e) => setItemQuestion(e.target.value)} placeholder="Question" /><input className={field} type="number" min={1} max={20} value={itemOptionCount} onChange={(e) => setItemOptionCount(Math.max(1, Number(e.target.value) || 1))} placeholder="Options" /><input className={field} value={itemOptions} onChange={(e) => setItemOptions(e.target.value)} placeholder="Options: Yes, No, N/A" /></div><CreateButton disabled={!itemChecklist || !itemQuestion.trim() || write.isPending} onClick={createItem}>Add checklist item</CreateButton><div className="mt-5 space-y-2">{(items.data?.results ?? []).map((row) => <div key={row.id} className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold text-foreground">{row.sequence}. {row.question}</p><p className="mt-1 text-[10px] text-muted-foreground">{row.checklist_name} · {row.question_type} · {row.is_required ? "Required" : "Optional"}</p></div>)}</div></section> : null}

    {tab === "mappings" ? <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-sm font-semibold text-foreground">Template → ProductModule</h2><div className="mt-4 grid gap-2"><Select value={templateModuleTemplate} setValue={setTemplateModuleTemplate} placeholder="Select template" rows={(templates.data?.results ?? []).map((r) => ({ id: r.id, label: r.name }))} /><Select value={templateModuleModule} setValue={setTemplateModuleModule} placeholder="Select module" rows={(modules.data?.results ?? []).map((r) => ({ id: r.id, label: `${r.name} (${r.code})` }))} /><CreateButton disabled={!templateModuleTemplate || !templateModuleModule || write.isPending} onClick={mapTemplateModule}>Map template module</CreateButton></div><div className="mt-5 space-y-2">{(templateModules.data?.results ?? []).map((row) => <Mapping key={row.id} left={row.template_name} right={`${row.module_name} (${row.module_code})`} />)}</div></section><section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-sm font-semibold text-foreground">Checklist → ProductModule</h2><div className="mt-4 grid gap-2"><Select value={checklistModuleChecklist} setValue={setChecklistModuleChecklist} placeholder="Select checklist" rows={(checklists.data?.results ?? []).map((r) => ({ id: r.id, label: r.name }))} /><Select value={checklistModuleModule} setValue={setChecklistModuleModule} placeholder="Select module" rows={(modules.data?.results ?? []).map((r) => ({ id: r.id, label: `${r.name} (${r.code})` }))} /><CreateButton disabled={!checklistModuleChecklist || !checklistModuleModule || write.isPending} onClick={mapChecklistModule}>Map checklist module</CreateButton></div><div className="mt-5 space-y-2">{(checklistModules.data?.results ?? []).map((row) => <Mapping key={row.id} left={row.checklist_name} right={row.module_code} />)}</div></section></div> : null}

    {tab === "organizations" ? <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-sm font-semibold text-foreground">Global template → OrganizationModule</h2><p className="mt-1 text-xs text-muted-foreground">A platform template loads for a tenant only after an explicit ChecklistTemplateAccess grant. The same template can be granted to many organizations and many compatible modules.</p><div className="mt-4 grid gap-2 lg:grid-cols-2"><Select value={selectedOrganization} setValue={(value) => { setSelectedOrganization(value); setAssignOrganizationModuleIds([]); }} placeholder="Select organization" rows={(organizations.data?.results ?? []).filter((o) => o.is_active).map((o) => ({ id: o.id, label: `${o.name} (${o.code})` }))} /><Select value={assignTemplate} setValue={(value) => { setAssignTemplate(value); setAssignOrganizationModuleIds([]); }} placeholder="Select platform template" rows={(templates.data?.results ?? []).filter((t) => t.is_active).map((t) => ({ id: t.id, label: t.name }))} /></div><div className="mt-4 flex flex-wrap gap-2">{assignableOrganizationModules.map((row) => { const checked = assignOrganizationModuleIds.includes(row.id); return <label key={row.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs", checked ? "border-primary bg-primary/5" : "border-border")}><input type="checkbox" checked={checked} onChange={() => setAssignOrganizationModuleIds(checked ? assignOrganizationModuleIds.filter((id) => id !== row.id) : [...assignOrganizationModuleIds, row.id])} />{row.module_name} ({row.module_code})</label>; })}</div><CreateButton disabled={!selectedOrganization || !assignTemplate || assignOrganizationModuleIds.length === 0 || write.isPending} onClick={assignTemplateToOrganization}>Grant template to selected modules</CreateButton>{selectedOrganization ? <div className="mt-6 grid gap-5 xl:grid-cols-2"><div><h3 className="text-xs font-semibold">Platform templates assigned here</h3><div className="mt-3 space-y-2">{(templateLibrary.data?.platform_assigned ?? []).map((t) => <div key={t.id} className="rounded-xl border border-border p-3 text-xs"><b>{t.name}</b><div className="mt-2 flex flex-wrap gap-1">{(templateLibrary.data?.access_grants ?? []).filter((a) => a.template === t.id).map((a) => <button key={a.id} type="button" className="rounded-full border border-primary/20 px-2 py-1 text-[10px] text-primary" onClick={() => run(() => write.mutateAsync({ method: "delete", path: `/checklist-template-accesses/${a.id}/?organization=${selectedOrganization}` }))}>{a.module_code} ×</button>)}</div></div>)}</div></div><div><h3 className="text-xs font-semibold">Created by this organization</h3><div className="mt-3 space-y-2">{(templateLibrary.data?.organization_owned ?? []).map((t) => <div key={t.id} className="rounded-xl border border-border p-3 text-xs"><b>{t.name}</b><p className="mt-1 font-mono text-[10px] text-muted-foreground">{t.code}</p><div className="mt-2 flex flex-wrap gap-1">{(t.module_links ?? []).filter((m) => m.is_active).map((m) => <span key={m.id} className="rounded-full bg-muted px-2 py-1 text-[10px]">{m.module_name}</span>)}</div></div>)}</div></div></div> : null}</section> : null}
    </main></div>
  </div>;
}

function OrganizationChecklistTemplatePage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const queryClient = useQueryClient();
  const organization = workspace.organization;
  const orgId = organization?.id ?? null;
  const owner = Boolean(user?.is_superuser || organization?.membership.is_owner);
  const permissions = new Set([...(user?.permission_codes ?? []), ...(workspace.topRole?.permission_codes ?? [])]);
  const can = (code: string) => owner || permissions.has(code);
  const canViewTemplates = can("checklist.template.view") || can("checklist.template.manage");
  const canManageTemplates = can("checklist.template.create") || can("checklist.template.update") || can("checklist.template.manage");
  const canViewDefinitions = can("checklist.definition.view") || can("checklist.definition.manage");
  const canManageDefinitions = can("checklist.definition.manage");
  const canViewMappings = can("checklist.mapping.view") || can("checklist.mapping.manage") || can("checklist.mapping.submit");
  const canManageMappings = can("checklist.mapping.manage");
  const canSubmitMappings = can("checklist.mapping.submit");
  const [tab, setTab] = useState<"templates" | "checklists" | "mappings">("templates");
  const [templateMode, setTemplateMode] = useState<"list" | "create" | "detail">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: number; scope: "platform" | "organization" } | null>(null);
  const [checklistMode, setChecklistMode] = useState<"list" | "create" | "edit">("list");
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [expandedChecklistIds, setExpandedChecklistIds] = useState<Set<number>>(new Set());
  const [taxonomyFilter, setTaxonomyFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [structure, setStructure] = useState("general");
  const [moduleIds, setModuleIds] = useState<number[]>([]);
  const [checklistTemplate, setChecklistTemplate] = useState<number | null>(null);
  const [checklistModule, setChecklistModule] = useState<number | null>(null);
  const [checklistTaxonomy, setChecklistTaxonomy] = useState<number | null>(null);
  const [taxonomyCategory, setTaxonomyCategory] = useState<number | null>(null);
  const [checklistName, setChecklistName] = useState("");
  const [checklistQuestions, setChecklistQuestions] = useState<QuestionDraft[]>([makeQuestionDraft()]);
  const [checklistPage, setChecklistPage] = useState(1);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(null), 3200); return () => window.clearTimeout(id); }, [toast]);

  const library = useQuery({ queryKey: ["org-checklist-template-library", orgId], enabled: Boolean(orgId && canViewTemplates), queryFn: async () => (await api.get<TemplateLibrary>(`/checklist-template-library/?organization=${orgId}`)).data });
  const scopedChecklists = useQuery({ queryKey: ["org-checklists", orgId, checklistPage], enabled: Boolean(orgId && canViewDefinitions), queryFn: async () => (await api.get<Page<Checklist>>(`/tenant-checklists/?organization=${orgId}&page=${checklistPage}&page_size=20`)).data });
  const organizationTaxonomySelector = useQuery({
    queryKey: ["org-checklist-taxonomy-selector", orgId, checklistModule],
    enabled: Boolean(orgId && checklistModule && canViewDefinitions),
    queryFn: async () => (await api.get<{ results: TaxonomySelectorRow[] }>(`/organization-taxonomy-selector/?organization=${orgId}&organization_module=${checklistModule}`)).data,
  });
  const write = useMutation({ mutationFn: async ({ method, path, payload }: { method: "post" | "patch" | "delete"; path: string; payload?: Record<string, unknown> }) => method === "post" ? (await api.post(path, payload ?? {})).data : method === "patch" ? (await api.patch(path, payload ?? {})).data : (await api.delete(path)).data, onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["org-checklist-template-library", orgId] }), queryClient.invalidateQueries({ queryKey: ["org-checklists", orgId] })]); setToast("Checklist changes saved successfully."); } });
  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); } catch (err) { setError(err); } };
  if (!organization) return <div className="p-6"><div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Select an organization from the workspace navbar first.</div></div>;
  if (!canViewTemplates && !canViewDefinitions && !canViewMappings) return <div className="p-6"><div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Your active role does not have checklist access.</div></div>;

  const createTemplate = () => run(async () => {
    if (!canManageTemplates || !can("checklist.template.assign_module") || !name.trim() || moduleIds.length === 0) return;
    await write.mutateAsync({ method: "post", path: `/scoped-checklist-templates/?organization=${orgId}`, payload: { name: name.trim(), description: description.trim(), structure_type: structure, version: 1, metadata: {}, organization_module_ids: moduleIds, is_active: true } });
    setName(""); setDescription(""); setModuleIds([]); setTemplateMode("list");
  });

  const orgTemplates = library.data?.organization_owned ?? [];
  const platformTemplates = library.data?.platform_assigned ?? [];
  const allTemplateRows = [
    ...orgTemplates.map((row) => ({ ...row, _scope: "organization" as const })),
    ...platformTemplates.map((row) => ({ ...row, _scope: "platform" as const })),
  ];
  const allChecklists = scopedChecklists.data?.results ?? [];
  const organizationTaxonomies = organizationTaxonomySelector.data?.results ?? [];
  const organizationCategoryRows = (organizationTaxonomies.find((row) => row.id === checklistTaxonomy)?.categories ?? []).filter((row) => row.is_active);
  const selectedTemplateForChecklist = allTemplateRows.find((row) => row.id === checklistTemplate);
  const compatibleModules = selectedTemplateForChecklist
    ? selectedTemplateForChecklist._scope === "organization"
      ? ((selectedTemplateForChecklist as ScopedTemplate).module_links ?? []).filter((row) => row.is_active).map((row) => row.organization_module)
      : (library.data?.access_grants ?? []).filter((row) => row.template === selectedTemplateForChecklist.id && row.is_active).map((row) => row.organization_module)
    : [];
  const selectedTemplateRow = selectedTemplate ? allTemplateRows.find((row) => row.id === selectedTemplate.id && row._scope === selectedTemplate.scope) : null;
  const selectedTemplateChecklists = selectedTemplateRow ? allChecklists.filter((row) => row.template === selectedTemplateRow.id) : [];
  const selectedTemplateModules = selectedTemplateRow?._scope === "organization"
    ? ((selectedTemplateRow as ScopedTemplate).module_links ?? []).filter((row) => row.is_active).map((row) => ({ id: row.organization_module, name: row.module_name, code: row.module_code }))
    : (library.data?.access_grants ?? []).filter((row) => row.template === selectedTemplateRow?.id && row.is_active).map((row) => {
        const moduleRow = (library.data?.organization_modules ?? []).find((m) => m.id === row.organization_module);
        return { id: row.organization_module, name: moduleRow?.module_name || row.module_code, code: row.module_code };
      });

  const resetChecklistEditor = () => { setEditingChecklistId(null); setChecklistTemplate(null); setChecklistModule(null); setChecklistTaxonomy(null); setTaxonomyCategory(null); setChecklistName(""); setChecklistQuestions([makeQuestionDraft()]); };
  const openChecklistEditor = (row?: Checklist) => {
    if (!row) { resetChecklistEditor(); setChecklistMode("create"); return; }
    if (row.scope_type === "platform") return;
    setEditingChecklistId(row.id); setChecklistTemplate(row.template); setChecklistModule(row.module_links?.find((link) => link.is_active)?.organization_module ?? null); setChecklistTaxonomy(row.taxonomy); setTaxonomyCategory(row.taxonomy_category); setChecklistName(row.name);
    const drafts = questionDraftsFromChecklist(row); setChecklistQuestions(drafts.length ? drafts : [makeQuestionDraft()]); setChecklistMode("edit");
  };
  const saveChecklist = () => run(async () => {
    if (!canManageDefinitions || !checklistTemplate || !checklistModule || !taxonomyCategory || !checklistName.trim()) return;
    const validQuestions = checklistQuestions.filter((row) => row.question.trim()); if (validQuestions.length !== checklistQuestions.length) return;
    const items = checklistItemsPayload(validQuestions); if (items.some((row) => row.options.length < 1)) return;
    const payload = { organization: orgId, organization_unit: null, project: null, organization_module: checklistModule, template: checklistTemplate, taxonomy_category: taxonomyCategory, name: checklistName.trim(), version: 1, description: "", structure_type: "general", metadata: {}, is_active: true, items };
    if (editingChecklistId) await write.mutateAsync({ method: "patch", path: `/scoped-checklists/${editingChecklistId}/?organization=${orgId}`, payload });
    else await write.mutateAsync({ method: "post", path: `/scoped-checklists/?organization=${orgId}`, payload });
    resetChecklistEditor(); setChecklistMode("list"); setTab("checklists");
  });
  const toggleExpanded = (id: number) => setExpandedChecklistIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const visibleChecklists = allChecklists.filter((row) => (taxonomyFilter === "all" || row.taxonomy_name === taxonomyFilter) && (!templateFilter || row.template === templateFilter));

  return <div className="min-h-full bg-muted/10">
    <ToastNotice message={toast} onClose={() => setToast(null)} />
    <div className="border-b border-border bg-background/95 px-4 py-3 sm:px-6"><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{organization.name}</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-semibold text-primary">Checklist setup</span></div></div>
    <div className="mx-auto grid w-full max-w-[1680px] gap-0 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-background p-3 xl:min-h-[calc(100vh-112px)] xl:border-b-0 xl:border-r xl:p-4">
        <div className="mb-4 px-2"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Checklist Setup</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{organization.name}</p></div>
        <nav className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
          {canViewTemplates ? <ChecklistSetupNavButton active={tab === "templates"} icon={CheckSquare2} label="Templates" meta={`${allTemplateRows.length} available`} onClick={() => { setTab("templates"); setTemplateMode("list"); setSelectedTemplate(null); }} /> : null}
          {canViewDefinitions ? <ChecklistSetupNavButton active={tab === "checklists"} icon={ListChecks} label="Checklists" meta={`${scopedChecklists.data?.count ?? 0} configured`} onClick={() => { setTab("checklists"); setChecklistMode("list"); }} /> : null}
          {canViewMappings ? <ChecklistSetupNavButton active={tab === "mappings"} icon={Link2} label="Mappings" meta="Physical + execution scope" onClick={() => setTab("mappings")} /> : null}
        </nav>
        <div className="mt-5 hidden rounded-xl border border-border bg-muted/20 p-3 xl:block"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Configured</p><div className="mt-2 grid grid-cols-2 gap-2 text-center"><MiniSetupCount label="Own templates" value={orgTemplates.length} /><MiniSetupCount label="Platform" value={platformTemplates.length} /><MiniSetupCount label="Checklists" value={scopedChecklists.data?.count ?? 0} /><MiniSetupCount label="Questions" value={allChecklists.reduce((sum, row) => sum + (row.items?.length ?? 0), 0)} /></div></div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 xl:p-7">
        {error ? <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(error, "Checklist operation failed.")}</p> : null}

        {tab === "templates" && canViewTemplates ? <div className="space-y-5">
          <SectionTitle eyebrow="Templates" title="Checklist templates" action={canManageTemplates && can("checklist.template.assign_module") && templateMode === "list" ? <button type="button" onClick={() => { setTemplateMode("create"); setSelectedTemplate(null); }} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New template</button> : null} />
          {templateMode === "list" ? <section className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_110px_44px] border-b border-border bg-muted/20 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><span>Template</span><span>Scope</span><span>Checklists</span><span /></div>
            {allTemplateRows.length === 0 ? <div className="p-8 text-center text-xs text-muted-foreground">No checklist templates are available.</div> : allTemplateRows.map((row, index) => <button key={`${row._scope}-${row.id}`} type="button" onClick={() => { setSelectedTemplate({ id: row.id, scope: row._scope }); setTemplateMode("detail"); }} className={cn("grid w-full grid-cols-[minmax(0,1fr)_120px_110px_44px] items-center px-4 py-3 text-left transition hover:bg-muted/20", index > 0 && "border-t border-border")}><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{row.name}</span><span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">{row.code} · {row.structure_type.replaceAll("_", " ")}</span></span><span><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase", row._scope === "platform" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>{row._scope}</span></span><span className="text-xs font-semibold text-foreground">{allChecklists.filter((c) => c.template === row.id).length}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>)}</section> : null}
          {templateMode === "create" ? <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-primary">New template</p><h2 className="mt-1 text-base font-semibold">Create organization template</h2></div><button type="button" onClick={() => setTemplateMode("list")} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 lg:grid-cols-3"><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" /><input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /><StructureSelect value={structure} setValue={setStructure} /></div><div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Organization module access</p><div className="flex flex-wrap gap-2">{(library.data?.organization_modules ?? []).map((m) => { const checked = moduleIds.includes(m.id); return <label key={m.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs", checked ? "border-primary bg-primary/5" : "border-border")}><input type="checkbox" checked={checked} onChange={() => setModuleIds(checked ? moduleIds.filter((id) => id !== m.id) : [...moduleIds, m.id])} />{m.module_name}</label>; })}</div></div><CreateButton disabled={!name.trim() || moduleIds.length === 0 || write.isPending} onClick={createTemplate}>Create template</CreateButton></section> : null}
          {templateMode === "detail" && selectedTemplateRow ? <section className="rounded-2xl border border-border bg-card p-5"><button type="button" onClick={() => { setTemplateMode("list"); setSelectedTemplate(null); }} className="mb-4 text-[10px] font-semibold text-muted-foreground hover:text-foreground">← Templates</button><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-foreground">{selectedTemplateRow.name}</h2><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase", selectedTemplateRow._scope === "platform" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>{selectedTemplateRow._scope}</span></div><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selectedTemplateRow.code} · v{selectedTemplateRow.version}</p><p className="mt-3 max-w-3xl text-xs leading-5 text-muted-foreground">{selectedTemplateRow.description || "No description provided."}</p></div>{selectedTemplateRow._scope === "organization" && canManageTemplates ? <button type="button" onClick={() => run(() => write.mutateAsync({ method: "patch", path: `/scoped-checklist-templates/${selectedTemplateRow.id}/?organization=${orgId}`, payload: { is_active: !selectedTemplateRow.is_active } }))} className={cn("rounded-xl border px-3 py-2 text-xs font-semibold", selectedTemplateRow.is_active ? "border-primary/20 text-primary" : "border-border text-muted-foreground")}>{selectedTemplateRow.is_active ? "Active" : "Inactive"}</button> : null}</div><div className="mt-5 grid gap-4 lg:grid-cols-3"><DetailChip label="Structure" value={selectedTemplateRow.structure_type.replaceAll("_", " ")} /><DetailChip label="Module access" value={String(selectedTemplateModules.length)} /><DetailChip label="Linked checklists" value={String(selectedTemplateChecklists.length)} /></div><div className="mt-5"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Organization module access</p><div className="mt-2 flex flex-wrap gap-2">{selectedTemplateModules.length ? selectedTemplateModules.map((m) => <span key={m.id} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">{m.name}<span className="ml-2 font-mono text-[9px] text-muted-foreground">{m.code}</span></span>) : <span className="text-xs text-muted-foreground">No module access is assigned.</span>}</div></div><div className="mt-6 border-t border-border pt-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-foreground">Checklists using this template</p></div></div><ChecklistList rows={selectedTemplateChecklists} expanded={expandedChecklistIds} onToggleExpand={toggleExpanded} onEdit={openChecklistEditor} onToggleActive={(row) => run(() => write.mutateAsync({ method: "patch", path: `/scoped-checklists/${row.id}/?organization=${orgId}`, payload: { organization: orgId, organization_module: row.module_links?.find((m) => m.is_active)?.organization_module, is_active: !row.is_active } }))} canEdit={canManageDefinitions} /></div></section> : null}
        </div> : null}

        {tab === "checklists" && canViewDefinitions ? <div className="space-y-5"><SectionTitle eyebrow="Checklists" title="Checklist definitions" action={canManageDefinitions && checklistMode === "list" ? <button type="button" onClick={() => openChecklistEditor()} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New checklist</button> : null} />
          {checklistMode === "list" ? <section className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-end gap-3"><div className="min-w-[220px]"><p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Template</p><select className={`${field} w-full`} value={templateFilter ?? ""} onChange={(e) => setTemplateFilter(e.target.value ? Number(e.target.value) : null)}><option value="">All templates</option>{allTemplateRows.map((t) => <option key={`${t._scope}-${t.id}`} value={t.id}>{t.name}</option>)}</select></div></div><TaxonomyFilter rows={allChecklists.filter((row) => !templateFilter || row.template === templateFilter)} value={taxonomyFilter} onChange={setTaxonomyFilter} /><ChecklistList rows={visibleChecklists} expanded={expandedChecklistIds} onToggleExpand={toggleExpanded} onEdit={openChecklistEditor} onToggleActive={(row) => run(() => write.mutateAsync({ method: "patch", path: `/scoped-checklists/${row.id}/?organization=${orgId}`, payload: { organization: orgId, organization_module: row.module_links?.find((m) => m.is_active)?.organization_module, is_active: !row.is_active } }))} canEdit={canManageDefinitions} /><div className="mt-4 flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{scopedChecklists.data?.count ?? 0} checklists</span><div className="flex items-center gap-2"><button type="button" disabled={checklistPage <= 1} onClick={() => setChecklistPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-border px-3 py-1.5 text-[10px] disabled:opacity-40">Previous</button><span className="text-[10px] text-muted-foreground">Page {checklistPage}</span><button type="button" disabled={!scopedChecklists.data || checklistPage * 20 >= scopedChecklists.data.count} onClick={() => setChecklistPage((current) => current + 1)} className="rounded-lg border border-border px-3 py-1.5 text-[10px] disabled:opacity-40">Next</button></div></div></section> : <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{checklistMode === "edit" ? "Update checklist" : "New checklist"}</p><h2 className="mt-1 text-base font-semibold text-foreground">{checklistMode === "edit" ? checklistName || "Checklist" : "Create checklist"}</h2></div><button type="button" onClick={() => { resetChecklistEditor(); setChecklistMode("list"); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 lg:grid-cols-4"><Select value={checklistTemplate} setValue={(value) => { setChecklistTemplate(value); setChecklistModule(null); setChecklistTaxonomy(null); setTaxonomyCategory(null); }} placeholder="Checklist template" rows={allTemplateRows.filter((r) => r.is_active).map((r) => ({ id: r.id, label: `${r.name}${r._scope === "platform" ? " · Platform" : ""}` }))} disabled={checklistMode === "edit"} /><Select value={checklistModule} setValue={(value) => { setChecklistModule(value); setChecklistTaxonomy(null); setTaxonomyCategory(null); }} placeholder="Compatible organization module" rows={(library.data?.organization_modules ?? []).filter((m) => compatibleModules.includes(m.id)).map((m) => ({ id: m.id, label: m.module_name }))} /><Select value={checklistTaxonomy} setValue={(value) => { setChecklistTaxonomy(value); setTaxonomyCategory(null); }} placeholder={checklistModule ? "Taxonomy" : "Select organization module first"} rows={organizationTaxonomies.map((r) => ({ id: r.id, label: `${r.name}${r.scope_type === "platform" ? " · Platform" : ""}` }))} disabled={!checklistModule} /><Select value={taxonomyCategory} setValue={setTaxonomyCategory} placeholder={checklistTaxonomy ? "Category" : "Select taxonomy first"} rows={organizationCategoryRows.map((r) => ({ id: r.id, label: r.full_path || r.category_name }))} disabled={!checklistTaxonomy} /></div><div className="mt-3"><input className={`${field} w-full`} value={checklistName} onChange={(e) => setChecklistName(e.target.value)} placeholder="Checklist name" /></div><QuestionCountControl rows={checklistQuestions} setRows={setChecklistQuestions} /><QuestionBuilder rows={checklistQuestions} setRows={setChecklistQuestions} /><CreateButton disabled={!checklistTemplate || !checklistModule || !taxonomyCategory || !checklistName.trim() || checklistQuestions.length === 0 || checklistQuestions.some((row) => !row.question.trim() || row.options.filter((option) => option.label.trim()).length === 0) || write.isPending} onClick={saveChecklist}>{checklistMode === "edit" ? "Save checklist" : "Create checklist"}</CreateButton></section>}
        </div> : null}
        {tab === "mappings" && canViewMappings ? <ChecklistMappingPanel organizationId={orgId!} canView={canViewMappings} canManage={canManageMappings} canSubmit={canSubmitMappings} /> : null}
      </main>
    </div>
  </div>;
}

function ChecklistSetupNavButton({ active, icon: Icon, label, meta, onClick }: { active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; meta: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-left transition", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/10 bg-background/60"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold">{label}</span><span className="block text-[10px] opacity-70">{meta}</span></span><ChevronRight className="hidden h-3.5 w-3.5 xl:block" /></button>;
}
function MiniSetupCount({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-background p-2"><p className="text-sm font-bold text-foreground">{value}</p><p className="text-[9px] text-muted-foreground">{label}</p></div>; }
function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1></div>{action}</div>; }

function QuestionBuilder({ rows, setRows }: { rows: QuestionDraft[]; setRows: React.Dispatch<React.SetStateAction<QuestionDraft[]>> }) {
  const updateQuestion = (index: number, value: string) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, question: value } : row));
  const updateOption = (questionIndex: number, optionIndex: number, patch: Partial<OptionDraft>) => setRows((current) => current.map((row, rowIndex) => rowIndex === questionIndex ? { ...row, options: row.options.map((option, currentOptionIndex) => currentOptionIndex === optionIndex ? { ...option, ...patch } : option) } : row));
  const addOption = (questionIndex: number) => setRows((current) => current.map((row, rowIndex) => rowIndex === questionIndex ? { ...row, options: [...row.options, makeOptionDraft(`Option ${row.options.length + 1}`)] } : row));
  const removeOption = (questionIndex: number, optionIndex: number) => setRows((current) => current.map((row, rowIndex) => rowIndex === questionIndex ? { ...row, options: row.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) } : row));
  const removeQuestion = (questionIndex: number) => setRows((current) => current.filter((_, index) => index !== questionIndex));
  return <div className="mt-4 space-y-3">{rows.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-6 text-center"><p className="text-xs font-semibold text-foreground">No questions added</p><button type="button" onClick={() => setRows([makeQuestionDraft()])} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-[10px] font-semibold text-primary"><Plus className="h-3 w-3" />Add first question</button></div> : rows.map((row, questionIndex) => <div key={questionIndex} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">{questionIndex + 1}</span><p className="text-xs font-semibold text-foreground">Question {questionIndex + 1}</p></div><button type="button" onClick={() => removeQuestion(questionIndex)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive" title="Remove question"><Trash2 className="h-3.5 w-3.5" /></button></div><input className={`${field} mt-3 w-full`} value={row.question} onChange={(e) => updateQuestion(questionIndex, e.target.value)} placeholder={`Enter question ${questionIndex + 1}`} /><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Options ({row.options.length})</p></div><button type="button" onClick={() => addOption(questionIndex)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-primary"><Plus className="h-3 w-3" />Add option</button></div><div className="mt-2 space-y-2">{row.options.map((option, optionIndex) => <div key={optionIndex} className="rounded-xl border border-border bg-card p-3"><div className="grid gap-2 lg:grid-cols-[28px_minmax(180px,1fr)_180px_auto]"><span className="flex h-10 items-center justify-center text-[10px] font-semibold text-muted-foreground">{optionIndex + 1}</span><input className={field} value={option.label} onChange={(e) => updateOption(questionIndex, optionIndex, { label: e.target.value })} placeholder={`Option ${optionIndex + 1}`} /><select className={field} value={option.behavior} onChange={(e) => updateOption(questionIndex, optionIndex, { behavior: e.target.value as OptionBehavior })}><option value="positive">Positive / pass</option><option value="negative">Negative / fail</option><option value="neutral">Neutral / no fail impact</option><option value="not_applicable">Not applicable</option></select><button type="button" onClick={() => removeOption(questionIndex, optionIndex)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive" title="Remove option"><Trash2 className="h-3.5 w-3.5" /></button></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 pl-7">{[["requires_remarks", "Require remarks"], ["requires_photo", "Require photo"]].map(([key, label]) => <label key={key} className="inline-flex items-center gap-2 text-[10px] font-medium text-muted-foreground"><input type="checkbox" checked={Boolean(option[key as keyof OptionDraft])} onChange={(e) => updateOption(questionIndex, optionIndex, { [key]: e.target.checked } as Partial<OptionDraft>)} />{label}</label>)}</div></div>)}</div><label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={row.is_required} onChange={(e) => setRows((current) => current.map((item, index) => index === questionIndex ? { ...item, is_required: e.target.checked } : item))} />Required question</label></div>)}</div>;
}


function QuestionCountControl({ rows, setRows }: { rows: QuestionDraft[]; setRows: React.Dispatch<React.SetStateAction<QuestionDraft[]>> }) {
  return <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/10 p-3"><label className="text-xs font-semibold text-foreground">Questions</label><input className={`${field} w-28`} type="number" min={0} value={rows.length} onChange={(e) => setRows((current) => resizeQuestionDrafts(current, Number(e.target.value)))} /><button type="button" onClick={() => setRows((current) => [...current, makeQuestionDraft()])} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[10px] font-semibold text-primary"><Plus className="h-3.5 w-3.5" />Add question</button></div>;
}

function TaxonomyFilter({ rows, value, onChange }: { rows: Checklist[]; value: string; onChange: (value: string) => void }) {
  const names = Array.from(new Set(rows.map((row) => row.taxonomy_name).filter(Boolean))).sort();
  if (names.length === 0) return null;
  return <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onChange("all")} className={cn("rounded-full border px-3 py-1.5 text-[10px] font-semibold", value === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>All taxonomies <span className="ml-1 opacity-70">{rows.length}</span></button>{names.map((name) => { const count = rows.filter((row) => row.taxonomy_name === name).length; return <button key={name} type="button" onClick={() => onChange(name)} className={cn("rounded-full border px-3 py-1.5 text-[10px] font-semibold", value === name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{name} <span className="ml-1 opacity-70">{count}</span></button>; })}</div>;
}

function ChecklistList({ rows, expanded, onToggleExpand, onEdit, onToggleActive, canEdit }: { rows: Checklist[]; expanded: Set<number>; onToggleExpand: (id: number) => void; onEdit: (row: Checklist) => void; onToggleActive: (row: Checklist) => void; canEdit: boolean }) {
  if (rows.length === 0) return <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-center"><ListChecks className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 text-sm font-semibold text-foreground">No checklists found</p><p className="mt-1 text-xs text-muted-foreground">Create a checklist or choose another taxonomy.</p></div>;
  return <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">{rows.map((row, index) => { const open = expanded.has(row.id); return <div key={row.id} className={cn(index > 0 && "border-t border-border")}><div className="flex items-center gap-3 px-4 py-3"><button type="button" onClick={() => onToggleExpand(row.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" title={open ? "Hide questions" : "Show questions"}>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button><button type="button" onClick={() => onToggleExpand(row.id)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-foreground">{row.name}</p><span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{row.taxonomy_name}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{row.category_name}</span></div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground"><span>{row.template_name || "Custom template"}</span><span>v{row.version}</span><span>{row.structure_type.replaceAll("_", " ")}</span><span>{row.items?.length ?? 0} questions</span><span className="font-mono">{row.code}</span></div></button>{row.scope_type === "platform" ? <span className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[10px] font-semibold text-primary">Platform</span> : <button type="button" onClick={() => onToggleActive(row)} className={cn("rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold", row.is_active ? "border-primary/20 text-primary" : "border-border text-muted-foreground")}>{row.is_active ? "Active" : "Inactive"}</button>}{canEdit && row.scope_type !== "platform" ? <button type="button" onClick={() => onEdit(row)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit checklist"><Pencil className="h-3.5 w-3.5" /></button> : null}</div>{open ? <div className="border-t border-border bg-muted/10 px-4 py-4"><div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><DetailChip label="Template" value={row.template_name || "Custom"} /><DetailChip label="Taxonomy" value={row.taxonomy_name} /><DetailChip label="Category" value={row.category_name} /><DetailChip label="Questions" value={String(row.items?.length ?? 0)} /></div><div className="space-y-2">{(row.items ?? []).length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">No questions are configured in this checklist.</p> : (row.items ?? []).map((item) => <div key={item.id} className="rounded-xl border border-border bg-card p-3"><div className="flex items-start gap-3"><span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">{item.sequence}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-foreground">{item.question}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.is_required ? "Required" : "Optional"} · Single choice</p><div className="mt-2 flex flex-wrap gap-1.5">{(item.options ?? []).map((option) => <span key={`${item.id}-${option.sequence}-${option.label}`} className="rounded-lg border border-border bg-background px-2 py-1 text-[10px]"><span className="font-medium text-foreground">{option.label}</span><span className="ml-1 text-muted-foreground">· {option.behavior.replaceAll("_", " ")}</span>{option.requires_remarks ? <span className="ml-1 text-primary">remarks</span> : null}{option.requires_photo ? <span className="ml-1 text-primary">photo</span> : null}</span>)}</div></div></div></div>)}</div></div> : null}</div>; })}</div>;
}

function DetailChip({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-background px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-medium text-foreground">{value || "—"}</p></div>; }

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold", active ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}><Icon className="h-4 w-4" />{children}</button>; }
function CreateButton({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" disabled={disabled} onClick={onClick} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4" />{children}</button>; }
function Select({ value, setValue, rows, placeholder, disabled = false }: { value: number | null; setValue: (value: number | null) => void; rows: Array<{ id: number; label: string }>; placeholder: string; disabled?: boolean }) { return <select className={field} value={value ?? ""} disabled={disabled} onChange={(e) => setValue(e.target.value ? Number(e.target.value) : null)}><option value="">{placeholder}</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select>; }
function StructureSelect({ value, setValue }: { value: string; setValue: (value: string) => void }) { return <select className={field} value={value} onChange={(e) => setValue(e.target.value)}>{structureTypes.map((row) => <option key={row} value={row}>{row.replaceAll("_", " ")}</option>)}</select>; }
function ResourceCard({ title, code, meta, active, onToggle }: { title: string; code: string; meta: string; active: boolean; onToggle: () => void }) { return <div className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{code}</p><p className="mt-2 text-[11px] text-muted-foreground">{meta}</p></div><button type="button" onClick={onToggle} className={cn("rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold", active ? "border-primary/20 text-primary" : "border-border text-muted-foreground")}>{active ? "Active" : "Inactive"}</button></div></div>; }
function Mapping({ left, right }: { left: string; right: string }) { return <div className="rounded-xl border border-border bg-background p-3 text-xs"><span className="font-semibold text-foreground">{left}</span><span className="mx-2 text-muted-foreground">→</span><span className="text-primary">{right}</span></div>; }
