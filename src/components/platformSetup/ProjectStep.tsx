import { useMemo, useState } from "react";
import { FolderPlus, MapPin } from "lucide-react";
import type { Organization, OrganizationUnit } from "@/features/organizations";
import { useCreateProject, useProjects, type Project } from "@/features/projects";
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

export function ProjectStep({
  organization,
  organizationUnit,
  onBack,
  onCreated,
}: {
  organization: Organization;
  organizationUnit: OrganizationUnit | null;
  onBack: () => void;
  onCreated: (project: Project) => void;
}) {
  const createProject = useCreateProject();
  const projectsQuery = useProjects({ organization: organization.id, page_size: 500, ordering: "name" });
  const [form, setForm] = useState({ name: "", project_number: "", location: "", description: "" });
  const existingProjects = projectsQuery.data?.results ?? [];

  const generatedCode = useMemo(
    () => generateUniqueSetupCode(form.name, existingProjects.map((project) => project.code), 80),
    [form.name, existingProjects]
  );
  const codeError = form.name.trim() ? getSetupCodeError(generatedCode, 80) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !generatedCode || codeError) return;

    const project = await createProject.mutateAsync({
      organization: organization.id,
      organization_unit: organizationUnit?.id ?? null,
      name: form.name.trim(),
      code: generatedCode,
      project_number: form.project_number.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      grouping_config: {},
      is_active: true,
    });
    onCreated(project);
  };

  return (
    <StepCard
      eyebrow="Project provisioning"
      title="Create the project"
      description={`The project will be owned by ${organization.name}${organizationUnit ? ` and scoped to ${organizationUnit.name}` : " at organization level"}. It starts in Draft according to the backend lifecycle.`}
    >
      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FolderPlus className="h-5 w-5" /></span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organization</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{organization.name}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organization unit</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{organizationUnit?.name ?? "Organization level"}</p>
          <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
            After project creation, the wizard creates the physical structure levels, execution scheme and project-module access in that order.
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SetupField label="Project name" required><input className={inputClass} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Tower A Construction" /></SetupField>
            <SetupField label="Project code" required hint="Auto-generated from the project name and made unique inside this organization.">
              <input className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")} value={generatedCode} readOnly tabIndex={-1} placeholder="auto-generated" />
              {codeError ? <span className="block text-[11px] text-destructive">{codeError}</span> : null}
            </SetupField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SetupField label="Project number"><input className={inputClass} value={form.project_number} onChange={(e) => setForm((current) => ({ ...current, project_number: e.target.value }))} placeholder="PRJ-2026-001" /></SetupField>
            <SetupField label="Location"><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className={`${inputClass} pl-9`} value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} placeholder="Mumbai, India" /></div></SetupField>
          </div>
          <SetupField label="Description"><textarea className={textareaClass} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Project scope and summary" /></SetupField>
          {projectsQuery.isError ? <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-muted-foreground">Existing project codes could not be preloaded. The backend will still perform the final uniqueness validation.</p> : null}
          {createProject.isError ? <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{getApiErrorMessage(createProject.error, "Unable to create project.")}</p> : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
            <SecondaryButton onClick={onBack}>Back</SecondaryButton>
            <PrimaryButton type="submit" loading={createProject.isPending} disabled={!form.name.trim() || !generatedCode || Boolean(codeError)}>Create project & continue</PrimaryButton>
          </div>
        </form>
      </div>
    </StepCard>
  );
}
