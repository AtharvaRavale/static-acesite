import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { OrganizationModule } from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";

export function ModuleConfigDrawer({
  assignment,
  onClose,
  onSave,
  saving,
  error,
}: {
  assignment: OrganizationModule;
  onClose: () => void;
  onSave: (configuration: Record<string, unknown>) => void;
  saving?: boolean;
  error?: unknown;
}) {
  const [text, setText] = useState("{}");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(assignment.configuration ?? {}, null, 2));
    setParseError(null);
  }, [assignment]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(text || "{}") as Record<string, unknown>;
      setParseError(null);
      onSave(parsed);
    } catch {
      setParseError("Configuration must be valid JSON.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30">
      <button
        type="button"
        className="flex-1 cursor-default"
        aria-label="Close configuration drawer"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Module configuration
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-foreground">
              {assignment.module_name}
            </h2>
            <p className="text-sm text-muted-foreground">{assignment.module_code}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <textarea
            className="h-[min(420px,60vh)] w-full rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          {parseError && (
            <p className="text-xs text-destructive">{parseError}</p>
          )}
          <ApiErrorBanner error={error} />
        </div>

        <div className="border-t border-border px-5 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </aside>
    </div>
  );
}
