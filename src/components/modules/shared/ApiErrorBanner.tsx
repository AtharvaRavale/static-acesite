import { AlertTriangle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/api";

export function ApiErrorBanner({
  error,
  fallback = "Request failed.",
}: {
  error: unknown;
  fallback?: string;
}) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{getApiErrorMessage(error, fallback)}</p>
    </div>
  );
}
