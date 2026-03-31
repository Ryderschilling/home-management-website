"use client";

import { useEffect, useMemo, useState } from "react";

type Client = { id: string; name: string; };
type Property = { id: string; client_id?: string | null; name: string; address_line1?: string | null; };
type Retainer = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  name: string;
  amount_cents: number;
  billing_frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  billing_interval: number;
  billing_anchor_date?: string | null;
  service_frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  service_interval: number;
  service_anchor_date?: string | null;
  service_type?: string | null;
  billing_model?: "FIXED_RECURRING" | "USAGE_RECURRING" | "ONE_OFF_TIME" | "FLAT_ONE_OFF";
  visit_rate_cents?: number | null;
  on_call_base_fee_cents?: number | null;
  hourly_rate_cents?: number | null;
  checklist_template_text?: string | null;
  checklist_template_json?: unknown;
  auto_generate_jobs?: boolean | null;
  archived_at?: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELED";
  notes?: string | null;
  created_at?: string | null;
  future_visit_count?: number | null;
  completed_visit_count?: number | null;
  next_visit_at?: string | null;
  last_completed_at?: string | null;
};

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhostLg: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnDanger: "inline-flex items-center justify-center rounded-lg border border-red-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-400 transition hover:bg-red-900/20",
};

function money(cents: number | null | undefined) { return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`; }
function fmtDate(value: string | null | undefined) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); }

function retainerStatusStyle(status: string): React.CSSProperties {
  if (status === "ACTIVE") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (status === "PAUSED") return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
}

export default function PortalRetainersPage() {
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [billingFrequency, setBillingFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("MONTHLY");
  const [billingInterval, setBillingInterval] = useState("1");
  const [billingAnchorDate, setBillingAnchorDate] = useState("");
  const [serviceFrequency, setServiceFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [serviceInterval, setServiceInterval] = useState("1");
  const [serviceAnchorDate, setServiceAnchorDate] = useState("");
  const [serviceType, setServiceType] = useState("HOME_MANAGEMENT");
  const [billingModel, setBillingModel] = useState<"FIXED_RECURRING" | "USAGE_RECURRING" | "ONE_OFF_TIME" | "FLAT_ONE_OFF">("FIXED_RECURRING");
  const [visitRate, setVisitRate] = useState("");
  const [onCallBaseFee, setOnCallBaseFee] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [checklistTemplateText, setChecklistTemplateText] = useState("");
  const [autoGenerateJobs, setAutoGenerateJobs] = useState(true);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [retainersRes, clientsRes, propertiesRes] = await Promise.all([fetch("/api/admin/retainers"), fetch("/api/admin/clients"), fetch("/api/admin/properties")]);
      const retainersJson = await retainersRes.json();
      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();
      if (!retainersRes.ok || !retainersJson.ok) throw new Error(retainersJson?.error?.message ?? "Failed to load retainers");
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      if (!propertiesRes.ok || !propertiesJson.ok) throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      setRetainers(retainersJson.data ?? []); setClients(clientsJson.data ?? []); setProperties(propertiesJson.data ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load retainers"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filteredRetainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return retainers;
    return retainers.filter((r) => [r.name, r.client_name, r.property_name, r.status, r.billing_frequency, r.billing_model, r.service_type, r.notes].map((v) => String(v ?? "").toLowerCase()).join(" • ").includes(q));
  }, [retainers, search]);

  const propertiesForClient = useMemo(() => !clientId ? [] : properties.filter((p) => p.client_id === clientId), [properties, clientId]);

  useEffect(() => {
    if (!clientId) { setPropertyId(""); return; }
    if (!propertiesForClient.some((p) => p.id === propertyId)) setPropertyId("");
  }, [clientId, propertiesForClient, propertyId]);

  const stats = useMemo(() => {
    const active = retainers.filter((r) => r.status === "ACTIVE" && !r.archived_at);
    const fixedRecurring = active.filter((r) => r.billing_model === "FIXED_RECURRING");
    const monthly = fixedRecurring
      .filter((r) => r.billing_frequency === "MONTHLY")
      .reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
    const weeklyNormalized = fixedRecurring
      .filter((r) => r.billing_frequency === "WEEKLY")
      .reduce((sum, r) => {
        const interval = Math.max(1, r.billing_interval || 1);
        return sum + Math.round((r.amount_cents * 52) / 12 / interval);
      }, 0);
    return {
      total: retainers.length,
      active: active.length,
      paused: retainers.filter((r) => r.status === "PAUSED" && !r.archived_at).length,
      archived: retainers.filter((r) => Boolean(r.archived_at)).length,
      usage: active.filter((r) => r.billing_model === "USAGE_RECURRING").length,
      estimatedMrr: monthly + weeklyNormalized,
    };
  }, [retainers]);

  async function createRetainer() {
    setError(""); setNotice("");
    if (!name.trim()) return setError("Plan name is required");
    if (!clientId) return setError("Client is required");
    const amountCents = Math.round(Number(amount || 0) * 100);
    if (Number.isNaN(amountCents) || amountCents < 0) return setError("Amount must be 0 or greater");
    if (billingModel === "FIXED_RECURRING" && amountCents <= 0) return setError("Fixed recurring plans need a recurring amount");
    const intervalNum = Math.max(1, Number(billingInterval));
    const serviceIntervalNum = Math.max(1, Number(serviceInterval));
    try {
      const res = await fetch("/api/admin/retainers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), clientId, propertyId: propertyId || null, amountCents, billingFrequency, billingInterval: intervalNum, billingAnchorDate: billingAnchorDate || null, serviceFrequency, serviceInterval: serviceIntervalNum, serviceAnchorDate: serviceAnchorDate || billingAnchorDate || null, serviceType, billingModel, visitRateCents: visitRate ? Math.round(Number(visitRate) * 100) : null, onCallBaseFeeCents: onCallBaseFee ? Math.round(Number(onCallBaseFee) * 100) : null, hourlyRateCents: hourlyRate ? Math.round(Number(hourlyRate) * 100) : null, checklistTemplateText: checklistTemplateText || null, autoGenerateJobs, notes: notes.trim() || null }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to create retainer");
      setName(""); setClientId(""); setPropertyId(""); setAmount(""); setBillingFrequency("MONTHLY"); setBillingInterval("1"); setBillingAnchorDate(""); setServiceFrequency("WEEKLY"); setServiceInterval("1"); setServiceAnchorDate(""); setServiceType("HOME_MANAGEMENT"); setBillingModel("FIXED_RECURRING"); setVisitRate(""); setOnCallBaseFee(""); setHourlyRate(""); setChecklistTemplateText(""); setAutoGenerateJobs(true); setNotes(""); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create retainer"); }
  }

  async function updateRetainerStatus(retainerId: string, status: "ACTIVE" | "PAUSED" | "CANCELED") {
    setError(""); setNotice("");
    try {
      const res = await fetch(`/api/admin/retainers/${retainerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update retainer");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update retainer"); }
  }

  async function archiveRetainer(retainerId: string, archived: boolean) {
    setError(""); setNotice("");
    try {
      const res = await fetch(`/api/admin/retainers/${retainerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivedAt: archived ? new Date().toISOString() : null, status: archived ? "CANCELED" : "PAUSED" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update archive state");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update archive state");
    }
  }

  async function regenerateFutureVisits(retainerId: string) {
    setError(""); setNotice("");
    try {
      const res = await fetch(`/api/admin/retainers/${retainerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGENERATE_FUTURE_VISITS" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to regenerate future visits");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to regenerate future visits");
    }
  }

  async function deleteRetainerAction(retainer: Retainer) {
    const futureVisitCount = retainer.future_visit_count ?? 0;
    const confirmed = window.confirm(
      futureVisitCount > 0
        ? `Delete this plan? This will also remove ${futureVisitCount} future uncompleted plan-generated visit${futureVisitCount === 1 ? "" : "s"}. Completed history is preserved.`
        : "Delete this plan? Completed history and invoiced plans cannot be deleted through this action."
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/admin/retainers/${retainer.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete plan");
      const deletedFutureVisitCount = Number(json.data?.deletedFutureVisitCount ?? 0);
      setNotice(
        deletedFutureVisitCount > 0
          ? `Deleted plan and removed ${deletedFutureVisitCount} future uncompleted plan visit${deletedFutureVisitCount === 1 ? "" : "s"}.`
          : "Deleted plan."
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete plan");
    }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Plans</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Service plans and recurring agreements</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 640 }}>Use plans for prepaid home management, usage-based mail checks, and concierge pricing context. Billing cadence can stay separate from visit cadence while plan-generated jobs stay linked to the agreement.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Total plans", value: stats.total }, { label: "Active", value: stats.active }, { label: "Usage plans", value: stats.usage }, { label: "Est. recurring base", value: money(stats.estimatedMrr), accent: true }].map((s) => (
              <div key={s.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: (s as any).accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
            <button onClick={() => { setShowForm((p) => !p); setError(""); }} className={S.btnPrimary}>{showForm ? "Close form" : "Create plan"}</button>
          </div>
        </div>
        <div className="mt-6"><input className={S.input} placeholder="Search plan, client, property, status..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className={S.cardInner} style={{ padding: "14px 16px" }}>
            <div className={S.label}>Billing cadence</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 6 }}>Determines when invoices are generated from the plan.</div>
          </div>
          <div className={S.cardInner} style={{ padding: "14px 16px" }}>
            <div className={S.label}>Visit cadence</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 6 }}>Determines how future jobs are generated on the schedule.</div>
          </div>
          <div className={S.cardInner} style={{ padding: "14px 16px" }}>
            <div className={S.label}>Example</div>
            <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 6 }}>Bill monthly while visits run weekly, then add extra billable jobs only when needed.</div>
          </div>
        </div>
        {error && <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        {!error && notice && <div className="mt-5 rounded-xl border border-emerald-900/30 bg-emerald-900/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}
      </section>

      {showForm && (
        <section className={`${S.card} p-5 sm:p-7`}>
          <div className="mb-6">
            <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Create service plan</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>Set the recurring agreement, then keep billing cadence and visit cadence independent.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><label className={S.label}>Plan name</label><input className={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Second-home weekly care, concierge plan..." /></div>
            <div className="space-y-2"><label className={S.label}>Client</label>
              <select className={S.input} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Property</label>
              <select className={S.input} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={!clientId}>
                <option value="">{!clientId ? "Select client first" : "Optional property"}</option>
                {propertiesForClient.map((p) => <option key={p.id} value={p.id}>{p.name}{p.address_line1 ? ` — ${p.address_line1}` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Service type</label>
              <select className={S.input} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="HOME_MANAGEMENT">Home management</option>
                <option value="MAIL_CHECK">Mail check</option>
                <option value="CONCIERGE">Concierge / on-call</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Billing model</label>
              <select className={S.input} value={billingModel} onChange={(e) => setBillingModel(e.target.value as any)}>
                <option value="FIXED_RECURRING">Fixed recurring</option>
                <option value="USAGE_RECURRING">Usage recurring</option>
                <option value="ONE_OFF_TIME">One-off time</option>
                <option value="FLAT_ONE_OFF">Flat one-off</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2 pt-2">
              <div className={S.label}>Billing cadence</div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>This controls plan billing. It does not control how often service visits occur.</p>
            </div>
            <div className="space-y-2"><label className={S.label}>Plan amount (USD)</label><input className={S.input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={billingModel === "FIXED_RECURRING" ? "e.g. 350" : "Optional recurring or flat amount"} /></div>
            <div className="space-y-2"><label className={S.label}>Billing frequency</label>
              <select className={S.input} value={billingFrequency} onChange={(e) => setBillingFrequency(e.target.value as any)}>
                <option value="MONTHLY">Monthly</option><option value="WEEKLY">Weekly</option><option value="DAILY">Daily</option>
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Every</label><input className={S.input} value={billingInterval} onChange={(e) => setBillingInterval(e.target.value)} placeholder="1" /></div>
            <div className="space-y-2"><label className={S.label}>Billing anchor date</label><input type="date" className={S.input} value={billingAnchorDate} onChange={(e) => setBillingAnchorDate(e.target.value)} /></div>
            {(billingModel === "USAGE_RECURRING" || billingModel === "ONE_OFF_TIME") && (
              <>
                <div className="space-y-2"><label className={S.label}>Visit rate (USD)</label><input className={S.input} value={visitRate} onChange={(e) => setVisitRate(e.target.value)} placeholder="For usage-based visits" /></div>
                <div className="space-y-2"><label className={S.label}>On-call base fee (USD)</label><input className={S.input} value={onCallBaseFee} onChange={(e) => setOnCallBaseFee(e.target.value)} placeholder="e.g. 75" /></div>
                <div className="space-y-2"><label className={S.label}>Hourly rate (USD)</label><input className={S.input} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="For concierge labor" /></div>
              </>
            )}
            <div className="space-y-2 md:col-span-2 pt-2">
              <div className={S.label}>Visit cadence</div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>This drives future jobs on the schedule. Example: bill monthly while visits happen weekly.</p>
            </div>
            <div className="space-y-2"><label className={S.label}>Service frequency</label>
              <select className={S.input} value={serviceFrequency} onChange={(e) => setServiceFrequency(e.target.value as any)}>
                <option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Every</label><input className={S.input} value={serviceInterval} onChange={(e) => setServiceInterval(e.target.value)} placeholder="1" /></div>
            <div className="space-y-2"><label className={S.label}>Service anchor date</label><input type="date" className={S.input} value={serviceAnchorDate} onChange={(e) => setServiceAnchorDate(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2">
              <label className={S.label}>Visit checklist / service notes</label>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Enter plain-English notes or use one checklist item per line for plan-generated visits.</p>
              <textarea className={`${S.input} mt-2 min-h-[90px] resize-none`} value={checklistTemplateText} onChange={(e) => setChecklistTemplateText(e.target.value)} placeholder="Exterior walk\nMail check\nReset thermostat if needed" />
            </div>
            <label className={`${S.cardInner} flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)] md:col-span-2`}>
              <input type="checkbox" checked={autoGenerateJobs} onChange={(e) => setAutoGenerateJobs(e.target.checked)} />
              Auto-generate future jobs from this plan
            </label>
            <div className="space-y-2 md:col-span-2"><label className={S.label}>Notes</label><textarea className={`${S.input} min-h-[110px] resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is included, service expectations, exclusions, homeowner notes..." /></div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={createRetainer} className={S.btnPrimary}>Save plan</button>
            <button onClick={() => setShowForm(false)} className={S.btnGhostLg}>Cancel</button>
          </div>
        </section>
      )}

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Plans</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredRetainers.length} visible plans`}</div>
        </div>
        {filteredRetainers.length === 0 ? (
          <div className="px-5 py-8 sm:px-7 sm:py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading plans..." : "No recurring plans found."}</div>
        ) : (
          <div className="portal-table-scroll">
            <table className="min-w-[1280px] w-full text-left md:min-w-[1520px]">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <tr>{["Plan", "Client", "Property", "Billing", "Visit setup", "Usage history", "Next visit", "Status", "Actions"].map((h) => (<th key={h} className="px-5 py-4" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {filteredRetainers.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }} className="align-top">
                    <td className="px-5 py-5"><div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{String(r.service_type ?? "CUSTOM").replaceAll("_", " ")}</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{r.notes || "—"}</div></td>
                    <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.client_name || "—"}</td>
                    <td className="px-5 py-5"><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.property_name || "—"}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.property_address_line1 || ""}</div></td>
                    <td className="px-5 py-5"><div style={{ fontSize: 12, color: "var(--text-primary)" }}>{String(r.billing_model ?? "FIXED_RECURRING").replaceAll("_", " ")}</div><div style={{ fontSize: 12, fontWeight: 500, color: "var(--accent-warm, #c9b89a)", marginTop: 4 }}>{money(r.amount_cents)}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Visit rate {money(r.visit_rate_cents)}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Base {money(r.on_call_base_fee_cents)} • Hourly {money(r.hourly_rate_cents)}</div></td>
                    <td className="px-5 py-5"><div style={{ fontSize: 12, color: "var(--text-primary)" }}>Bill every {r.billing_interval} {r.billing_frequency.toLowerCase()}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Visits every {r.service_interval} {r.service_frequency.toLowerCase()}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Auto-generate: {r.auto_generate_jobs ? "On" : "Off"}</div></td>
                    <td className="px-5 py-5"><div style={{ fontSize: 12, color: "var(--text-primary)" }}>{r.completed_visit_count ?? 0} completed</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.future_visit_count ?? 0} future in horizon</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Last completed: {fmtDate(r.last_completed_at)}</div></td>
                    <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtDate(r.next_visit_at)}</td>
                    <td className="px-5 py-5"><span style={retainerStatusStyle(r.archived_at ? "CANCELED" : r.status)}>{r.archived_at ? "ARCHIVED" : r.status}</span></td>
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => regenerateFutureVisits(r.id)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]">Regenerate future visits</button>
                        {r.status !== "ACTIVE" && <button onClick={() => updateRetainerStatus(r.id, "ACTIVE")} className="rounded-lg border border-green-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-green-400 transition hover:bg-green-900/20">Activate</button>}
                        {r.status !== "PAUSED" && <button onClick={() => updateRetainerStatus(r.id, "PAUSED")} className="rounded-lg border border-amber-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-400 transition hover:bg-amber-900/20">Pause</button>}
                        {r.status !== "CANCELED" && <button onClick={() => updateRetainerStatus(r.id, "CANCELED")} className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]">Cancel</button>}
                        {!r.archived_at ? <button onClick={() => archiveRetainer(r.id, true)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]">Archive</button> : <button onClick={() => archiveRetainer(r.id, false)} className="rounded-lg border border-sky-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-900/20">Restore</button>}
                        <button onClick={() => deleteRetainerAction(r)} className={S.btnDanger}>Delete plan</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
