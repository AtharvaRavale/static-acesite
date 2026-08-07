import {
  useDependencyGraph,
  useImpactAnalysis,
} from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { TableSkeleton } from "@/components/ui/skeletonPatterns";

export function ImpactTab({ moduleId }: { moduleId: number }) {
  const impactQuery = useImpactAnalysis(moduleId);
  const graphQuery = useDependencyGraph(moduleId);

  const impact = impactQuery.data;
  const graph = graphQuery.data;
  const isLoading =
    (impactQuery.isLoading && !impactQuery.data) ||
    (graphQuery.isLoading && !graphQuery.data);

  return (
    <div className="space-y-4">
      {(impactQuery.error || graphQuery.error) && (
        <div className="space-y-2">
          {impactQuery.error && (
            <ApiErrorBanner
              error={impactQuery.error}
              fallback="Failed to load impact analysis."
            />
          )}
          {graphQuery.error && (
            <ApiErrorBanner
              error={graphQuery.error}
              fallback="Failed to load dependency graph."
            />
          )}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : !impact ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Impact analysis unavailable.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CountCard
              label="Direct dependents"
              value={impact.counts.direct_dependents}
            />
            <CountCard
              label="Transitive dependents"
              value={impact.counts.transitive_dependents}
            />
            <CountCard
              label="Affected organizations"
              value={impact.counts.affected_organizations}
            />
            <CountCard label="Conflicts" value={impact.counts.conflicts} />
          </div>

          {graph && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-foreground">Graph summary</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {graph.node_count} nodes · {graph.edge_count} edges in dependency graph
              </p>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ModuleList
              title="Direct dependents"
              empty="No direct dependents."
              items={impact.direct_dependents.map((item) => ({
                id: item.id,
                primary: item.name,
                secondary: item.code,
              }))}
            />
            <ModuleList
              title="Transitive dependents"
              empty="No transitive dependents."
              items={impact.transitive_dependents.map((item) => ({
                id: item.id,
                primary: item.name,
                secondary: item.code,
              }))}
            />
          </div>

          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold text-foreground">
              Affected organizations
            </h3>
            {impact.affected_organizations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No affected organizations.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {impact.affected_organizations.map((org) => (
                  <li
                    key={org.organization_id}
                    className="flex items-center justify-between px-3 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {org.organization__name}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {org.organization__code}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {org.affected_module_count} module
                      {org.affected_module_count === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-xs font-semibold text-foreground">Conflicts</h3>
            {impact.conflicts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No conflicts detected.</p>
            ) : (
              <ul className="space-y-1.5">
                {impact.conflicts.map((conflict) => (
                  <li
                    key={conflict.id}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-foreground">
                      {conflict.source.code} ↔ {conflict.target.code}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {conflict.source.name} conflicts with {conflict.target.name}
                      {conflict.version_constraint
                        ? ` · ${conflict.version_constraint}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
    </div>
  );
}

function ModuleList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: number; primary: string; secondary: string }>;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border px-2.5 py-2 text-xs"
            >
              <p className="font-medium text-foreground">{item.primary}</p>
              <p className="font-mono text-[10px] text-muted-foreground">{item.secondary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
