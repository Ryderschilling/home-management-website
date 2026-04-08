"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { isEditableInvoiceStatus } from "@/lib/invoices";

import { InvoiceComposer } from "./InvoiceComposer";
import {
  S,
  StatusBadge,
  formatDate,
  formatDateTime,
  money,
  type PortalInvoice,
} from "./invoice-ui";

export function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"send" | "resend" | "sync" | "delete" | "">("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`);
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to load invoice");
      }
      setInvoice(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(action: "sendNow" | "resend" | "sync") {
    setWorking(action === "sendNow" ? "send" : action === "resend" ? "resend" : "sync");
    setError("");

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Invoice action failed");
      }
      setInvoice(json.data);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Invoice action failed");
    } finally {
      setWorking("");
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    if (!invoice.can_delete) {
      setError(invoice.delete_block_reason || "This invoice cannot be deleted.");
      return;
    }

    const confirmationMessage = invoice.stripe_invoice_id
      ? `Delete ${invoice.invoice_number}? If it has already been sent, Stripe will void it first, then remove it from the portal. This permanently removes the invoice and its history.`
      : `Delete ${invoice.invoice_number}? This permanently removes the invoice and its history.`;
    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) return;

    setWorking("delete");
    setError("");

    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to delete invoice");
      }

      const deletedInvoiceNumber = String(json?.data?.invoiceNumber ?? invoice.invoice_number);
      router.push(
        `/portal/invoices?deleted=1&invoice=${encodeURIComponent(deletedInvoiceNumber)}`
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete invoice");
      setWorking("");
    }
  }

  if (loading) {
    return (
      <div className={`${S.card} p-6 text-sm text-[var(--text-muted)]`}>
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={`${S.card} p-6 text-sm text-[var(--text-muted)]`}>
        Invoice not found.
      </div>
    );
  }

  const editable = isEditableInvoiceStatus(invoice.status);
  const deleteBlockedReason = invoice.delete_block_reason || "This invoice cannot be deleted.";

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className={S.label}>Invoice detail</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1
                className="text-[34px] text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-serif), serif", lineHeight: 1.02 }}
              >
                {invoice.invoice_number}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {invoice.client_name || "No client"}
              {invoice.property_name ? ` • ${invoice.property_name}` : ""}
              {invoice.stripe_invoice_id ? ` • Stripe ${invoice.stripe_invoice_id}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {editable ? (
              <button
                type="button"
                onClick={() => runAction("sendNow")}
                className={S.btnPrimary}
                disabled={working !== ""}
              >
                {working === "send" ? "Sending..." : "Send now"}
              </button>
            ) : null}
            {!editable && invoice.status !== "PAID" && invoice.status !== "VOID" ? (
              <button
                type="button"
                onClick={() => runAction("resend")}
                className={S.btnGhost}
                disabled={working !== ""}
              >
                {working === "resend" ? "Resending..." : "Resend"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => runAction("sync")}
              className={S.btnGhost}
              disabled={working !== ""}
            >
              {working === "sync" ? "Syncing..." : "Sync"}
            </button>
            {invoice.can_delete ? (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className={S.btnDanger}
                disabled={working !== ""}
              >
                {working === "delete" ? "Deleting..." : "Delete invoice"}
              </button>
            ) : null}
            {invoice.hosted_invoice_url ? (
              <a
                href={invoice.hosted_invoice_url}
                target="_blank"
                rel="noreferrer"
                className={S.btnGhost}
              >
                View hosted invoice
              </a>
            ) : null}
            {invoice.invoice_pdf_url ? (
              <a
                href={invoice.invoice_pdf_url}
                target="_blank"
                rel="noreferrer"
                className={S.btnGhost}
              >
                View PDF
              </a>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {!invoice.can_delete ? (
          <div className="mt-5 rounded-xl border border-amber-900/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-200">
            Delete unavailable: {deleteBlockedReason}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total", value: money(invoice.total_cents) },
            {
              label: "Remaining",
              value: money(invoice.amount_remaining_cents ?? invoice.total_cents),
            },
            { label: "Due date", value: formatDate(invoice.due_date) },
            { label: "Sent at", value: formatDateTime(invoice.sent_at) },
            { label: "Paid at", value: formatDateTime(invoice.paid_at) },
          ].map((stat) => (
            <div key={stat.label} className={`${S.cardInner} px-4 py-4`}>
              <div className={S.label}>{stat.label}</div>
              <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {editable ? (
        <InvoiceComposer
          mode="edit"
          initialInvoice={invoice}
          onSaved={(nextInvoice) => setInvoice(nextInvoice)}
        />
      ) : null}

      <section className={`${S.card} p-5 sm:p-7`}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className={S.label}>Line items</div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
                <table className="min-w-full text-left">
                  <thead className="bg-[var(--surface-3)]">
                    <tr>
                      {["Description", "Qty", "Unit", "Total"].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.line_items ?? []).map((item) => (
                      <tr key={item.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {money(item.unit_price_cents)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                          {money(item.line_total_cents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className={S.label}>Sync history</div>
              <div className="mt-4 space-y-3">
                {(invoice.events ?? []).length === 0 ? (
                  <div className="text-sm text-[var(--text-muted)]">
                    No sync or action history recorded yet.
                  </div>
                ) : (
                  (invoice.events ?? []).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-[var(--border)] px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {event.event_type}
                          </div>
                          <div className="mt-1 text-sm text-[var(--text-secondary)]">
                            {event.message || "No message"}
                          </div>
                          <div className="mt-1 text-xs text-[var(--text-muted)]">
                            Source {event.source}
                            {event.stripe_event_id ? ` • Stripe event ${event.stripe_event_id}` : ""}
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {formatDateTime(event.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className={S.label}>Invoice metadata</div>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <div>
                  <span className="text-[var(--text-primary)]">Local status:</span>{" "}
                  {invoice.status}
                </div>
                <div>
                  <span className="text-[var(--text-primary)]">Stripe status:</span>{" "}
                  {invoice.stripe_status || "—"}
                </div>
                <div>
                  <span className="text-[var(--text-primary)]">Stripe invoice id:</span>{" "}
                  {invoice.stripe_invoice_id || "—"}
                </div>
                <div>
                  <span className="text-[var(--text-primary)]">Stripe customer id:</span>{" "}
                  {invoice.stripe_customer_id || "—"}
                </div>
                <div>
                  <span className="text-[var(--text-primary)]">Scheduled send:</span>{" "}
                  {formatDateTime(invoice.send_at)}
                </div>
                <div>
                  <span className="text-[var(--text-primary)]">Last synced:</span>{" "}
                  {formatDateTime(invoice.last_synced_at)}
                </div>
              </div>
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className={S.label}>Notes</div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Client memo
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">
                    {invoice.memo || invoice.notes || "No memo saved."}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Internal notes
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)]">
                    {invoice.internal_notes || "No internal notes saved."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
