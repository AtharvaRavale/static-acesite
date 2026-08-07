import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-20 rounded-lg" />
    </div>
  );
}

export function FilterBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Skeleton className="h-9 w-64 rounded-lg" />
      <Skeleton className="h-9 w-36 rounded-lg" />
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}

/** Matches ModuleCard: icon + status, title + 2-line description, footer meta. */
export function ModuleCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <div className="mt-3 flex-1 space-y-2">
        <Skeleton className="h-4 w-[75%]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[83%]" />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-2.5 w-10" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

export function ModuleGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }, (_, i) => (
            <ModuleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Matches Module Studio list table columns: Name, Category, Status, Version. */
export function TableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-3.5 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className="bg-card">
              {Array.from({ length: columns }, (_, col) => (
                <td key={col} className="px-4 py-3">
                  {col === 0 ? (
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  ) : (
                    <Skeleton
                      className={cn(
                        "h-3.5",
                        col === 1 && "w-16",
                        col === 2 && "w-14 rounded-full",
                        col === 3 && "w-10",
                        col > 3 && "w-20"
                      )}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Organization matrix: sticky first column + org header cells + status dots. */
export function MatrixTableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-3 text-left">
              <Skeleton className="h-3.5 w-36" />
            </th>
            {Array.from({ length: columns }, (_, i) => (
              <th
                key={i}
                className="border-b border-border bg-muted/30 px-4 py-3 text-center"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </td>
              {Array.from({ length: columns }, (_, col) => (
                <td key={col} className="border-b border-border px-4 py-3">
                  <div className="flex items-center justify-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Matches ModuleDetailDrawer sections: icon/title, badges, description, meta grid, assignments. */
export function DrawerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-[83%]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssignmentListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border p-3"
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
