import type {
  ProductModuleClassification,
  ProductModuleMaturity,
} from "@/features/platformModules";
import { cn } from "@/lib/utils";

const maturityStyles: Record<ProductModuleMaturity, string> = {
  alpha: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  beta: "bg-warning/10 text-warning",
  ga: "bg-success/10 text-success",
  deprecated: "bg-destructive/10 text-destructive",
  retired: "bg-muted text-muted-foreground",
};

const classificationStyles: Record<ProductModuleClassification, string> = {
  platform_only: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  core: "bg-primary/10 text-primary",
  optional: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

const classificationLabels: Record<ProductModuleClassification, string> = {
  platform_only: "Platform Only",
  core: "Core",
  optional: "Optional",
};

export function MaturityBadge({
  maturity,
  label,
  className,
}: {
  maturity: ProductModuleMaturity;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        maturityStyles[maturity],
        className
      )}
    >
      {label ?? maturity}
    </span>
  );
}

export function ClassificationBadge({
  classification,
  className,
}: {
  classification: ProductModuleClassification;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
        classificationStyles[classification],
        className
      )}
    >
      {classificationLabels[classification]}
    </span>
  );
}

export function ActivePublishedBadges({
  isActive,
  isPublished,
}: {
  isActive: boolean;
  isPublished: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isActive ? "bg-success" : "bg-muted-foreground"
          )}
        />
        {isActive ? "Active" : "Inactive"}
      </span>
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
          isPublished ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {isPublished ? "Published" : "Draft"}
      </span>
    </div>
  );
}

export { classificationLabels };
