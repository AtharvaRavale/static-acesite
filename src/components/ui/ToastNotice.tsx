import { CheckCircle2, X } from "lucide-react";

export function ToastNotice({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-2xl">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      <span className="min-w-0 flex-1 font-medium">{message}</span>
      <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close notification">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
