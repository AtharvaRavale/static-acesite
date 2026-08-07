import { useMemo, useRef, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  useCreateLifecyclePhase,
  useDeleteLifecyclePhase,
  useLifecyclePhases,
  useReorderLifecyclePhases,
  type LifecyclePhase,
  type ProductModule,
  type ProductModuleLifecyclePhase,
} from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { TableSkeleton } from "@/components/ui/skeletonPatterns";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const PHASES: { id: LifecyclePhase; label: string }[] = [
  { id: "pre_construction", label: "Pre-construction" },
  { id: "during_construction", label: "During construction" },
  { id: "post_construction", label: "Post-construction" },
];

type DragPayload = {
  id: number;
  fromPhase: LifecyclePhase;
};

export function LifecycleTab({
  moduleId,
  module,
}: {
  moduleId: number;
  module: ProductModule;
}) {
  const phasesQuery = useLifecyclePhases({ module: moduleId, page_size: 100 });
  const createPhase = useCreateLifecyclePhase();
  const deletePhase = useDeleteLifecyclePhase();
  const reorderPhases = useReorderLifecyclePhases();

  const dragRef = useRef<DragPayload | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<LifecyclePhase | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const items = phasesQuery.data?.results ?? [];

  const byPhase = useMemo(() => {
    const map: Record<LifecyclePhase, ProductModuleLifecyclePhase[]> = {
      pre_construction: [],
      during_construction: [],
      post_construction: [],
    };
    for (const item of items) {
      map[item.phase]?.push(item);
    }
    for (const phase of PHASES) {
      map[phase.id].sort((a, b) => a.sequence - b.sequence || a.id - b.id);
    }
    return map;
  }, [items]);

  if (!module.is_lifecycle_specific) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">Lifecycle mapping is disabled</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Enable lifecycle-specific on this module to assign construction phases.
        </p>
      </div>
    );
  }

  const commitReorder = async (
    next: Record<LifecyclePhase, ProductModuleLifecyclePhase[]>
  ) => {
    const payloadItems = PHASES.flatMap((phase) =>
      next[phase.id].map((item, index) => ({
        id: item.id,
        phase: phase.id,
        sequence: index,
      }))
    );
    try {
      setActionError(null);
      await reorderPhases.mutateAsync({ items: payloadItems });
    } catch (error) {
      setActionError(error);
    }
  };

  const handleDrop = async (toPhase: LifecyclePhase, targetIndex?: number) => {
    const payload = dragRef.current;
    if (!payload) return;
    dragRef.current = null;
    setDragOverPhase(null);

    const next: Record<LifecyclePhase, ProductModuleLifecyclePhase[]> = {
      pre_construction: [...byPhase.pre_construction],
      during_construction: [...byPhase.during_construction],
      post_construction: [...byPhase.post_construction],
    };

    const fromList = next[payload.fromPhase];
    const fromIndex = fromList.findIndex((item) => item.id === payload.id);
    if (fromIndex < 0) return;
    const [moved] = fromList.splice(fromIndex, 1);
    if (!moved) return;

    const toList = next[toPhase];
    const insertAt =
      targetIndex === undefined
        ? toList.length
        : Math.max(0, Math.min(targetIndex, toList.length));

    // Adjust index when moving within the same column after removal
    const adjustedIndex =
      payload.fromPhase === toPhase && fromIndex < insertAt ? insertAt - 1 : insertAt;

    toList.splice(adjustedIndex, 0, { ...moved, phase: toPhase });
    await commitReorder(next);
  };

  const handleAdd = async (phase: LifecyclePhase) => {
    try {
      setActionError(null);
      await createPhase.mutateAsync({
        module: moduleId,
        phase,
        sequence: byPhase[phase].length,
        is_active: true,
      });
    } catch (error) {
      setActionError(error);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      setActionError(null);
      await deletePhase.mutateAsync(id);
    } catch (error) {
      setActionError(error);
    }
  };

  const isLoading = phasesQuery.isLoading && !phasesQuery.data;

  return (
    <div className="space-y-3">
      {phasesQuery.error && (
        <ApiErrorBanner error={phasesQuery.error} fallback="Failed to load lifecycle phases." />
      )}
      {actionError != null && (
        <ApiErrorBanner
          error={actionError}
          fallback={getApiErrorMessage(actionError, "Lifecycle update failed.")}
        />
      )}

      {isLoading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {PHASES.map((phase) => (
            <div
              key={phase.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverPhase(phase.id);
              }}
              onDragLeave={() => setDragOverPhase((current) => (current === phase.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                void handleDrop(phase.id);
              }}
              className={cn(
                "flex min-h-[280px] flex-col rounded-xl border bg-card",
                dragOverPhase === phase.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">{phase.label}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {byPhase[phase.id].length} mapping
                    {byPhase[phase.id].length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAdd(phase.id)}
                  disabled={createPhase.isPending}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1.5 p-2">
                {byPhase[phase.id].length === 0 && (
                  <p className="px-1 py-6 text-center text-[11px] text-muted-foreground">
                    Drop here or add mapping
                  </p>
                )}
                {byPhase[phase.id].map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => {
                      dragRef.current = { id: item.id, fromPhase: phase.id };
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverPhase(phase.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDrop(phase.id, index);
                    }}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-left shadow-sm"
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.phase_display}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        seq {item.sequence}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.id)}
                      disabled={deletePhase.isPending}
                      className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
