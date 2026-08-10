import { useEffect, useMemo, useState } from "react";
import { ArrowDown, GripVertical, Network, Plus, Trash2 } from "lucide-react";
import {
  useCreateLocationHierarchyTransition,
  useCreateProjectStructureLevel,
  useLocationHierarchy,
  useProjectStructureLevels,
  useUpdateProjectStructureLevel,
  type Project,
  type ProjectStructureLevel,
} from "@/features/projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import {
  getSetupCodeError,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  slugifySetupValue,
  StepCard,
} from "./ui";

type DraftLevel = {
  key: string;
  id: number | null;
  originalCode: string | null;
  sequence: number | null;
  name: string;
  checklist_allowed: boolean;
  visible_in_navigation: boolean;
  is_flat_template_applicable: boolean;
};

const DEFAULT_LEVELS: DraftLevel[] = [
  { key: "building", id: null, originalCode: null, sequence: null, name: "Building / Tower", checklist_allowed: false, visible_in_navigation: true, is_flat_template_applicable: false },
  { key: "floor", id: null, originalCode: null, sequence: null, name: "Floor", checklist_allowed: true, visible_in_navigation: true, is_flat_template_applicable: false },
  { key: "unit", id: null, originalCode: null, sequence: null, name: "Flat / Unit", checklist_allowed: true, visible_in_navigation: true, is_flat_template_applicable: true },
  { key: "room", id: null, originalCode: null, sequence: null, name: "Room", checklist_allowed: true, visible_in_navigation: true, is_flat_template_applicable: false },
];

function toDraft(level: ProjectStructureLevel): DraftLevel {
  return {
    key: `existing-${level.id}`,
    id: level.id,
    originalCode: level.code,
    sequence: level.sequence,
    name: level.name,
    checklist_allowed: level.checklist_allowed,
    visible_in_navigation: level.visible_in_navigation,
    is_flat_template_applicable: level.is_flat_template_applicable,
  };
}

export function StructureStep({
  project,
  onBack,
  onComplete,
}: {
  project: Project;
  onBack: () => void;
  onComplete: (levels: ProjectStructureLevel[]) => void;
}) {
  const [levels, setLevels] = useState<DraftLevel[]>(DEFAULT_LEVELS);
  const [hydratedProject, setHydratedProject] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const existingLevels = useProjectStructureLevels({ project: project.id, page_size: 500, ordering: "sequence" });
  const existingTransitions = useLocationHierarchy(project.id, { page_size: 500 });
  const createLevel = useCreateProjectStructureLevel();
  const updateExistingLevel = useUpdateProjectStructureLevel();
  const createTransition = useCreateLocationHierarchyTransition();
  const busy = createLevel.isPending || updateExistingLevel.isPending || createTransition.isPending;

  useEffect(() => {
    if (!existingLevels.data || hydratedProject === project.id) return;
    const rows = [...existingLevels.data.results].sort((a, b) => a.sequence - b.sequence || a.id - b.id);
    setLevels(rows.length > 0 ? rows.map(toDraft) : DEFAULT_LEVELS.map((row) => ({ ...row })));
    setHydratedProject(project.id);
  }, [existingLevels.data, hydratedProject, project.id]);

  const hasExisting = levels.some((level) => level.id !== null);
  const levelCodes = useMemo(() => levels.map((level) => slugifySetupValue(level.name, 100)), [levels]);
  const hasInvalidCode = levelCodes.some((code) => Boolean(getSetupCodeError(code, 100)));
  const hasDuplicateCode = new Set(levelCodes.filter(Boolean)).size !== levelCodes.filter(Boolean).length;

  const updateLevel = (key: string, patch: Partial<DraftLevel>) => {
    setLevels((current) => current.map((level) => level.key === key ? { ...level, ...patch } : level));
  };

  const move = (index: number, direction: -1 | 1) => {
    // Existing level sequence is deliberately stable in resume/edit mode. This
    // avoids temporary unique-sequence collisions and protects already-created
    // location nodes. New-project setup keeps the original reorder UX.
    if (hasExisting) return;
    setLevels((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (levels.length === 0 || levels.some((level) => !level.name.trim()) || hasInvalidCode || hasDuplicateCode) return;
    setSubmitError(null);
    try {
      const currentRows = existingLevels.data?.results ?? [];
      const currentById = new Map(currentRows.map((row) => [row.id, row]));
      const maxExistingSequence = Math.max(0, ...currentRows.map((row) => row.sequence));
      let appended = 0;
      const resolved: ProjectStructureLevel[] = [];

      for (let index = 0; index < levels.length; index += 1) {
        const draft = levels[index];
        const code = slugifySetupValue(draft.name, 100);

        if (draft.id !== null) {
          const previous = currentById.get(draft.id);
          if (!previous) continue;
          const payload = {
            name: draft.name.trim(),
            code,
            checklist_allowed: draft.checklist_allowed,
            visible_in_navigation: draft.visible_in_navigation,
            is_flat_template_applicable: draft.is_flat_template_applicable,
            is_active: true,
          };
          const changed = previous.name !== payload.name
            || previous.code !== payload.code
            || previous.checklist_allowed !== payload.checklist_allowed
            || previous.visible_in_navigation !== payload.visible_in_navigation
            || previous.is_flat_template_applicable !== payload.is_flat_template_applicable
            || !previous.is_active;
          resolved.push(changed ? await updateExistingLevel.mutateAsync({ id: draft.id, payload }) : previous);
          continue;
        }

        appended += 1;
        resolved.push(await createLevel.mutateAsync({
          project: project.id,
          name: draft.name.trim(),
          code,
          sequence: hasExisting ? maxExistingSequence + appended : index + 1,
          checklist_allowed: draft.checklist_allowed,
          visible_in_navigation: draft.visible_in_navigation,
          is_flat_template_applicable: draft.is_flat_template_applicable,
          is_active: true,
        }));
      }

      const ordered = [...resolved].sort((a, b) => a.sequence - b.sequence || a.id - b.id);
      const transitions = existingTransitions.data?.results ?? [];
      for (let index = 0; index < ordered.length; index += 1) {
        const parent = index === 0 ? null : ordered[index - 1];
        const child = ordered[index];
        const exists = transitions.some((transition) =>
          transition.parent_level === (parent?.id ?? null) && transition.child_level === child.id && transition.is_active
        );
        if (!exists) {
          await createTransition.mutateAsync({
            projectId: project.id,
            payload: { parent_level: parent?.id ?? null, child_level: child.id, is_active: true },
          });
        }
      }
      onComplete(ordered);
    } catch (error) {
      setSubmitError(error);
    }
  };

  const loadingExisting = existingLevels.isLoading || existingTransitions.isLoading || hydratedProject !== project.id;

  return (
    <StepCard
      eyebrow="Physical hierarchy"
      title={hasExisting ? "Review and extend project structure" : "Define project structure levels"}
      description={hasExisting
        ? "Existing structure levels are loaded from the project. Edit their names/settings or add more levels; saving reuses existing records and only creates missing levels/transitions."
        : "Create the level definitions first, then the wizard automatically creates ROOT → first level and sequential parent → child transitions so location nodes can be placed legally later."}
    >
      {loadingExisting ? (
        <div className="mb-4 rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">Loading the project's existing structure configuration…</div>
      ) : null}

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
        <Network className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Hierarchy preview</p>
            {hasExisting ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Existing project structure</span> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">ROOT {levels.map((level) => `→ ${level.name || "Unnamed"}`).join(" ")}</p>
          {hasExisting ? <p className="mt-1 text-[10px] text-muted-foreground">Existing level order is preserved; newly added levels are appended after the current last level.</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        {levels.map((level, index) => {
          const generatedCode = slugifySetupValue(level.name, 100);
          const codeError = level.name.trim() ? getSetupCodeError(generatedCode, 100) : null;
          return (
            <div key={level.key} className="rounded-xl border border-border bg-background p-3">
              <div className="grid gap-3 lg:grid-cols-[32px_1fr_0.8fr_auto] lg:items-center">
                <div className="flex items-center justify-center text-muted-foreground"><GripVertical className="h-4 w-4" /></div>
                <div>
                  <input className={inputClass} value={level.name} onChange={(e) => updateLevel(level.key, { name: e.target.value })} placeholder="Level name" />
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{level.id ? `Existing #${level.id}` : "New level"}</span>
                    {level.sequence ? <span>Sequence {level.sequence}</span> : null}
                  </div>
                </div>
                <div>
                  <input className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")} value={generatedCode} readOnly tabIndex={-1} placeholder="auto-generated" />
                  {codeError ? <span className="mt-1 block text-[10px] text-destructive">{codeError}</span> : null}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button type="button" disabled={hasExisting || index === 0} onClick={() => move(index, -1)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-30" title={hasExisting ? "Existing order is preserved" : "Move up"}><ArrowDown className="h-4 w-4 rotate-180" /></button>
                  <button type="button" disabled={hasExisting || index === levels.length - 1} onClick={() => move(index, 1)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-30" title={hasExisting ? "Existing order is preserved" : "Move down"}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" disabled={level.id !== null} onClick={() => setLevels((current) => current.filter((item) => item.key !== level.key))} className="rounded-lg border border-border p-2 text-muted-foreground hover:border-destructive/40 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30" title={level.id ? "Existing levels are edited/deactivated from project administration" : "Remove new level"}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 pl-0 lg:pl-11">
                <Toggle label="Checklist allowed" checked={level.checklist_allowed} onChange={(checked) => updateLevel(level.key, { checklist_allowed: checked })} />
                <Toggle label="Visible in navigation" checked={level.visible_in_navigation} onChange={(checked) => updateLevel(level.key, { visible_in_navigation: checked })} />
                <Toggle label="Flat template applicable" checked={level.is_flat_template_applicable} onChange={(checked) => updateLevel(level.key, { is_flat_template_applicable: checked })} />
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setLevels((current) => [...current, { key: crypto.randomUUID(), id: null, originalCode: null, sequence: null, name: "", checklist_allowed: true, visible_in_navigation: true, is_flat_template_applicable: false }])}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-border px-4 text-xs font-semibold text-primary hover:border-primary/50 hover:bg-primary/5"
      ><Plus className="h-4 w-4" /> Add structure level</button>

      {hasDuplicateCode ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">Two structure level names generate the same code. Rename one of the levels before continuing.</p> : null}
      {submitError ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(submitError, "Unable to save project structure.")}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <SecondaryButton onClick={onBack} disabled={busy}>Back</SecondaryButton>
        <PrimaryButton onClick={save} loading={busy} disabled={loadingExisting || levels.length === 0 || levels.some((level) => !level.name.trim()) || hasInvalidCode || hasDuplicateCode}>{hasExisting ? "Save structure & continue" : "Create structure & transitions"}</PrimaryButton>
      </div>
    </StepCard>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />{label}</label>;
}
