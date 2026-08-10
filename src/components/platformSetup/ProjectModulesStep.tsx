import { useEffect, useMemo, useState } from "react";
import { Check, PackageCheck, Shield, SlidersHorizontal } from "lucide-react";
import {
  useOrganizationModules,
  type Organization,
} from "@/features/organizations";
import {
  useCreateProjectModuleAccess,
  useProjectModuleAccesses,
  useUpdateProjectModuleAccess,
  type Project,
  type ProjectModuleAccess,
} from "@/features/projects";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { PrimaryButton, SecondaryButton, StepCard } from "./ui";

export function ProjectModulesStep({
  organization,
  project,
  onBack,
  onComplete,
}: {
  organization: Organization;
  project: Project;
  onBack: () => void;
  onComplete: (accesses: ProjectModuleAccess[]) => void;
}) {
  const organizationModulesQuery = useOrganizationModules(organization.id);
  const projectAccessQuery = useProjectModuleAccesses({ project: project.id, page_size: 500 });
  const createAccess = useCreateProjectModuleAccess();
  const updateAccess = useUpdateProjectModuleAccess();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<unknown>(null);

  const availableModules = useMemo(
    () => (organizationModulesQuery.data ?? []).filter((assignment) => assignment.is_available),
    [organizationModulesQuery.data]
  );

  useEffect(() => {
    setSelected(new Set(availableModules.map((assignment) => assignment.id)));
  }, [availableModules]);

  const existingAccesses = projectAccessQuery.data?.results ?? [];
  const busy = createAccess.isPending || updateAccess.isPending;

  const save = async () => {
    setSubmitError(null);
    try {
      const resolved: ProjectModuleAccess[] = [];
      for (const assignment of availableModules) {
        if (!selected.has(assignment.id)) continue;
        const existing = existingAccesses.find((access) => access.organization_module === assignment.id);
        if (existing?.is_active) {
          resolved.push(existing);
          continue;
        }
        if (existing) {
          resolved.push(await updateAccess.mutateAsync({
            id: existing.id,
            payload: {
              organization_module: assignment.id,
              is_active: true,
              metadata: { ...existing.metadata, provisioned_via: "platform_setup_wizard" },
            },
          }));
          continue;
        }
        resolved.push(await createAccess.mutateAsync({
          project: project.id,
          organization_module: assignment.id,
          is_active: true,
          metadata: { provisioned_via: "platform_setup_wizard" },
        }));
      }
      onComplete(resolved);
    } catch (error) {
      setSubmitError(error);
    }
  };

  return (
    <StepCard
      eyebrow="Project capability access"
      title="Enable organization modules for this project"
      description={`These are the enabled/read-only modules already owned by ${organization.name}. Selecting one creates ProjectModuleAccess for ${project.name}; it does not create a second organization-module assignment.`}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <InfoBox icon={PackageCheck} label="Available in organization" value={String(availableModules.length)} />
        <InfoBox icon={SlidersHorizontal} label="Selected for project" value={String(selected.size)} />
        <InfoBox icon={Shield} label="Existing project access" value={String(existingAccesses.filter((item) => item.is_active).length)} />
      </div>

      {organizationModulesQuery.isLoading || projectAccessQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : organizationModulesQuery.isError || projectAccessQuery.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(organizationModulesQuery.error ?? projectAccessQuery.error, "Unable to load organization/project module access.")}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {availableModules.map((assignment) => {
            const checked = selected.has(assignment.id);
            const existing = existingAccesses.find((access) => access.organization_module === assignment.id && access.is_active);
            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() => setSelected((current) => {
                  const next = new Set(current);
                  if (next.has(assignment.id)) next.delete(assignment.id); else next.add(assignment.id);
                  return next;
                })}
                className={cn("rounded-xl border p-4 text-left transition", checked ? "border-primary/50 bg-primary/[0.045]" : "border-border bg-background hover:border-primary/30")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{assignment.module_name}</p><p className="mt-1 text-xs text-muted-foreground">{assignment.module_code}</p></div>
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{checked ? <Check className="h-3.5 w-3.5" /> : null}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">{assignment.status.replace("_", " ")}</span>
                  <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[9px] font-semibold uppercase text-primary">{assignment.module_classification}</span>
                  {existing ? <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-success">Already active</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {availableModules.length === 0 && !organizationModulesQuery.isLoading ? (
        <div className="mt-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          This organization has no enabled or read-only organization modules. Enable organization modules before project access can be granted.
        </div>
      ) : null}
      {submitError ? <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(submitError, "Unable to create project module access.")}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <SecondaryButton onClick={onBack} disabled={busy}>Back</SecondaryButton>
        <PrimaryButton onClick={save} loading={busy} disabled={availableModules.length === 0 || selected.size === 0}>Enable project modules & finish</PrimaryButton>
      </div>
    </StepCard>
  );
}

function InfoBox({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-muted/20 p-3"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" />{label}</div><p className="mt-2 text-xl font-semibold text-foreground">{value}</p></div>;
}
