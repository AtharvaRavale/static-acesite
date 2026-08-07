import { useEffect, useRef } from "react";
import { Check, Moon, Monitor, Palette, Sun, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import type { ThemeMode } from "./types";
import { cn } from "@/lib/utils";

interface ThemeCustomizerDrawerProps {
  open: boolean;
  onClose: () => void;
}

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>;
  };
};

function applyCurtainTransition(action: () => void) {
  const transitionDocument = document as ViewTransitionDocument;
  if (!transitionDocument.startViewTransition) {
    action();
    return;
  }

  document.documentElement.classList.add("theme-transition-curtain");
  const transition = transitionDocument.startViewTransition(() => action());
  transition.finished.finally(() => {
    document.documentElement.classList.remove("theme-transition-curtain");
  });
}

export function ThemeCustomizerDrawer({ open, onClose }: ThemeCustomizerDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { mode, setMode, presetId, setPreset, presets } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-medium text-foreground">
              Theme Customizer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Mode Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Appearance</h3>
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((option) => {
                  const isActive = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => applyCurtainTransition(() => setMode(option.value))}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                        isActive
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      <option.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Theme Preset</h3>
              <div className="space-y-2">
                {presets.map((preset) => {
                  const isActive = presetId === preset.id;
                  const primaryColor = `hsl(${preset.colors.light.primary})`;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyCurtainTransition(() => setPreset(preset.id))}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 transition-all",
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg border border-border"
                          style={{ backgroundColor: primaryColor }}
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">
                            {preset.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {preset.id === "siteos-blue" && "Clean enterprise blue/white"}
                            {preset.id === "ace-orange" && "Original Ace orange palette"}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Preview</h3>
              <div className="space-y-2 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-xs text-muted-foreground">Secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Success</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">Destructive</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
