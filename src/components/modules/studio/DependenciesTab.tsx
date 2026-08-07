import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  BarChart3,
  Box,
  Check,
  CheckSquare2,
  ChevronDown,
  FileText,
  Filter,
  Focus,
  FolderKanban,
  Lightbulb,
  Lock,
  Minus,
  Move,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Unlock,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useCreateModuleDependency,
  useDeleteModuleDependency,
  useDependencyGraph,
  useModuleDependencies,
  useProductModules,
  type ModuleDependency,
  type ModuleDependencyType,
  type ModuleSummary,
  type ProductModule,
} from "@/features/platformModules";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { ClassificationBadge } from "@/components/modules/shared/moduleBadges";
import { TableSkeleton } from "@/components/ui/skeletonPatterns";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type LibraryTab = "all" | "added";
type DependencyLayoutMode = "smart" | "vertical" | "horizontal";
type ModuleRecord = ModuleSummary | ProductModule;
type DependencyNodeKind = "current" | "dependency";
type HandleSide = "top" | "right" | "bottom" | "left";
type Point = { x: number; y: number };
type NodeSize = { width: number; height: number };

interface GraphNode {
  id: number;
  dependencyId: number;
  name: string;
  code: string;
  type: ModuleDependencyType;
  themeColor?: string;
}

type DependencyNodeData = {
  kind: DependencyNodeKind;
  currentModule: ProductModule;
  dependency: GraphNode | null;
  locked: boolean;
  onDelete: (dependencyId: number) => void;
};

type DependencyFlowNode = Node<DependencyNodeData, "dependencyMap">;

type DependencyEdgeData = {
  dependencyType: ModuleDependencyType;
  color: string;
  dashed: boolean;
  layoutMode: DependencyLayoutMode;
};

type DependencyFlowEdge = Edge<DependencyEdgeData, "dependencyMap">;

type LayoutSnapshot = {
  signature: string;
  positions: Map<string, Point>;
};

const NODE_SIZE: Record<DependencyNodeKind, NodeSize> = {
  current: { width: 220, height: 184 },
  dependency: { width: 194, height: 108 },
};

const HANDLE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const LAYOUT_LABELS: Record<DependencyLayoutMode, string> = {
  smart: "Smart",
  vertical: "Vertical",
  horizontal: "Horizontal",
};

const TYPE_META: Record<
  ModuleDependencyType,
  {
    label: string;
    color: string;
    badgeBackground: string;
    dashed: boolean;
  }
> = {
  required: {
    label: "REQUIRED",
    color: "#2563eb",
    badgeBackground: "rgba(37, 99, 235, 0.12)",
    dashed: false,
  },
  optional: {
    label: "OPTIONAL",
    color: "#06b6d4",
    badgeBackground: "rgba(6, 182, 212, 0.12)",
    dashed: true,
  },
  conflict: {
    label: "CONFLICT",
    color: "#ef4444",
    badgeBackground: "rgba(239, 68, 68, 0.12)",
    dashed: true,
  },
};

const NODE_TYPES = {
  dependencyMap: DependencyMapNode,
};

const EDGE_TYPES = {
  dependencyMap: DependencyMapEdge,
};

const STORAGE_PREFIX = "siteos:module-dependency-map:layout:";

function currentNodeId(moduleId: number) {
  return `current-module-${moduleId}`;
}

function dependencyNodeId(dependencyId: number) {
  return `dependency-${dependencyId}`;
}

function readStoredLayoutMode(moduleId: number): DependencyLayoutMode {
  if (typeof window === "undefined") return "smart";

  const value = window.localStorage.getItem(`${STORAGE_PREFIX}${moduleId}`);

  return value === "horizontal" || value === "vertical" || value === "smart"
    ? value
    : "smart";
}

function storeLayoutMode(moduleId: number, mode: DependencyLayoutMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${moduleId}`, mode);
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return `rgba(37, 99, 235, ${alpha})`;
  }

  const parsed = Number.parseInt(value, 16);
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getThemeColor(record: ModuleRecord | undefined) {
  if (!record || !("theme_color" in record)) return undefined;
  return typeof record.theme_color === "string"
    ? record.theme_color
    : undefined;
}

function getModuleVisual(
  code: string,
  name: string,
): { Icon: LucideIcon; color: string } {
  const value = `${code} ${name}`.toLowerCase();

  if (value.includes("user")) {
    return { Icon: Users, color: "#6d4aff" };
  }

  if (value.includes("audit") || value.includes("log")) {
    return { Icon: ShieldCheck, color: "#6d4aff" };
  }

  if (value.includes("analytics")) {
    return { Icon: BarChart3, color: "#12b8b2" };
  }

  if (value.includes("project")) {
    return { Icon: FolderKanban, color: "#7157f5" };
  }

  if (value.includes("document")) {
    return { Icon: FileText, color: "#2474f5" };
  }

  if (value.includes("check")) {
    return { Icon: CheckSquare2, color: "#7157f5" };
  }

  if (value.includes("snag")) {
    return { Icon: Wrench, color: "#19b8ad" };
  }

  if (value.includes("setup")) {
    return { Icon: Settings2, color: "#f38a3e" };
  }

  return { Icon: Box, color: "#f38a3e" };
}

function graphSignature(moduleId: number, dependencies: GraphNode[]) {
  const nodes = dependencies
    .map(
      (node) =>
        `${node.dependencyId}:${node.id}:${node.type}:${node.code}`,
    )
    .sort()
    .join("|");

  return `${moduleId}::${nodes}`;
}

function calculateSmartPositions(
  moduleId: number,
  dependencies: GraphNode[],
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const rootId = currentNodeId(moduleId);
  const sorted = [...dependencies].sort((left, right) => {
    const order: Record<ModuleDependencyType, number> = {
      required: 0,
      optional: 1,
      conflict: 2,
    };

    return (
      order[left.type] - order[right.type] ||
      left.name.localeCompare(right.name)
    );
  });

  if (sorted.length === 0) {
    positions.set(rootId, { x: 0, y: 0 });
    return positions;
  }

  if (sorted.length === 1) {
    positions.set(rootId, { x: 0, y: 0 });
    positions.set(dependencyNodeId(sorted[0].dependencyId), {
      x: 374,
      y: 38,
    });
    return positions;
  }

  if (sorted.length === 2) {
    positions.set(rootId, { x: 282, y: 156 });
    positions.set(dependencyNodeId(sorted[0].dependencyId), {
      x: -70,
      y: 194,
    });
    positions.set(dependencyNodeId(sorted[1].dependencyId), {
      x: 648,
      y: 194,
    });
    return positions;
  }

  const rootX = 440;
  const rootY = 320;
  const ringCapacity = 8;

  positions.set(rootId, { x: rootX, y: rootY });

  sorted.forEach((dependency, index) => {
    const ring = Math.floor(index / ringCapacity);
    const ringStart = ring * ringCapacity;
    const ringCount = Math.min(
      ringCapacity,
      sorted.length - ringStart,
    );
    const indexInRing = index - ringStart;
    const angle =
      -Math.PI / 2 + (Math.PI * 2 * indexInRing) / ringCount;
    const radiusX = 390 + ring * 245;
    const radiusY = 255 + ring * 170;

    positions.set(dependencyNodeId(dependency.dependencyId), {
      x:
        rootX +
        NODE_SIZE.current.width / 2 +
        Math.cos(angle) * radiusX -
        NODE_SIZE.dependency.width / 2,
      y:
        rootY +
        NODE_SIZE.current.height / 2 +
        Math.sin(angle) * radiusY -
        NODE_SIZE.dependency.height / 2,
    });
  });

  return positions;
}

function calculateHorizontalPositions(
  moduleId: number,
  dependencies: GraphNode[],
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const rowGap = 34;
  const columnGap = 72;
  const maxRows = Math.min(
    5,
    Math.max(1, Math.ceil(Math.sqrt(dependencies.length))),
  );
  const mapHeight =
    maxRows * NODE_SIZE.dependency.height + (maxRows - 1) * rowGap;

  positions.set(currentNodeId(moduleId), {
    x: 0,
    y: Math.max(0, mapHeight / 2 - NODE_SIZE.current.height / 2),
  });

  dependencies.forEach((dependency, index) => {
    const column = Math.floor(index / maxRows);
    const row = index % maxRows;

    positions.set(dependencyNodeId(dependency.dependencyId), {
      x:
        NODE_SIZE.current.width +
        176 +
        column * (NODE_SIZE.dependency.width + columnGap),
      y: row * (NODE_SIZE.dependency.height + rowGap),
    });
  });

  return positions;
}

function calculateVerticalPositions(
  moduleId: number,
  dependencies: GraphNode[],
): Map<string, Point> {
  const positions = new Map<string, Point>();
  const columnGap = 44;
  const rowGap = 46;
  const columnCount = Math.min(
    4,
    Math.max(1, Math.ceil(Math.sqrt(dependencies.length))),
  );
  const gridWidth =
    columnCount * NODE_SIZE.dependency.width +
    (columnCount - 1) * columnGap;

  positions.set(currentNodeId(moduleId), {
    x: Math.max(0, gridWidth / 2 - NODE_SIZE.current.width / 2),
    y: 0,
  });

  dependencies.forEach((dependency, index) => {
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);

    positions.set(dependencyNodeId(dependency.dependencyId), {
      x: column * (NODE_SIZE.dependency.width + columnGap),
      y:
        NODE_SIZE.current.height +
        156 +
        row * (NODE_SIZE.dependency.height + rowGap),
    });
  });

  return positions;
}

function calculatePositions(
  moduleId: number,
  dependencies: GraphNode[],
  mode: DependencyLayoutMode,
) {
  if (mode === "horizontal") {
    return calculateHorizontalPositions(moduleId, dependencies);
  }

  if (mode === "vertical") {
    return calculateVerticalPositions(moduleId, dependencies);
  }

  return calculateSmartPositions(moduleId, dependencies);
}

function getNodeCenter(node: DependencyFlowNode) {
  const size = NODE_SIZE[node.data.kind];

  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  };
}

function sideTowards(
  source: DependencyFlowNode,
  target: DependencyFlowNode,
): HandleSide {
  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "bottom" : "top";
}

function oppositeSide(side: HandleSide): HandleSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  return "left";
}

function createFlowNodes(
  currentModule: ProductModule,
  dependencies: GraphNode[],
  positions: Map<string, Point>,
  locked: boolean,
  onDelete: (dependencyId: number) => void,
): DependencyFlowNode[] {
  const rootId = currentNodeId(currentModule.id);
  const root: DependencyFlowNode = {
    id: rootId,
    type: "dependencyMap",
    position: positions.get(rootId) ?? { x: 0, y: 0 },
    width: NODE_SIZE.current.width,
    height: NODE_SIZE.current.height,
    draggable: !locked,
    selectable: false,
    focusable: false,
    zIndex: 8,
    data: {
      kind: "current",
      currentModule,
      dependency: null,
      locked,
      onDelete,
    },
  };

  const dependencyNodes: DependencyFlowNode[] = dependencies.map(
    (dependency) => {
      const id = dependencyNodeId(dependency.dependencyId);

      return {
        id,
        type: "dependencyMap",
        position: positions.get(id) ?? { x: 0, y: 0 },
        width: NODE_SIZE.dependency.width,
        height: NODE_SIZE.dependency.height,
        draggable: !locked,
        selectable: false,
        focusable: false,
        zIndex: 10,
        data: {
          kind: "dependency",
          currentModule,
          dependency,
          locked,
          onDelete,
        },
      };
    },
  );

  return [root, ...dependencyNodes];
}

function createFlowEdges(
  currentModule: ProductModule,
  dependencies: GraphNode[],
  nodes: DependencyFlowNode[],
  layoutMode: DependencyLayoutMode,
): DependencyFlowEdge[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const sourceId = currentNodeId(currentModule.id);
  const source = nodesById.get(sourceId);

  if (!source) return [];

  return dependencies.flatMap((dependency) => {
    const targetId = dependencyNodeId(dependency.dependencyId);
    const target = nodesById.get(targetId);
    if (!target) return [];

    const sourceSide = sideTowards(source, target);
    const targetSide = oppositeSide(sourceSide);
    const meta = TYPE_META[dependency.type];

    return [
      {
        id: `${sourceId}--${targetId}`,
        source: sourceId,
        target: targetId,
        sourceHandle: `source-${sourceSide}`,
        targetHandle: `target-${targetSide}`,
        type: "dependencyMap",
        selectable: false,
        focusable: false,
        data: {
          dependencyType: dependency.type,
          color: meta.color,
          dashed: meta.dashed,
          layoutMode,
        },
      },
    ];
  });
}

function copyPositions(nodes: DependencyFlowNode[]) {
  return new Map(
    nodes.map((node) => [
      node.id,
      { x: node.position.x, y: node.position.y },
    ]),
  );
}

function DependencyMapNode({ data }: NodeProps<DependencyFlowNode>) {
  return (
    <div className="relative h-full w-full cursor-grab select-none active:cursor-grabbing">
      {(["top", "right", "bottom", "left"] as HandleSide[]).map(
        (side) => (
          <Handle
            key={`target-${side}`}
            id={`target-${side}`}
            type="target"
            position={HANDLE_POSITION[side]}
            isConnectable={false}
            className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
          />
        ),
      )}

      {data.kind === "current" ? (
        <CurrentModuleNodeCard data={data} />
      ) : (
        <DependencyNodeCard data={data} />
      )}

      {(["top", "right", "bottom", "left"] as HandleSide[]).map(
        (side) => (
          <Handle
            key={`source-${side}`}
            id={`source-${side}`}
            type="source"
            position={HANDLE_POSITION[side]}
            isConnectable={false}
            className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
          />
        ),
      )}
    </div>
  );
}

function CurrentModuleNodeCard({ data }: { data: DependencyNodeData }) {
  const module = data.currentModule;
  const visual = getModuleVisual(module.code, module.name);
  const Icon = visual.Icon;
  const color = module.theme_color || visual.color;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-visible">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.075]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.055] blur-2xl" />

      <div className="relative z-10 flex h-[176px] w-[212px] flex-col items-center justify-center rounded-[34px] border border-border/90 bg-card/95 px-5 text-center shadow-[0_24px_64px_-30px_rgba(37,99,235,0.48),0_12px_30px_-20px_rgba(0,0,0,0.62)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-[7px] rounded-[28px] border border-primary/10" />

        <div
          className="relative mb-3 flex h-[62px] w-[62px] items-center justify-center rounded-[22px] text-white ring-8 ring-primary/[0.07]"
          style={{
            background: `linear-gradient(145deg, ${hexToRgba(
              color,
              0.86,
            )}, ${color})`,
            boxShadow: `0 15px 34px -14px ${hexToRgba(color, 0.92)}`,
          }}
        >
          <Icon className="h-7 w-7" strokeWidth={1.9} />
        </div>

        <h3
          className="line-clamp-2 max-w-[176px] text-[14px] font-semibold leading-[18px] text-foreground"
          title={module.name}
        >
          {module.name}
        </h3>

        <p className="mt-1 max-w-[176px] truncate text-[10px] font-medium text-muted-foreground">
          {module.code}
        </p>

        <span className="mt-2 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.11em] text-primary">
          This module
        </span>
      </div>
    </div>
  );
}

function DependencyNodeCard({ data }: { data: DependencyNodeData }) {
  const dependency = data.dependency;
  if (!dependency) return null;

  const meta = TYPE_META[dependency.type];
  const visual = getModuleVisual(dependency.code, dependency.name);
  const Icon = visual.Icon;
  const iconColor = dependency.themeColor || visual.color;

  return (
    <div
      className="group relative flex h-full w-full items-center gap-3 overflow-hidden rounded-[22px] border border-border/90 bg-card/95 px-3.5 py-3 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.72),0_8px_20px_-16px_rgba(0,0,0,0.58)] backdrop-blur-xl transition-shadow hover:shadow-[0_22px_48px_-26px_rgba(37,99,235,0.32),0_10px_24px_-16px_rgba(0,0,0,0.62)]"
      style={{ borderColor: hexToRgba(meta.color, 0.24) }}
    >
      <div
        className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: meta.color }}
      />

      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-white ring-4 ring-background/40"
        style={{
          background: `linear-gradient(145deg, ${hexToRgba(
            iconColor,
            0.84,
          )}, ${iconColor})`,
          boxShadow: `0 10px 20px -10px ${hexToRgba(iconColor, 0.9)}`,
        }}
      >
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
      </div>

      <div className="min-w-0 flex-1">
        <h4
          className="truncate pr-6 text-[13px] font-semibold text-foreground"
          title={dependency.name}
        >
          {dependency.name}
        </h4>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {dependency.code}
        </p>
        <span
          className="mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-bold leading-none tracking-[0.08em]"
          style={{
            color: meta.color,
            backgroundColor: meta.badgeBackground,
          }}
        >
          {meta.label}
        </span>
      </div>

      {!data.locked ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            data.onDelete(dependency.dependencyId);
          }}
          className="nodrag nopan absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
          aria-label={`Remove ${dependency.name}`}
          title={`Remove ${dependency.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function DependencyMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<DependencyFlowEdge>) {
  const color = data?.color ?? "#2563eb";
  const mode = data?.layoutMode ?? "smart";
  const dashed = data?.dashed ?? false;
  const [path] =
    mode === "smart"
      ? getBezierPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          curvature: 0.36,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          borderRadius: 22,
          offset: 34,
        });

  return (
    <g>
      <BaseEdge
        id={`${id}-glow`}
        path={path}
        style={{
          stroke: color,
          strokeWidth: 9,
          strokeOpacity: 0.075,
          strokeLinecap: "round",
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: 1.9,
          strokeOpacity: 0.78,
          strokeLinecap: "round",
          strokeDasharray: dashed
            ? data?.dependencyType === "conflict"
              ? "4 6"
              : "8 7"
            : undefined,
        }}
      />
      <circle cx={sourceX} cy={sourceY} r="3.1" fill={color} fillOpacity="0.92" />
      <circle
        cx={targetX}
        cy={targetY}
        r="3.7"
        fill="hsl(var(--card))"
        stroke={color}
        strokeWidth="1.8"
      />
    </g>
  );
}

function FlowViewportSync({
  zoom,
  onZoomChange,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const { getViewport, setViewport } = useReactFlow();
  const lastExternalZoom = useRef(zoom);

  useEffect(() => {
    if (Math.abs(lastExternalZoom.current - zoom) < 0.001) return;

    lastExternalZoom.current = zoom;
    const viewport = getViewport();
    void setViewport({ ...viewport, zoom }, { duration: 180 });
  }, [getViewport, setViewport, zoom]);

  useEffect(() => {
    const currentZoom = getViewport().zoom;
    if (Math.abs(currentZoom - zoom) > 0.001) {
      onZoomChange(currentZoom);
    }
  }, [getViewport, onZoomChange, zoom]);

  return null;
}

function DependencyGraphCanvas({
  currentModule,
  dependencies,
  zoom,
  onZoomChange,
  locked,
  onLockedChange,
  onDelete,
}: {
  currentModule: ProductModule;
  dependencies: GraphNode[];
  zoom: number;
  onZoomChange: (zoom: number) => void;
  locked: boolean;
  onLockedChange: (locked: boolean) => void;
  onDelete: (dependencyId: number) => void;
}) {
  const [layoutMode, setLayoutMode] = useState<DependencyLayoutMode>(() =>
    readStoredLayoutMode(currentModule.id),
  );
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [layouting, setLayouting] = useState(true);
  const [flowNodes, setFlowNodes, onNodesChange] =
    useNodesState<DependencyFlowNode>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] =
    useEdgesState<DependencyFlowEdge>([]);
  const flowRef = useRef<
    ReactFlowInstance<DependencyFlowNode, DependencyFlowEdge> | null
  >(null);
  const nodesRef = useRef<DependencyFlowNode[]>([]);
  const dependenciesRef = useRef(dependencies);
  const snapshotsRef = useRef<
    Record<DependencyLayoutMode, LayoutSnapshot | null>
  >({
    smart: null,
    vertical: null,
    horizontal: null,
  });

  const signature = useMemo(
    () => graphSignature(currentModule.id, dependencies),
    [currentModule.id, dependencies],
  );

  useEffect(() => {
    dependenciesRef.current = dependencies;
  }, [dependencies]);

  useEffect(() => {
    nodesRef.current = flowNodes;
  }, [flowNodes]);

  useEffect(() => {
    snapshotsRef.current = {
      smart: null,
      vertical: null,
      horizontal: null,
    };
    setLayoutMode(readStoredLayoutMode(currentModule.id));
    setLayoutVersion((value) => value + 1);
  }, [currentModule.id]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    setLayouting(true);

    const snapshot = snapshotsRef.current[layoutMode];
    const positions =
      snapshot?.signature === signature
        ? snapshot.positions
        : calculatePositions(currentModule.id, dependencies, layoutMode);
    const nextNodes = createFlowNodes(
      currentModule,
      dependencies,
      positions,
      locked,
      onDelete,
    );
    const nextEdges = createFlowEdges(
      currentModule,
      dependencies,
      nextNodes,
      layoutMode,
    );

    snapshotsRef.current[layoutMode] = {
      signature,
      positions: copyPositions(nextNodes),
    };

    nodesRef.current = nextNodes;
    setFlowNodes(nextNodes);
    setFlowEdges(nextEdges);

    timer = window.setTimeout(() => {
      if (cancelled) return;

      void flowRef.current
        ?.fitView({
          padding: 0.2,
          maxZoom: 1,
          duration: 430,
        })
        .then(() => {
          const nextZoom = flowRef.current?.getViewport().zoom;
          if (typeof nextZoom === "number") onZoomChange(nextZoom);
        });
      setLayouting(false);
    }, 45);

    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [
    currentModule.id,
    dependencies,
    layoutMode,
    layoutVersion,
    setFlowEdges,
    setFlowNodes,
    signature,
  ]);

  useEffect(() => {
    const dependencyById = new Map(
      dependencies.map((dependency) => [
        dependency.dependencyId,
        dependency,
      ]),
    );

    setFlowNodes((current) =>
      current.map((node) => {
        const dependencyId = node.data.dependency?.dependencyId;
        const dependency =
          dependencyId == null
            ? null
            : dependencyById.get(dependencyId) ?? node.data.dependency;

        return {
          ...node,
          draggable: !locked,
          data: {
            ...node.data,
            currentModule,
            dependency,
            locked,
            onDelete,
          },
        };
      }),
    );
  }, [currentModule, dependencies, locked, onDelete, setFlowNodes]);

  const rerouteEdges = useCallback(
    (nextNodes: DependencyFlowNode[]) => {
      setFlowEdges(
        createFlowEdges(
          currentModule,
          dependenciesRef.current,
          nextNodes,
          layoutMode,
        ),
      );
    },
    [currentModule, layoutMode, setFlowEdges],
  );

  const handleNodeDrag = useCallback(
    (_: unknown, movedNode: DependencyFlowNode) => {
      const nextNodes = nodesRef.current.map((node) =>
        node.id === movedNode.id
          ? { ...node, position: { ...movedNode.position } }
          : node,
      );

      rerouteEdges(nextNodes);
    },
    [rerouteEdges],
  );

  const handleNodeDragStop = useCallback(
    (_: unknown, movedNode: DependencyFlowNode) => {
      const nextNodes = nodesRef.current.map((node) =>
        node.id === movedNode.id
          ? { ...node, position: { ...movedNode.position } }
          : node,
      );

      nodesRef.current = nextNodes;
      snapshotsRef.current[layoutMode] = {
        signature,
        positions: copyPositions(nextNodes),
      };
      rerouteEdges(nextNodes);
    },
    [layoutMode, rerouteEdges, signature],
  );

  const changeLayout = useCallback(
    (mode: DependencyLayoutMode) => {
      if (mode === layoutMode) return;
      storeLayoutMode(currentModule.id, mode);
      setLayoutMode(mode);
    },
    [currentModule.id, layoutMode],
  );

  const forceRelayout = useCallback(() => {
    snapshotsRef.current[layoutMode] = null;
    setLayoutVersion((value) => value + 1);
  }, [layoutMode]);

  const fitGraph = useCallback(() => {
    void flowRef.current
      ?.fitView({ padding: 0.2, maxZoom: 1, duration: 360 })
      .then(() => {
        const nextZoom = flowRef.current?.getViewport().zoom;
        if (typeof nextZoom === "number") onZoomChange(nextZoom);
      });
  }, [onZoomChange]);

  return (
    <div className="relative h-full min-h-[620px] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(37,99,235,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute -left-32 -top-36 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/20" />

      <ReactFlow<DependencyFlowNode, DependencyFlowEdge>
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        onMoveEnd={(_, viewport) => onZoomChange(viewport.zoom)}
        nodesConnectable={false}
        nodesDraggable={!locked}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.35}
        maxZoom={1.65}
        snapToGrid
        snapGrid={[12, 12]}
        onlyRenderVisibleElements
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        proOptions={{ hideAttribution: true }}
        className="dependency-map-flow [&_.react-flow__node]:outline-none [&_.react-flow__node]:ring-0"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.05}
          color="rgba(100,116,139,0.24)"
        />

        <FlowViewportSync zoom={zoom} onZoomChange={onZoomChange} />

        <Panel position="top-right" className="!m-4">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
            <div className="px-2.5 text-[10px] font-semibold text-muted-foreground">
              {dependencies.length} dependenc{dependencies.length === 1 ? "y" : "ies"}
            </div>

            <div className="flex rounded-lg bg-muted/55 p-0.5">
              {(
                ["smart", "vertical", "horizontal"] as DependencyLayoutMode[]
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeLayout(mode)}
                  className={cn(
                    "nodrag nopan rounded-md px-2.5 py-2 text-[10px] font-semibold transition",
                    layoutMode === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-card hover:text-foreground",
                  )}
                >
                  {LAYOUT_LABELS[mode]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={forceRelayout}
              disabled={layouting}
              className="nodrag nopan inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[10px] font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", layouting && "animate-spin")}
              />
              Re-layout
            </button>
          </div>
        </Panel>

        <Panel position="bottom-left" className="!m-4">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
            <button
              type="button"
              onClick={() =>
                onZoomChange(
                  Math.min(1.65, Number((zoom + 0.1).toFixed(2))),
                )
              }
              className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onZoomChange(1)}
              className="nodrag nopan flex h-8 min-w-9 items-center justify-center rounded-lg px-1.5 text-[9px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Reset to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={() =>
                onZoomChange(
                  Math.max(0.35, Number((zoom - 0.1).toFixed(2))),
                )
              }
              className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="my-0.5 h-px bg-border" />

            <button
              type="button"
              onClick={fitGraph}
              className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Fit graph"
            >
              <Focus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onLockedChange(!locked)}
              className={cn(
                "nodrag nopan flex h-8 w-9 items-center justify-center rounded-lg transition",
                locked
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={locked ? "Unlock graph" : "Lock graph"}
            >
              {locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </button>
          </div>
        </Panel>

        <Panel position="bottom-right" className="!m-4">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
            <Move className="h-3 w-3 text-primary" />
            {locked ? "Graph locked" : "Drag nodes to fine-tune"}
          </div>
        </Panel>
      </ReactFlow>

      {layouting && flowNodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="rounded-xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground shadow-lg backdrop-blur-xl">
            Arranging dependency map…
          </div>
        </div>
      ) : null}

      {dependencies.length === 0 && !layouting ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 text-center text-xs text-muted-foreground">
          Add a module from the library to create the dependency map.
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/75 to-transparent" />
    </div>
  );
}

export function DependenciesTab({
  moduleId,
  module,
}: {
  moduleId: number;
  module: ProductModule;
}) {
  const libraryQuery = useProductModules({ page_size: 100 });
  const graphQuery = useDependencyGraph(moduleId, {
    include_required: true,
    include_optional: true,
    include_conflicts: true,
    transitive: false,
  });
  const depsQuery = useModuleDependencies({
    module: moduleId,
    page_size: 100,
  });
  const createDep = useCreateModuleDependency();
  const deleteDep = useDeleteModuleDependency();

  const [libraryTab, setLibraryTab] = useState<LibraryTab>("all");
  const [search, setSearch] = useState("");
  const [pendingType, setPendingType] =
    useState<ModuleDependencyType>("required");
  const [zoom, setZoom] = useState(1);
  const [locked, setLocked] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<ModuleDependencyType, boolean>
  >({
    required: true,
    optional: true,
    conflict: true,
  });

  const library = libraryQuery.data?.results ?? [];
  const dependencies = depsQuery.data?.results ?? [];

  const linkedIds = useMemo(
    () => new Set(dependencies.map((dependency) => dependency.required_module)),
    [dependencies],
  );

  const nodeById = useMemo(() => {
    const map = new Map<number, ModuleRecord>();

    for (const item of library) {
      map.set(item.id, item);
    }

    for (const node of graphQuery.data?.nodes ?? []) {
      map.set(node.id, node);
    }

    map.set(moduleId, module);

    return map;
  }, [graphQuery.data?.nodes, library, module, moduleId]);

  const filteredLibrary = useMemo(() => {
    const query = search.trim().toLowerCase();

    return library
      .filter((item) => item.id !== moduleId)
      .filter((item) =>
        libraryTab === "added" ? linkedIds.has(item.id) : true,
      )
      .filter((item) => {
        if (!query) return true;

        return (
          item.name.toLowerCase().includes(query) ||
          item.code.toLowerCase().includes(query)
        );
      });
  }, [library, libraryTab, linkedIds, moduleId, search]);

  const graphNodes = useMemo<GraphNode[]>(() => {
    return dependencies.flatMap((dependency) => {
      const node = nodeById.get(dependency.required_module);

      if (!node) return [];

      return [
        {
          id: node.id,
          dependencyId: dependency.id,
          name: node.name,
          code: node.code,
          type: dependency.dependency_type,
          themeColor: getThemeColor(node),
        },
      ];
    });
  }, [dependencies, nodeById]);

  const grouped = useMemo(() => {
    const groups: Record<ModuleDependencyType, ModuleDependency[]> = {
      required: [],
      optional: [],
      conflict: [],
    };

    for (const dependency of dependencies) {
      groups[dependency.dependency_type].push(dependency);
    }

    return groups;
  }, [dependencies]);

  const handleAdd = async (requiredModuleId: number) => {
    if (
      locked ||
      requiredModuleId === moduleId ||
      linkedIds.has(requiredModuleId)
    ) {
      return;
    }

    try {
      setActionError(null);

      await createDep.mutateAsync({
        module: moduleId,
        required_module: requiredModuleId,
        dependency_type: pendingType,
      });
    } catch (error) {
      setActionError(error);
    }
  };

  const handleDelete = async (dependencyId: number) => {
    if (locked) return;

    try {
      setActionError(null);
      await deleteDep.mutateAsync(dependencyId);
    } catch (error) {
      setActionError(error);
    }
  };

  const handleClearAll = async () => {
    if (locked || dependencies.length === 0) return;

    try {
      setActionError(null);

      for (const dependency of dependencies) {
        await deleteDep.mutateAsync(dependency.id);
      }
    } catch (error) {
      setActionError(error);
    }
  };

  const toggleSection = (section: ModuleDependencyType) => {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const isLoading =
    (libraryQuery.isLoading && !libraryQuery.data) ||
    (graphQuery.isLoading && !graphQuery.data) ||
    (depsQuery.isLoading && !depsQuery.data);

  return (
    <div className="space-y-3">
      {libraryQuery.error || graphQuery.error || depsQuery.error ? (
        <div className="space-y-2">
          {libraryQuery.error ? (
            <ApiErrorBanner
              error={libraryQuery.error}
              fallback="Failed to load module library."
            />
          ) : null}

          {graphQuery.error ? (
            <ApiErrorBanner
              error={graphQuery.error}
              fallback="Failed to load dependency graph."
            />
          ) : null}

          {depsQuery.error ? (
            <ApiErrorBanner
              error={depsQuery.error}
              fallback="Failed to load dependencies."
            />
          ) : null}
        </div>
      ) : null}

      {actionError != null ? (
        <ApiErrorBanner
          error={actionError}
          fallback={getApiErrorMessage(
            actionError,
            "Dependency update failed.",
          )}
        />
      ) : null}

      {isLoading ? (
        <TableSkeleton rows={6} columns={3} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[300px_minmax(620px,1fr)_300px]">
          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Module Library
                </h3>

                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Filter modules"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search modules..."
                  className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="mt-3 flex gap-1 rounded-xl bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => setLibraryTab("all")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition",
                    libraryTab === "all"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All Modules
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                    {library.filter((item) => item.id !== moduleId).length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLibraryTab("added")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition",
                    libraryTab === "added"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Added
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                    {linkedIds.size}
                  </span>
                </button>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Add dependency as
                </p>

                <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1">
                  {(
                    [
                      "required",
                      "optional",
                      "conflict",
                    ] as ModuleDependencyType[]
                  ).map((type) => {
                    const meta = TYPE_META[type];

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPendingType(type)}
                        className={cn(
                          "rounded-lg px-2 py-2 text-[10px] font-semibold transition",
                          pendingType === type
                            ? "bg-card shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        style={
                          pendingType === type
                            ? { color: meta.color }
                            : undefined
                        }
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <ul className="flex-1 space-y-2 overflow-y-auto p-3">
              {filteredLibrary.length === 0 ? (
                <li className="px-2 py-10 text-center text-sm text-muted-foreground">
                  No modules found.
                </li>
              ) : (
                filteredLibrary.map((item) => {
                  const added = linkedIds.has(item.id);
                  const visual = getModuleVisual(item.code, item.name);
                  const Icon = visual.Icon;
                  const iconColor = item.theme_color || visual.color;

                  return (
                    <li
                      key={item.id}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition hover:border-primary/30 hover:shadow-sm"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{
                          background: `linear-gradient(145deg, ${hexToRgba(
                            iconColor,
                            0.84,
                          )}, ${iconColor})`,
                        }}
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <ClassificationBadge
                          classification={item.classification}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={added || locked || createDep.isPending}
                        onClick={() => void handleAdd(item.id)}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed",
                          added
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "border-border text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-50",
                        )}
                        title={
                          added
                            ? "Already added"
                            : `Add as ${pendingType}`
                        }
                      >
                        {added ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="relative min-h-[620px] min-w-0">
            <ReactFlowProvider>
              <DependencyGraphCanvas
                currentModule={module}
                dependencies={graphNodes}
                zoom={zoom}
                onZoomChange={setZoom}
                locked={locked}
                onLockedChange={setLocked}
                onDelete={(dependencyId) => {
                  void handleDelete(dependencyId);
                }}
              />
            </ReactFlowProvider>
          </section>

          <section className="flex min-h-[620px] flex-col gap-4">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-base font-semibold text-foreground">
                  Selected Dependencies
                </h3>

                {dependencies.length > 0 && !locked ? (
                  <button
                    type="button"
                    onClick={() => void handleClearAll()}
                    disabled={deleteDep.isPending}
                    className="text-xs font-medium text-primary transition hover:text-primary/80 disabled:opacity-50"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {(
                  [
                    "required",
                    "optional",
                    "conflict",
                  ] as ModuleDependencyType[]
                ).map((type) => {
                  const items = grouped[type];
                  const meta = TYPE_META[type];
                  const expanded = expandedSections[type];

                  return (
                    <div key={type}>
                      <button
                        type="button"
                        onClick={() => toggleSection(type)}
                        className="flex w-full items-center gap-2 py-1.5"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {meta.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({items.length})
                        </span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
                            !expanded && "-rotate-90",
                          )}
                        />
                      </button>

                      {expanded && items.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {items.map((dependency) => {
                            const node = nodeById.get(
                              dependency.required_module,
                            );
                            const visual = getModuleVisual(
                              node?.code ?? "",
                              node?.name ??
                                dependency.required_module_name,
                            );
                            const Icon = visual.Icon;
                            const iconColor =
                              getThemeColor(node) || visual.color;

                            return (
                              <li
                                key={dependency.id}
                                className="group flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5"
                              >
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                                  style={{
                                    background: `linear-gradient(145deg, ${hexToRgba(
                                      iconColor,
                                      0.84,
                                    )}, ${iconColor})`,
                                  }}
                                >
                                  <Icon
                                    className="h-4 w-4"
                                    strokeWidth={1.9}
                                  />
                                </div>

                                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                                  {dependency.required_module_name}
                                </p>

                                {!locked ? (
                                  <button
                                    type="button"
                                    disabled={deleteDep.isPending}
                                    onClick={() =>
                                      void handleDelete(dependency.id)
                                    }
                                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 disabled:opacity-50"
                                    title={`Remove ${dependency.required_module_name}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}

                {dependencies.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No dependencies selected yet.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-foreground" />
                <h4 className="text-sm font-semibold text-foreground">
                  Dependency Rules
                </h4>
              </div>

              <ul className="space-y-2.5">
                {[
                  {
                    title: "No self-dependency",
                    body: "A module cannot depend on itself.",
                  },
                  {
                    title: "No duplicate dependency",
                    body: "A module can only be added once.",
                  },
                  {
                    title: "No circular dependency",
                    body: "Circular dependencies are not allowed.",
                  },
                ].map((rule) => (
                  <li key={rule.title} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {rule.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {rule.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold text-foreground">Tip</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Choose the dependency type, then click the plus button beside
                  a module to add it to the map.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}