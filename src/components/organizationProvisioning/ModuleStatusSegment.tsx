import type { OrganizationModuleStatus } from "@/features/platformModules";
import { cn } from "@/lib/utils";

const OPTIONS: OrganizationModuleStatus[] = [
  "enabled",
  "read_only",
  "disabled",
];

export function ModuleStatusSegment({
  value,
  onChange,
  disabled,
  allowed = OPTIONS,
}: {
  value: OrganizationModuleStatus | null;
  onChange: (status: OrganizationModuleStatus) => void;
  disabled?: boolean;
  allowed?: OrganizationModuleStatus[];
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {OPTIONS.map((option) => {
        const isAllowed = allowed.includes(option);
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            disabled={disabled || !isAllowed}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              active && option === "enabled" && "border-success/40 bg-success/10 text-success",
              active &&
                option === "read_only" &&
                "border-warning/40 bg-warning/10 text-warning",
              active &&
                option === "disabled" &&
                "border-destructive/40 bg-destructive/10 text-destructive",
              !active && "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {option.replace("_", "-")}
          </button>
        );
      })}
    </div>
  );
}
