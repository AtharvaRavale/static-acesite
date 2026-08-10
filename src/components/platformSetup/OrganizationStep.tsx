import { useMemo, useState } from "react";
import { Building2, ImagePlus, Plus, Search, Sparkles } from "lucide-react";
import {
  useCreateOrganization,
  useOrganizations,
  type Organization,
  type OrganizationFlow,
} from "@/features/organizations";
import { getApiErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { SetupBranch } from "./types";
import {
  generateUniqueSetupCode,
  getSetupCodeError,
  inputClass,
  PrimaryButton,
  SetupField,
  StepCard,
  textareaClass,
} from "./ui";

export function OrganizationStep({
  onOrganizationReady,
}: {
  onOrganizationReady: (organization: Organization, branch: SetupBranch) => void;
}) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    legal_name: "",
    email: "",
    owner_first_name: "",
    owner_last_name: "",
    phone: "",
    address: "",
    flow: "self" as OrganizationFlow,
    timezone: "Asia/Kolkata",
  });
  const organizationsQuery = useOrganizations({ page_size: 500, is_active: true, ordering: "name" });
  const createOrganization = useCreateOrganization();
  const organizations = organizationsQuery.data?.results ?? [];

  const generatedCode = useMemo(
    () => generateUniqueSetupCode(form.name, organizations.map((organization) => organization.code), 80),
    [form.name, organizations]
  );
  const codeError = form.name.trim() ? getSetupCodeError(generatedCode, 80) : null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return organizations;
    return organizations.filter((organization) =>
      [organization.name, organization.code, organization.organization_id, organization.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [organizations, search]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !generatedCode || codeError) return;

    const created = await createOrganization.mutateAsync({
      ...form,
      name: form.name.trim(),
      code: generatedCode,
      legal_name: form.legal_name.trim(),
      email: form.email.trim(),
      owner_first_name: form.owner_first_name.trim(),
      owner_last_name: form.owner_last_name.trim(),
      logo,
      status: "active",
      is_active: true,
    });
    onOrganizationReady(created, "new");
  };

  return (
    <StepCard
      eyebrow="Step 1"
      title="Choose the organization path"
      description="Select an existing organization to continue directly to its organization units, or create a new organization and provision its eligible modules first."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={cn(inputClass, "pl-9")}
              placeholder="Search organization, code, ID or email"
            />
          </div>

          {organizationsQuery.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : organizationsQuery.isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {getApiErrorMessage(organizationsQuery.error, "Unable to load organizations.")}
            </p>
          ) : (
            <div className="grid max-h-[470px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
              {filtered.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => onOrganizationReady(organization, "existing")}
                  className="group flex min-h-28 items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                    {organization.logo ? (
                      <img src={organization.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{organization.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {organization.code} · {organization.organization_id}
                    </span>
                    <span className="mt-2 inline-flex rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Existing organization
                    </span>
                  </span>
                </button>
              ))}
              {filtered.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No matching organizations found.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4 sm:p-5">
          {!showCreate ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Plus className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">Create a new organization</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Creates the tenant, owner membership, default roles and core module provisioning through the existing organization API.
              </p>
              <PrimaryButton className="mt-5" onClick={() => setShowCreate(true)}>
                <Sparkles className="h-4 w-4" /> New organization
              </PrimaryButton>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Organization details</p>
                  <p className="text-xs text-muted-foreground">Required fields are kept focused for fast provisioning.</p>
                </div>
                <button type="button" className="text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SetupField label="Organization name" required>
                  <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Acme Construction" />
                </SetupField>
                <SetupField label="Code" required hint="Auto-generated from the organization name and sent with the create request.">
                  <input
                    className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")}
                    value={generatedCode}
                    readOnly
                    tabIndex={-1}
                    placeholder="auto-generated"
                  />
                  {codeError ? <span className="block text-[11px] text-destructive">{codeError}</span> : null}
                </SetupField>
              </div>
              <SetupField label="Owner / admin email" required hint="The backend creates or links the non-platform owner membership and invitation.">
                <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="owner@company.com" />
              </SetupField>
              <div className="grid gap-3 sm:grid-cols-2">
                <SetupField label="Owner first name"><input className={inputClass} value={form.owner_first_name} onChange={(e) => update("owner_first_name", e.target.value)} /></SetupField>
                <SetupField label="Owner last name"><input className={inputClass} value={form.owner_last_name} onChange={(e) => update("owner_last_name", e.target.value)} /></SetupField>
              </div>
              <SetupField label="Legal name"><input className={inputClass} value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} /></SetupField>
              <div className="grid gap-3 sm:grid-cols-2">
                <SetupField label="Flow">
                  <select className={inputClass} value={form.flow} onChange={(e) => update("flow", e.target.value)}>
                    <option value="self">Self</option>
                    <option value="partner_company">Partner company</option>
                    <option value="both">Both</option>
                  </select>
                </SetupField>
                <SetupField label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} /></SetupField>
              </div>
              <SetupField label="Address"><textarea className={textareaClass} value={form.address} onChange={(e) => update("address", e.target.value)} /></SetupField>
              <SetupField label="Logo">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 text-sm text-muted-foreground hover:border-primary/50">
                  <ImagePlus className="h-4 w-4" />
                  <span className="truncate">{logo?.name ?? "Choose organization logo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
                </label>
              </SetupField>
              {createOrganization.isError ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {getApiErrorMessage(createOrganization.error, "Unable to create organization.")}
                </p>
              ) : null}
              <PrimaryButton
                type="submit"
                loading={createOrganization.isPending}
                disabled={!form.name.trim() || !form.email.trim() || !generatedCode || Boolean(codeError)}
                className="w-full"
              >
                Create organization & continue
              </PrimaryButton>
            </form>
          )}
        </div>
      </div>
    </StepCard>
  );
}
