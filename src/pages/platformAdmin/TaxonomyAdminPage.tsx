import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Building2, ChevronDown, ChevronRight, Link2, Plus, Tags, Trash2, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { organizationsApi } from "@/features/organizations";
import { organizationModulesApi, productModulesApi } from "@/features/platformModules";
import { useWorkspace } from "@/features/workspace";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { ToastNotice } from "@/components/ui/ToastNotice";

type Page<T> = { count: number; results: T[] };
type Taxonomy = {
  id: number; scope_type: "platform" | "organization"; owner_organization: number | null;
  owner_organization_name?: string | null; name: string; code: string; description: string;
  module_count?: number; category_count?: number; organization_assignment_count?: number;
  organization_module_links?: TaxonomyOrgModule[]; is_active: boolean;
};
type Category = {
  id: number; organization: number | null; organization_name: string | null; name: string;
  code: string; description: string; color: string; icon: string; scope_type: string; is_active: boolean;
};
type TaxonomyCategory = {
  id: number; taxonomy: number; taxonomy_name: string; category: number; category_name: string;
  parent: number | null; parent_category_name: string | null; sort_order: number;
  availability_mode: string; full_path: string; is_active: boolean;
};
type TaxonomyModule = {
  id: number; taxonomy: number; taxonomy_name: string; module: number; module_name: string;
  module_code: string; is_required: boolean; sort_order: number; is_active: boolean;
};
type TaxonomyOrgModule = {
  id: number; taxonomy: number; taxonomy_name: string; taxonomy_code: string;
  taxonomy_scope_type: string; organization_module: number; organization: number;
  organization_name: string; module: number; module_code: string; module_name: string;
  is_active: boolean;
};
type Library = {
  organization: { id: number; name: string; code: string };
  organization_modules: Array<{ id: number; module_id: number; module_code: string; module_name: string; status: string }>;
  platform_assigned: Taxonomy[];
  organization_owned: Taxonomy[];
  assignments: TaxonomyOrgModule[];
  categories: Category[];
};

type PlatformTab = "taxonomies" | "categories" | "mappings" | "organizations";
type OrgTab = "library" | "taxonomies" | "categories" | "hierarchy" | "assignments";
const platformKey = ["platform-taxonomy-admin"] as const;
const field = "h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary";
const list = async <T,>(path: string) => (await api.get<Page<T>>(path.includes("?") ? `${path}&page_size=500` : `${path}?page_size=500`)).data;

export function TaxonomyAdminPage() {
  const { user } = useAuth();
  if (user?.user_type === "non_platform") return <OrganizationTaxonomyPage />;
  return <PlatformTaxonomyPage />;
}

function PlatformTaxonomyPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<PlatformTab>("taxonomies");
  const [error, setError] = useState<unknown>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [taxonomyName, setTaxonomyName] = useState("");
  const [taxonomyDescription, setTaxonomyDescription] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [mapTaxonomy, setMapTaxonomy] = useState<number | null>(null);
  const [mapCategory, setMapCategory] = useState<number | null>(null);
  const [mapParent, setMapParent] = useState<number | null>(null);
  const [mapModuleTaxonomy, setMapModuleTaxonomy] = useState<number | null>(null);
  const [mapModule, setMapModule] = useState<number | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<number | null>(null);
  const [assignTaxonomy, setAssignTaxonomy] = useState<number | null>(null);
  const [assignOrganizationModuleIds, setAssignOrganizationModuleIds] = useState<number[]>([]);
  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<number | null>(null);

  const taxonomies = useQuery({ queryKey: [...platformKey, "taxonomies"], queryFn: () => list<Taxonomy>("/taxonomies/") });
  const categories = useQuery({ queryKey: [...platformKey, "categories"], queryFn: () => list<Category>("/categories/") });
  const taxonomyCategories = useQuery({ queryKey: [...platformKey, "taxonomy-categories"], queryFn: () => list<TaxonomyCategory>("/taxonomy-categories/") });
  const taxonomyModules = useQuery({ queryKey: [...platformKey, "taxonomy-modules"], queryFn: () => list<TaxonomyModule>("/taxonomy-modules/") });
  const modules = useQuery({ queryKey: [...platformKey, "modules"], queryFn: () => productModulesApi.list({ page_size: 500, ordering: "menu_order,name" }) });
  const organizations = useQuery({ queryKey: [...platformKey, "organizations"], queryFn: () => organizationsApi.list({ page_size: 500, ordering: "name" }) });
  const orgModules = useQuery({
    queryKey: [...platformKey, "organization-modules", selectedOrganization],
    enabled: Boolean(selectedOrganization),
    queryFn: () => organizationModulesApi.list({ organization: selectedOrganization!, page_size: 500, ordering: "module__menu_order,module__name" }),
  });
  const library = useQuery({
    queryKey: [...platformKey, "library", selectedOrganization],
    enabled: Boolean(selectedOrganization),
    queryFn: async () => (await api.get<Library>(`/taxonomy-library/?organization=${selectedOrganization}`)).data,
  });

  const write = useMutation({
    mutationFn: async ({ method, path, payload }: { method: "post" | "patch" | "delete"; path: string; payload?: Record<string, unknown> }) => {
      if (method === "post") return (await api.post(path, payload ?? {})).data;
      if (method === "patch") return (await api.patch(path, payload ?? {})).data;
      return (await api.delete(path)).data;
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: platformKey }); },
  });
  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); } catch (err) { setError(err); } };

  const platformTaxonomies = useMemo(() => (taxonomies.data?.results ?? []).filter((r) => r.scope_type === "platform"), [taxonomies.data]);
  const globalCategories = useMemo(() => (categories.data?.results ?? []).filter((r) => r.organization === null), [categories.data]);
  const compatibleModuleIds = useMemo(() => new Set((taxonomyModules.data?.results ?? []).filter((r) => r.taxonomy === assignTaxonomy && r.is_active).map((r) => r.module)), [taxonomyModules.data, assignTaxonomy]);
  const assignableOrgModules = useMemo(() => (orgModules.data?.results ?? []).filter((r) => r.is_available && compatibleModuleIds.has(r.module)), [orgModules.data, compatibleModuleIds]);

  const createTaxonomy = () => run(async () => {
    if (!taxonomyName.trim()) return;
    await write.mutateAsync({ method: "post", path: "/taxonomies/", payload: { name: taxonomyName.trim(), description: taxonomyDescription.trim(), is_active: true } });
    setTaxonomyName(""); setTaxonomyDescription("");
  });
  const createCategory = () => run(async () => {
    if (!categoryName.trim()) return;
    await write.mutateAsync({ method: "post", path: "/categories/", payload: { organization: null, name: categoryName.trim(), description: categoryDescription.trim(), color: "", icon: "", is_active: true } });
    setCategoryName(""); setCategoryDescription("");
  });
  const createTaxonomyCategory = () => run(async () => {
    if (!mapTaxonomy || !mapCategory) return;
    await write.mutateAsync({ method: "post", path: "/taxonomy-categories/", payload: { taxonomy: mapTaxonomy, category: mapCategory, parent: mapParent, availability_mode: "this_and_all_children", is_active: true } });
    setMapCategory(null); setMapParent(null);
  });
  const createTaxonomyModule = () => run(async () => {
    if (!mapModuleTaxonomy || !mapModule) return;
    await write.mutateAsync({ method: "post", path: "/taxonomy-modules/", payload: { taxonomy: mapModuleTaxonomy, module: mapModule, is_required: false, is_active: true } });
    setMapModule(null);
  });
  const assignToOrganization = () => run(async () => {
    if (!selectedOrganization || !assignTaxonomy || assignOrganizationModuleIds.length === 0) return;
    await Promise.all(assignOrganizationModuleIds.map((organizationModuleId) => write.mutateAsync({
      method: "post",
      path: `/taxonomy-organization-modules/?organization=${selectedOrganization}`,
      payload: { taxonomy: assignTaxonomy, organization_module: organizationModuleId, is_required: false, is_active: true },
    })));
    setAssignOrganizationModuleIds([]);
  });

  return <div className="space-y-5 pb-8">
    <Hero eyebrow="Platform administration" title="Taxonomy Studio" text="Create platform-global taxonomies/categories, define ProductModule compatibility, then explicitly grant a taxonomy to one or many OrganizationModules. Organization-owned taxonomies are visible from the organization assignment tab but remain tenant-owned." />
    <ToastNotice message={toast} onClose={() => setToast(null)} />
    <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="self-start rounded-2xl border border-border bg-card p-3 shadow-sm lg:sticky lg:top-4"><p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Taxonomy settings</p><div className="grid gap-1"><TabButton active={tab === "taxonomies"} onClick={() => setTab("taxonomies")} icon={Tags}>Taxonomies</TabButton><TabButton active={tab === "categories"} onClick={() => setTab("categories")} icon={Boxes}>Categories</TabButton><TabButton active={tab === "mappings"} onClick={() => setTab("mappings")} icon={Link2}>Platform mappings</TabButton><TabButton active={tab === "organizations"} onClick={() => setTab("organizations")} icon={Building2}>Organization assignment</TabButton></div></aside>
      <main className="min-w-0 space-y-5">
    <ErrorBox error={error} fallback="Taxonomy operation failed." />

    {tab === "taxonomies" && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]"><input className={field} value={taxonomyName} onChange={(e) => setTaxonomyName(e.target.value)} placeholder="Taxonomy name" /><input className={field} value={taxonomyDescription} onChange={(e) => setTaxonomyDescription(e.target.value)} placeholder="Description" /><CreateButton disabled={!taxonomyName.trim() || write.isPending} onClick={createTaxonomy}>Create global taxonomy</CreateButton></div>
      <p className="mt-2 text-[10px] text-muted-foreground">Code is generated by the backend from the name.</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">{platformTaxonomies.map((row) => <ResourceCard key={row.id} title={row.name} code={row.code} meta={`${row.module_count ?? 0} ProductModules · ${row.category_count ?? 0} categories · ${row.organization_assignment_count ?? 0} org-module grants`} active={row.is_active} onClick={() => setSelectedTaxonomyId(row.id)} onToggle={() => run(() => write.mutateAsync({ method: "patch", path: `/taxonomies/${row.id}/`, payload: { is_active: !row.is_active } }))} />)}</div>
      {selectedTaxonomyId && (() => { const selected = platformTaxonomies.find((t) => t.id === selectedTaxonomyId); const mappedCategories = (taxonomyCategories.data?.results ?? []).filter((r) => r.taxonomy === selectedTaxonomyId); const mappedModules = (taxonomyModules.data?.results ?? []).filter((r) => r.taxonomy === selectedTaxonomyId && r.is_active); if (!selected) return null; return <div className="mt-5 rounded-2xl border border-border bg-background p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{selected.name}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selected.code}</p></div><button type="button" onClick={() => setSelectedTaxonomyId(null)} className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-semibold">Close</button></div><div className="mt-5 grid gap-5 lg:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Categories</p><div className="mt-2 space-y-2">{mappedCategories.length ? mappedCategories.map((r) => <div key={r.id} className="rounded-xl border border-border p-3 text-xs"><span className="font-medium">{r.full_path || r.category_name}</span></div>) : <p className="text-xs text-muted-foreground">No categories mapped yet.</p>}</div></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Mapped ProductModules</p><div className="mt-2 space-y-2">{mappedModules.length ? mappedModules.map((r) => <div key={r.id} className="rounded-xl border border-border p-3 text-xs"><span className="font-medium">{r.module_name}</span><span className="ml-2 font-mono text-[10px] text-muted-foreground">{r.module_code}</span></div>) : <p className="text-xs text-muted-foreground">No ProductModule compatibility mapped yet.</p>}</div></div></div></div>; })()}
    </section>}

    {tab === "categories" && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto]"><input className={field} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Global category name" /><input className={field} value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} placeholder="Description" /><CreateButton disabled={!categoryName.trim() || write.isPending} onClick={createCategory}>Create global category</CreateButton></div>
      <p className="mt-2 text-[10px] text-muted-foreground">Category code is generated automatically. Organization-created categories are shown in the selected organization library, not edited here.</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">{globalCategories.map((row) => <ResourceCard key={row.id} title={row.name} code={row.code} meta="Platform / global" active={row.is_active} onToggle={() => run(() => write.mutateAsync({ method: "patch", path: `/categories/${row.id}/`, payload: { is_active: !row.is_active } }))} />)}</div>
    </section>}

    {tab === "mappings" && <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-sm font-semibold">Taxonomy → Category hierarchy</h2><div className="mt-4 grid gap-2"><Select value={mapTaxonomy} setValue={setMapTaxonomy} placeholder="Select global taxonomy" rows={platformTaxonomies.map((r) => ({ id: r.id, label: r.name }))} /><Select value={mapCategory} setValue={setMapCategory} placeholder="Select global category" rows={globalCategories.map((r) => ({ id: r.id, label: r.name }))} /><Select value={mapParent} setValue={setMapParent} placeholder="ROOT / no parent" rows={(taxonomyCategories.data?.results ?? []).filter((r) => !mapTaxonomy || r.taxonomy === mapTaxonomy).map((r) => ({ id: r.id, label: r.full_path || r.category_name }))} allowEmpty /><CreateButton disabled={!mapTaxonomy || !mapCategory || write.isPending} onClick={createTaxonomyCategory}>Add category mapping</CreateButton></div><div className="mt-5 space-y-2">{(taxonomyCategories.data?.results ?? []).filter((r) => platformTaxonomies.some((t) => t.id === r.taxonomy)).map((r) => <Mapping key={r.id} left={r.taxonomy_name} right={r.full_path || r.category_name} />)}</div></section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="text-sm font-semibold">Taxonomy → ProductModule compatibility</h2><p className="mt-1 text-xs text-muted-foreground">This declares capability only. It does not make the taxonomy visible to an organization.</p><div className="mt-4 grid gap-2"><Select value={mapModuleTaxonomy} setValue={setMapModuleTaxonomy} placeholder="Select global taxonomy" rows={platformTaxonomies.map((r) => ({ id: r.id, label: r.name }))} /><Select value={mapModule} setValue={setMapModule} placeholder="Select ProductModule" rows={(modules.data?.results ?? []).map((r) => ({ id: r.id, label: `${r.name} (${r.code})` }))} /><CreateButton disabled={!mapModuleTaxonomy || !mapModule || write.isPending} onClick={createTaxonomyModule}>Add compatibility</CreateButton></div><div className="mt-5 space-y-2">{(taxonomyModules.data?.results ?? []).map((r) => <Mapping key={r.id} left={r.taxonomy_name} right={`${r.module_name} (${r.module_code})`} />)}</div></section>
    </div>}

    {tab === "organizations" && <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Global taxonomy → OrganizationModule</h2><p className="mt-1 text-xs text-muted-foreground">Choose the organization and taxonomy, then select the compatible modules where that taxonomy should be available. Only these three choices are needed for assignment.</p>
      <div className="mt-4 grid gap-2 lg:grid-cols-2"><Select value={selectedOrganization} setValue={(v) => { setSelectedOrganization(v); setAssignOrganizationModuleIds([]); }} placeholder="Select organization" rows={(organizations.data?.results ?? []).filter((o) => o.is_active).map((o) => ({ id: o.id, label: `${o.name} (${o.code})` }))} /><Select value={assignTaxonomy} setValue={(v) => { setAssignTaxonomy(v); setAssignOrganizationModuleIds([]); }} placeholder="Select global taxonomy" rows={platformTaxonomies.filter((t) => t.is_active).map((t) => ({ id: t.id, label: t.name }))} /></div>
      <div className="mt-4 flex flex-wrap gap-2">{assignableOrgModules.map((row) => { const checked = assignOrganizationModuleIds.includes(row.id); return <label key={row.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs", checked ? "border-primary bg-primary/5" : "border-border")}><input type="checkbox" checked={checked} onChange={() => setAssignOrganizationModuleIds(checked ? assignOrganizationModuleIds.filter((id) => id !== row.id) : [...assignOrganizationModuleIds, row.id])} />{row.module_name} ({row.module_code})</label>; })}</div>
      {selectedOrganization && assignTaxonomy && assignableOrgModules.length === 0 && <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">No assignable module is available. The organization must have an enabled/read-only OrganizationModule whose ProductModule is already compatible with this taxonomy.</div>}
      <CreateButton disabled={!selectedOrganization || !assignTaxonomy || assignOrganizationModuleIds.length === 0 || write.isPending} onClick={assignToOrganization}>Assign taxonomy to selected modules</CreateButton>
      {selectedOrganization && <div className="mt-6 grid gap-5 xl:grid-cols-2"><div><h3 className="text-xs font-semibold">Platform taxonomies assigned here</h3><div className="mt-3 space-y-2">{(library.data?.platform_assigned ?? []).map((t) => <div key={t.id} className="rounded-xl border border-border p-3 text-xs"><b>{t.name}</b><div className="mt-2 flex flex-wrap gap-1">{(library.data?.assignments ?? []).filter((a) => a.taxonomy === t.id).map((a) => <AssignmentChip key={a.id} label={a.module_name} onRemove={() => run(() => write.mutateAsync({ method: "delete", path: `/taxonomy-organization-modules/${a.id}/?organization=${selectedOrganization}` }))} />)}</div></div>)}</div></div><div><h3 className="text-xs font-semibold">Created by this organization</h3><div className="mt-3 space-y-2">{(library.data?.organization_owned ?? []).map((t) => <div key={t.id} className="rounded-xl border border-border p-3 text-xs"><b>{t.name}</b><p className="mt-1 font-mono text-[10px] text-muted-foreground">{t.code}</p><div className="mt-2 flex flex-wrap gap-1">{(t.organization_module_links ?? []).filter((a) => a.is_active).map((a) => <span key={a.id} className="rounded-full bg-muted px-2 py-1 text-[10px]">{a.module_name}</span>)}</div></div>)}</div></div></div>}
    </section>}
      </main>
    </div>
  </div>;
}

function OrganizationTaxonomyPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();
  const queryClient = useQueryClient();
  const organization = workspace.organization;
  const orgId = organization?.id ?? null;
  const [tab, setTab] = useState<"taxonomies" | "categories" | "hierarchy" | "assignments">("taxonomies");
  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<number | null>(null);
  const [taxonomyMode, setTaxonomyMode] = useState<"list" | "create" | "detail">("list");
  const [error, setError] = useState<unknown>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [taxonomyName, setTaxonomyName] = useState("");
  const [taxonomyDescription, setTaxonomyDescription] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [treeTaxonomy, setTreeTaxonomy] = useState<number | null>(null);
  const [treeCategories, setTreeCategories] = useState<number[]>([]);
  const [treeParent, setTreeParent] = useState<number | null>(null);
  const [assignTaxonomy, setAssignTaxonomy] = useState<number | null>(null);
  const [assignModule, setAssignModule] = useState<number | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<"list" | "create">("list");
  const [expandedGrantModules, setExpandedGrantModules] = useState<number[]>([]);
  const owner = Boolean(user?.is_superuser || organization?.membership.is_owner);
  const permissionCodes = new Set([...(user?.permission_codes ?? []), ...(workspace.topRole?.permission_codes ?? [])]);
  const can = (code: string) => owner || permissionCodes.has(code);

  const library = useQuery({ queryKey: ["org-taxonomy", orgId, "library"], enabled: Boolean(orgId && can("taxonomy.taxonomy.view")), queryFn: async () => (await api.get<Library>(`/taxonomy-library/?organization=${orgId}`)).data });
  const categories = useQuery({ queryKey: ["org-taxonomy", orgId, "categories"], enabled: Boolean(orgId && can("taxonomy.category.view")), queryFn: () => list<Category>(`/scoped-categories/?organization=${orgId}`) });
  const hierarchy = useQuery({ queryKey: ["org-taxonomy", orgId, "hierarchy"], enabled: Boolean(orgId && can("taxonomy.category.view")), queryFn: () => list<TaxonomyCategory>(`/scoped-taxonomy-categories/?organization=${orgId}`) });
  const write = useMutation({ mutationFn: async ({ method, path, payload }: { method: "post" | "patch" | "delete"; path: string; payload?: Record<string, unknown> }) => method === "post" ? (await api.post(path, payload ?? {})).data : method === "patch" ? (await api.patch(path, payload ?? {})).data : (await api.delete(path)).data, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["org-taxonomy", orgId] }); setToast("Taxonomy changes saved successfully."); } });
  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); } catch (err) { setError(err); } };
  if (!organization) return <EmptyState text="Select an organization from the workspace navbar first." />;
  if (!can("taxonomy.taxonomy.view") && !can("taxonomy.category.view")) return <EmptyState text="Your active role does not have Taxonomy view permission." />;

  const orgTaxonomies = library.data?.organization_owned ?? [];
  const platformTaxonomies = library.data?.platform_assigned ?? [];
  const allTaxonomies = [...orgTaxonomies.map((t) => ({ ...t, _scope: "organization" as const })), ...platformTaxonomies.map((t) => ({ ...t, _scope: "platform" as const }))];
  const availableCategories = categories.data?.results ?? [];
  const hierarchyRows = Array.from(new Map((hierarchy.data?.results ?? []).map((r) => [r.id, r])).values());
  const assignableModules = library.data?.organization_modules ?? [];
  const selectedTaxonomy = selectedTaxonomyId ? allTaxonomies.find((t) => t.id === selectedTaxonomyId) : null;
  const selectedHierarchy = selectedTaxonomy ? hierarchyRows.filter((r) => r.taxonomy === selectedTaxonomy.id) : [];
  const selectedAssignments = selectedTaxonomy ? (library.data?.assignments ?? []).filter((a) => a.taxonomy === selectedTaxonomy.id && a.is_active) : [];
  const activeAssignments = (library.data?.assignments ?? []).filter((a) => a.is_active);
  const grantsByModule = assignableModules.map((module) => ({
    module,
    grants: activeAssignments.filter((assignment) => assignment.organization_module === module.id),
  })).filter((group) => group.grants.length > 0);

  const createOwnTaxonomy = () => run(async () => { if (!can("taxonomy.taxonomy.create") || !can("taxonomy.taxonomy.assign_module") || !taxonomyName.trim() || selectedModuleIds.length === 0) return; await write.mutateAsync({ method: "post", path: `/scoped-taxonomies/?organization=${orgId}`, payload: { name: taxonomyName.trim(), description: taxonomyDescription.trim(), organization_module_ids: selectedModuleIds, is_active: true } }); setTaxonomyName(""); setTaxonomyDescription(""); setSelectedModuleIds([]); setTaxonomyMode("list"); });
  const createOwnCategory = () => run(async () => { if (!can("taxonomy.category.create") || !categoryName.trim()) return; await write.mutateAsync({ method: "post", path: `/scoped-categories/?organization=${orgId}`, payload: { name: categoryName.trim(), description: categoryDescription.trim(), color: "", icon: "", is_active: true } }); setCategoryName(""); setCategoryDescription(""); });
  const addHierarchy = () => run(async () => { if (!can("taxonomy.category.assign_taxonomy") || !treeTaxonomy || treeCategories.length === 0) return; for (const category of treeCategories) await write.mutateAsync({ method: "post", path: `/scoped-taxonomy-categories/?organization=${orgId}`, payload: { taxonomy: treeTaxonomy, category, parent: treeParent, availability_mode: "this_and_all_children", is_active: true } }); setTreeCategories([]); });
  const assignExisting = () => run(async () => { if (!can("taxonomy.taxonomy.assign_module") || !assignTaxonomy || !assignModule) return; await write.mutateAsync({ method: "post", path: `/taxonomy-organization-modules/?organization=${orgId}`, payload: { taxonomy: assignTaxonomy, organization_module: assignModule, is_active: true } }); setAssignTaxonomy(null); setAssignModule(null); setAssignmentMode("list"); });

  return <div className="min-h-full bg-muted/10">
    <ToastNotice message={toast} onClose={() => setToast(null)} />
    <div className="border-b border-border bg-background/95 px-4 py-3 sm:px-6"><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{organization.name}</span><ChevronRight className="h-3.5 w-3.5" /><span className="font-semibold text-primary">Taxonomy setup</span></div></div>
    <div className="mx-auto grid w-full max-w-[1680px] gap-0 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-background p-3 xl:min-h-[calc(100vh-112px)] xl:border-b-0 xl:border-r xl:p-4">
        <div className="mb-4 px-2"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Taxonomy Setup</p><p className="mt-1 truncate text-sm font-semibold text-foreground">{organization.name}</p></div>
        <nav className="grid gap-1 sm:grid-cols-4 xl:grid-cols-1">
          <TaxonomySetupNavButton active={tab === "taxonomies"} icon={Tags} label="Taxonomies" meta={`${allTaxonomies.length} available`} onClick={() => { setTab("taxonomies"); setTaxonomyMode("list"); setSelectedTaxonomyId(null); }} />
          {can("taxonomy.category.view") ? <TaxonomySetupNavButton active={tab === "categories"} icon={Boxes} label="Categories" meta={`${availableCategories.length} reusable`} onClick={() => setTab("categories")} /> : null}
          {can("taxonomy.category.assign_taxonomy") ? <TaxonomySetupNavButton active={tab === "hierarchy"} icon={Link2} label="Hierarchy" meta={`${hierarchyRows.length} mapped`} onClick={() => setTab("hierarchy")} /> : null}
          {can("taxonomy.taxonomy.assign_module") ? <TaxonomySetupNavButton active={tab === "assignments"} icon={Building2} label="Module access" meta={`${(library.data?.assignments ?? []).length} grants`} onClick={() => setTab("assignments")} /> : null}
        </nav>
        <div className="mt-5 hidden rounded-xl border border-border bg-muted/20 p-3 xl:block"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Configured</p><div className="mt-2 grid grid-cols-2 gap-2 text-center"><TaxMiniCount label="Own taxonomy" value={orgTaxonomies.length} /><TaxMiniCount label="Platform" value={platformTaxonomies.length} /><TaxMiniCount label="Categories" value={availableCategories.length} /><TaxMiniCount label="Mappings" value={hierarchyRows.length} /></div></div>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 xl:p-7">
        <ErrorBox error={error} fallback="Taxonomy operation failed." />
        {tab === "taxonomies" ? <div className="space-y-5"><TaxSectionTitle eyebrow="Taxonomies" title="Taxonomy library" action={can("taxonomy.taxonomy.create") && can("taxonomy.taxonomy.assign_module") && taxonomyMode === "list" ? <button type="button" onClick={() => { setTaxonomyMode("create"); setSelectedTaxonomyId(null); }} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New taxonomy</button> : null} />
          {taxonomyMode === "list" ? <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="grid grid-cols-[minmax(0,1fr)_120px_100px_44px] border-b border-border bg-muted/20 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><span>Taxonomy</span><span>Scope</span><span>Categories</span><span /></div>{allTaxonomies.length ? allTaxonomies.map((t, index) => <button key={`${t._scope}-${t.id}`} type="button" onClick={() => { setSelectedTaxonomyId(t.id); setTaxonomyMode("detail"); }} className={cn("grid w-full grid-cols-[minmax(0,1fr)_120px_100px_44px] items-center px-4 py-3 text-left transition hover:bg-muted/20", index > 0 && "border-t border-border")}><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{t.name}</span><span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground">{t.code}</span></span><span><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase", t._scope === "platform" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>{t._scope}</span></span><span className="text-xs font-semibold">{hierarchyRows.filter((r) => r.taxonomy === t.id).length}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>) : <div className="p-8 text-center text-xs text-muted-foreground">No taxonomy is available.</div>}</section> : null}
          {taxonomyMode === "create" ? <section className="rounded-2xl border border-border bg-card p-5"><button type="button" onClick={() => setTaxonomyMode("list")} className="mb-4 text-[10px] font-semibold text-muted-foreground hover:text-foreground">← Taxonomies</button><h2 className="text-base font-semibold">Create organization taxonomy</h2><div className="mt-4 grid gap-3 lg:grid-cols-2"><input className={field} value={taxonomyName} onChange={(e) => setTaxonomyName(e.target.value)} placeholder="Taxonomy name" /><input className={field} value={taxonomyDescription} onChange={(e) => setTaxonomyDescription(e.target.value)} placeholder="Description" /></div><ModuleCheckboxes rows={assignableModules} selected={selectedModuleIds} setSelected={setSelectedModuleIds} /><CreateButton disabled={!taxonomyName.trim() || selectedModuleIds.length === 0 || write.isPending} onClick={createOwnTaxonomy}>Create taxonomy</CreateButton></section> : null}
          {taxonomyMode === "detail" && selectedTaxonomy ? <section className="rounded-2xl border border-border bg-card p-5"><button type="button" onClick={() => { setTaxonomyMode("list"); setSelectedTaxonomyId(null); }} className="mb-4 text-[10px] font-semibold text-muted-foreground hover:text-foreground">← Taxonomies</button><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{selectedTaxonomy.name}</h2><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase", selectedTaxonomy._scope === "platform" ? "bg-primary/10 text-primary" : "bg-muted")}>{selectedTaxonomy._scope}</span></div><p className="mt-1 font-mono text-[10px] text-muted-foreground">{selectedTaxonomy.code}</p><p className="mt-3 max-w-3xl text-xs leading-5 text-muted-foreground">{selectedTaxonomy.description || "No description provided."}</p></div>{selectedTaxonomy._scope === "organization" && can("taxonomy.taxonomy.update") ? <button type="button" onClick={() => run(() => write.mutateAsync({ method: "patch", path: `/scoped-taxonomies/${selectedTaxonomy.id}/?organization=${orgId}`, payload: { is_active: !selectedTaxonomy.is_active } }))} className={cn("rounded-xl border px-3 py-2 text-xs font-semibold", selectedTaxonomy.is_active ? "border-primary/20 text-primary" : "border-border text-muted-foreground")}>{selectedTaxonomy.is_active ? "Active" : "Inactive"}</button> : null}</div><div className="mt-5 grid gap-4 lg:grid-cols-3"><TaxDetail label="Scope" value={selectedTaxonomy._scope === "platform" ? "Platform assigned" : organization.name} /><TaxDetail label="Categories" value={String(selectedHierarchy.length)} /><TaxDetail label="Module access" value={String(selectedAssignments.length)} /></div><div className="mt-6 grid gap-5 xl:grid-cols-2"><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category hierarchy</p><div className="mt-3 rounded-xl border border-border bg-background p-3">{selectedHierarchy.length ? selectedHierarchy.sort((a,b) => (a.full_path || a.category_name).localeCompare(b.full_path || b.category_name)).map((r) => <div key={r.id} className="relative flex items-center gap-3 border-l border-border py-2 pl-5 before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:bg-border"><span className="h-2 w-2 rounded-full bg-primary" /><div><p className="text-xs font-semibold">{r.category_name}</p><p className="text-[9px] text-muted-foreground">{r.full_path || r.category_name}</p></div></div>) : <p className="p-3 text-xs text-muted-foreground">No categories mapped yet.</p>}</div></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Organization module access</p><div className="mt-3 space-y-2">{selectedAssignments.length ? selectedAssignments.map((a) => <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3"><div><p className="text-xs font-semibold">{a.module_name}</p><p className="font-mono text-[9px] text-muted-foreground">{a.module_code}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">AVAILABLE</span></div>) : <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">No module access assigned.</p>}</div></div></div></section> : null}
        </div> : null}

        {tab === "categories" ? <div className="space-y-5"><TaxSectionTitle eyebrow="Categories" title="Reusable category masters" />{can("taxonomy.category.create") ? <section className="rounded-2xl border border-border bg-card p-5"><div className="grid gap-3 lg:grid-cols-[1fr_1.5fr_auto]"><input className={field} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" /><input className={field} value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} placeholder="Description" /><CreateButton disabled={!categoryName.trim() || write.isPending} onClick={createOwnCategory}>Create category</CreateButton></div></section> : null}<section className="grid gap-3 lg:grid-cols-2">{availableCategories.map((c) => <ResourceCard key={c.id} title={c.name} code={c.code} meta={c.organization ? "Organization owned" : "Platform reusable"} active={c.is_active} onToggle={c.organization === orgId && can("taxonomy.category.update") ? () => run(() => write.mutateAsync({ method: "patch", path: `/scoped-categories/${c.id}/?organization=${orgId}`, payload: { is_active: !c.is_active } })) : undefined} onDelete={c.organization === orgId && can("taxonomy.category.delete") ? () => run(() => write.mutateAsync({ method: "delete", path: `/scoped-categories/${c.id}/?organization=${orgId}` })) : undefined} />)}</section></div> : null}

        {tab === "hierarchy" ? <div className="space-y-5"><TaxSectionTitle eyebrow="Hierarchy" title="Build taxonomy structure" /><section className="rounded-2xl border border-border bg-card p-5"><div className="grid gap-2 lg:grid-cols-2"><Select value={treeTaxonomy} setValue={(value) => { setTreeTaxonomy(value); setTreeParent(null); setTreeCategories([]); }} placeholder="Organization taxonomy" rows={orgTaxonomies.map((t) => ({ id: t.id, label: t.name }))} /><Select value={treeParent} setValue={(value) => { setTreeParent(value); setTreeCategories([]); }} placeholder="ROOT / no parent" rows={hierarchyRows.filter((r) => !treeTaxonomy || r.taxonomy === treeTaxonomy).map((r) => ({ id: r.id, label: r.full_path || r.category_name }))} allowEmpty /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{availableCategories.filter((c) => c.is_active && !hierarchyRows.some((r) => r.taxonomy === treeTaxonomy && r.category === c.id)).map((c) => { const checked = treeCategories.includes(c.id); return <label key={c.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs", checked ? "border-primary bg-primary/5" : "border-border")}><input type="checkbox" checked={checked} onChange={() => setTreeCategories(checked ? treeCategories.filter((id) => id !== c.id) : [...treeCategories, c.id])} /><span>{c.name}<span className="ml-1 text-[9px] text-muted-foreground">{c.organization ? "own" : "platform"}</span></span></label>; })}</div><CreateButton disabled={!treeTaxonomy || treeCategories.length === 0 || write.isPending} onClick={addHierarchy}>Add selected categories</CreateButton>{treeTaxonomy ? <div className="mt-6 rounded-xl border border-border bg-background p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current structure</p>{hierarchyRows.filter((r) => r.taxonomy === treeTaxonomy).map((r) => <div key={r.id} className="flex items-center justify-between border-l border-border py-2 pl-5 text-xs"><span>{r.full_path || r.category_name}</span><button type="button" className="text-destructive" onClick={() => run(() => write.mutateAsync({ method: "delete", path: `/scoped-taxonomy-categories/${r.id}/?organization=${orgId}` }))}><Trash2 className="h-4 w-4" /></button></div>)}</div> : null}</section></div> : null}

        {tab === "assignments" ? <div className="space-y-5"><TaxSectionTitle eyebrow="Module access" title="Taxonomy availability" action={assignmentMode === "list" ? <button type="button" onClick={() => setAssignmentMode("create")} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Assign module</button> : null} />
          {assignmentMode === "create" ? <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">New module grant</h2><button type="button" onClick={() => { setAssignmentMode("list"); setAssignTaxonomy(null); setAssignModule(null); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 lg:grid-cols-2"><Select value={assignTaxonomy} setValue={setAssignTaxonomy} placeholder="Taxonomy" rows={orgTaxonomies.filter((t) => t.is_active).map((t) => ({ id: t.id, label: t.name }))} /><Select value={assignModule} setValue={setAssignModule} placeholder="Module" rows={assignableModules.map((m) => ({ id: m.id, label: `${m.module_name} (${m.module_code})` }))} /></div><CreateButton disabled={!assignTaxonomy || !assignModule || write.isPending} onClick={assignExisting}>Save grant</CreateButton></section> : null}
          {assignmentMode === "list" ? <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="grid grid-cols-[minmax(0,1fr)_100px_44px] border-b border-border bg-muted/20 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"><span>Organization module</span><span>Taxonomies</span><span /></div>{grantsByModule.length ? grantsByModule.map((group, index) => { const open = expandedGrantModules.includes(group.module.id); const platformCount = group.grants.filter((grant) => grant.taxonomy_scope_type === "platform").length; const organizationCount = group.grants.length - platformCount; return <div key={group.module.id} className={cn(index > 0 && "border-t border-border")}><button type="button" onClick={() => setExpandedGrantModules(open ? expandedGrantModules.filter((id) => id !== group.module.id) : [...expandedGrantModules, group.module.id])} className="grid w-full grid-cols-[minmax(0,1fr)_100px_44px] items-center px-4 py-3 text-left transition hover:bg-muted/20"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{group.module.module_name}</span><span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{group.module.module_code}</span></span><span><span className="text-xs font-semibold text-foreground">{group.grants.length}</span><span className="ml-1 text-[9px] text-muted-foreground">grants</span></span>{open ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</button>{open ? <div className="border-t border-border bg-muted/10 px-4 py-4"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-muted px-2 py-1 text-[9px] font-semibold text-muted-foreground">{organizationCount} organization</span>{platformCount > 0 ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">{platformCount} platform</span> : null}</div><div className="space-y-2">{group.grants.map((grant) => <div key={grant.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-semibold text-foreground">{grant.taxonomy_name}</p><span className={cn("rounded-full px-2 py-0.5 text-[8px] font-bold uppercase", grant.taxonomy_scope_type === "platform" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>{grant.taxonomy_scope_type}</span></div><p className="mt-1 font-mono text-[9px] text-muted-foreground">{grant.taxonomy_code}</p></div>{grant.taxonomy_scope_type === "organization" ? <button type="button" title="Remove grant" className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => run(() => write.mutateAsync({ method: "delete", path: `/taxonomy-organization-modules/${grant.id}/?organization=${orgId}` }))}><Trash2 className="h-4 w-4" /></button> : <span className="text-[9px] font-semibold text-muted-foreground">Read only</span>}</div>)}</div></div> : null}</div>; }) : <div className="p-8 text-center text-xs text-muted-foreground">No taxonomy module grants configured.</div>}</section> : null}
        </div> : null}
      </main>
    </div>
  </div>;
}

function TaxonomySetupNavButton({ active, icon: Icon, label, meta, onClick }: { active: boolean; icon: React.ComponentType<{ className?: string }>; label: string; meta: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 text-left transition", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/10 bg-background/60"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold">{label}</span><span className="block text-[10px] opacity-70">{meta}</span></span><ChevronRight className="hidden h-3.5 w-3.5 xl:block" /></button>; }
function TaxMiniCount({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-background p-2"><p className="text-sm font-bold text-foreground">{value}</p><p className="text-[9px] text-muted-foreground">{label}</p></div>; }
function TaxSectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1></div>{action}</div>; }
function TaxDetail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-background px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold text-foreground">{value}</p></div>; }

function Hero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-1 font-logo text-2xl font-normal text-foreground">{title}</h1><p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">{text}</p></section>; }
function ErrorBox({ error, fallback }: { error: unknown; fallback: string }) { return error ? <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(error, fallback)}</p> : null; }
function EmptyState({ text }: { text: string }) { return <div className="p-6"><div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{text}</div></div>; }
function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={cn("inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold", active ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}><Icon className="h-4 w-4" />{children}</button>; }
function CreateButton({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" disabled={disabled} onClick={onClick} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4" />{children}</button>; }
function Select({ value, setValue, rows, placeholder, allowEmpty = false }: { value: number | null; setValue: (value: number | null) => void; rows: Array<{ id: number; label: string }>; placeholder: string; allowEmpty?: boolean }) { return <select className={field} value={value ?? ""} onChange={(e) => setValue(e.target.value ? Number(e.target.value) : null)}><option value="">{allowEmpty ? placeholder : placeholder}</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select>; }
function ResourceCard({ title, code, meta, active, onClick, onToggle, onDelete }: { title: string; code: string; meta: string; active: boolean; onClick?: () => void; onToggle?: () => void; onDelete?: () => void }) { return <div onClick={onClick} className={cn("rounded-xl border border-border bg-background p-4", onClick && "cursor-pointer transition hover:border-primary/40 hover:bg-muted/20")}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{code}</p><p className="mt-2 text-[11px] text-muted-foreground">{meta}</p></div><div className="flex items-center gap-2">{onToggle && <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(); }} className={cn("rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold", active ? "border-primary/20 text-primary" : "border-border text-muted-foreground")}>{active ? "Active" : "Inactive"}</button>}{onDelete && <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded-lg border border-destructive/20 p-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}</div></div></div>; }
function Mapping({ left, right }: { left: string; right: string }) { return <div className="rounded-xl border border-border bg-background p-3 text-xs"><span className="font-semibold text-foreground">{left}</span><span className="mx-2 text-muted-foreground">→</span><span className="text-primary">{right}</span></div>; }
function AssignmentChip({ label, onRemove }: { label: string; onRemove: () => void }) { return <button type="button" onClick={onRemove} title="Remove assignment" className="rounded-full border border-primary/20 px-2 py-1 text-[10px] text-primary">{label} ×</button>; }
function ModuleCheckboxes({ rows, selected, setSelected }: { rows: Library["organization_modules"]; selected: number[]; setSelected: (ids: number[]) => void }) { return <div className="mt-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Assign to organization modules</p><div className="flex flex-wrap gap-2">{rows.map((r) => { const checked = selected.includes(r.id); return <label key={r.id} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs", checked ? "border-primary bg-primary/5" : "border-border")}><input type="checkbox" checked={checked} onChange={() => setSelected(checked ? selected.filter((id) => id !== r.id) : [...selected, r.id])} />{r.module_name}</label>; })}</div></div>; }
function LibraryColumn({ title, rows, assignments }: { title: string; rows: Taxonomy[]; assignments: TaxonomyOrgModule[] }) { return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-sm font-semibold">{title}</h2><div className="mt-4 space-y-3">{rows.length === 0 ? <p className="text-xs text-muted-foreground">Nothing available.</p> : rows.map((t) => <div key={t.id} className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">{t.name}</p><p className="font-mono text-[10px] text-muted-foreground">{t.code}</p><div className="mt-2 flex flex-wrap gap-1">{assignments.filter((a) => a.taxonomy === t.id).map((a) => <span key={a.id} className="rounded-full bg-muted px-2 py-1 text-[10px]">{a.module_name}</span>)}</div></div>)}</div></section>; }
