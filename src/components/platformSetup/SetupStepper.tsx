import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SetupStepDefinition, SetupStepId } from "./types";

export function SetupStepper({
  steps,
  activeStep,
  completedSteps,
}: {
  steps: SetupStepDefinition[];
  activeStep: SetupStepId;
  completedSteps: Set<SetupStepId>;
}) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card p-3 shadow-sm">
      <ol className="flex min-w-max items-start">
        {steps.map((step, index) => {
          const done = completedSteps.has(step.id) || index < activeIndex;
          const active = step.id === activeStep;
          return (
            <li key={step.id} className="flex items-start">
              <div className="flex w-[132px] flex-col items-center px-1 text-center sm:w-[150px]">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && !done && "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",
                    !active && !done && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <p className={cn("mt-2 text-[11px] font-semibold", active ? "text-primary" : "text-foreground")}>
                  {step.shortLabel}
                </p>
                <p className="mt-0.5 hidden max-w-[135px] text-[9px] leading-3 text-muted-foreground sm:block">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 ? (
                <div className={cn("mt-[17px] h-px w-6 sm:w-10", index < activeIndex ? "bg-primary" : "bg-border")} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
