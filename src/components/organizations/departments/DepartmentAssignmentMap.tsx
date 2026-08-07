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
  Building2,
  Focus,
  GitBranch,
  Minus,
  Move,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  Department,
  DepartmentUnitAssignment,
  OrganizationUnit,
} from "@/features/organizations";
import { UNIT_TYPE_META } from "@/components/organizations/organizationUi";
import { cn } from "@/lib/utils";

export type DepartmentAssignmentLayoutMode =
  | "smart"
  | "horizontal"
  | "vertical";

type NodeKind = "department" | "assignment";
type HandleSide = "top" | "right" | "bottom" | "left";
type Point = { x: number; y: number };
type NodeSize = { width: number; height: number };

type AssignmentMapNodeData = {
  kind: NodeKind;
  department: Department;
  assignment: DepartmentUnitAssignment | null;
  unit: OrganizationUnit | null;
  selected: boolean;
  accent: string;
};

type AssignmentMapFlowNode = Node<AssignmentMapNodeData, "assignmentMap">;

type AssignmentMapEdgeData = {
  color: string;
  selected: boolean;
  active: boolean;
};

type AssignmentMapFlowEdge = Edge<AssignmentMapEdgeData, "assignmentMap">;

type GraphNode = {
  id: string;
  kind: NodeKind;
  department: Department;
  assignment: DepartmentUnitAssignment | null;
  unit: OrganizationUnit | null;
  accent: string;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  color: string;
  assignmentId: number;
  active: boolean;
};

type AssignmentGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type LayoutSnapshot = {
  signature: string;
  positions: Map<string, Point>;
};

const NODE_SIZE: Record<NodeKind, NodeSize> = {
  department: { width: 220, height: 184 },
  assignment: { width: 198, height: 102 },
};

const HANDLE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const LAYOUT_LABELS: Record<DepartmentAssignmentLayoutMode, string> = {
  smart: "Smart",
  horizontal: "Horizontal",
  vertical: "Vertical",
};

const STORAGE_PREFIX = "siteos:department-assignment-map:layout:";

const NODE_TYPES = {
  assignmentMap: AssignmentMapNode,
};

const EDGE_TYPES = {
  assignmentMap: AssignmentMapEdge,
};

function departmentNodeId(departmentId: number) {
  return `department-${departmentId}`;
}

function assignmentNodeId(assignmentId: number) {
  return `assignment-${assignmentId}`;
}

function readStoredLayoutMode(
  departmentId: number
): DepartmentAssignmentLayoutMode {
  if (typeof window === "undefined") return "smart";

  const value = window.localStorage.getItem(
    `${STORAGE_PREFIX}${departmentId}`
  );

  return value === "horizontal" || value === "vertical" || value === "smart"
    ? value
    : "smart";
}

function storeLayoutMode(
  departmentId: number,
  mode: DepartmentAssignmentLayoutMode
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STORAGE_PREFIX}${departmentId}`, mode);
}

function assignmentAccent(
  assignment: DepartmentUnitAssignment,
  unit: OrganizationUnit | null
) {
  const value = `${
    unit?.unit_type ?? assignment.organization_unit_type ?? ""
  } ${unit?.unit_type_display ?? ""}`.toLowerCase();

  if (value.includes("region")) return "#7c3aed";
  if (value.includes("legal") || value.includes("entity")) return "#10b981";
  if (value.includes("department")) return "#f59e0b";
  if (value.includes("office") || value.includes("site")) return "#06b6d4";
  if (value.includes("division") || value.includes("business")) return "#ec4899";

  const palette = [
    "#2563eb",
    "#7c3aed",
    "#10b981",
    "#f59e0b",
    "#06b6d4",
    "#ec4899",
  ];

  return palette[Math.abs(assignment.id) % palette.length];
}

function buildGraph(
  department: Department,
  assignments: DepartmentUnitAssignment[],
  unitsById: Map<number, OrganizationUnit>
): AssignmentGraph {
  const rootId = departmentNodeId(department.id);
  const nodes: GraphNode[] = [
    {
      id: rootId,
      kind: "department",
      department,
      assignment: null,
      unit: null,
      accent: department.is_active ? "#4f46e5" : "#94a3b8",
    },
  ];
  const edges: GraphEdge[] = [];

  assignments.forEach((assignment) => {
    const unit = unitsById.get(assignment.organization_unit) ?? null;
    const accent = assignmentAccent(assignment, unit);
    const id = assignmentNodeId(assignment.id);

    nodes.push({
      id,
      kind: "assignment",
      department,
      assignment,
      unit,
      accent,
    });

    edges.push({
      id: `${rootId}--${id}`,
      source: rootId,
      target: id,
      color: accent,
      assignmentId: assignment.id,
      active: assignment.is_active,
    });
  });

  return { nodes, edges };
}

function graphSignature(graph: AssignmentGraph) {
  return graph.nodes
    .map((node) =>
      node.assignment
        ? `${node.id}:${node.assignment.organization_unit}`
        : node.id
    )
    .sort()
    .join("|");
}

function calculateSmartPositions(graph: AssignmentGraph): Map<string, Point> {
  const positions = new Map<string, Point>();
  const root = graph.nodes.find((node) => node.kind === "department");
  const children = graph.nodes.filter((node) => node.kind === "assignment");

  if (!root) return positions;

  if (children.length === 0) {
    positions.set(root.id, { x: 0, y: 0 });
    return positions;
  }

  if (children.length === 1) {
    positions.set(root.id, { x: 0, y: 0 });
    positions.set(children[0].id, { x: 350, y: 41 });
    return positions;
  }

  if (children.length === 2) {
    positions.set(root.id, { x: 260, y: 150 });
    positions.set(children[0].id, { x: -80, y: 191 });
    positions.set(children[1].id, { x: 610, y: 191 });
    return positions;
  }

  const rootX = 420;
  const rootY = 300;
  const radiusX = children.length <= 5 ? 390 : children.length <= 9 ? 470 : 560;
  const radiusY = children.length <= 5 ? 245 : children.length <= 9 ? 300 : 360;
  const angleOffset = -Math.PI / 2;

  positions.set(root.id, { x: rootX, y: rootY });

  children.forEach((child, index) => {
    const angle = angleOffset + (Math.PI * 2 * index) / children.length;
    const size = NODE_SIZE.assignment;

    positions.set(child.id, {
      x:
        rootX +
        NODE_SIZE.department.width / 2 +
        Math.cos(angle) * radiusX -
        size.width / 2,
      y:
        rootY +
        NODE_SIZE.department.height / 2 +
        Math.sin(angle) * radiusY -
        size.height / 2,
    });
  });

  return positions;
}

function calculateHorizontalPositions(graph: AssignmentGraph): Map<string, Point> {
  const positions = new Map<string, Point>();
  const root = graph.nodes.find((node) => node.kind === "department");
  const children = graph.nodes.filter((node) => node.kind === "assignment");

  if (!root) return positions;

  const rowGap = 34;
  const columnGap = 86;
  const maxRows = Math.min(5, Math.max(1, Math.ceil(Math.sqrt(children.length))));
  const mapHeight =
    maxRows * NODE_SIZE.assignment.height + (maxRows - 1) * rowGap;

  positions.set(root.id, {
    x: 0,
    y: Math.max(0, mapHeight / 2 - NODE_SIZE.department.height / 2),
  });

  children.forEach((child, index) => {
    const column = Math.floor(index / maxRows);
    const row = index % maxRows;

    positions.set(child.id, {
      x:
        NODE_SIZE.department.width +
        170 +
        column * (NODE_SIZE.assignment.width + columnGap),
      y: row * (NODE_SIZE.assignment.height + rowGap),
    });
  });

  return positions;
}

function calculateVerticalPositions(graph: AssignmentGraph): Map<string, Point> {
  const positions = new Map<string, Point>();
  const root = graph.nodes.find((node) => node.kind === "department");
  const children = graph.nodes.filter((node) => node.kind === "assignment");

  if (!root) return positions;

  const columnGap = 46;
  const rowGap = 52;
  const columnCount = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(children.length))));
  const gridWidth =
    columnCount * NODE_SIZE.assignment.width + (columnCount - 1) * columnGap;

  positions.set(root.id, {
    x: Math.max(0, gridWidth / 2 - NODE_SIZE.department.width / 2),
    y: 0,
  });

  children.forEach((child, index) => {
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);

    positions.set(child.id, {
      x: column * (NODE_SIZE.assignment.width + columnGap),
      y:
        NODE_SIZE.department.height +
        150 +
        row * (NODE_SIZE.assignment.height + rowGap),
    });
  });

  return positions;
}

function calculatePositions(
  graph: AssignmentGraph,
  mode: DepartmentAssignmentLayoutMode
) {
  if (mode === "horizontal") return calculateHorizontalPositions(graph);
  if (mode === "vertical") return calculateVerticalPositions(graph);
  return calculateSmartPositions(graph);
}

function getNodeCenter(node: AssignmentMapFlowNode) {
  const size = NODE_SIZE[node.data.kind];
  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2,
  };
}

function sideTowards(
  source: AssignmentMapFlowNode,
  target: AssignmentMapFlowNode
): HandleSide {
  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "bottom" : "top";
}

function oppositeSide(side: HandleSide): HandleSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  return "left";
}

function nodeDataFromGraphNode(
  node: GraphNode,
  selectedAssignmentId: number | null
): AssignmentMapNodeData {
  return {
    kind: node.kind,
    department: node.department,
    assignment: node.assignment,
    unit: node.unit,
    selected:
      node.assignment != null && node.assignment.id === selectedAssignmentId,
    accent: node.accent,
  };
}

function createFlowNodes(
  graph: AssignmentGraph,
  positions: Map<string, Point>,
  selectedAssignmentId: number | null
): AssignmentMapFlowNode[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    type: "assignmentMap",
    position: positions.get(node.id) ?? { x: 0, y: 0 },
    width: NODE_SIZE[node.kind].width,
    height: NODE_SIZE[node.kind].height,
    draggable: true,
    selectable: false,
    focusable: false,
    zIndex: node.kind === "department" ? 5 : 7,
    data: nodeDataFromGraphNode(node, selectedAssignmentId),
  }));
}

function createFlowEdges(
  graphEdges: GraphEdge[],
  nodes: AssignmentMapFlowNode[],
  selectedAssignmentId: number | null
): AssignmentMapFlowEdge[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return graphEdges.flatMap((edge) => {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) return [];

    const sourceSide = sideTowards(source, target);
    const targetSide = oppositeSide(sourceSide);

    return [
      {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: `source-${sourceSide}`,
        targetHandle: `target-${targetSide}`,
        type: "assignmentMap",
        selectable: false,
        focusable: false,
        data: {
          color: edge.color,
          selected: selectedAssignmentId === edge.assignmentId,
          active: edge.active,
        },
      },
    ];
  });
}

function copyPositions(nodes: AssignmentMapFlowNode[]) {
  return new Map(
    nodes.map((node) => [
      node.id,
      { x: node.position.x, y: node.position.y },
    ])
  );
}

function AssignmentMapNode({ data }: NodeProps<AssignmentMapFlowNode>) {
  return (
    <div
      className={cn(
        "relative h-full w-full cursor-grab select-none active:cursor-grabbing",
        data.kind === "department" && "overflow-visible"
      )}
    >
      {(["top", "right", "bottom", "left"] as HandleSide[]).map((side) => (
        <Handle
          key={`target-${side}`}
          id={`target-${side}`}
          type="target"
          position={HANDLE_POSITION[side]}
          isConnectable={false}
          className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
        />
      ))}

      {data.kind === "department" ? (
        <DepartmentNodeCard data={data} />
      ) : (
        <AssignmentNodeCard data={data} />
      )}

      {(["top", "right", "bottom", "left"] as HandleSide[]).map((side) => (
        <Handle
          key={`source-${side}`}
          id={`source-${side}`}
          type="source"
          position={HANDLE_POSITION[side]}
          isConnectable={false}
          className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0"
        />
      ))}
    </div>
  );
}

function DepartmentNodeCard({ data }: { data: AssignmentMapNodeData }) {
  const department = data.department;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/5" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/[0.075]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.055] blur-2xl" />

      <div className="relative z-10 flex h-[176px] w-[212px] flex-col items-center justify-center rounded-[34px] border border-border/90 bg-card/92 px-5 text-center shadow-[0_24px_64px_-30px_rgba(37,99,235,0.42),0_12px_30px_-20px_rgba(0,0,0,0.58)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-[7px] rounded-[28px] border border-primary/10" />

        <div className="relative mb-3 flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-white shadow-[0_15px_34px_-14px_rgba(79,70,229,0.9)] ring-8 ring-indigo-500/[0.08]">
          {department.image ? (
            <img
              src={department.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-7 w-7" strokeWidth={1.8} />
          )}
        </div>

        <p className="line-clamp-2 max-w-[178px] text-[15px] font-semibold leading-5 text-foreground">
          {department.name}
        </p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-primary/80">
          Department
        </p>
        <span
          className={cn(
            "mt-2 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide",
            department.is_active
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-muted text-muted-foreground"
          )}
        >
          {department.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}

function AssignmentNodeCard({ data }: { data: AssignmentMapNodeData }) {
  const assignment = data.assignment;
  if (!assignment) return null;

  const unit = data.unit;
  const unitType = unit?.unit_type ?? assignment.organization_unit_type;
  const meta = UNIT_TYPE_META[unitType] ?? UNIT_TYPE_META.other;
  const Icon = meta.icon;
  const name = assignment.organization_unit_name || unit?.name || "Unit";
  const code = assignment.organization_unit_code || unit?.code || "No code";
  const typeLabel = unit?.unit_type_display || meta.label;
  const image = assignment.image || unit?.image;

  return (
    <div
      className={cn(
        "group relative flex h-full w-full items-center gap-3 rounded-[24px] border bg-card/92 px-3.5 py-3 shadow-[0_18px_45px_-28px_rgba(0,0,0,0.72),0_8px_20px_-16px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-200",
        data.selected
          ? "border-primary/60 shadow-[0_20px_50px_-24px_rgba(37,99,235,0.65),0_0_0_4px_rgba(59,130,246,0.10)]"
          : "border-border/90 hover:border-primary/40"
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-4 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: data.accent }}
      />

      <div
        className={cn(
          "relative flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-[17px] ring-1 ring-black/[0.035]",
          meta.tone
        )}
      >
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-foreground">
            {name}
          </p>
          <GitBranch
            className="h-3 w-3 shrink-0 opacity-45"
            style={{ color: data.accent }}
          />
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {code} · {typeLabel}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide",
              assignment.is_active
                ? "bg-sky-500/10 text-sky-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            {assignment.is_active ? "Assigned" : "Inactive"}
          </span>
          {data.selected ? (
            <span className="text-[9px] font-semibold text-primary">
              Selected
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AssignmentMapEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<AssignmentMapFlowEdge>) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.32,
  });

  const color = data?.color ?? "#6366f1";
  const selected = Boolean(data?.selected);
  const active = data?.active !== false;

  return (
    <g>
      <BaseEdge
        id={`${id}-glow`}
        path={path}
        style={{
          stroke: color,
          strokeWidth: selected ? 13 : 10,
          strokeOpacity: selected ? 0.13 : 0.065,
          strokeLinecap: "round",
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: selected ? 2.4 : 1.7,
          strokeOpacity: active ? (selected ? 0.82 : 0.48) : 0.24,
          strokeLinecap: "round",
          strokeDasharray: active ? undefined : "5 6",
        }}
      />
      <circle
        cx={sourceX}
        cy={sourceY}
        r={selected ? 4 : 3.2}
        fill={color}
        fillOpacity={selected ? 1 : 0.8}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={selected ? 4.2 : 3.4}
        fill="hsl(var(--card))"
        stroke={color}
        strokeWidth={selected ? 2.2 : 1.6}
      />
    </g>
  );
}

function MapZoomControls() {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(1);

  const syncZoom = useCallback(() => {
    requestAnimationFrame(() => setZoom(getZoom()));
  }, [getZoom]);

  return (
    <Panel position="bottom-left" className="!m-4">
      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => {
            void zoomIn({ duration: 180 });
            syncZoom();
          }}
          className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="flex h-7 min-w-9 items-center justify-center text-[9px] font-bold tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </div>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => {
            void zoomOut({ duration: 180 });
            syncZoom();
          }}
          className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="mx-1 my-0.5 h-px bg-border" />
        <button
          type="button"
          aria-label="Fit map"
          title="Fit map"
          onClick={() => {
            void fitView({ padding: 0.2, maxZoom: 1, duration: 350 });
            syncZoom();
          }}
          className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Focus className="h-4 w-4" />
        </button>
      </div>
    </Panel>
  );
}

function AssignmentMapCanvas({
  department,
  assignments,
  unitsById,
  selectedAssignmentId,
  onSelectAssignment,
}: {
  department: Department;
  assignments: DepartmentUnitAssignment[];
  unitsById: Map<number, OrganizationUnit>;
  selectedAssignmentId: number | null;
  onSelectAssignment: (assignmentId: number) => void;
}) {
  const [layoutMode, setLayoutMode] = useState<DepartmentAssignmentLayoutMode>(
    () => readStoredLayoutMode(department.id)
  );
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [layouting, setLayouting] = useState(true);
  const [nodes, setNodes, onNodesChange] =
    useNodesState<AssignmentMapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<AssignmentMapFlowEdge>([]);

  const flowRef =
    useRef<ReactFlowInstance<AssignmentMapFlowNode, AssignmentMapFlowEdge> | null>(
      null
    );
  const nodesRef = useRef<AssignmentMapFlowNode[]>([]);
  const snapshotsRef = useRef<
    Record<DepartmentAssignmentLayoutMode, LayoutSnapshot | null>
  >({
    smart: null,
    horizontal: null,
    vertical: null,
  });

  const graph = useMemo(
    () => buildGraph(department, assignments, unitsById),
    [assignments, department, unitsById]
  );
  const signature = useMemo(() => graphSignature(graph), [graph]);
  const graphRef = useRef(graph);
  graphRef.current = graph;

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    setLayoutMode(readStoredLayoutMode(department.id));
    snapshotsRef.current = {
      smart: null,
      horizontal: null,
      vertical: null,
    };
  }, [department.id]);

  useEffect(() => {
    let cancelled = false;
    setLayouting(true);

    const currentGraph = graphRef.current;
    const saved = snapshotsRef.current[layoutMode];
    const positions: Map<string, Point> =
      saved?.signature === signature
        ? new Map<string, Point>(saved.positions)
        : calculatePositions(currentGraph, layoutMode);

    const nextNodes = createFlowNodes(
      currentGraph,
      positions,
      selectedAssignmentId
    );
    const nextEdges = createFlowEdges(
      currentGraph.edges,
      nextNodes,
      selectedAssignmentId
    );

    snapshotsRef.current[layoutMode] = {
      signature,
      positions: copyPositions(nextNodes),
    };

    if (!cancelled) {
      nodesRef.current = nextNodes;
      setNodes(nextNodes);
      setEdges(nextEdges);

      window.setTimeout(() => {
        if (cancelled) return;
        void flowRef.current?.fitView({
          padding: 0.2,
          maxZoom: 1,
          duration: 420,
        });
        setLayouting(false);
      }, 40);
    }

    return () => {
      cancelled = true;
    };
  }, [
    department.id,
    layoutMode,
    layoutVersion,
    setEdges,
    setNodes,
    signature,
  ]);

  useEffect(() => {
    const currentGraph = graphRef.current;
    const graphNodesById = new Map<string, GraphNode>(
      currentGraph.nodes.map((node): [string, GraphNode] => [node.id, node])
    );

    setNodes((current) =>
      current.map((node) => {
        const graphNode = graphNodesById.get(node.id);
        if (!graphNode) return node;

        return {
          ...node,
          data: nodeDataFromGraphNode(graphNode, selectedAssignmentId),
        };
      })
    );

    setEdges((current) =>
      current.map((edge) => {
        const graphEdge = currentGraph.edges.find(
          (candidate) => candidate.id === edge.id
        );
        if (!graphEdge) return edge;

        return {
          ...edge,
          data: {
            color: graphEdge.color,
            active: graphEdge.active,
            selected: selectedAssignmentId === graphEdge.assignmentId,
          },
        };
      })
    );
  }, [graph, selectedAssignmentId, setEdges, setNodes]);

  const rerouteEdges = useCallback(
    (nextNodes: AssignmentMapFlowNode[]) => {
      setEdges(
        createFlowEdges(
          graphRef.current.edges,
          nextNodes,
          selectedAssignmentId
        )
      );
    },
    [selectedAssignmentId, setEdges]
  );

  const handleNodeDrag = useCallback(
    (_: unknown, movedNode: AssignmentMapFlowNode) => {
      const nextNodes = nodesRef.current.map((node) =>
        node.id === movedNode.id
          ? { ...node, position: { ...movedNode.position } }
          : node
      );
      rerouteEdges(nextNodes);
    },
    [rerouteEdges]
  );

  const handleNodeDragStop = useCallback(
    (_: unknown, movedNode: AssignmentMapFlowNode) => {
      const nextNodes = nodesRef.current.map((node) =>
        node.id === movedNode.id
          ? { ...node, position: { ...movedNode.position } }
          : node
      );

      nodesRef.current = nextNodes;
      snapshotsRef.current[layoutMode] = {
        signature,
        positions: copyPositions(nextNodes),
      };
      rerouteEdges(nextNodes);
    },
    [layoutMode, rerouteEdges, signature]
  );

  const changeLayout = useCallback(
    (mode: DepartmentAssignmentLayoutMode) => {
      if (mode === layoutMode) return;
      storeLayoutMode(department.id, mode);
      setLayoutMode(mode);
    },
    [department.id, layoutMode]
  );

  const forceRelayout = useCallback(() => {
    snapshotsRef.current[layoutMode] = null;
    setLayoutVersion((value) => value + 1);
  }, [layoutMode]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-card">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(37,99,235,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute -left-32 -top-36 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/20" />

      <ReactFlow<AssignmentMapFlowNode, AssignmentMapFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        onNodeClick={(_, node) => {
          const assignment = node.data.assignment;
          if (assignment) onSelectAssignment(assignment.id);
        }}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodesConnectable={false}
        nodesDraggable
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.3}
        maxZoom={1.5}
        snapToGrid
        snapGrid={[12, 12]}
        onlyRenderVisibleElements={false}
        proOptions={{ hideAttribution: true }}
        className="department-assignment-flow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(148, 163, 184, 0.18)"
        />

        <Panel position="top-right" className="!m-4">
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
            <div className="flex rounded-xl bg-muted/60 p-0.5">
              {(
                ["smart", "horizontal", "vertical"] as DepartmentAssignmentLayoutMode[]
              ).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => changeLayout(mode)}
                  className={cn(
                    "nodrag nopan h-8 rounded-[10px] px-3 text-[10px] font-semibold transition",
                    layoutMode === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
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
              className="nodrag nopan inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-[10px] font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", layouting && "animate-spin")}
              />
              Re-layout
            </button>
          </div>
        </Panel>

        <Panel position="bottom-right" className="!m-4">
          <div className="pointer-events-none flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1.5 text-[9px] font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Move className="h-3 w-3" />
            Drag nodes to fine-tune
          </div>
        </Panel>

        <MapZoomControls />
      </ReactFlow>

      {assignments.length === 0 && !layouting ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-6">
          <div className="rounded-2xl border border-dashed border-border bg-card/90 px-5 py-3 text-center text-xs text-muted-foreground shadow-sm backdrop-blur">
            No units assigned yet. Use <strong>Assign to Unit</strong> to map
            coverage.
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
    </div>
  );
}

export function DepartmentAssignmentMap({
  department,
  assignments,
  unitsById,
  selectedAssignmentId,
  onSelectAssignment,
}: {
  department: Department | null;
  assignments: DepartmentUnitAssignment[];
  unitsById: Map<number, OrganizationUnit>;
  selectedAssignmentId: number | null;
  onSelectAssignment: (assignmentId: number) => void;
}) {
  if (!department) {
    return (
      <div className="flex min-h-[560px] flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center text-sm text-muted-foreground shadow-sm">
        Select a department to view its unit assignment map.
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative z-20 flex items-center justify-between border-b border-border/70 bg-card/88 px-5 py-3 backdrop-blur-xl">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Assignment map
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">
            {department.name} <span className="text-muted-foreground">→</span>{" "}
            organization units
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
          {assignments.length} assignment{assignments.length === 1 ? "" : "s"}
        </span>
      </div>

      <ReactFlowProvider>
        <AssignmentMapCanvas
          department={department}
          assignments={assignments}
          unitsById={unitsById}
          selectedAssignmentId={selectedAssignmentId}
          onSelectAssignment={onSelectAssignment}
        />
      </ReactFlowProvider>
    </div>
  );
}
