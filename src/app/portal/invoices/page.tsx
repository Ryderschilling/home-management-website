"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalDrawer } from "@/app/portal/_components/PortalDrawer";

type Client = { id: string; name: string };
type Property = { id: string; client_id?: string | null; name: string; address_line1?: string | null };
type Retainer = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  name: string;
  amount_cents: number;
  billing_frequency: string;
  billing_interval: number;
  status: string;
};
type Job = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  retainer_id?: string | null;
  title: string;
  scheduled_for: string;
  status: string;
  price_cents?: number | null;
};
type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price_cents: number;
  line_total_cents: number;
  line_type: string;
  job_id?: string | null;
  retainer_id?: string | null;
};
type Invoice = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  retainer_id?: string | null;
  invoice_number: string;
  status: string;
  period_start?: string | null;
  period_end?: string | null;
  issue_date?: string | null;
  due_date?: string | null;
  subtotal_cents: number;
  total_cents: number;
  notes?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  plan_name?: string | null;
  line_items?: InvoiceLineItem[] | null;
};
type ManualLine = { description: string; quantity: string; unitPrice: string };

const S = {
  input:
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary:
    "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhost:
    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
};

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function invoiceStatusStyle(status: string): React.CSSProperties {
  const normalized = status.toUpperCase();
  if (normalized === "PAID") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.24)", color: "#4ade80", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (normalized === "SENT") return { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.24)", color: "#60a5fa", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (normalized === "OVERDUE") return { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.24)", color: "#f87171", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (normalized === "VOID") return { background: "rgba(120,120,120,0.12)", border: "1px solid rgba(120,120,120,0.26)", color: "#b4b4b4", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.24)", color: "#fbbf24", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
}

function newManualLine(): ManualLine {
  return { description: "", quantity: "1", unitPrice: "" };
}

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [plans, setPlans] = useState<Retainer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientId, setClientId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [retainerId, setRetainerId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [manualLines, setManualLines] = useState<ManualLine[]>([newManualLine()]);
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [invoicesRes, clientsRes, propertiesRes, plansRes, jobsRes] = await Promise.all([
        fetch("/api/admin/invoices"),
        fetch("/api/admin/clients"),
        fetch("/api/admin/properties"),
        fetch("/api/admin/retainers"),
        fetch(`/api/admin/jobs?includeCompleted=true&start=${encodeURIComponent(new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString())}&end=${encodeURIComponent(new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString())}`),
      ]);
      const invoicesJson = await invoicesRes.json();
      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();
      const plansJson = await plansRes.json();
      const jobsJson = await jobsRes.json();
      if (!invoicesRes.ok || !invoicesJson.ok) throw new Error(invoicesJson?.error?.message ?? "Failed to load invoices");
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      if (!propertiesRes.ok || !propertiesJson.ok) throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      if (!plansRes.ok || !plansJson.ok) throw new Error(plansJson?.error?.message ?? "Failed to load plans");
      if (!jobsRes.ok || !jobsJson.ok) throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      setInvoices(invoicesJson.data ?? []);
      setClients(clientsJson.data ?? []);
      setProperties(propertiesJson.data ?? []);
      setPlans(plansJson.data ?? []);
      setJobs(jobsJson.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (statusFilter !== "ALL" && invoice.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, statusFilter]);

  const propertiesForClient = useMemo(() => {
    if (!clientId) return properties;
    return properties.filter((property) => property.client_id === clientId);
  }, [clientId, properties]);

  const plansForClient = useMemo(() => {
    if (!clientId) return plans;
    return plans.filter((plan) => plan.client_id === clientId);
  }, [clientId, plans]);

  const billableJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (clientId && job.client_id !== clientId) return false;
      if (propertyId && job.property_id !== propertyId) return false;
      return job.status !== "CANCELED";
    });
  }, [clientId, jobs, propertyId]);

  const stats = useMemo(() => {
    const sent = invoices.filter((invoice) => invoice.status === "SENT").length;
    const paid = invoices.filter((invoice) => invoice.status === "PAID").length;
    const draft = invoices.filter((invoice) => invoice.status === "DRAFT").length;
    const total = invoices.reduce((sum, invoice) => sum + (invoice.total_cents ?? 0), 0);
    return { sent, paid, draft, total };
  }, [invoices]);

  useEffect(() => {
    if (!retainerId) return;
    const plan = plans.find((item) => item.id === retainerId);
    if (!plan) return;
    setClientId(plan.client_id ?? "");
    setPropertyId(plan.property_id ?? "");
  }, [plans, retainerId]);

  function toggleJob(jobId: string) {
    setSelectedJobIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]
    );
  }

  function updateManualLine(index: number, key: keyof ManualLine, value: string) {
    setManualLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line))
    );
  }

  async function createInvoice() {
    setSaving(true);
    setError("");
    try {
      const manualLineItems = manualLines
        .filter((line) => line.description.trim())
        .map((line) => ({
          description: line.description.trim(),
          quantity: Number(line.quantity || 1),
          unitPriceCents: Math.round(Number(line.unitPrice || 0) * 100),
        }));

      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          propertyId: propertyId || null,
          retainerId: retainerId || null,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          issueDate: issueDate || null,
          dueDate: dueDate || null,
          jobIds: selectedJobIds,
          manualLineItems,
          notes: notes || null,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to create invoice");
      }
      setDrawerOpen(false);
      setClientId("");
      setPropertyId("");
      setRetainerId("");
      setPeriodStart("");
      setPeriodEnd("");
      setIssueDate(new Date().toISOString().slice(0, 10));
      setDueDate("");
      setSelectedJobIds([]);
      setManualLines([newManualLine()]);
      setNotes("");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  }

  async function updateInvoiceStatus(invoiceId: string, status: string) {
    setError("");
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to update invoice");
      }
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update invoice");
    }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Invoices</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Billing records and draft generation</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 680 }}>Plans own billing cadence, jobs can optionally add extra charges, and invoices now exist as first-class operator records without touching payment collection flows.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[{ label: "Draft", value: stats.draft }, { label: "Sent", value: stats.sent }, { label: "Paid", value: stats.paid }, { label: "Total billed", value: money(stats.total) }].map((stat) => (
              <div key={stat.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                <div className={S.label}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)", marginTop: 8 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <select className={S.input} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <button type="button" onClick={() => setDrawerOpen(true)} className={S.btnPrimary}>
            Create draft invoice
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}
      </section>

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Invoices</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredInvoices.length} invoice records`}</div>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-[var(--text-muted)]">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--text-muted)]">No invoices created yet.</div>
        ) : (
          <div className="space-y-4 p-5 sm:p-6">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className={S.cardInner} style={{ padding: 18 }}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{invoice.invoice_number}</div>
                      <span style={invoiceStatusStyle(invoice.status)}>{invoice.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">
                      {invoice.client_name || "No client"} {invoice.property_name ? `• ${invoice.property_name}` : ""}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-muted)]">
                      Period: {fmtDate(invoice.period_start)} - {fmtDate(invoice.period_end)} • Issue {fmtDate(invoice.issue_date)} • Due {fmtDate(invoice.due_date)}
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">
                      {invoice.notes || "No notes"}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: "var(--text-primary)" }}>{money(invoice.total_cents)}</div>
                    <div className="flex flex-wrap gap-2">
                      {["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"].map((status) => (
                        <button key={status} type="button" onClick={() => updateInvoiceStatus(invoice.id, status)} className={S.btnGhost}>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {Array.isArray(invoice.line_items) && invoice.line_items.length > 0 ? (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="min-w-[760px] w-full text-left">
                      <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-3)" }}>
                        <tr>{["Description", "Type", "Qty", "Unit", "Line total"].map((heading) => <th key={heading} className="px-4 py-3 text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{heading}</th>)}</tr>
                      </thead>
                      <tbody>
                        {invoice.line_items.map((item) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{item.line_type}</td>
                            <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{money(item.unit_price_cents)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{money(item.line_total_cents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <PortalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create draft invoice"
        subtitle="Generate from a service plan, optionally attach extra billable jobs, and add manual line items without leaving the portal."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDrawerOpen(false)} className={S.btnGhost}>
              Cancel
            </button>
            <button type="button" onClick={createInvoice} disabled={saving} className={S.btnPrimary}>
              {saving ? "Creating..." : "Create invoice"}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className={S.label}>Client</label>
              <select className={S.input} value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <option value="">Select client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className={S.label}>Property</label>
              <select className={S.input} value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
                <option value="">Optional property</option>
                {propertiesForClient.map((property) => <option key={property.id} value={property.id}>{property.name}{property.address_line1 ? ` - ${property.address_line1}` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={S.label}>Plan</label>
              <select className={S.input} value={retainerId} onChange={(event) => setRetainerId(event.target.value)}>
                <option value="">Optional plan base charge</option>
                {plansForClient.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} • {money(plan.amount_cents)} • every {plan.billing_interval} {plan.billing_frequency.toLowerCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className={S.label}>Period start</label>
              <input type="date" className={S.input} value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className={S.label}>Period end</label>
              <input type="date" className={S.input} value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className={S.label}>Issue date</label>
              <input type="date" className={S.input} value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className={S.label}>Due date</label>
              <input type="date" className={S.input} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </div>

          <div>
            <div className={S.label}>Optional extra billable jobs</div>
            <div className="mt-3 max-h-[240px] space-y-2 overflow-y-auto">
              {billableJobs.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] px-4 py-4 text-sm text-[var(--text-muted)]">No billable jobs match the selected client or property.</div>
              ) : (
                billableJobs.map((job) => (
                  <label key={job.id} className={`${S.cardInner} flex items-start gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]`}>
                    <input type="checkbox" checked={selectedJobIds.includes(job.id)} onChange={() => toggleJob(job.id)} />
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-primary)]">{job.title}</div>
                      <div className="mt-1 text-[12px] text-[var(--text-secondary)]">{fmtDate(job.scheduled_for)} • {job.status} • {money(job.price_cents)}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={S.label}>Manual line items</div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">Use this for admin fees, one-off adjustments, or non-job charges.</div>
              </div>
              <button type="button" onClick={() => setManualLines((current) => [...current, newManualLine()])} className={S.btnGhost}>
                Add line
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {manualLines.map((line, index) => (
                <div key={`manual-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] p-4 md:grid-cols-[minmax(0,1fr)_140px_160px]">
                  <input className={S.input} value={line.description} onChange={(event) => updateManualLine(index, "description", event.target.value)} placeholder="Description" />
                  <input className={S.input} value={line.quantity} onChange={(event) => updateManualLine(index, "quantity", event.target.value)} placeholder="Qty" />
                  <input className={S.input} value={line.unitPrice} onChange={(event) => updateManualLine(index, "unitPrice", event.target.value)} placeholder="Unit price (USD)" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={S.label}>Notes</label>
            <textarea className={`${S.input} min-h-[110px] resize-none`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Billing notes, context for the client, or operator-only reminders..." />
          </div>
        </div>
      </PortalDrawer>
    </div>
  );
}
