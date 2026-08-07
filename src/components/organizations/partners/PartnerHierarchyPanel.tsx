import { Building2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import type {
  Organization,
  PartnerOrganization,
  PartnerOrganizationTreeNode,
} from "@/features/organizations";
import {
  PARTNER_TYPE_LABELS,
  partnerIconTone,
  partnerInitials,
} from "@/components/organizations/partners/partnerUi";
import { cn } from "@/lib/utils";

export function PartnerHierarchyPanel({
  organization,
  tree,
  flatPartners,
  contactCounts,
  selectedId,
  loading,
  onSelect,
}: {
  organization: Organization | null;
  tree: PartnerOrganizationTreeNode[];
  flatPartners: PartnerOrganization[];
  contactCounts: Map<number, number>;
  selectedId: number | null;
  loading?: boolean;
  onSelect: (id: number) => void;
}) {
  const displayTree =
    tree.length > 0
      ? tree
      : buildTreeFromFlat(flatPartners);

  return (
    <div className="flex-1 space-y-1 overflow-y-auto p-3">
      {organization ? (
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {organization.name}{" "}
              <span className="font-normal text-muted-foreground">(You)</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{organization.code}</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
            Active
          </span>
        </div>
      ) : null}

      {loading ? (
        Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[68px] animate-pulse rounded-xl border border-border bg-muted/30"
          />
        ))
      ) : displayTree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs leading-5 text-muted-foreground">
          No partner organizations found. Add a partner organization to start
          building your partner directory.
        </div>
      ) : (
        displayTree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            contactCounts={contactCounts}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  contactCounts,
  onSelect,
}: {
  node: PartnerOrganizationTreeNode;
  depth: number;
  selectedId: number | null;
  contactCounts: Map<number, number>;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const selected = selectedId === node.id;
  const contacts = contactCounts.get(node.id) ?? 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={cn(
          "flex w-full items-start gap-2 rounded-xl border p-2.5 text-left transition",
          selected
            ? "border-primary/40 bg-primary/5 ring-2 ring-primary/15"
            : "border-transparent hover:border-border hover:bg-muted/20"
        )}
        style={{ paddingLeft: 10 + depth * 14 }}
      >
        <span
          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center"
          onClick={(event) => {
            if (!hasChildren) return;
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </span>

        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
            partnerIconTone(node.code || node.id)
          )}
        >
          {partnerInitials(node.name)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {node.name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {node.code}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {node.partner_type_display ||
                PARTNER_TYPE_LABELS[node.partner_type]}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                node.is_active
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {node.is_active ? "Active" : "Inactive"}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {contacts}
            </span>
            {(node.child_count > 0 || children.length > 0) && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {node.child_count || children.length}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
      </button>

      {open &&
        children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            contactCounts={contactCounts}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function buildTreeFromFlat(
  partners: PartnerOrganization[]
): PartnerOrganizationTreeNode[] {
  const map = new Map<number, PartnerOrganizationTreeNode>();
  for (const partner of partners) {
    map.set(partner.id, { ...partner, children: [] });
  }
  const roots: PartnerOrganizationTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parent != null && map.has(node.parent)) {
      map.get(node.parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
