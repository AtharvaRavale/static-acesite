import { Building2, Handshake } from "lucide-react";
import type { Department } from "@/features/organizations";
import { cn } from "@/lib/utils";

export function DepartmentListPanel({
  departments,
  assignmentCounts,
  selectedId,
  search,
  statusFilter,
  loading,
  onSearchChange,
  onStatusFilterChange,
  onSelect,
}: {
  departments: Department[];
  assignmentCounts: Map<number, number>;
  selectedId: number | null;
  search: string;
  statusFilter: "all" | "active" | "inactive";
  loading?: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "active" | "inactive") => void;
  onSelect: (id: number) => void;
}) {
  return (
    <aside className="flex h-full min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:w-[300px] xl:shrink-0">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Departments
        </p>
        <input
          className="mt-2 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="Search departments…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="mt-2 flex gap-1 rounded-lg border border-border p-0.5">
          {(["all", "active", "inactive"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onStatusFilterChange(value)}
              className={cn(
                "h-7 flex-1 rounded-md text-[11px] font-medium capitalize",
                statusFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))
        ) : departments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs leading-5 text-muted-foreground">
            No departments found. Create a department to start mapping coverage.
          </div>
        ) : (
          departments.map((department) => {
            const count = assignmentCounts.get(department.id) ?? 0;
            const selected = selectedId === department.id;
            return (
              <button
                key={department.id}
                type="button"
                onClick={() => onSelect(department.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                  selected
                    ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15"
                    : "border-border hover:border-primary/20 hover:bg-muted/20"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/5">
                  {department.image ? (
                    <img
                      src={department.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {department.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {department.code || "No code"} · {count} unit
                    {count === 1 ? "" : "s"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        department.is_active
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {department.is_active ? "Active" : "Inactive"}
                    </span>
                    {department.partner_organization ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-700">
                        <Handshake className="h-2.5 w-2.5" />
                        Partner
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
