export function WorkspaceAccessPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="font-logo text-[1.65rem] font-normal tracking-tight text-foreground">
          People & Access
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-sm leading-6 text-muted-foreground">
          People & Access will manage organization memberships, unit scopes, and
          role assignments.
        </p>
      </div>
    </div>
  );
}
