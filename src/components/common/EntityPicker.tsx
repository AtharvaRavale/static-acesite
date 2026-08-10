import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type EntityPickerPage<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

export type EntityPickerColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  label?: string;
  placeholder: string;
  modalTitle: string;
  value: T[];
  onChange: (rows: T[]) => void;
  getId: (row: T) => number;
  getLabel: (row: T) => string;
  loadPage: (args: { page: number; search: string; pageSize: number }) => Promise<EntityPickerPage<T>>;
  columns: EntityPickerColumn<T>[];
  multiple?: boolean;
  disabled?: boolean;
  pageSize?: number;
  previewCount?: number;
  emptyText?: string;
};

export function EntityPicker<T>({
  label,
  placeholder,
  modalTitle,
  value,
  onChange,
  getId,
  getLabel,
  loadPage,
  columns,
  multiple = false,
  disabled = false,
  pageSize = 20,
  previewCount = 6,
  emptyText = "No records found.",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<EntityPickerPage<T> | null>(null);
  const [modalPage, setModalPage] = useState<EntityPickerPage<T> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const selectedIds = useMemo(() => new Set(value.map(getId)), [value, getId]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPreview(true);
    loadPage({ page: 1, search: "", pageSize: Math.max(previewCount, 10) })
      .then((data) => { if (!cancelled) setPreview(data); })
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [open, loadPage, previewCount]);

  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    setLoadingModal(true);
    loadPage({ page, search: debouncedSearch, pageSize })
      .then((data) => { if (!cancelled) setModalPage(data); })
      .finally(() => { if (!cancelled) setLoadingModal(false); });
    return () => { cancelled = true; };
  }, [modalOpen, page, debouncedSearch, pageSize, loadPage]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const toggle = (row: T) => {
    const id = getId(row);
    if (multiple) {
      onChange(selectedIds.has(id) ? value.filter((item) => getId(item) !== id) : [...value, row]);
    } else {
      onChange([row]);
      setOpen(false);
      setModalOpen(false);
    }
  };

  const summary = value.length === 0
    ? placeholder
    : multiple
      ? value.length <= 2
        ? value.map(getLabel).join(", ")
        : `${value.slice(0, 2).map(getLabel).join(", ")} +${value.length - 2}`
      : getLabel(value[0]);

  const previewRows = preview?.results.slice(0, previewCount) ?? [];
  const pageCount = Math.max(1, Math.ceil((modalPage?.count ?? 0) / pageSize));

  return <div className="relative">
    {label ? <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p> : null}
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-left text-xs outline-none transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        value.length ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span className="truncate">{summary}</span><ChevronDown className="h-3.5 w-3.5 shrink-0" />
    </button>

    {open ? <div className="absolute z-40 mt-1 w-full min-w-[320px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      <div className="max-h-64 overflow-y-auto p-1.5">
        {loadingPreview ? <div className="flex items-center justify-center gap-2 p-5 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div> : previewRows.length ? previewRows.map((row) => {
          const checked = selectedIds.has(getId(row));
          return <button key={getId(row)} type="button" onClick={() => toggle(row)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-muted/60">
            <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{checked ? <Check className="h-3 w-3" /> : null}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{getLabel(row)}</span>
          </button>;
        }) : <div className="p-4 text-center text-xs text-muted-foreground">{emptyText}</div>}
      </div>
      <button type="button" onClick={() => { setOpen(false); setModalOpen(true); }} className="flex w-full items-center justify-between border-t border-border px-3 py-2.5 text-xs font-semibold text-primary hover:bg-muted/30">
        <span>View more</span><span className="text-[10px] font-normal text-muted-foreground">{preview?.count ?? 0} records</span>
      </button>
    </div> : null}

    {modalOpen ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setModalOpen(false); }}>
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Select</p><h3 className="mt-1 text-base font-bold text-foreground">{modalTitle}</h3></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
        <div className="border-b border-border p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code or related data..." className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary" /></div></div>
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="sticky top-0 z-10 grid border-b border-border bg-muted/40 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground" style={{ gridTemplateColumns: `44px repeat(${columns.length}, minmax(0, 1fr))` }}><span />{columns.map((column) => <span key={column.key} className={column.className}>{column.label}</span>)}</div>
          {loadingModal ? <div className="flex min-h-56 items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading records...</div> : (modalPage?.results ?? []).length ? (modalPage?.results ?? []).map((row) => { const checked = selectedIds.has(getId(row)); return <button key={getId(row)} type="button" onClick={() => toggle(row)} className="grid w-full items-center border-b border-border/70 px-4 py-3 text-left hover:bg-muted/25" style={{ gridTemplateColumns: `44px repeat(${columns.length}, minmax(0, 1fr))` }}><span className={cn("flex h-4 w-4 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{checked ? <Check className="h-3 w-3" /> : null}</span>{columns.map((column) => <span key={column.key} className={cn("min-w-0 truncate text-xs text-foreground", column.className)}>{column.render(row)}</span>)}</button>; }) : <div className="p-10 text-center text-xs text-muted-foreground">{emptyText}</div>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3"><p className="text-xs text-muted-foreground"><b className="text-foreground">{value.length}</b> selected · {modalPage?.count ?? 0} records</p><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loadingModal} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Previous</button><span className="text-[10px] text-muted-foreground">{page} / {pageCount}</span><button type="button" disabled={page >= pageCount || loadingModal} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-40">Next</button>{multiple ? <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Done</button> : null}</div></div>
      </div>
    </div> : null}
  </div>;
}
