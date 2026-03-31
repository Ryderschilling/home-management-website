"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  InvoiceCard,
  S,
  formatDate,
  invoiceGroupLabel,
  money,
  type InvoiceDashboardData,
  type PortalClient,
  type PortalInvoice,
  type QueueJob,
} from "./_components/invoice-ui";
import { InvoiceComposer } from "./_components/InvoiceComposer";

type ComposerPrefill = {
  clientId?: string;
  propertyId?: string;
  jobIds?: string[];
};

function filterInvoices(
  invoices: PortalInvoice[],
  clientFilter: string,
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase();

  return invoices.filter((invoice) => {
    if (clientFilter && invoice.client_id !== clientFilter) return false;
    if (!normalizedQuery) return true;

    return [
      invoice.invoice_number,
      invoice.client_name,
      invoice.property_name,
      invoice.stripe_invoice_id,
      invoice.memo,
      invoice.notes,
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .some((value) => value.includes(normalizedQuery));
  });
}

export default function PortalInvoicesPage() {
  const [dashboard, setDashboard] = useState<InvoiceDashboardData | null>(null);
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [query, setQuery] = useState("");
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [composerPrefill, setComposerPrefill] = useState<ComposerPrefill | null>(null);

  const closeComposer = useCallback(() => {
    setComposerPrefill(null);

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("compose");
    params.delete("clientId");
    params.delete("propertyId");
    params.delete("jobId");
    const nextQuery = params.toString();
    window.history.replaceState({}, "", nextQuery ? `/portal/invoices?${nextQuery}` : "/portal/invoices");
  }, []);

  const openComposer = useCallback((prefill?: ComposerPrefill | null) => {
    setComposerPrefill({
      clientId: prefill?.clientId,
      propertyId: prefill?.propertyId,
      jobIds: prefill?.jobIds ?? [],
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dashboardRes, clientsRes] = await Promise.all([
        fetch("/api/admin/invoices/dashboard"),
        fetch("/api/admin/clients"),
      ]);
      const [dashboardJson, clientsJson] = await Promise.all([
        dashboardRes.json(),
        clientsRes.json(),
      ]);

      if (!dashboardRes.ok || !dashboardJson.ok) {
        throw new Error(dashboardJson?.error?.message ?? "Failed to load invoices");
      }
      if (!clientsRes.ok || !clientsJson.ok) {
        throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      }

      setDashboard(dashboardJson.data);
      setClients(clientsJson.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("deleted") === "1") {
      const deletedInvoiceLabel = params.get("invoice");
      setDeleteSuccessMessage(
        `${deletedInvoiceLabel || "Invoice"} deleted successfully.`
      );
    } else {
      setDeleteSuccessMessage("");
    }

    if (params.get("compose") === "1") {
      openComposer({
        clientId: params.get("clientId") ?? undefined,
        propertyId: params.get("propertyId") ?? undefined,
        jobIds: params.getAll("jobId"),
      });
    }
  }, [openComposer]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredGroups = useMemo(() => {
    if (!dashboard) return {};

    return Object.fromEntries(
      Object.entries(dashboard.groups).map(([groupKey, invoices]) => [
        groupKey,
        filterInvoices(invoices ?? [], clientFilter, query),
      ])
    ) as Record<string, PortalInvoice[]>;
  }, [clientFilter, dashboard, query]);

  const filteredQueue = useMemo(() => {
    if (!dashboard) {
      return {
        completedJobsWithoutInvoice: [] as QueueJob[],
        agingCompletedJobsWithoutInvoice: [] as QueueJob[],
        draftInvoices: [] as PortalInvoice[],
        scheduledDueSoon: [] as PortalInvoice[],
        overdueInvoices: [] as PortalInvoice[],
      };
    }

    return {
      completedJobsWithoutInvoice: dashboard.queue.completedJobsWithoutInvoice.filter((job) =>
        clientFilter ? job.client_id === clientFilter : true
      ),
      agingCompletedJobsWithoutInvoice: dashboard.queue.agingCompletedJobsWithoutInvoice.filter(
        (job) => (clientFilter ? job.client_id === clientFilter : true)
      ),
      draftInvoices: filterInvoices(dashboard.queue.draftInvoices, clientFilter, query),
      scheduledDueSoon: filterInvoices(dashboard.queue.scheduledDueSoon, clientFilter, query),
      overdueInvoices: filterInvoices(dashboard.queue.overdueInvoices, clientFilter, query),
    };
  }, [clientFilter, dashboard, query]);

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label}>Invoices</div>
            <h1
              className="mt-2 text-[34px] text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-serif), serif", lineHeight: 1.02 }}
            >
              Invoice operations
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
              Create Stripe invoices from completed work, track what still needs to be billed,
              and manage draft, scheduled, outstanding, overdue, and paid invoices from one
              operator view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => openComposer()} className={S.btnPrimary}>
              New invoice
            </button>
          </div>
        </div>

        {dashboard ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Draft invoices", value: dashboard.summary.totalDraftInvoices },
              { label: "Ready to send", value: dashboard.summary.totalReadyToSend },
              { label: "Outstanding balance", value: money(dashboard.summary.outstandingBalanceCents) },
              { label: "Overdue balance", value: money(dashboard.summary.overdueBalanceCents) },
              { label: "Paid this month", value: money(dashboard.summary.paidThisMonthCents) },
            ].map((stat) => (
              <div key={stat.label} className={`${S.cardInner} px-4 py-4`}>
                <div className={S.label}>{stat.label}</div>
                <div
                  className="mt-2 text-[28px] text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-serif), serif", lineHeight: 1.05 }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <select
            className={`${S.input} portal-select`}
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <input
            className={S.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoice number, client, property, Stripe id, or memo..."
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}
        {deleteSuccessMessage ? (
          <div className="mt-5 rounded-xl border border-emerald-900/30 bg-emerald-900/10 px-4 py-3 text-sm text-emerald-200">
            {deleteSuccessMessage}
          </div>
        ) : null}
      </section>

      <section className={`${S.card} p-5 sm:p-7`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className={S.label}>Needs invoice queue</div>
            <h2
              className="mt-2 text-[26px] text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-serif), serif", lineHeight: 1.04 }}
            >
              What needs attention next
            </h2>
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Aging jobs are completed jobs older than 7 days without an invoice.
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className={`${S.cardInner} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Completed jobs with no invoice
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {filteredQueue.completedJobsWithoutInvoice.length} visible
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredQueue.completedJobsWithoutInvoice.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">
                  No completed uninvoiced jobs in the current filter.
                </div>
              ) : (
                filteredQueue.completedJobsWithoutInvoice.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() =>
                      openComposer({
                        clientId: job.client_id ?? undefined,
                        propertyId: job.property_id ?? undefined,
                        jobIds: [job.id],
                      })
                    }
                    className="block w-full rounded-xl border border-[var(--border)] p-4 text-left transition hover:border-[var(--border-hover)]"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {job.title}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">
                          {job.client_name || "No client"}
                          {job.property_name ? ` • ${job.property_name}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          Completed {formatDate(job.completed_at ?? job.scheduled_for)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {money(job.price_cents)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={`${S.cardInner} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Aging completed jobs
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {filteredQueue.agingCompletedJobsWithoutInvoice.length} visible
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredQueue.agingCompletedJobsWithoutInvoice.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">
                  No aging uninvoiced jobs in the current filter.
                </div>
              ) : (
                filteredQueue.agingCompletedJobsWithoutInvoice.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() =>
                      openComposer({
                        clientId: job.client_id ?? undefined,
                        propertyId: job.property_id ?? undefined,
                        jobIds: [job.id],
                      })
                    }
                    className="block w-full rounded-xl border border-[var(--border)] p-4 text-left transition hover:border-[var(--border-hover)]"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {job.title}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">
                          {job.client_name || "No client"}
                          {job.property_name ? ` • ${job.property_name}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-red-300">
                          Completed {formatDate(job.completed_at ?? job.scheduled_for)}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {money(job.price_cents)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={`${S.cardInner} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Drafts not yet sent
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {filteredQueue.draftInvoices.length} visible
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredQueue.draftInvoices.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">
                  No unsent drafts in the current filter.
                </div>
              ) : (
                filteredQueue.draftInvoices.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} compact />
                ))
              )}
            </div>
          </div>

          <div className={`${S.cardInner} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Scheduled to send soon
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {filteredQueue.scheduledDueSoon.length} visible
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredQueue.scheduledDueSoon.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">
                  No scheduled invoices due soon.
                </div>
              ) : (
                filteredQueue.scheduledDueSoon.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} compact />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className={`${S.cardInner} p-4`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Overdue unpaid invoices
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {filteredQueue.overdueInvoices.length} visible
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {filteredQueue.overdueInvoices.length === 0 ? (
                <div className="text-sm text-[var(--text-muted)]">
                  No overdue invoices in the current filter.
                </div>
              ) : (
                filteredQueue.overdueInvoices.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} compact />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {loading ? (
          <div className={`${S.card} p-6 text-sm text-[var(--text-muted)]`}>
            Loading invoices...
          </div>
        ) : (
          Object.entries(filteredGroups).map(([groupKey, invoices]) => (
            <div key={groupKey} className={`${S.card} p-5 sm:p-7`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className={S.label}>Status group</div>
                  <h2
                    className="mt-2 text-[24px] text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-serif), serif", lineHeight: 1.05 }}
                  >
                    {invoiceGroupLabel(groupKey)}
                  </h2>
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="mt-5 text-sm text-[var(--text-muted)]">
                  No invoices in this group for the current filters.
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {invoices.map((invoice) => (
                    <InvoiceCard key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {composerPrefill ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New invoice"
            className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
          >
            <div className="flex justify-end px-3 pt-3">
              <button type="button" onClick={closeComposer} className={S.btnGhost}>
                Close
              </button>
            </div>
            <InvoiceComposer
              mode="create"
              initialPrefill={composerPrefill}
              allowSchedule={false}
              onCancel={closeComposer}
              onSaved={async () => {
                closeComposer();
                await loadData();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
