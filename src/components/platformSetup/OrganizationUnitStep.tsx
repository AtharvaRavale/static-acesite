import { useEffect, useMemo, useState } from "react";
import {
  Building,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  FolderOpen,
  ImagePlus,
  MapPin,
  Plus,
  Search,
  Waypoints,
  X,
} from "lucide-react";
import {
  useCreateOrganizationUnit,
  useOrganizationSetupTree,
  type Organization,
  type OrganizationSetupTreeProject,
  type OrganizationSetupTreeUnit,
  type OrganizationUnit,
  type UnitType,
} from "@/features/organizations";
import {
  projectStructureLevelsApi,
  projectsApi,
  useCreateProject,
  type Project,
  type ProjectStructureLevel,
} from "@/features/projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import {
  generateUniqueSetupCode,
  getSetupCodeError,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  SetupField,
  StepCard,
  textareaClass,
} from "./ui";

const UNIT_TYPES: Array<{ value: UnitType; label: string }> = [
  { value: "holding_company", label: "Holding company" },
  { value: "legal_entity", label: "Legal entity" },
  { value: "business_unit", label: "Business unit" },
  { value: "region", label: "Region" },
  { value: "zone", label: "Zone" },
  { value: "branch", label: "Branch" },
  { value: "site_office", label: "Site office" },
  { value: "other", label: "Other" },
];

const MAX_PROJECT_IMAGE_SIZE = 10 * 1024 * 1024;

type PlacementTarget =
  | { kind: "organization"; unit: null }
  | { kind: "unit"; unit: OrganizationSetupTreeUnit };

type PanelMode = "summary" | "project" | "unit" | "projects";

type ProjectFormState = {
  name: string;
  project_number: string;
  location: string;
  description: string;
  image: File | null;
};

const EMPTY_PROJECT_FORM: ProjectFormState = {
  name: "",
  project_number: "",
  location: "",
  description: "",
  image: null,
};

function collectUnits(nodes: OrganizationSetupTreeUnit[]): OrganizationSetupTreeUnit[] {
  return nodes.flatMap((node) => [node, ...collectUnits(node.children ?? [])]);
}

function collectProjects(
  rootProjects: OrganizationSetupTreeProject[],
  nodes: OrganizationSetupTreeUnit[]
): OrganizationSetupTreeProject[] {
  return [
    ...rootProjects,
    ...nodes.flatMap((node) => [
      ...(node.projects ?? []),
      ...collectProjects([], node.children ?? []),
    ]),
  ];
}

function findUnit(
  nodes: OrganizationSetupTreeUnit[],
  id: number
): OrganizationSetupTreeUnit | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findUnit(node.children ?? [], id);
    if (nested) return nested;
  }
  return null;
}

function filterTree(
  nodes: OrganizationSetupTreeUnit[],
  query: string
): OrganizationSetupTreeUnit[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;

  return nodes.flatMap((node) => {
    const children = filterTree(node.children ?? [], normalized);
    const matchesSelf =
      node.name.toLowerCase().includes(normalized) ||
      node.code.toLowerCase().includes(normalized) ||
      node.unit_type_display.toLowerCase().includes(normalized);
    const hasMatchingProject = (node.projects ?? []).some(
      (project) =>
        project.name.toLowerCase().includes(normalized) ||
        project.code.toLowerCase().includes(normalized) ||
        project.project_number.toLowerCase().includes(normalized)
    );

    if (!matchesSelf && !hasMatchingProject && children.length === 0) return [];

    return [
      {
        ...node,
        children: matchesSelf ? node.children : children,
      },
    ];
  });
}

export function OrganizationUnitStep({
  organization,
  initialSelection,
  onBack,
  onProjectCreated,
}: {
  organization: Organization;
  initialSelection: OrganizationUnit | null;
  onBack: () => void;
  onProjectCreated: (
    project: Project,
    organizationUnit: OrganizationUnit | null,
    existingStructureLevels?: ProjectStructureLevel[]
  ) => void;
}) {
  const treeQuery = useOrganizationSetupTree(organization.id);
  const createProject = useCreateProject();
  const createUnit = useCreateOrganizationUnit();

  const [selected, setSelected] = useState<PlacementTarget>({
    kind: "organization",
    unit: null,
  });
  const [mode, setMode] = useState<PanelMode>("summary");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [rootExpanded, setRootExpanded] = useState(true);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const [projectImageError, setProjectImageError] = useState<string | null>(null);
  const [openingProjectId, setOpeningProjectId] = useState<number | null>(null);
  const [openProjectError, setOpenProjectError] = useState<unknown>(null);

  const [unitForm, setUnitForm] = useState({
    name: "",
    unit_type: "business_unit" as UnitType,
    description: "",
  });

  const tree = treeQuery.data;
  const allUnits = useMemo(() => collectUnits(tree?.children ?? []), [tree]);
  const allProjects = useMemo(
    () => collectProjects(tree?.projects ?? [], tree?.children ?? []),
    [tree]
  );
  const filteredUnits = useMemo(
    () => filterTree(tree?.children ?? [], search),
    [tree, search]
  );

  useEffect(() => {
    if (!tree) return;

    setExpanded((current) => {
      if (current.size > 0) return current;
      return new Set(allUnits.map((unit) => unit.id));
    });

    if (initialSelection) {
      const matched = findUnit(tree.children, initialSelection.id);
      if (matched) setSelected({ kind: "unit", unit: matched });
    }
  }, [tree, allUnits, initialSelection]);

  useEffect(() => {
    return () => {
      if (projectImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(projectImagePreview);
      }
    };
  }, [projectImagePreview]);

  const selectedUnit = selected.kind === "unit" ? selected.unit : null;
  const selectedLabel = selectedUnit?.name ?? organization.name;
  const selectedProjects = selectedUnit?.projects ?? tree?.projects ?? [];
  const selectedProjectCount = selectedProjects.length;
  const selectedChildCount = selectedUnit?.children.length ?? tree?.children.length ?? 0;

  const generatedProjectCode = useMemo(
    () =>
      generateUniqueSetupCode(
        projectForm.name,
        allProjects.map((project) => project.code),
        80
      ),
    [projectForm.name, allProjects]
  );
  const projectCodeError = projectForm.name.trim()
    ? getSetupCodeError(generatedProjectCode, 80)
    : null;

  const generatedUnitCode = useMemo(
    () =>
      generateUniqueSetupCode(
        unitForm.name,
        allUnits.map((unit) => unit.code),
        80
      ),
    [unitForm.name, allUnits]
  );
  const unitCodeError = unitForm.name.trim()
    ? getSetupCodeError(generatedUnitCode, 80)
    : null;

  const chooseOrganization = () => {
    setSelected({ kind: "organization", unit: null });
    setMode("summary");
  };

  const chooseUnit = (unit: OrganizationSetupTreeUnit) => {
    setSelected({ kind: "unit", unit });
    setMode("summary");
  };

  const resetProjectImage = () => {
    if (projectImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(projectImagePreview);
    }
    setProjectImagePreview(null);
    setProjectImageError(null);
  };

  const openProjectForm = (target?: PlacementTarget) => {
    if (target) setSelected(target);
    resetProjectImage();
    setMode("project");
    setProjectForm(EMPTY_PROJECT_FORM);
  };

  const openProjects = (target?: PlacementTarget) => {
    if (target) setSelected(target);
    setOpenProjectError(null);
    setMode("projects");
  };

  const openUnitForm = () => {
    setMode("unit");
    setUnitForm({ name: "", unit_type: "business_unit", description: "" });
  };

  const onProjectImageChange = (file: File | null) => {
    resetProjectImage();

    if (!file) {
      setProjectForm((current) => ({ ...current, image: null }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProjectImageError("Please select an image file.");
      setProjectForm((current) => ({ ...current, image: null }));
      return;
    }

    if (file.size > MAX_PROJECT_IMAGE_SIZE) {
      setProjectImageError("Project image must be 10 MB or smaller.");
      setProjectForm((current) => ({ ...current, image: null }));
      return;
    }

    setProjectForm((current) => ({ ...current, image: file }));
    setProjectImagePreview(URL.createObjectURL(file));
  };

  const submitProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !projectForm.name.trim() ||
      !generatedProjectCode ||
      projectCodeError ||
      projectImageError
    ) {
      return;
    }

    const project = await createProject.mutateAsync({
      organization: organization.id,
      organization_unit: selectedUnit?.id ?? null,
      name: projectForm.name.trim(),
      code: generatedProjectCode,
      project_number: projectForm.project_number.trim(),
      location: projectForm.location.trim(),
      description: projectForm.description.trim(),
      image: projectForm.image ?? undefined,
      grouping_config: {},
      is_active: true,
    });

    await treeQuery.refetch();
    onProjectCreated(project, selectedUnit as OrganizationUnit | null);
  };

  const submitUnit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!unitForm.name.trim() || !generatedUnitCode || unitCodeError) return;

    const created = await createUnit.mutateAsync({
      organization: organization.id,
      parent: selectedUnit?.id ?? null,
      name: unitForm.name.trim(),
      code: generatedUnitCode,
      unit_type: unitForm.unit_type,
      description: unitForm.description.trim(),
      is_active: true,
    });

    const refreshed = await treeQuery.refetch();
    const createdNode = refreshed.data
      ? findUnit(refreshed.data.children, created.id)
      : null;

    if (createdNode) {
      setSelected({ kind: "unit", unit: createdNode });
      setExpanded((current) => new Set([...current, createdNode.id]));
    }
    setMode("summary");
  };

  const openExistingProject = async (project: OrganizationSetupTreeProject) => {
    setOpeningProjectId(project.id);
    setOpenProjectError(null);

    try {
      // Opening a project must not depend on the combined structure-tree API.
      // Load the project itself first; this keeps the workflow usable even if
      // an optional hierarchy request temporarily fails.
      const fullProject = await projectsApi.get(project.id);
      let existingStructureLevels: ProjectStructureLevel[] = [];

      try {
        const projectTree = await projectsApi.structureTree(project.id);
        existingStructureLevels = projectTree.structure_levels;
      } catch (treeError) {
        // Graceful fallback: use the existing level-list endpoint instead of
        // blocking the whole step with an "Unable to load" state.
        try {
          const levelsResponse = await projectStructureLevelsApi.list({
            project: project.id,
            page_size: 200,
            ordering: "sequence",
          });
          existingStructureLevels = levelsResponse.results;
        } catch {
          // Project detail loaded successfully, so allow the user to continue.
          // The Structure step can still fetch/create data independently.
          existingStructureLevels = [];
        }

        // Keep the technical failure out of the primary UI; it is already
        // recoverable and should not make a valid project look unavailable.
        console.warn(
          `Structure tree for project ${project.id} could not be loaded; using fallback data.`,
          treeError
        );
      }

      const projectUnit =
        project.organization_unit == null || !tree
          ? null
          : findUnit(tree.children, project.organization_unit);

      onProjectCreated(
        fullProject,
        projectUnit as OrganizationUnit | null,
        existingStructureLevels
      );
    } catch (error) {
      // Only a failure to load the actual project blocks opening it.
      setOpenProjectError(error);
    } finally {
      setOpeningProjectId(null);
    }
  };

  return (
    <StepCard
      eyebrow="Project placement"
      title="Choose the exact organization scope"
      description="The organization stays centered as the hierarchy root. Its organization units branch below it, and every child unit keeps the same hierarchical layout. Select a node, inspect its projects, or create a project directly at that scope."
    >
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="border-b border-border bg-muted/15 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={cn(inputClass, "pl-9")}
                placeholder="Search organization units or projects"
              />
            </div>
          </div>

          <div className="max-h-[650px] overflow-auto p-4 sm:p-6">
            {treeQuery.isLoading ? (
              <div className="space-y-4">
                <div className="mx-auto h-28 w-64 animate-pulse rounded-2xl bg-muted" />
                <div className="mx-auto h-48 w-[80%] animate-pulse rounded-2xl bg-muted/70" />
              </div>
            ) : null}

            {treeQuery.isError ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">
                {getApiErrorMessage(
                  treeQuery.error,
                  "Unable to load the organization setup tree."
                )}
              </p>
            ) : null}

            {tree ? (
              <div className="min-w-max px-3 py-5">
                <div className="flex flex-col items-center">
                  <HierarchyNodeCard
                    kind="organization"
                    name={tree.organization.name}
                    code={tree.organization.code}
                    meta="Organization"
                    projectCount={tree.projects.length}
                    childCount={tree.children.length}
                    selected={selected.kind === "organization"}
                    expanded={rootExpanded}
                    hasChildren={filteredUnits.length > 0}
                    onToggle={() => setRootExpanded((current) => !current)}
                    onSelect={chooseOrganization}
                    onProjects={() =>
                      openProjects({ kind: "organization", unit: null })
                    }
                    onCreateProject={() =>
                      openProjectForm({ kind: "organization", unit: null })
                    }
                  />

                  {rootExpanded && filteredUnits.length > 0 ? (
                    <>
                      <div className="h-7 w-px bg-border" />
                      <div className="relative flex items-start justify-center gap-6 border-t border-border px-4 pt-7">
                        {filteredUnits.map((unit) => (
                          <HierarchyBranch
                            key={unit.id}
                            unit={unit}
                            selectedUnitId={selectedUnit?.id ?? null}
                            expanded={expanded}
                            setExpanded={setExpanded}
                            onSelect={chooseUnit}
                            onProjects={(targetUnit) =>
                              openProjects({ kind: "unit", unit: targetUnit })
                            }
                            onCreateProject={(targetUnit) =>
                              openProjectForm({ kind: "unit", unit: targetUnit })
                            }
                          />
                        ))}
                      </div>
                    </>
                  ) : search.trim() ? (
                    <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
                      No organization unit matches this search.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5">
          {mode === "summary" ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Selected placement
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {selectedLabel}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedUnit
                      ? `${selectedUnit.unit_type_display} · ${selectedUnit.code}`
                      : `Organization root · ${organization.code}`}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {selectedUnit ? (
                    <Building className="h-5 w-5" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openProjects()}
                  className="rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/35 hover:bg-primary/5"
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Projects here
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {selectedProjectCount}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-primary">
                    Click to open
                  </p>
                </button>
                <div className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Child units
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {selectedChildCount}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openProjectForm()}
                className="mt-5 flex w-full items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left transition hover:border-primary/45 hover:bg-primary/10"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    Create project here
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    The project will be scoped to {selectedUnit ? selectedUnit.name : "the organization root"}.
                  </span>
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Plus className="h-5 w-5" />
                </span>
              </button>

              <SecondaryButton className="mt-3 w-full" onClick={openUnitForm}>
                <Waypoints className="h-4 w-4" />
                Add child organization unit
              </SecondaryButton>
            </div>
          ) : null}

          {mode === "projects" ? (
            <div>
              <PanelHeader
                title={`Projects in ${selectedLabel}`}
                subtitle={`${selectedProjectCount} project${selectedProjectCount === 1 ? "" : "s"} directly scoped here`}
                onClose={() => setMode("summary")}
              />

              <div className="mt-4 space-y-3">
                {selectedProjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center">
                    <FolderKanban className="mx-auto h-7 w-7 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      No projects at this scope
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create the first project directly under {selectedLabel}.
                    </p>
                    <PrimaryButton
                      className="mt-4"
                      onClick={() => openProjectForm()}
                    >
                      <Plus className="h-4 w-4" />
                      Create project
                    </PrimaryButton>
                  </div>
                ) : (
                  selectedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      loading={openingProjectId === project.id}
                      onOpen={() => openExistingProject(project)}
                    />
                  ))
                )}
              </div>

              {openProjectError ? (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-semibold text-destructive">
                    This project could not be opened.
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-destructive/90">
                    {getApiErrorMessage(
                      openProjectError,
                      "The project detail request failed. Please retry; the organization tree is still available."
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === "project" ? (
            <form onSubmit={submitProject} className="space-y-4">
              <PanelHeader
                title="Create project"
                subtitle={`Placement: ${selectedLabel}`}
                onClose={() => setMode("summary")}
              />

              <SetupField label="Project image" hint="Optional · PNG, JPG, WEBP or another browser-supported image · max 10 MB">
                <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-background">
                  {projectImagePreview ? (
                    <div className="relative aspect-[16/8] overflow-hidden bg-muted">
                      <img
                        src={projectImagePreview}
                        alt="Project preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          resetProjectImage();
                          setProjectForm((current) => ({ ...current, image: null }));
                        }}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-background/90 text-foreground shadow"
                        aria-label="Remove selected image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center px-4 py-7 text-center transition hover:bg-muted/30">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <span className="mt-3 text-sm font-semibold text-foreground">
                        Upload project image
                      </span>
                      <span className="mt-1 text-[11px] text-muted-foreground">
                        Click to choose an image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) =>
                          onProjectImageChange(event.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  )}
                </div>
                {projectImageError ? (
                  <span className="block text-[11px] text-destructive">
                    {projectImageError}
                  </span>
                ) : null}
              </SetupField>

              <SetupField label="Project name" required>
                <input
                  className={inputClass}
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Tower A Construction"
                />
              </SetupField>

              <SetupField
                label="Project code"
                required
                hint="Generated automatically and validated before submission."
              >
                <input
                  className={cn(
                    inputClass,
                    "bg-muted/40 font-mono text-muted-foreground"
                  )}
                  value={generatedProjectCode}
                  readOnly
                  tabIndex={-1}
                  placeholder="auto-generated"
                />
                {projectCodeError ? (
                  <span className="block text-[11px] text-destructive">
                    {projectCodeError}
                  </span>
                ) : null}
              </SetupField>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <SetupField label="Project number">
                  <input
                    className={inputClass}
                    value={projectForm.project_number}
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        project_number: event.target.value,
                      }))
                    }
                    placeholder="PRJ-2026-001"
                  />
                </SetupField>
                <SetupField label="Location">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      className={cn(inputClass, "pl-9")}
                      value={projectForm.location}
                      onChange={(event) =>
                        setProjectForm((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      placeholder="Mumbai, India"
                    />
                  </div>
                </SetupField>
              </div>

              <SetupField label="Description">
                <textarea
                  className={textareaClass}
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Project scope and summary"
                />
              </SetupField>

              {createProject.isError ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {getApiErrorMessage(
                    createProject.error,
                    "Unable to create project."
                  )}
                </p>
              ) : null}

              <PrimaryButton
                type="submit"
                className="w-full"
                loading={createProject.isPending}
                disabled={
                  !projectForm.name.trim() ||
                  !generatedProjectCode ||
                  Boolean(projectCodeError) ||
                  Boolean(projectImageError)
                }
              >
                <Plus className="h-4 w-4" />
                Create project here & continue
              </PrimaryButton>
            </form>
          ) : null}

          {mode === "unit" ? (
            <form onSubmit={submitUnit} className="space-y-4">
              <PanelHeader
                title="Add organization unit"
                subtitle={`Parent: ${selectedLabel}`}
                onClose={() => setMode("summary")}
              />

              <SetupField label="Unit name" required>
                <input
                  className={inputClass}
                  value={unitForm.name}
                  onChange={(event) =>
                    setUnitForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="West Region"
                />
              </SetupField>

              <SetupField
                label="Unit code"
                required
                hint="Generated automatically and unique inside this organization."
              >
                <input
                  className={cn(
                    inputClass,
                    "bg-muted/40 font-mono text-muted-foreground"
                  )}
                  value={generatedUnitCode}
                  readOnly
                  tabIndex={-1}
                  placeholder="auto-generated"
                />
                {unitCodeError ? (
                  <span className="block text-[11px] text-destructive">
                    {unitCodeError}
                  </span>
                ) : null}
              </SetupField>

              <SetupField label="Type">
                <select
                  className={inputClass}
                  value={unitForm.unit_type}
                  onChange={(event) =>
                    setUnitForm((current) => ({
                      ...current,
                      unit_type: event.target.value as UnitType,
                    }))
                  }
                >
                  {UNIT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </SetupField>

              <SetupField label="Description">
                <textarea
                  className={textareaClass}
                  value={unitForm.description}
                  onChange={(event) =>
                    setUnitForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </SetupField>

              {createUnit.isError ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {getApiErrorMessage(
                    createUnit.error,
                    "Unable to create organization unit."
                  )}
                </p>
              ) : null}

              <PrimaryButton
                type="submit"
                className="w-full"
                loading={createUnit.isPending}
                disabled={
                  !unitForm.name.trim() ||
                  !generatedUnitCode ||
                  Boolean(unitCodeError)
                }
              >
                Add unit under {selectedUnit ? selectedUnit.name : "organization"}
              </PrimaryButton>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Select any hierarchy node to manage its child units and projects.
        </p>
      </div>
    </StepCard>
  );
}

function HierarchyBranch({
  unit,
  selectedUnitId,
  expanded,
  setExpanded,
  onSelect,
  onProjects,
  onCreateProject,
}: {
  unit: OrganizationSetupTreeUnit;
  selectedUnitId: number | null;
  expanded: Set<number>;
  setExpanded: React.Dispatch<React.SetStateAction<Set<number>>>;
  onSelect: (unit: OrganizationSetupTreeUnit) => void;
  onProjects: (unit: OrganizationSetupTreeUnit) => void;
  onCreateProject: (unit: OrganizationSetupTreeUnit) => void;
}) {
  const isExpanded = expanded.has(unit.id);
  const hasChildren = unit.children.length > 0;

  const toggle = () => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(unit.id)) next.delete(unit.id);
      else next.add(unit.id);
      return next;
    });
  };

  return (
    <div className="relative flex min-w-[230px] flex-col items-center">
      <div className="absolute -top-7 left-1/2 h-7 w-px -translate-x-1/2 bg-border" />
      <HierarchyNodeCard
        kind="unit"
        name={unit.name}
        code={unit.code}
        meta={unit.unit_type_display}
        projectCount={unit.projects.length}
        childCount={unit.children.length}
        selected={selectedUnitId === unit.id}
        expanded={isExpanded}
        hasChildren={hasChildren}
        onToggle={toggle}
        onSelect={() => onSelect(unit)}
        onProjects={() => onProjects(unit)}
        onCreateProject={() => onCreateProject(unit)}
      />

      {hasChildren && isExpanded ? (
        <>
          <div className="h-7 w-px bg-border" />
          <div className="relative flex items-start justify-center gap-6 border-t border-border px-4 pt-7">
            {unit.children.map((child) => (
              <HierarchyBranch
                key={child.id}
                unit={child}
                selectedUnitId={selectedUnitId}
                expanded={expanded}
                setExpanded={setExpanded}
                onSelect={onSelect}
                onProjects={onProjects}
                onCreateProject={onCreateProject}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function HierarchyNodeCard({
  kind,
  name,
  code,
  meta,
  projectCount,
  childCount,
  selected,
  expanded,
  hasChildren,
  onToggle,
  onSelect,
  onProjects,
  onCreateProject,
}: {
  kind: "organization" | "unit";
  name: string;
  code: string;
  meta: string;
  projectCount: number;
  childCount: number;
  selected: boolean;
  expanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onProjects: () => void;
  onCreateProject: () => void;
}) {
  const Icon = kind === "organization" ? Building2 : Building;

  return (
    <div
      className={cn(
        "group relative w-[230px] rounded-2xl border bg-card p-3 shadow-sm transition",
        selected
          ? "border-primary/50 ring-2 ring-primary/10"
          : "border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              kind === "organization"
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {name}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {meta}
            </span>
            <span className="mt-1 block truncate font-mono text-[9px] text-muted-foreground">
              {code}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onCreateProject}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/5 text-primary transition hover:bg-primary hover:text-primary-foreground"
          title={`Create project in ${name}`}
          aria-label={`Create project in ${name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
        <button
          type="button"
          onClick={onProjects}
          className="rounded-lg bg-muted/40 px-2 py-2 text-left transition hover:bg-primary/10"
        >
          <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Projects here
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            {projectCount}
          </span>
        </button>

        <button
          type="button"
          onClick={hasChildren ? onToggle : undefined}
          disabled={!hasChildren}
          className="rounded-lg bg-muted/40 px-2 py-2 text-left transition hover:bg-muted disabled:cursor-default"
        >
          <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Child units
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-foreground">
            {hasChildren ? (
              expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
              )
            ) : (
              <Waypoints className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {childCount}
          </span>
        </button>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  loading,
  onOpen,
}: {
  project: OrganizationSetupTreeProject;
  loading: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="aspect-[16/7] overflow-hidden bg-muted">
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={project.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <FolderKanban className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {project.name}
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {project.code}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
            {project.status_display}
          </span>
        </div>
        <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
          {project.project_number ? <p>{project.project_number}</p> : null}
          {project.location ? (
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.location}
            </p>
          ) : null}
        </div>
        <PrimaryButton
          className="mt-3 w-full"
          onClick={onOpen}
          loading={loading}
        >
          <FolderOpen className="h-4 w-4" />
          Open project & continue
        </PrimaryButton>
      </div>
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
