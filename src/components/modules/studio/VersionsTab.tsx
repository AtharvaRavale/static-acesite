import { useState } from "react";
import { X } from "lucide-react";
import {
  useProductModuleVersions,
  type ProductModuleVersion,
} from "@/features/platformModules";
import { MaturityBadge } from "@/components/modules/shared/moduleBadges";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { TableSkeleton } from "@/components/ui/skeletonPatterns";

export function VersionsTab({ moduleId }: { moduleId: number }) {
  const versionsQuery = useProductModuleVersions({
    module: moduleId,
    page_size: 100,
    ordering: "-published_at",
  });
  const [selected, setSelected] = useState<ProductModuleVersion | null>(null);

  const versions = versionsQuery.data?.results ?? [];
  const isLoading = versionsQuery.isLoading && !versionsQuery.data;

  return (
    <div className="space-y-3">
      {versionsQuery.error && (
        <ApiErrorBanner error={versionsQuery.error} fallback="Failed to load versions." />
      )}

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">No published versions yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Version</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Maturity</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Changelog</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Checksum</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Published by</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Published at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {versions.map((version) => (
                <tr
                  key={version.id}
                  onClick={() => setSelected(version)}
                  className="cursor-pointer bg-card hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                    {version.version}
                  </td>
                  <td className="px-4 py-2.5">
                    <MaturityBadge
                      maturity={version.maturity}
                      label={version.maturity_display}
                    />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 text-xs text-muted-foreground">
                    {version.changelog || "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
                    {version.checksum
                      ? `${version.checksum.slice(0, 12)}…`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {version.published_by_email || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {version.published_at
                      ? new Date(version.published_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Version {selected.version}
                </h3>
                <p className="text-[10px] text-muted-foreground">Manifest (read-only)</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-foreground">
              {JSON.stringify(selected.manifest ?? {}, null, 2)}
            </pre>
          </aside>
        </>
      )}
    </div>
  );
}
