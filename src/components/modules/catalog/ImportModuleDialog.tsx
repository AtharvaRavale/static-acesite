import { useState } from "react";
import { FileUp, X } from "lucide-react";
import { useImportModule } from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { getApiErrorMessage } from "@/lib/api";

interface ImportModuleDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (moduleId: number) => void;
}

export function ImportModuleDialog({ open, onClose, onImported }: ImportModuleDialogProps) {
  const importModule = useImportModule();
  const [jsonText, setJsonText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async () => {
    setLocalError(null);
    try {
      let payload: FormData | Record<string, unknown>;

      if (file) {
        const form = new FormData();
        form.append("manifest_file", file);
        payload = form;
      } else if (jsonText.trim()) {
        payload = JSON.parse(jsonText) as Record<string, unknown>;
      } else {
        setLocalError("Provide a manifest file or paste JSON.");
        return;
      }

      const result = await importModule.mutateAsync(payload);
      onImported(result.module.id);
      onClose();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setLocalError("Manifest JSON is invalid.");
        return;
      }
      setLocalError(getApiErrorMessage(error, "Import failed."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">Import Module</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upload a manifest file or paste JSON to import a product module.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {(localError || importModule.error) && (
            <ApiErrorBanner error={localError ?? importModule.error} />
          )}

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/40">
            <FileUp className="mb-2 h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {file ? file.name : "Choose manifest file"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">JSON file accepted</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setJsonText("");
              }}
            />
          </label>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Or paste JSON</p>
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setFile(null);
              }}
              rows={8}
              placeholder='{"module":{"code":"example","name":"Example",...}}'
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={importModule.isPending}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {importModule.isPending ? "Importing…" : "Import Module"}
          </button>
        </div>
      </div>
    </div>
  );
}
