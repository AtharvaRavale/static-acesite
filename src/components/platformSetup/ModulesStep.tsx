import { useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole, Package, ShieldCheck } from "lucide-react";
import {
  useEnableOrganizationModule,
  useOrganizationAvailableModules,
  type Organization,
} from "@/features/organizations";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { PrimaryButton, SecondaryButton, StepCard } from "./ui";

export function ModulesStep({
  organization,
  onBack,
  onComplete,
}: {
  organization: Organization;
  onBack: () => void;
  onComplete: () => void;
}) {
  const query = useOrganizationAvailableModules(organization.id);
  const enableModule = useEnableOrganizationModule();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<unknown>(null);

  const modules = useMemo(() => query.data ?? [], [query.data]);

  useEffect(() => {
    if (!query.data) return;
    setSelected(
      new Set(
        query.data
          .filter((item) => item.is_core || item.organization_assignment?.is_available)
          .map((item) => item.id)
      )
    );
  }, [query.data]);

  const toggle = (id: number, locked: boolean) => {
    if (locked) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSubmitError(null);
    try {
      const toEnable = modules.filter(
        (item) => selected.has(item.id) && !item.organization_assignment?.is_available
      );
      for (const module of toEnable) {
        await enableModule.mutateAsync({ id: organization.id, moduleId: module.id });
      }
      await query.refetch();
      onComplete();
    } catch (error) {
      setSubmitError(error);
    }
  };

  return (
    <StepCard
      eyebrow="New organization flow"
      title="Provision organization modules"
      description={`Only modules whose availability is Organization or Both are returned by the backend for ${organization.name}. Core modules are automatically provisioned and remain locked on.`}
    >
      {query.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : query.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(query.error, "Unable to load available organization modules.")}
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{selected.size} selected</span>
            <span>·</span>
            <span>{modules.length} organization-eligible modules</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => {
              const available = Boolean(module.organization_assignment?.is_available);
              const locked = module.is_core || Boolean(module.organization_assignment?.is_locked);
              const checked = selected.has(module.id);
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => toggle(module.id, locked)}
                  className={cn(
                    "relative min-h-36 rounded-xl border p-4 text-left transition",
                    checked ? "border-primary/50 bg-primary/[0.045] shadow-sm" : "border-border bg-background hover:border-primary/30",
                    locked && "cursor-default"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-muted/60 text-primary">
                      {module.image_url || module.image ? (
                        <img src={module.image_url ?? module.image ?? ""} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4.5 w-4.5" />
                      )}
                    </span>
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {checked ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{module.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{module.code}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">{module.availability}</span>
                    {module.is_core ? <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-primary"><LockKeyhole className="h-2.5 w-2.5" /> Core</span> : null}
                    {available ? <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-success">Already enabled</span> : null}
                  </div>
                </button>
              );
            })}
          </div>
          {modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No organization-eligible product modules are active in the catalog.</div>
          ) : null}
        </>
      )}

      {submitError ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {getApiErrorMessage(submitError, "Unable to provision selected modules.")}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <SecondaryButton onClick={onBack}>Back</SecondaryButton>
        <PrimaryButton onClick={save} loading={enableModule.isPending} disabled={query.isLoading || query.isError || modules.length === 0}>
          Save modules & continue
        </PrimaryButton>
      </div>
    </StepCard>
  );
}
