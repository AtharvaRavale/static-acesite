import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  FolderTree,
  GitBranch,
  Plus,
} from "lucide-react";
import {
  useCreatePartnerOrganization,
  useCreatePartnerOrganizationContact,
  useDeletePartnerOrganization,
  useDeletePartnerOrganizationContact,
  useOrganization,
  useOrganizationPartnerTree,
  usePartnerOrganizationContacts,
  usePartnerOrganizations,
  useUpdatePartnerOrganization,
  useUpdatePartnerOrganizationContact,
  type PartnerOrganization,
  type PartnerOrganizationContact,
  type PartnerOrganizationContactWritePayload,
  type PartnerOrganizationTreeNode,
  type PartnerOrganizationWritePayload,
  type PartnerType,
} from "@/features/organizations";
import { ContactFormPanel } from "@/components/organizations/partners/ContactFormPanel";
import { PartnerDetailPanel } from "@/components/organizations/partners/PartnerDetailPanel";
import { PartnerFormPanel } from "@/components/organizations/partners/PartnerFormPanel";
import { PartnerHierarchyPanel } from "@/components/organizations/partners/PartnerHierarchyPanel";
import { PartnerListPanel } from "@/components/organizations/partners/PartnerListPanel";
import { ApiErrorBanner } from "@/components/modules/shared/ApiErrorBanner";
import { cn } from "@/lib/utils";

type LeftTab = "hierarchy" | "all";
type PanelMode =
  | "detail"
  | "create-partner"
  | "edit-partner"
  | "create-contact"
  | "edit-contact";

export function PartnersPage() {
  const { organizationId } = useParams();
  const orgId = Number(organizationId);
  const validId = Number.isFinite(orgId) ? orgId : null;

  const [leftTab, setLeftTab] = useState<LeftTab>("hierarchy");
  const [search, setSearch] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType | "">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [editingContact, setEditingContact] =
    useState<PartnerOrganizationContact | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("detail");
  const [formError, setFormError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const orgQuery = useOrganization(validId);
  const treeQuery = useOrganizationPartnerTree(validId, {
    include_inactive: true,
  });
  const partnersQuery = usePartnerOrganizations({
    organization: validId ?? undefined,
    page_size: 500,
    ordering: "name",
    search: leftTab === "all" ? search.trim() || undefined : undefined,
    partner_type: leftTab === "all" ? partnerType || undefined : undefined,
    is_active:
      leftTab === "all"
        ? statusFilter === "active"
          ? true
          : statusFilter === "inactive"
            ? false
            : undefined
        : undefined,
  });
  const allContactsQuery = usePartnerOrganizationContacts({
    organization: validId ?? undefined,
    page_size: 500,
  });
  const partnerContactsQuery = usePartnerOrganizationContacts({
    partner_organization: selectedPartnerId ?? undefined,
    page_size: 200,
  });

  const createPartner = useCreatePartnerOrganization();
  const updatePartner = useUpdatePartnerOrganization();
  const deletePartner = useDeletePartnerOrganization();
  const createContact = useCreatePartnerOrganizationContact();
  const updateContact = useUpdatePartnerOrganizationContact();
  const deleteContact = useDeletePartnerOrganizationContact();

  const organization = orgQuery.data ?? null;
  const partners = partnersQuery.data?.results ?? [];
  const tree = treeQuery.data ?? [];
  const allContacts = allContactsQuery.data?.results ?? [];
  const partnerContacts = partnerContactsQuery.data?.results ?? [];

  const contactCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const contact of allContacts) {
      map.set(
        contact.partner_organization,
        (map.get(contact.partner_organization) ?? 0) + 1
      );
    }
    return map;
  }, [allContacts]);

  const selectedPartner: PartnerOrganization | null =
    partners.find((partner) => partner.id === selectedPartnerId) ??
    flattenTree(tree).find((partner) => partner.id === selectedPartnerId) ??
    null;

  const selectPartner = (id: number) => {
    setSelectedPartnerId(id);
    setEditingContact(null);
    setPanelMode("detail");
    setFormError(null);
  };

  const handlePartnerSubmit = async (payload: PartnerOrganizationWritePayload) => {
    setSaving(true);
    setFormError(null);
    try {
      if (panelMode === "create-partner") {
        const created = await createPartner.mutateAsync(payload);
        setSelectedPartnerId(created.id);
        setPanelMode("detail");
      } else if (panelMode === "edit-partner" && selectedPartner) {
        await updatePartner.mutateAsync({
          id: selectedPartner.id,
          payload,
        });
        setPanelMode("detail");
      }
      setDefaultParentId(null);
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleContactSubmit = async (
    payload: PartnerOrganizationContactWritePayload
  ) => {
    setSaving(true);
    setFormError(null);
    try {
      if (panelMode === "create-contact") {
        await createContact.mutateAsync(payload);
      } else if (panelMode === "edit-contact" && editingContact) {
        await updateContact.mutateAsync({
          id: editingContact.id,
          payload,
        });
      }
      setEditingContact(null);
      setPanelMode("detail");
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePartner = async () => {
    if (!selectedPartner) return;
    setSaving(true);
    setFormError(null);
    try {
      await updatePartner.mutateAsync({
        id: selectedPartner.id,
        payload: { is_active: !selectedPartner.is_active },
      });
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!selectedPartner) return;
    if (
      !window.confirm(
        `Delete partner "${selectedPartner.name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await deletePartner.mutateAsync(selectedPartner.id);
      setSelectedPartnerId(null);
      setPanelMode("detail");
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleContact = async (contact: PartnerOrganizationContact) => {
    setSaving(true);
    setFormError(null);
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        payload: { is_active: !contact.is_active },
      });
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contact: PartnerOrganizationContact) => {
    if (!window.confirm(`Delete contact "${contact.name}"?`)) return;
    setSaving(true);
    setFormError(null);
    try {
      await deleteContact.mutateAsync(contact.id);
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  if (!validId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Invalid organization id.
      </div>
    );
  }

  const leftLoading =
    (partnersQuery.isLoading && !partnersQuery.data) ||
    (treeQuery.isLoading && !treeQuery.data);

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>Platform</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/organizations" className="hover:text-foreground">
          Organizations
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          to={`/organizations/${validId}`}
          className="hover:text-foreground"
        >
          {organization?.name ?? "Organization"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Partners & Contacts</span>
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-logo text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
            Partner Organizations & Contacts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage partner organizations and their contacts within your partner
            ecosystem.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/organizations/${validId}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organization
          </Link>
          <Link
            to={`/organizations/${validId}/departments`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            <FolderTree className="h-4 w-4" />
            View Departments
          </Link>
          <button
            type="button"
            onClick={() => setLeftTab("hierarchy")}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
            title="Focus hierarchy tab"
          >
            <GitBranch className="h-4 w-4" />
            Edit Hierarchy
          </button>
          <button
            type="button"
            onClick={() => {
              setDefaultParentId(null);
              setPanelMode("create-partner");
              setFormError(null);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Partner Organization
          </button>
        </div>
      </div>

      <ApiErrorBanner
        error={
          formError ||
          orgQuery.error ||
          partnersQuery.error ||
          treeQuery.error ||
          partnerContactsQuery.error
        }
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <aside className="flex min-h-[560px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:w-[360px] xl:shrink-0">
          <div className="flex border-b border-border px-2 pt-2">
            <TabButton
              active={leftTab === "hierarchy"}
              onClick={() => setLeftTab("hierarchy")}
              label="Partner Hierarchy"
            />
            <TabButton
              active={leftTab === "all"}
              onClick={() => setLeftTab("all")}
              label="All Partners"
            />
          </div>

          {leftTab === "hierarchy" ? (
            <>
              <div className="border-b border-border px-3 py-2">
                <input
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="Search partners…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <PartnerHierarchyPanel
                organization={organization}
                tree={filterTree(tree, search)}
                flatPartners={partners}
                contactCounts={contactCounts}
                selectedId={selectedPartnerId}
                loading={leftLoading}
                onSelect={selectPartner}
              />
            </>
          ) : (
            <PartnerListPanel
              partners={partners}
              contactCounts={contactCounts}
              selectedId={selectedPartnerId}
              search={search}
              partnerType={partnerType}
              statusFilter={statusFilter}
              loading={leftLoading}
              onSearchChange={setSearch}
              onPartnerTypeChange={setPartnerType}
              onStatusFilterChange={setStatusFilter}
              onSelect={selectPartner}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5 text-[11px] text-muted-foreground">
            <span>{allContacts.length} Contacts</span>
            <span>·</span>
            <span>{partners.length} Partners</span>
            {organization?.flow ? (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-semibold text-violet-700">
                Flow: {organization.flow_display || organization.flow}
              </span>
            ) : null}
          </div>
        </aside>

        <aside className="flex min-h-[560px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {panelMode === "create-partner" || panelMode === "edit-partner" ? (
            <PartnerFormPanel
              mode={panelMode === "create-partner" ? "create" : "edit"}
              organizationId={validId}
              partner={panelMode === "edit-partner" ? selectedPartner : null}
              parentOptions={partners}
              defaultParentId={defaultParentId}
              saving={saving}
              error={formError}
              onCancel={() => {
                setDefaultParentId(null);
                setPanelMode(selectedPartner ? "detail" : "detail");
              }}
              onSubmit={(payload) => void handlePartnerSubmit(payload)}
            />
          ) : null}

          {(panelMode === "create-contact" || panelMode === "edit-contact") &&
          selectedPartner ? (
            <ContactFormPanel
              mode={panelMode === "create-contact" ? "create" : "edit"}
              partner={selectedPartner}
              contact={panelMode === "edit-contact" ? editingContact : null}
              saving={saving}
              error={formError}
              onCancel={() => {
                setEditingContact(null);
                setPanelMode("detail");
              }}
              onSubmit={(payload) => void handleContactSubmit(payload)}
            />
          ) : null}

          {panelMode === "detail" && selectedPartner ? (
            <PartnerDetailPanel
              organization={organization}
              partner={selectedPartner}
              contacts={partnerContacts}
              contactLoading={
                partnerContactsQuery.isLoading && !partnerContactsQuery.data
              }
              onEdit={() => {
                setPanelMode("edit-partner");
                setFormError(null);
              }}
              onAddChild={() => {
                setDefaultParentId(selectedPartner.id);
                setPanelMode("create-partner");
                setFormError(null);
              }}
              onAddContact={() => {
                setEditingContact(null);
                setPanelMode("create-contact");
                setFormError(null);
              }}
              onEditContact={(contact) => {
                setEditingContact(contact);
                setPanelMode("edit-contact");
                setFormError(null);
              }}
              onToggleContact={(contact) => void handleToggleContact(contact)}
              onDeleteContact={(contact) => void handleDeleteContact(contact)}
              onToggleActive={() => void handleTogglePartner()}
              onDelete={() => void handleDeletePartner()}
              toggling={saving}
              deleting={saving}
            />
          ) : null}

          {panelMode === "detail" && !selectedPartner ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Select a partner organization to view details and contacts.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex-1 px-3 py-2.5 text-sm font-medium transition",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {active ? (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />
      ) : null}
    </button>
  );
}

function flattenTree(
  nodes: PartnerOrganizationTreeNode[]
): PartnerOrganization[] {
  const result: PartnerOrganization[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

function filterTree(
  nodes: PartnerOrganizationTreeNode[],
  search: string
): PartnerOrganizationTreeNode[] {
  const q = search.trim().toLowerCase();
  if (!q) return nodes;

  const filterNodes = (
    list: PartnerOrganizationTreeNode[]
  ): PartnerOrganizationTreeNode[] => {
    const filtered: PartnerOrganizationTreeNode[] = [];
    for (const node of list) {
      const children = filterNodes(node.children ?? []);
      const matches =
        node.name.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.legal_name?.toLowerCase().includes(q);
      if (matches || children.length > 0) {
        filtered.push({ ...node, children });
      }
    }
    return filtered;
  };

  return filterNodes(nodes);
}
