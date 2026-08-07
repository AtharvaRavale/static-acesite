import { useState, type FormEvent } from "react";
import {
  useModuleValidation,
  usePublishModule,
  type ProductModule,
  type ProductModuleMaturity,
  type PublishModuleResponse,
} from "@/features/platformModules";
import { MaturityBadge } from "@/components/modules/shared/moduleBadges";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { TableSkeleton } from "@/components/ui/skeletonPatterns";
import { getApiErrorMessage } from "@/lib/api";

const MATURITIES: ProductModuleMaturity[] = [
  "alpha",
  "beta",
  "ga",
  "deprecated",
  "retired",
];

export function PublishTab({
  moduleId,
  module,
}: {
  moduleId: number;
  module: ProductModule;
}) {
  const validationQuery = useModuleValidation(moduleId);
  const publishModule = usePublishModule();

  const [version, setVersion] = useState(module.version || "");
  const [maturity, setMaturity] = useState<ProductModuleMaturity>(module.maturity);
  const [changelog, setChangelog] = useState("");
  const [actionError, setActionError] = useState<unknown>(null);
  const [published, setPublished] = useState<PublishModuleResponse | null>(null);

  const validation = validationQuery.data;
  const hasErrors = (validation?.errors?.length ?? 0) > 0;
  const canPublish = Boolean(validation?.is_valid) && !hasErrors;

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    if (!canPublish) return;
    try {
      setActionError(null);
      const result = await publishModule.mutateAsync({
        id: moduleId,
        payload: {
          version: version.trim() || undefined,
          maturity,
          changelog: changelog.trim() || undefined,
        },
      });
      setPublished(result);
    } catch (error) {
      setActionError(error);
    }
  };

  const isLoading = validationQuery.isLoading && !validationQuery.data;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Validation</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Publish is blocked while validation reports errors.
          </p>
        </div>

        {validationQuery.error && (
          <ApiErrorBanner
            error={validationQuery.error}
            fallback="Failed to load module validation."
          />
        )}

        {isLoading ? (
          <TableSkeleton rows={3} columns={2} />
        ) : validation ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={
                  validation.is_valid
                    ? "rounded-full bg-success/10 px-2 py-0.5 font-medium text-success"
                    : "rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive"
                }
              >
                {validation.is_valid ? "Valid" : "Invalid"}
              </span>
              <span className="font-mono text-muted-foreground">
                {validation.module_code} · v{validation.version}
              </span>
            </div>

            {validation.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-xs font-semibold text-destructive">Errors (block publish)</p>
                <ul className="mt-2 space-y-1.5">
                  {validation.errors.map((issue, index) => (
                    <li key={`err-${index}`} className="text-xs text-destructive">
                      {issue.field ? (
                        <span className="font-mono">{issue.field}: </span>
                      ) : null}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                <p className="text-xs font-semibold text-warning">Warnings</p>
                <ul className="mt-2 space-y-1.5">
                  {validation.warnings.map((issue, index) => (
                    <li key={`warn-${index}`} className="text-xs text-warning">
                      {issue.field ? (
                        <span className="font-mono">{issue.field}: </span>
                      ) : null}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {validation.errors.length === 0 && validation.warnings.length === 0 && (
              <p className="text-xs text-muted-foreground">No validation issues.</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Validation report unavailable.</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Publish</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Create a published version snapshot for this module.
          </p>
        </div>

        {actionError != null && (
          <ApiErrorBanner
            error={actionError}
            fallback={getApiErrorMessage(actionError, "Publish failed.")}
          />
        )}

        <form onSubmit={(e) => void handlePublish(e)} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Version
            </span>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 1.2.0"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Maturity
            </span>
            <select
              value={maturity}
              onChange={(e) => setMaturity(e.target.value as ProductModuleMaturity)}
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {MATURITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Changelog
            </span>
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="What changed in this release?"
            />
          </label>

          <button
            type="submit"
            disabled={!canPublish || publishModule.isPending || isLoading}
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {publishModule.isPending ? "Publishing…" : "Publish module"}
          </button>
        </form>

        {published && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary">Published successfully</p>
            <div className="mt-2 space-y-1 text-xs text-foreground">
              <p>
                Version{" "}
                <span className="font-mono">{published.published_version.version}</span>
              </p>
              <div className="flex items-center gap-2">
                <MaturityBadge
                  maturity={published.published_version.maturity}
                  label={published.published_version.maturity_display}
                />
              </div>
              <p className="text-muted-foreground">
                {published.published_version.published_at
                  ? new Date(published.published_version.published_at).toLocaleString()
                  : "—"}
              </p>
              {published.published_version.checksum && (
                <p className="font-mono text-[10px] text-muted-foreground">
                  {published.published_version.checksum}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
