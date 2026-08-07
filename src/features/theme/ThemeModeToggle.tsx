import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { GripVertical, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

interface ThemeModeToggleProps {
  className?: string;
  docked?: boolean;
  onOpenCustomizer?: () => void;
}

type DockPos = { x: number; y: number };

const STORAGE_KEY = "siteos.theme.dock.position";

function readStoredPos(): DockPos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DockPos;
    if (typeof parsed.x === "number" && typeof parsed.y === "number") {
      return parsed;
    }
  } catch {
    /* ignore invalid storage */
  }
  return null;
}

function clampPos(x: number, y: number, width: number, height: number): DockPos {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - width - pad);
  const maxY = Math.max(pad, window.innerHeight - height - pad);
  return {
    x: Math.min(Math.max(pad, x), maxX),
    y: Math.min(Math.max(pad, y), maxY),
  };
}

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

export function ThemeModeToggle({
  className,
  docked = false,
  onOpenCustomizer,
}: ThemeModeToggleProps) {
  const { resolvedMode, toggleMode } = useTheme();
  const dockRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState<DockPos>(() => {
    const stored = readStoredPos();
    if (stored) return stored;
    if (typeof window === "undefined") return { x: 16, y: 16 };
    return { x: window.innerWidth - 120, y: window.innerHeight - 64 };
  });

  const isLight = resolvedMode === "light";
  const Icon = isLight ? Moon : Sun;
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";

  const persistPos = useCallback((next: DockPos) => {
    setPos(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!docked) return;

    const onResize = () => {
      const el = dockRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setPos((prev) => {
        const next = clampPos(prev.x, prev.y, width, height);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [docked]);

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const el = dockRef.current;
    if (!el) return;

    el.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent) => {
    const drag = dragRef.current;
    const el = dockRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    const { width, height } = el.getBoundingClientRect();
    setPos(clampPos(drag.origX + dx, drag.origY + dy, width, height));
  };

  const onPointerUp = (event: PointerEvent) => {
    const drag = dragRef.current;
    const el = dockRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !el) return;

    el.releasePointerCapture(event.pointerId);
    const { width, height } = el.getBoundingClientRect();
    persistPos(clampPos(pos.x, pos.y, width, height));
    dragRef.current = null;
    setDragging(false);
  };

  const onToggle = () => {
    if (dragRef.current?.moved) return;
    applyCurtainTransition(toggleMode);
  };

  const button = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  if (!docked) return button;

  return (
    <div
      ref={dockRef}
      style={{ left: pos.x, top: pos.y }}
      className={cn(
        "fixed z-[70] flex items-center gap-2 rounded-full border border-border/50 bg-background/85 p-2 shadow-lg backdrop-blur-xl",
        dragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <button
        type="button"
        aria-label="Drag theme controls"
        title="Drag to move"
        className="flex h-8 w-6 cursor-grab items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-foreground/[0.05] hover:text-foreground active:cursor-grabbing"
        onPointerDown={onPointerDown}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        title={label}
        className="cursor-pointer rounded-full bg-primary p-2 text-primary-foreground shadow-md transition-all duration-200 hover:scale-105"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>

      {onOpenCustomizer && (
        <button
          type="button"
          onClick={onOpenCustomizer}
          aria-label="Open theme customizer"
          title="Theme customizer"
          className="cursor-pointer rounded-full border border-border bg-card p-2 text-muted-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:text-foreground"
        >
          <Palette className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
