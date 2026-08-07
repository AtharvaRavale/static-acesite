import ELK from "elkjs/lib/elk.bundled.js";
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
import { Focus, Minus, Plus, RefreshCw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  Organization,
  OrganizationUnitTreeNode,
} from "@/features/organizations";
import { OrganizationNodeCard } from "@/components/organizations/OrganizationNodeCard";
import { cn } from "@/lib/utils";

export type CanvasSelection =
  | { kind: "org"; id: number }
  | { kind: "unit"; id: number };

export type HierarchyLayoutMode = "smart" | "vertical" | "horizontal";

export interface LayoutNode {
  key: string;
  kind: "org" | "unit";
  x: number;
  y: number;
  data: Organization | OrganizationUnitTreeNode;
  childCount: number;
  depth: number;
}

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  color: string;
}

type HierarchyNodeData = {
  layoutNode: LayoutNode;
  selected: boolean;
  collapsed: boolean;
  onSelect: (node: LayoutNode) => void;
  onToggleCollapsed: (key: string) => void;
};

type HierarchyFlowNode = Node<HierarchyNodeData, "hierarchy">;
type HierarchyEdgeData = {
  color: string;
  layoutMode: HierarchyLayoutMode;
};
type HierarchyFlowEdge = Edge<HierarchyEdgeData, "hierarchy">;

type FlatGraph = {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
};

type NodeSize = { width: number; height: number };
type HandleSide = "top" | "right" | "bottom" | "left";
type Point = { x: number; y: number };
type LayoutSnapshot = {
  signature: string;
  positions: Map<string, Point>;
};

const elk = new ELK();

const NODE_SIZE: Record<LayoutNode["kind"], NodeSize> = {
  org: { width: 244, height: 206 },
  unit: { width: 184, height: 128 },
};

const NODE_TYPES = {
  hierarchy: HierarchyNode,
};

const EDGE_TYPES = {
  hierarchy: HierarchyEdge,
};

const HANDLE_POSITION: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

const MODE_LABELS: Record<HierarchyLayoutMode, string> = {
  smart: "Smart",
  vertical: "Vertical",
  horizontal: "Horizontal",
};

const LAYOUT_STORAGE_PREFIX = "siteos:organization-hierarchy:layout-mode:";

function readStoredLayoutMode(organizationId: number): HierarchyLayoutMode {
  if (typeof window === "undefined") return "smart";

  const stored = window.localStorage.getItem(
    `${LAYOUT_STORAGE_PREFIX}${organizationId}`
  );

  if (stored === "vertical" || stored === "horizontal" || stored === "smart") {
    return stored;
  }

  return "smart";
}

function storeLayoutMode(
  organizationId: number,
  mode: HierarchyLayoutMode
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${LAYOUT_STORAGE_PREFIX}${organizationId}`,
    mode
  );
}

function unitEdgeColor(unit: OrganizationUnitTreeNode, depth: number) {
  const value = `${unit.unit_type ?? ""} ${
    unit.unit_type_display ?? ""
  }`.toLowerCase();

  if (value.includes("region")) return "#7c3aed";
  if (value.includes("legal") || value.includes("entity")) return "#10b981";
  if (value.includes("department")) {
    return depth % 2 === 0 ? "#f59e0b" : "#2563eb";
  }
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

  return palette[Math.abs(unit.id + depth) % palette.length];
}

function flattenVisibleTree(
  organization: Organization,
  tree: OrganizationUnitTreeNode[],
  collapsed: Set<string>
): FlatGraph {
  const organizationKey = `org-${organization.id}`;
  const nodes: LayoutNode[] = [
    {
      key: organizationKey,
      kind: "org",
      x: 0,
      y: 0,
      data: organization,
      childCount: tree.length,
      depth: 0,
    },
  ];
  const edges: LayoutEdge[] = [];

  const walk = (
    children: OrganizationUnitTreeNode[],
    parentKey: string,
    depth: number
  ) => {
    children.forEach((child) => {
      const key = `unit-${child.id}`;
      const childCount = child.children?.length ?? 0;

      nodes.push({
        key,
        kind: "unit",
        x: 0,
        y: 0,
        data: child,
        childCount,
        depth,
      });

      edges.push({
        id: `${parentKey}--${key}`,
        from: parentKey,
        to: key,
        color: unitEdgeColor(child, depth),
      });

      if (childCount > 0 && !collapsed.has(key)) {
        walk(child.children ?? [], key, depth + 1);
      }
    });
  };

  if (!collapsed.has(organizationKey)) {
    walk(tree, organizationKey, 1);
  }

  return { nodes, edges };
}

function graphSignature(graph: FlatGraph) {
  const nodes = graph.nodes
    .map((node) => `${node.key}:${node.depth}:${node.childCount}`)
    .join("|");
  const edges = graph.edges
    .map((edge) => `${edge.from}>${edge.to}`)
    .join("|");

  return `${nodes}::${edges}`;
}

function oppositeSide(side: HandleSide): HandleSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  return "left";
}

function sideTowards(
  from: HierarchyFlowNode,
  to: HierarchyFlowNode
): HandleSide {
  const fromSize = NODE_SIZE[from.data.layoutNode.kind];
  const toSize = NODE_SIZE[to.data.layoutNode.kind];
  const fromCenter = {
    x: from.position.x + fromSize.width / 2,
    y: from.position.y + fromSize.height / 2,
  };
  const toCenter = {
    x: to.position.x + toSize.width / 2,
    y: to.position.y + toSize.height / 2,
  };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }

  return dy >= 0 ? "bottom" : "top";
}

function isSelected(
  layoutNode: LayoutNode,
  selected: CanvasSelection | null
) {
  const entityId =
    layoutNode.kind === "org"
      ? (layoutNode.data as Organization).id
      : (layoutNode.data as OrganizationUnitTreeNode).id;

  return selected?.kind === layoutNode.kind && selected.id === entityId;
}

function buildFlowNodes(
  graphNodes: LayoutNode[],
  positions: Map<string, Point>,
  selected: CanvasSelection | null,
  collapsed: Set<string>,
  onSelect: (node: LayoutNode) => void,
  onToggleCollapsed: (key: string) => void
): HierarchyFlowNode[] {
  return graphNodes.map((layoutNode) => {
    const position = positions.get(layoutNode.key) ?? { x: 0, y: 0 };
    const size = NODE_SIZE[layoutNode.kind];

    return {
      id: layoutNode.key,
      type: "hierarchy",
      position,
      width: size.width,
      height: size.height,
      style: {
        width: size.width,
        height: size.height,
      },
      draggable: true,
      selectable: true,
      data: {
        layoutNode: {
          ...layoutNode,
          x: position.x,
          y: position.y,
        },
        selected: isSelected(layoutNode, selected),
        collapsed: collapsed.has(layoutNode.key),
        onSelect,
        onToggleCollapsed,
      },
    };
  });
}

function buildFlowEdges(
  graphEdges: LayoutEdge[],
  nodes: HierarchyFlowNode[],
  layoutMode: HierarchyLayoutMode
): HierarchyFlowEdge[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return graphEdges.flatMap((edge) => {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);
    if (!source || !target) return [];

    const sourceSide = sideTowards(source, target);
    const targetSide = oppositeSide(sourceSide);

    return [
      {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        sourceHandle: `source-${sourceSide}`,
        targetHandle: `target-${targetSide}`,
        type: "hierarchy",
        data: {
          color: edge.color,
          layoutMode,
        },
        selectable: false,
        focusable: false,
      },
    ];
  });
}

function elkOptionsForMode(
  layoutMode: HierarchyLayoutMode,
  nodeCount: number
): Record<string, string> {
  if (layoutMode === "vertical") {
    return {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "SPLINES",
      "elk.spacing.nodeNode": "92",
      "elk.spacing.edgeNode": "42",
      "elk.layered.spacing.nodeNodeBetweenLayers": "118",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.padding": "[top=80,left=80,bottom=80,right=80]",
    };
  }

  if (layoutMode === "horizontal") {
    return {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "SPLINES",
      "elk.spacing.nodeNode": "82",
      "elk.spacing.edgeNode": "42",
      "elk.layered.spacing.nodeNodeBetweenLayers": "132",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.padding": "[top=80,left=80,bottom=80,right=80]",
    };
  }

  // The radial view is closest to the command-center reference. For larger
  // hierarchies, a larger radius prevents sibling cards from colliding.
  const radius = Math.max(230, Math.min(430, 205 + nodeCount * 8));

  return {
    "elk.algorithm": "radial",
    "elk.radial.centerOnRoot": "true",
    "elk.radial.radius": String(radius),
    "elk.spacing.nodeNode": "112",
    "elk.spacing.edgeNode": "48",
    "elk.spacing.edgeEdge": "32",
    "elk.aspectRatio": "1.55",
    "elk.padding": "[top=90,left=90,bottom=90,right=90]",
  };
}

async function calculatePositions(
  graph: FlatGraph,
  layoutMode: HierarchyLayoutMode
): Promise<Map<string, Point>> {
  const result = await elk.layout({
    id: "organization-hierarchy",
    layoutOptions: elkOptionsForMode(layoutMode, graph.nodes.length),
    children: graph.nodes.map((node) => ({
      id: node.key,
      width: NODE_SIZE[node.kind].width,
      height: NODE_SIZE[node.kind].height,
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.from],
      targets: [edge.to],
    })),
  });

  return new Map(
    (result.children ?? []).map((child) => [
      child.id,
      {
        x: child.x ?? 0,
        y: child.y ?? 0,
      },
    ])
  );
}

function snapshotPositions(
  signature: string,
  nodes: HierarchyFlowNode[]
): LayoutSnapshot {
  return {
    signature,
    positions: new Map(
      nodes.map((node) => [
        node.id,
        { x: node.position.x, y: node.position.y },
      ])
    ),
  };
}

function HierarchyNode({ data }: NodeProps<HierarchyFlowNode>) {
  return (
    <div className="relative h-full w-full cursor-grab active:cursor-grabbing">
      {(["top", "right", "bottom", "left"] as HandleSide[]).map(
        (side) => (
          <Handle
            key={`target-${side}`}
            id={`target-${side}`}
            type="target"
            position={HANDLE_POSITION[side]}
            className="!h-2 !w-2 !border-2 !border-white !bg-primary !opacity-0"
            isConnectable={false}
          />
        )
      )}

      <OrganizationNodeCard
        node={data.layoutNode}
        selected={data.selected}
        collapsed={data.collapsed}
        onToggleCollapsed={() =>
          data.onToggleCollapsed(data.layoutNode.key)
        }
        onClick={() => data.onSelect(data.layoutNode)}
      />

      {(["top", "right", "bottom", "left"] as HandleSide[]).map(
        (side) => (
          <Handle
            key={`source-${side}`}
            id={`source-${side}`}
            type="source"
            position={HANDLE_POSITION[side]}
            className="!h-2 !w-2 !border-2 !border-white !bg-primary !opacity-0"
            isConnectable={false}
          />
        )
      )}
    </div>
  );
}

function HierarchyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<HierarchyFlowEdge>) {
  const color = data?.color ?? "#2563eb";
  const layoutMode = data?.layoutMode ?? "smart";

  const [path] =
    layoutMode === "smart"
      ? getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          curvature: 0.3,
        })
      : getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 18,
          offset: 28,
        });

  return (
    <g>
      <BaseEdge
        id={`${id}-shadow`}
        path={path}
        style={{
          stroke: color,
          strokeWidth: 9,
          strokeOpacity: 0.07,
          strokeLinecap: "round",
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: color,
          strokeWidth: 1.8,
          strokeOpacity: 0.58,
          strokeLinecap: "round",
        }}
      />
      <circle
        cx={sourceX}
        cy={sourceY}
        r="3.2"
        fill={color}
        fillOpacity="0.9"
      />
      <circle
        cx={targetX}
        cy={targetY}
        r="3.4"
        fill="white"
        stroke={color}
        strokeWidth="1.8"
      />
    </g>
  );
}

function FlowViewportSync({ zoom }: { zoom: number }) {
  const { getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    const viewport = getViewport();
    if (Math.abs(viewport.zoom - zoom) < 0.002) return;

    void setViewport(
      {
        ...viewport,
        zoom,
      },
      { duration: 160 }
    );
  }, [getViewport, setViewport, zoom]);

  return null;
}

function LayoutModeButton({
  mode,
  activeMode,
  onClick,
}: {
  mode: HierarchyLayoutMode;
  activeMode: HierarchyLayoutMode;
  onClick: (mode: HierarchyLayoutMode) => void;
}) {
  const active = mode === activeMode;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(mode)}
      className={cn(
        "nodrag nopan h-8 rounded-lg px-2.5 text-[11px] font-semibold transition",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {MODE_LABELS[mode]}
    </button>
  );
}

function HierarchyFlow({
  organization,
  tree,
  selected,
  zoom,
  onSelect,
  onZoomChange,
}: {
  organization: Organization;
  tree: OrganizationUnitTreeNode[];
  selected: CanvasSelection | null;
  zoom: number;
  onSelect: (selection: CanvasSelection) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [layoutMode, setLayoutMode] = useState<HierarchyLayoutMode>(() =>
    readStoredLayoutMode(organization.id)
  );
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [layouting, setLayouting] = useState(true);
  const [nodes, setNodes, onNodesChange] =
    useNodesState<HierarchyFlowNode>([]);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<HierarchyFlowEdge>([]);

  const flowRef = useRef<
    ReactFlowInstance<HierarchyFlowNode, HierarchyFlowEdge> | null
  >(null);
  const layoutCacheRef = useRef(
    new Map<HierarchyLayoutMode, LayoutSnapshot>()
  );
  const lastGraphSignatureRef = useRef("");
  const dragFrameRef = useRef<number | null>(null);
  const activeOrganizationIdRef = useRef(organization.id);
  const onSelectRef = useRef(onSelect);
  const onZoomChangeRef = useRef(onZoomChange);
  const selectedRef = useRef(selected);

  onSelectRef.current = onSelect;
  onZoomChangeRef.current = onZoomChange;
  selectedRef.current = selected;

  const handleSelectNode = useCallback((node: LayoutNode) => {
    onSelectRef.current(
      node.kind === "org"
        ? { kind: "org", id: (node.data as Organization).id }
        : {
            kind: "unit",
            id: (node.data as OrganizationUnitTreeNode).id,
          }
    );
  }, []);

  const handleToggleCollapsed = useCallback((key: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const graph = useMemo(
    () => flattenVisibleTree(organization, tree, collapsed),
    [collapsed, organization, tree]
  );
  const signature = useMemo(() => graphSignature(graph), [graph]);

  const fitCurrentView = useCallback((duration = 360) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void flowRef.current?.fitView({
          padding: 0.2,
          duration,
          minZoom: 0.35,
          maxZoom: 1.12,
        });
      });
    });
  }, []);

  useEffect(() => {
    if (activeOrganizationIdRef.current === organization.id) return;

    activeOrganizationIdRef.current = organization.id;
    setCollapsed(new Set());
    layoutCacheRef.current.clear();
    lastGraphSignatureRef.current = "";
    setLayoutMode(readStoredLayoutMode(organization.id));
  }, [organization.id]);

  useEffect(() => {
    storeLayoutMode(organization.id, layoutMode);
  }, [layoutMode, organization.id]);

  useEffect(() => {
    if (lastGraphSignatureRef.current !== signature) {
      layoutCacheRef.current.clear();
      lastGraphSignatureRef.current = signature;
    }

    let cancelled = false;
    const cached = layoutCacheRef.current.get(layoutMode);

    const applyPositions = (positions: Map<string, Point>) => {
      const nextNodes = buildFlowNodes(
        graph.nodes,
        positions,
        selectedRef.current,
        collapsed,
        handleSelectNode,
        handleToggleCollapsed
      );
      const nextEdges = buildFlowEdges(graph.edges, nextNodes, layoutMode);

      setNodes(nextNodes);
      setEdges(nextEdges);
      fitCurrentView(cached ? 260 : 380);
    };

    if (cached?.signature === signature) {
      setLayouting(false);
      applyPositions(cached.positions);
      return () => {
        cancelled = true;
      };
    }

    setLayouting(true);

    void calculatePositions(graph, layoutMode)
      .then((positions) => {
        if (cancelled) return;

        layoutCacheRef.current.set(layoutMode, {
          signature,
          positions,
        });
        applyPositions(positions);
      })
      .finally(() => {
        if (!cancelled) setLayouting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    collapsed,
    fitCurrentView,
    graph,
    handleSelectNode,
    handleToggleCollapsed,
    layoutMode,
    layoutVersion,
    setEdges,
    setNodes,
    signature,
  ]);

  // Refresh labels, counts and entity data without recalculating positions.
  useEffect(() => {
    const freshById = new Map(graph.nodes.map((node) => [node.key, node]));

    setNodes((current) =>
      current.map((node) => {
        const fresh = freshById.get(node.id);
        if (!fresh) return node;

        return {
          ...node,
          data: {
            ...node.data,
            layoutNode: {
              ...fresh,
              x: node.position.x,
              y: node.position.y,
            },
            collapsed: collapsed.has(node.id),
          },
        };
      })
    );
  }, [collapsed, graph.nodes, setNodes]);

  // Selection only changes the card highlight. It never triggers ELK or fitView.
  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: isSelected(node.data.layoutNode, selected),
        },
      }))
    );
  }, [selected, setNodes]);

  const refreshEdgeAttachments = useCallback(() => {
    const liveNodes = flowRef.current?.getNodes() ?? [];
    if (!liveNodes.length) return;
    setEdges(buildFlowEdges(graph.edges, liveNodes, layoutMode));
  }, [graph.edges, layoutMode, setEdges]);

  const handleNodeDrag = useCallback(() => {
    if (dragFrameRef.current !== null) return;

    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      refreshEdgeAttachments();
    });
  }, [refreshEdgeAttachments]);

  const handleNodeDragStop = useCallback(() => {
    const liveNodes = flowRef.current?.getNodes() ?? [];
    if (!liveNodes.length) return;

    const syncedNodes = liveNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        layoutNode: {
          ...node.data.layoutNode,
          x: node.position.x,
          y: node.position.y,
        },
      },
    }));

    setNodes(syncedNodes);
    setEdges(buildFlowEdges(graph.edges, syncedNodes, layoutMode));
    layoutCacheRef.current.set(
      layoutMode,
      snapshotPositions(signature, syncedNodes)
    );
  }, [graph.edges, layoutMode, setEdges, setNodes, signature]);

  const handleLayoutModeChange = useCallback(
    (mode: HierarchyLayoutMode) => {
      if (mode === layoutMode) return;
      setLayoutMode(mode);
    },
    [layoutMode]
  );

  const handleRelayout = useCallback(() => {
    layoutCacheRef.current.delete(layoutMode);
    setLayoutVersion((value) => value + 1);
  }, [layoutMode]);

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative h-full min-h-[620px] w-full overflow-hidden rounded-2xl border border-border bg-card">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(37,99,235,0.10),transparent_42%)]" />
      <div className="pointer-events-none absolute -left-32 -top-36 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

      <ReactFlow<HierarchyFlowNode, HierarchyFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        onMoveEnd={(_, viewport) =>
          onZoomChangeRef.current?.(viewport.zoom)
        }
        nodesConnectable={false}
        nodesDraggable
        elementsSelectable
        elevateNodesOnSelect
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        snapToGrid
        snapGrid={[16, 16]}
        minZoom={0.35}
        maxZoom={1.65}
        onlyRenderVisibleElements
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.12 }}
        proOptions={{ hideAttribution: true }}
        className="organization-hierarchy-flow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.1}
          color="rgba(148, 163, 184, 0.28)"
        />

        <FlowViewportSync zoom={zoom} />

        <Panel position="top-right" className="!m-4 max-w-[calc(100%-2rem)]">
          <div className="flex flex-wrap items-center justify-end gap-1.5 rounded-xl border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur">
            <div className="px-2 text-[11px] font-medium text-muted-foreground">
              {graph.nodes.length - 1} visible unit
              {graph.nodes.length - 1 === 1 ? "" : "s"}
            </div>

            <div className="flex items-center rounded-lg bg-muted/60 p-0.5">
              {(
                ["smart", "vertical", "horizontal"] as HierarchyLayoutMode[]
              ).map((mode) => (
                <LayoutModeButton
                  key={mode}
                  mode={mode}
                  activeMode={layoutMode}
                  onClick={handleLayoutModeChange}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleRelayout}
              disabled={layouting}
              className="nodrag nopan inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  layouting && "animate-spin"
                )}
              />
              Re-layout
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {layouting && nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-border bg-card/95 px-4 py-3 text-sm text-muted-foreground shadow-lg backdrop-blur">
            Arranging organization hierarchy…
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/75 to-transparent" />
    </div>
  );
}

export function OrganizationHierarchyCanvas({
  organization,
  tree,
  selected,
  zoom,
  onSelect,
  onZoomChange,
}: {
  organization: Organization;
  tree: OrganizationUnitTreeNode[];
  selected: CanvasSelection | null;
  zoom: number;
  onSelect: (selection: CanvasSelection) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  return (
    <ReactFlowProvider>
      <HierarchyFlow
        organization={organization}
        tree={tree}
        selected={selected}
        zoom={zoom}
        onSelect={onSelect}
        onZoomChange={onZoomChange}
      />
    </ReactFlowProvider>
  );
}

export function CanvasZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur">
      <ZoomButton
        label="Zoom in"
        onClick={onZoomIn}
        icon={<Plus className="h-4 w-4" />}
      />
      <button
        type="button"
        onClick={onReset}
        className="nodrag nopan flex h-8 min-w-9 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="Reset to 100%"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ZoomButton
        label="Zoom out"
        onClick={onZoomOut}
        icon={<Minus className="h-4 w-4" />}
      />
      <div className="my-0.5 h-px bg-border" />
      <ZoomButton
        label="Reset zoom"
        onClick={onReset}
        icon={<Focus className="h-4 w-4" />}
      />
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="nodrag nopan flex h-8 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {icon}
    </button>
  );
}

export function countUnitTree(nodes: OrganizationUnitTreeNode[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + countUnitTree(node.children ?? []),
    0
  );
}

export function findUnitInTree(
  nodes: OrganizationUnitTreeNode[],
  id: number
): OrganizationUnitTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findUnitInTree(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

export function flattenUnits(
  nodes: OrganizationUnitTreeNode[]
): OrganizationUnitTreeNode[] {
  const flat: OrganizationUnitTreeNode[] = [];
  for (const node of nodes) {
    flat.push(node);
    flat.push(...flattenUnits(node.children ?? []));
  }
  return flat;
}