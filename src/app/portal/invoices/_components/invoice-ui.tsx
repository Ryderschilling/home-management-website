"use client";

import Link from "next/link";

import { INVOICE_GROUPS, type InvoiceStatus } from "@/lib/invoices";

export type PortalClient = {
  id: string;
  name: string;
  email?: string | null;
};

export type PortalProperty = {
  id: string;
  client_id?: string | null;
  name: string;
  address_line1?: string | null;
};

export type PortalRetainer = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  name: string;
  amount_cents: number;
  status: string;
};

export type PortalService = {
  id: string;
  name: string;
  unit_price_cents: number;
};

export type PortalJob = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  retainer_id?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  title: string;
  scheduled_for: string;
  completed_at?: string | null;
  status: string;
  price_cents?: number | null;
};

export type PortalInvoiceLineItem = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price_cents: number;
  line_total_cents: number;
  line_type: string;
  job_id?: string | null;
  retainer_id?: string | null;
  job_title?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  scheduled_for?: string | null;
};

export type PortalInvoiceEvent = {
  id: string;
  source: string;
  event_type: string;
  stripe_event_id?: string | null;
  message?: string | null;
  created_at: string;
};

export type PortalInvoice = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  retainer_id?: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  stripe_customer_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_status?: string | null;
  send_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal_cents: number;
  tax_cents?: number | null;
  total_cents: number;
  amount_paid_cents?: number | null;
  amount_remaining_cents?: number | null;
  currency?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf_url?: string | null;
  memo?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  finalized_at?: string | null;
  last_synced_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  plan_name?: string | null;
  checklist_template_text?: string | null;
  can_delete?: boolean;
  delete_block_reason?: string | null;
  line_items?: PortalInvoiceLineItem[] | null;
  events?: PortalInvoiceEvent[] | null;
};

export type QueueJob = {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  title: string;
  scheduled_for?: string | null;
  completed_at?: string | null;
  price_cents?: number | null;
};

export type InvoiceDashboardData = {
  summary: {
    totalDraftInvoices: number;
    totalReadyToSend: number;
    outstandingBalanceCents: number;
    overdueBalanceCents: number;
    paidThisMonthCents: number;
  };
  groups: Record<string, PortalInvoice[]>;
  queue: {
    completedJobsWithoutInvoice: QueueJob[];
    agingCompletedJobsWithoutInvoice: QueueJob[];
    draftInvoices: PortalInvoice[];
    scheduledDueSoon: PortalInvoice[];
    overdueInvoices: PortalInvoice[];
  };
};

export const S = {
  input:
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary:
    "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhost:
    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
  btnDanger:
    "inline-flex items-center justify-center rounded-lg border border-red-900/40 px-4 py-2 text-xs uppercase tracking-[0.22em] text-red-400 transition hover:bg-red-900/20",
};

export function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusBadgeClass(status: string) {
  if (status === "PAID") {
    return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "OVERDUE" || status === "FINALIZATION_FAILED") {
    return "border border-red-500/30 bg-red-500/10 text-red-300";
  }
  if (status === "OUTSTANDING") {
    return "border border-sky-500/30 bg-sky-500/10 text-sky-300";
  }
  if (status === "SCHEDULED") {
    return "border border-violet-500/30 bg-violet-500/10 text-violet-300";
  }
  if (status === "READY_TO_SEND") {
    return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  if (status === "VOID") {
    return "border border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
  }
  return "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]";
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusBadgeClass(
        status
      )}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function InvoiceCard({
  invoice,
  compact = false,
}: {
  invoice: PortalInvoice;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/portal/invoices/${invoice.id}`}
      className={`${S.cardInner} block p-4 transition hover:border-[var(--border-hover)] hover:bg-[rgba(255,255,255,0.04)]`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {invoice.invoice_number}
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="mt-2 text-sm text-[var(--text-secondary)]">
            {invoice.client_name || "Unassigned client"}
            {invoice.property_name ? ` • ${invoice.property_name}` : ""}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Due {formatDate(invoice.due_date)}
            {invoice.send_at ? ` • Sends ${formatDateTime(invoice.send_at)}` : ""}
            {invoice.stripe_invoice_id ? ` • Stripe ${invoice.stripe_invoice_id}` : ""}
          </div>
          {!compact ? (
            <div className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">
              {invoice.memo || invoice.notes || "No memo saved."}
            </div>
          ) : null}
        </div>
        <div className="text-left md:text-right">
          <div
            className="text-2xl text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            {money(invoice.total_cents)}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Remaining {money(invoice.amount_remaining_cents ?? invoice.total_cents)}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function invoiceGroupLabel(groupKey: string) {
  return INVOICE_GROUPS.find((group) => group.key === groupKey)?.label ?? groupKey;
}
