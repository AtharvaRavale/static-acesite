import { useEffect, useMemo, useState } from "react";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import {
  useCreateExecutionLevel,
  useCreateExecutionScheme,
  useExecutionLevels,
  useExecutionSchemes,
  useUpdateExecutionLevel,
  useUpdateExecutionScheme,
  type ExecutionFlowMode,
  type ExecutionLevel,
  type ExecutionScheme,
} from "@/features/execution";
import type { Project } from "@/features/projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import {
  getSetupCodeError,
  inputClass,
  PrimaryButton,
  SecondaryButton,
  SetupField,
  slugifySetupValue,
  StepCard,
  textareaClass,
} from "./ui";

type LevelDraft = {
  key: string;
  id: number | null;
  sequence: number | null;
  name: string;
  mode: ExecutionFlowMode;
};

const DEFAULT_EXECUTION_LEVELS: LevelDraft[] = [
  { key: "phase", id: null, sequence: null, name: "Phase", mode: "manual" },
  { key: "stage", id: null, sequence: null, name: "Stage", mode: "manual" },
  { key: "activity", id: null, sequence: null, name: "Activity", mode: "manual" },
];

export function ExecutionStep({
  project,
  onBack,
  onComplete,
}: {
  project: Project;
  onBack: () => void;
  onComplete: (scheme: ExecutionScheme, levels: ExecutionLevel[]) => void;
}) {
  const [scheme, setScheme] = useState({ id: null as number | null, name: "Main Execution Scheme", description: "Default execution hierarchy for the project." });
  const [levels, setLevels] = useState<LevelDraft[]>(DEFAULT_EXECUTION_LEVELS);
  const [hydratedProject, setHydratedProject] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const schemesQuery = useExecutionSchemes({ project: project.id, page_size: 500 });
  const levelsQuery = useExecutionLevels({ project: project.id, page_size: 500 });
  const createScheme = useCreateExecutionScheme();
  const updateScheme = useUpdateExecutionScheme();
  const createLevel = useCreateExecutionLevel();
  const updateLevel = useUpdateExecutionLevel();
  const busy = createScheme.isPending || updateScheme.isPending || createLevel.isPending || updateLevel.isPending;

  useEffect(() => {
    if (!schemesQuery.data || !levelsQuery.data || hydratedProject === project.id) return;
    const schemes = schemesQuery.data.results.filter((item) => item.is_active);
    const existingScheme = schemes.find((item) => item.is_current) ?? schemes[0] ?? null;
    if (existingScheme) {
      const existingLevels = levelsQuery.data.results
        .filter((level) => level.scheme === existingScheme.id && level.is_active)
        .sort((a, b) => a.sequence - b.sequence || a.id - b.id);
      setScheme({ id: existingScheme.id, name: existingScheme.name, description: existingScheme.description ?? "" });
      setLevels(existingLevels.map((level) => ({
        key: `existing-${level.id}`,
        id: level.id,
        sequence: level.sequence,
        name: level.name,
        mode: level.default_flow_mode,
      })));
    } else {
      setScheme({ id: null, name: "Main Execution Scheme", description: "Default execution hierarchy for the project." });
      setLevels(DEFAULT_EXECUTION_LEVELS.map((row) => ({ ...row })));
    }
    setHydratedProject(project.id);
  }, [hydratedProject, levelsQuery.data, project.id, schemesQuery.data]);

  const hasExisting = scheme.id !== null;
  const schemeCode = useMemo(() => slugifySetupValue(scheme.name, 100), [scheme.name]);
  const schemeCodeError = scheme.name.trim() ? getSetupCodeError(schemeCode, 100) : null;
  const levelCodes = useMemo(() => levels.map((level) => slugifySetupValue(level.name, 100)), [levels]);
  const hasInvalidLevelCode = levelCodes.some((code) => Boolean(getSetupCodeError(code, 100)));
  const hasDuplicateLevelCode = new Set(levelCodes.filter(Boolean)).size !== levelCodes.filter(Boolean).length;
  const loadingExisting = schemesQuery.isLoading || levelsQuery.isLoading || hydratedProject !== project.id;

  const save = async () => {
    if (
      !scheme.name.trim() || !schemeCode || schemeCodeError || levels.length === 0
      || levels.some((level) => !level.name.trim()) || hasInvalidLevelCode || hasDuplicateLevelCode
    ) return;

    setSubmitError(null);
    try {
      let resolvedScheme: ExecutionScheme;
      if (scheme.id !== null) {
        resolvedScheme = await updateScheme.mutateAsync({
          id: scheme.id,
          payload: {
            name: scheme.name.trim(),
            code: schemeCode,
            description: scheme.description.trim(),
            is_current: true,
            is_active: true,
          },
        });
      } else {
        const byCode = (schemesQuery.data?.results ?? []).find((item) => item.code.toLowerCase() === schemeCode);
        resolvedScheme = byCode ?? await createScheme.mutateAsync({
          project: project.id,
          name: scheme.name.trim(),
          code: schemeCode,
          description: scheme.description.trim(),
          is_current: true,
          is_active: true,
        });
      }

      const existing = (levelsQuery.data?.results ?? []).filter((level) => level.scheme === resolvedScheme.id);
      const existingById = new Map(existing.map((level) => [level.id, level]));
      const maxExistingSequence = Math.max(0, ...existing.map((level) => level.sequence));
      let appended = 0;
      const resolvedLevels: ExecutionLevel[] = [];

      for (let index = 0; index < levels.length; index += 1) {
        const draft = levels[index];
        const code = slugifySetupValue(draft.name, 100);
        if (draft.id !== null) {
          const previous = existingById.get(draft.id);
          if (!previous) continue;
          const payload = {
            name: draft.name.trim(),
            code,
            default_flow_mode: draft.mode,
            visible_in_navigation: true,
            is_active: true,
          };
          const changed = previous.name !== payload.name
            || previous.code !== payload.code
            || previous.default_flow_mode !== payload.default_flow_mode
            || !previous.visible_in_navigation
            || !previous.is_active;
          resolvedLevels.push(changed ? await updateLevel.mutateAsync({ id: draft.id, payload }) : previous);
          continue;
        }

        appended += 1;
        resolvedLevels.push(await createLevel.mutateAsync({
          scheme: resolvedScheme.id,
          name: draft.name.trim(),
          code,
          sequence: hasExisting ? maxExistingSequence + appended : index + 1,
          default_flow_mode: draft.mode,
          visible_in_navigation: true,
          is_active: true,
        }));
      }
      onComplete(resolvedScheme, [...resolvedLevels].sort((a, b) => a.sequence - b.sequence || a.id - b.id));
    } catch (error) {
      setSubmitError(error);
    }
  };

  return (
    <StepCard
      eyebrow="Execution engine"
      title={hasExisting ? "Review and extend the execution scheme" : "Create the execution scheme"}
      description={hasExisting
        ? "The project's current execution scheme and levels are loaded below. Update existing values or add more levels, then save and continue to Project Modules."
        : "Configure the project's current execution scheme and its ordered execution levels. This uses the existing ExecutionScheme and ExecutionLevel backend APIs."}
    >
      {loadingExisting ? <div className="mb-4 rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">Loading the project's existing execution configuration…</div> : null}
      {hasExisting ? (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
          Existing scheme <span className="font-semibold text-foreground">#{scheme.id}</span> is being edited in place. Existing execution level order is preserved; new levels are appended.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-muted/15 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary" /><p className="text-sm font-semibold text-foreground">Scheme identity</p></div>
          <div className="space-y-4">
            <SetupField label="Scheme name" required><input className={inputClass} value={scheme.name} onChange={(e) => setScheme((current) => ({ ...current, name: e.target.value }))} /></SetupField>
            <SetupField label="Code" required hint="Auto-generated from the scheme name and sent to the execution API.">
              <input className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")} value={schemeCode} readOnly tabIndex={-1} placeholder="auto-generated" />
              {schemeCodeError ? <span className="block text-[11px] text-destructive">{schemeCodeError}</span> : null}
            </SetupField>
            <SetupField label="Description"><textarea className={textareaClass} value={scheme.description} onChange={(e) => setScheme((current) => ({ ...current, description: e.target.value }))} /></SetupField>
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">Execution levels</p><p className="text-xs text-muted-foreground">Top to bottom sequence</p></div><span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary">{levels.length} levels</span></div>
          <div className="space-y-2">
            {levels.map((level, index) => {
              const generatedCode = slugifySetupValue(level.name, 100);
              const codeError = level.name.trim() ? getSetupCodeError(generatedCode, 100) : null;
              return (
                <div key={level.key} className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[32px_1fr_0.8fr_0.65fr_auto] sm:items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-xs font-bold text-primary">{level.sequence ?? index + 1}</span>
                  <div>
                    <input className={inputClass} value={level.name} onChange={(e) => setLevels((current) => current.map((item) => item.key === level.key ? { ...item, name: e.target.value } : item))} placeholder="Level name" />
                    <p className="mt-1 text-[10px] text-muted-foreground">{level.id ? `Existing #${level.id}` : "New level"}</p>
                  </div>
                  <div>
                    <input className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")} value={generatedCode} readOnly tabIndex={-1} placeholder="auto-generated" />
                    {codeError ? <span className="mt-1 block text-[10px] text-destructive">{codeError}</span> : null}
                  </div>
                  <select className={inputClass} value={level.mode} onChange={(e) => setLevels((current) => current.map((item) => item.key === level.key ? { ...item, mode: e.target.value as ExecutionFlowMode } : item))}><option value="manual">Manual</option><option value="automatic">Automatic</option></select>
                  <button type="button" disabled={level.id !== null} onClick={() => setLevels((current) => current.filter((item) => item.key !== level.key))} className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30" title={level.id ? "Existing levels are edited in place" : "Remove new level"}><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={() => setLevels((current) => [...current, { key: crypto.randomUUID(), id: null, sequence: null, name: "", mode: "manual" }])} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-border px-4 text-xs font-semibold text-primary hover:border-primary/50"><Plus className="h-4 w-4" /> Add execution level</button>
        </div>
      </div>
      {hasDuplicateLevelCode ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">Two execution level names generate the same code. Rename one before continuing.</p> : null}
      {submitError ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(submitError, "Unable to save execution scheme.")}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <SecondaryButton onClick={onBack} disabled={busy}>Back</SecondaryButton>
        <PrimaryButton
          onClick={save}
          loading={busy}
          disabled={loadingExisting || !scheme.name.trim() || !schemeCode || Boolean(schemeCodeError) || levels.length === 0 || levels.some((level) => !level.name.trim()) || hasInvalidLevelCode || hasDuplicateLevelCode}
        >
          {hasExisting ? "Save execution & continue" : "Create execution scheme & continue"}
        </PrimaryButton>
      </div>
    </StepCard>
  );
}
