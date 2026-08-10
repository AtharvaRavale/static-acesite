import { CheckCircle2, GitBranch, Layers3, PackageCheck, RotateCcw } from "lucide-react";
import type { PlatformSetupState } from "./types";
import { PrimaryButton, StepCard } from "./ui";

export function SetupCompleteStep({ state, onStartAnother }: { state: PlatformSetupState; onStartAnother: () => void }) {
  return (
    <StepCard
      eyebrow="Provisioning complete"
      title="Organization and project setup is ready"
      description="The wizard has completed the tenant/project foundation in dependency order. The created records now remain available to the normal project and module workflows."
    >
      <div className="flex flex-col items-center py-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-success/10 text-success"><CheckCircle2 className="h-8 w-8" /></span>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{state.project?.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{state.organization?.name} · {state.organizationUnit?.name ?? "Organization level"}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Layers3} label="Structure levels" value={state.structureLevels.length} detail={state.structureLevels.map((item) => item.name).join(" → ") || "None"} />
        <SummaryCard icon={GitBranch} label="Execution scheme" value={state.executionLevels.length} detail={state.executionScheme?.name ?? "None"} />
        <SummaryCard icon={PackageCheck} label="Project modules" value={state.projectModuleAccesses.length} detail={state.projectModuleAccesses.map((item) => item.module_name).join(", ") || "None"} />
        <SummaryCard icon={CheckCircle2} label="Flow" value={state.branch === "new" ? 1 : 2} detail={state.branch === "new" ? "New organization" : "Existing organization"} />
      </div>
      <div className="mt-6 flex justify-center"><PrimaryButton onClick={onStartAnother}><RotateCcw className="h-4 w-4" /> Start another setup</PrimaryButton></div>
    </StepCard>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; detail: string }) {
  return <div className="rounded-xl border border-border bg-background p-4 text-left"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" />{label}</div><p className="mt-2 text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{detail}</p></div>;
}
