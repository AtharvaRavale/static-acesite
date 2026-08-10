import { useMemo, useState } from "react";
import { Building2, CheckCircle2, FolderCog, Network, PackageCheck, Sparkles } from "lucide-react";
import { OrganizationStep } from "@/components/platformSetup/OrganizationStep";
import { ModulesStep } from "@/components/platformSetup/ModulesStep";
import { OrganizationUnitStep } from "@/components/platformSetup/OrganizationUnitStep";
import { StructureStep } from "@/components/platformSetup/StructureStep";
import { ExecutionStep } from "@/components/platformSetup/ExecutionStep";
import { MasterAvailabilityStep } from "@/components/platformSetup/MasterAvailabilityStep";
import { ProjectModulesStep } from "@/components/platformSetup/ProjectModulesStep";
import { SetupCompleteStep } from "@/components/platformSetup/SetupCompleteStep";
import { SetupStepper } from "@/components/platformSetup/SetupStepper";
import type { PlatformSetupState, SetupStepDefinition, SetupStepId } from "@/components/platformSetup/types";

const BASE_STEPS: Record<SetupStepId, SetupStepDefinition> = {
  organization: { id: "organization", label: "Organization", shortLabel: "Organization", description: "Choose existing or create new" },
  modules: { id: "modules", label: "Organization Modules", shortLabel: "Modules", description: "Provision eligible tenant modules" },
  unit: { id: "unit", label: "Project Placement", shortLabel: "Placement", description: "Choose org/unit in hierarchy and create project" },
  structure: { id: "structure", label: "Physical Structure", shortLabel: "Structure", description: "Create levels and transitions" },
  availability: { id: "availability", label: "Master Availability", shortLabel: "Masters", description: "Room and flat master availability" },
  execution: { id: "execution", label: "Execution Scheme", shortLabel: "Execution", description: "Create scheme and levels" },
  access: { id: "access", label: "Project Modules", shortLabel: "Access", description: "Enable tenant modules in project" },
  complete: { id: "complete", label: "Complete", shortLabel: "Complete", description: "Review the setup" },
};

const INITIAL_STATE: PlatformSetupState = {
  branch: null,
  organization: null,
  organizationUnit: null,
  project: null,
  structureLevels: [],
  executionScheme: null,
  executionLevels: [],
  projectModuleAccesses: [],
};

export function PlatformSetupWizardPage() {
  const [state, setState] = useState<PlatformSetupState>(INITIAL_STATE);
  const [activeStep, setActiveStep] = useState<SetupStepId>("organization");
  const [completedSteps, setCompletedSteps] = useState<Set<SetupStepId>>(new Set());

  const hasFlatTemplateLevel = useMemo(
    () => state.structureLevels.some((level) => level.is_active && level.is_flat_template_applicable),
    [state.structureLevels]
  );

  const steps = useMemo(() => {
    const order: SetupStepId[] = ["organization"];
    if (state.branch === "new") order.push("modules");
    order.push("unit", "structure");
    if (hasFlatTemplateLevel) order.push("availability");
    order.push("execution", "access", "complete");
    return order.map((id) => BASE_STEPS[id]);
  }, [hasFlatTemplateLevel, state.branch]);

  const markComplete = (step: SetupStepId) => setCompletedSteps((current) => new Set([...current, step]));
  const reset = () => { setState(INITIAL_STATE); setCompletedSteps(new Set()); setActiveStep("organization"); };

  return (
    <div className="space-y-5 pb-8">
      <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Platform Superuser Setup</div>
            <h1 className="mt-2 font-logo text-2xl font-normal tracking-tight text-foreground sm:text-3xl">Organization & Project Provisioning</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">A dependency-aware setup flow from organization selection through organization units, project structure, execution hierarchy and project-level module access.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[460px]">
            <MiniStat icon={Building2} label="Tenant" value={state.organization ? "Ready" : "Select"} />
            <MiniStat icon={FolderCog} label="Project" value={state.project ? "Ready" : "Pending"} />
            <MiniStat icon={Network} label="Structure" value={String(state.structureLevels.length)} />
            <MiniStat icon={PackageCheck} label="Modules" value={String(state.projectModuleAccesses.length)} />
          </div>
        </div>
      </section>

      <SetupStepper steps={steps} activeStep={activeStep} completedSteps={completedSteps} />

      {activeStep === "organization" ? <OrganizationStep onOrganizationReady={(organization, branch) => {
        setState({ ...INITIAL_STATE, branch, organization });
        setCompletedSteps(new Set(["organization"]));
        setActiveStep(branch === "new" ? "modules" : "unit");
      }} /> : null}

      {activeStep === "modules" && state.organization ? <ModulesStep organization={state.organization} onBack={() => setActiveStep("organization")} onComplete={() => { markComplete("modules"); setActiveStep("unit"); }} /> : null}

      {activeStep === "unit" && state.organization ? (
        state.project ? (
          <CommittedStep
            icon={FolderCog}
            title="Project placement already committed"
            description={`${state.project.name} (${state.project.code}) was created ${state.organizationUnit ? `inside ${state.organizationUnit.name}` : `at the ${state.organization.name} organization root`}. Reusing the committed project prevents duplicate project creation when navigating backward.`}
            backLabel={state.branch === "new" ? "Back to modules" : "Back to organization"}
            continueLabel="Continue to structure"
            onBack={() => setActiveStep(state.branch === "new" ? "modules" : "organization")}
            onContinue={() => setActiveStep("structure")}
          />
        ) : (
          <OrganizationUnitStep
            organization={state.organization}
            initialSelection={state.organizationUnit}
            onBack={() => setActiveStep(state.branch === "new" ? "modules" : "organization")}
            onProjectCreated={(project, organizationUnit, existingStructureLevels = []) => {
              setState((current) => ({
                ...current,
                project,
                organizationUnit,
                structureLevels: existingStructureLevels,
              }));
              markComplete("unit");
              if (existingStructureLevels.length > 0) markComplete("structure");
              setActiveStep("structure");
            }}
          />
        )
      ) : null}

      {activeStep === "structure" && state.project ? (
        <StructureStep project={state.project} onBack={() => setActiveStep("unit")} onComplete={(structureLevels) => {
          const needsAvailability = structureLevels.some((level) => level.is_active && level.is_flat_template_applicable);
          setState((current) => ({ ...current, structureLevels }));
          markComplete("structure");
          setActiveStep(needsAvailability ? "availability" : "execution");
        }} />
      ) : null}

      {activeStep === "availability" && state.organization && state.project && hasFlatTemplateLevel ? (
        <MasterAvailabilityStep
          organization={state.organization}
          organizationUnit={state.organizationUnit}
          project={state.project}
          onBack={() => setActiveStep("structure")}
          onComplete={() => {
            markComplete("availability");
            setActiveStep("execution");
          }}
        />
      ) : null}

      {activeStep === "execution" && state.project ? (
        <ExecutionStep project={state.project} onBack={() => setActiveStep(hasFlatTemplateLevel ? "availability" : "structure")} onComplete={(executionScheme, executionLevels) => { setState((current) => ({ ...current, executionScheme, executionLevels })); markComplete("execution"); setActiveStep("access"); }} />
      ) : null}

      {activeStep === "access" && state.organization && state.project ? <ProjectModulesStep organization={state.organization} project={state.project} onBack={() => setActiveStep("execution")} onComplete={(projectModuleAccesses) => { setState((current) => ({ ...current, projectModuleAccesses })); markComplete("access"); markComplete("complete"); setActiveStep("complete"); }} /> : null}

      {activeStep === "complete" && state.organization && state.project ? <SetupCompleteStep state={state} onStartAnother={reset} /> : null}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background/80 px-3 py-3 backdrop-blur-sm"><div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" />{label}</div><p className="mt-1.5 text-sm font-semibold text-foreground">{value}</p></div>;
}

function CommittedStep({ icon: Icon, title, description, backLabel, continueLabel, onBack, onContinue }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; backLabel: string; continueLabel: string; onBack: () => void; onContinue: () => void }) {
  return <section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success"><CheckCircle2 className="h-6 w-6" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h2 className="text-lg font-semibold text-foreground">{title}</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={onBack} className="h-11 rounded-xl border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted/50">{backLabel}</button><button type="button" onClick={onContinue} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm">{continueLabel}</button></div></div></div></section>;
}
