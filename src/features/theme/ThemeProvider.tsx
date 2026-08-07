import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ThemeCustomizerDrawer } from "./ThemeCustomizerDrawer";
import { ThemeModeToggle } from "./ThemeModeToggle";
import { DEFAULT_PRESET_ID, getPresetById, THEME_PRESETS } from "./presets";
import type { ThemePreset } from "./types";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY_MODE = "siteos.theme.mode";
const STORAGE_KEY_PRESET = "siteos.theme.preset";

function getStoredThemeMode(): ThemeMode {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY_MODE);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  }
  return "system";
}

function getResolvedMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

function getStoredPresetId(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY_PRESET);
    if (stored && getPresetById(stored)) return stored;
  }
  return DEFAULT_PRESET_ID;
}

function setCssVar(root: HTMLElement, name: string, value: string) {
  root.style.setProperty(name, `hsl(${value})`);
}

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  presetId: string;
  presets: ThemePreset[];
  setPreset: (presetId: string) => void;
  openCustomizer: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [presetId, setPresetState] = useState<string>(getStoredPresetId);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const resolvedMode = getResolvedMode(mode);
  const activePreset = getPresetById(presetId) ?? getPresetById(DEFAULT_PRESET_ID)!;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedMode);
    const colors = activePreset.colors[resolvedMode];

    setCssVar(root, "--color-background", colors.background);
    setCssVar(root, "--color-foreground", colors.foreground);
    setCssVar(root, "--color-card", colors.card);
    setCssVar(root, "--color-card-foreground", colors.cardForeground);
    setCssVar(root, "--color-popover", colors.popover);
    setCssVar(root, "--color-popover-foreground", colors.popoverForeground);
    setCssVar(root, "--color-primary", colors.primary);
    setCssVar(root, "--color-primary-foreground", colors.primaryForeground);
    setCssVar(root, "--color-secondary", colors.secondary);
    setCssVar(root, "--color-secondary-foreground", colors.secondaryForeground);
    setCssVar(root, "--color-muted", colors.muted);
    setCssVar(root, "--color-muted-foreground", colors.mutedForeground);
    setCssVar(root, "--color-accent", colors.accent);
    setCssVar(root, "--color-accent-foreground", colors.accentForeground);
    setCssVar(root, "--color-destructive", colors.destructive);
    setCssVar(root, "--color-destructive-foreground", colors.destructiveForeground);
    setCssVar(root, "--color-success", colors.success);
    setCssVar(root, "--color-success-foreground", colors.successForeground);
    setCssVar(root, "--color-warning", colors.warning);
    setCssVar(root, "--color-warning-foreground", colors.warningForeground);
    setCssVar(root, "--color-border", colors.border);
    setCssVar(root, "--color-input", colors.input);
    setCssVar(root, "--color-ring", colors.ring);
    setCssVar(root, "--color-sidebar", colors.sidebar);
    setCssVar(root, "--color-sidebar-foreground", colors.sidebarForeground);
    setCssVar(root, "--color-sidebar-border", colors.sidebarBorder);
  }, [activePreset, resolvedMode]);

  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const newResolved = mediaQuery.matches ? "dark" : "light";
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newResolved);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  const setMode = (nextMode: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY_MODE, nextMode);
    setModeState(nextMode);
  };

  const setPreset = (nextPresetId: string) => {
    if (!getPresetById(nextPresetId)) return;
    window.localStorage.setItem(STORAGE_KEY_PRESET, nextPresetId);
    setPresetState(nextPresetId);
  };

  const toggleMode = () => {
    const nextMode = resolvedMode === "light" ? "dark" : "light";
    setMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        setMode,
        toggleMode,
        presetId,
        presets: THEME_PRESETS,
        setPreset,
        openCustomizer: () => setCustomizerOpen(true),
      }}
    >
      {children}
      <ThemeModeToggle docked onOpenCustomizer={() => setCustomizerOpen(true)} />
      <ThemeCustomizerDrawer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
