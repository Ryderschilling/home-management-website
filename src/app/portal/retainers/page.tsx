"use client";

import { useEffect, useMemo, useState } from "react";

type Client = { id: string; name: string; };
type Property = { id: string; client_id?: string | null; name: string; address_line1?: string | null; };
type Retainer = { id: string; client_id?: string | null; property_id?: string | null; client_name?: string | null; property_name?: string | null; property_address_line1?: string | null; name: string; amount_cents: number; billing_frequency: "DAILY" | "WEEKLY" | "MONTHLY"; billing_interval: number; billing_anchor_date?: string | null; service_frequency: "DAILY" | "WEEKLY" | "MONTHLY"; service_interval: number; service_anchor_date?: string | null; status: "ACTIVE" | "PAUSED" | "CANCELED"; notes?: string | null; created_at?: string | null; };

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhostLg: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
};

function money(cents: number | null | undefined) { return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`; }

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
  const [notes, setNotes] = useState("");

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
    return retainers.filter((r) => [r.name, r.client_name, r.property_name, r.status, r.billing_frequency, r.notes].map((v) => String(v ?? "").toLowerCase()).join(" • ").includes(q));
  }, [retainers, search]);

  const propertiesForClient = useMemo(() => !clientId ? [] : properties.filter((p) => p.client_id === clientId), [properties, clientId]);

  useEffect(() => {
    if (!clientId) { setPropertyId(""); return; }
    if (!propertiesForClient.some((p) => p.id === propertyId)) setPropertyId("");
  }, [clientId, propertiesForClient, propertyId]);

  const stats = useMemo(() => {
    const active = retainers.filter((r) => r.status === "ACTIVE");
    const monthly = active.filter((r) => r.billing_frequency === "MONTHLY").reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);
    const weeklyNormalized = active.filter((r) => r.billing_frequency === "WEEKLY").reduce((sum, r) => { const interval = Math.max(1, r.billing_interval || 1); return sum + Math.round((r.amount_cents * 52) / 12 / interval); }, 0);
    return { total: retainers.length, active: active.length, paused: retainers.filter((r) => r.status === "PAUSED").length, canceled: retainers.filter((r) => r.status === "CANCELED").length, estimatedMrr: monthly + weeklyNormalized };
  }, [retainers]);

  async function createRetainer() {
    setError("");
    if (!name.trim()) return setError("Plan name is required");
    if (!clientId) return setError("Client is required");
    const amountCents = Math.round(Number(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) return setError("Amount must be greater than 0");
    const intervalNum = Math.max(1, Number(billingInterval));
    const serviceIntervalNum = Math.max(1, Number(serviceInterval));
    try {
      const res = await fetch("/api/admin/retainers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), clientId, propertyId: propertyId || null, amountCents, billingFrequency, billingInterval: intervalNum, billingAnchorDate: billingAnchorDate || null, serviceFrequency, serviceInterval: serviceIntervalNum, serviceAnchorDate: serviceAnchorDate || billingAnchorDate || null, notes: notes.trim() || null }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to create retainer");
      setName(""); setClientId(""); setPropertyId(""); setAmount(""); setBillingFrequency("MONTHLY"); setBillingInterval("1"); setBillingAnchorDate(""); setServiceFrequency("WEEKLY"); setServiceInterval("1"); setServiceAnchorDate(""); setNotes(""); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create retainer"); }
  }

  async function updateRetainerStatus(retainerId: string, status: "ACTIVE" | "PAUSED" | "CANCELED") {
    setError("");
    try {
      const res = await fetch(`/api/admin/retainers/${retainerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update retainer");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update retainer"); }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Retainers</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Recurring revenue plans</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Manage recurring homeowner plans so the business compounds beyond one-off jobs.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Total plans", value: stats.total }, { label: "Active", value: stats.active }, { label: "Est. MRR", value: money(stats.estimatedMrr), accent: true }].map((s) => (
              <div key={s.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: (s as any).accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
            <button onClick={() => { setShowForm((p) => !p); setError(""); }} className={S.btnPrimary}>{showForm ? "Close form" : "Create plan"}</button>
          </div>
        </div>
        <div className="mt-6"><input className={S.input} placeholder="Search plan, client, property, status..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {error && <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      {showForm && (
        <section className={`${S.card} p-7`}>
          <div className="mb-6">
            <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Create recurring plan</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>Set the client, property, billing cadence, and plan amount.</p>
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
            <div className="space-y-2"><label className={S.label}>Amount (USD)</label><input className={S.input} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 350" /></div>
            <div className="space-y-2"><label className={S.label}>Billing frequency</label>
              <select className={S.input} value={billingFrequency} onChange={(e) => setBillingFrequency(e.target.value as any)}>
                <option value="MONTHLY">Monthly</option><option value="WEEKLY">Weekly</option><option value="DAILY">Daily</option>
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Every</label><input className={S.input} value={billingInterval} onChange={(e) => setBillingInterval(e.target.value)} placeholder="1" /></div>
            <div className="space-y-2"><label className={S.label}>Anchor date</label><input type="date" className={S.input} value={billingAnchorDate} onChange={(e) => setBillingAnchorDate(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2 pt-2">
              <div className={S.label}>Service schedule</div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>This controls how often tasks should be performed. It can be different from billing.</p>
            </div>
            <div className="space-y-2"><label className={S.label}>Service frequency</label>
              <select className={S.input} value={serviceFrequency} onChange={(e) => setServiceFrequency(e.target.value as any)}>
                <option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Every</label><input className={S.input} value={serviceInterval} onChange={(e) => setServiceInterval(e.target.value)} placeholder="1" /></div>
            <div className="space-y-2"><label className={S.label}>Service anchor date</label><input type="date" className={S.input} value={serviceAnchorDate} onChange={(e) => setServiceAnchorDate(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><label className={S.label}>Notes</label><textarea className={`${S.input} min-h-[110px] resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is included, service expectations, exclusions, homeowner notes..." /></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={createRetainer} className={S.btnPrimary}>Save plan</button>
            <button onClick={() => setShowForm(false)} className={S.btnGhostLg}>Cancel</button>
          </div>
        </section>
      )}

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Plans</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredRetainers.length} visible retainers`}</div>
        </div>
        {filteredRetainers.length === 0 ? (
          <div className="px-7 py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading plans..." : "No recurring plans found."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <tr>{["Plan", "Client", "Property", "Amount", "Billing", "Billing Anchor", "Service", "Service Anchor", "Status", "Actions"].map((h) => (<th key={h} className="px-5 py-4" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {filteredRetainers.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }} className="align-top">
                    <td className="px-5 py-5"><div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</div><div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{r.notes || "—"}</div></td>
                    <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.client_name || "—"}</td>
                    <td className="px-5 py-5"><div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.property_name || "—"}</div><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.property_address_line1 || ""}</div></td>
                    <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-warm, #c9b89a)" }}>{money(r.amount_cents)}</td>
                    <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>Every {r.billing_interval} {r.billing_frequency.toLowerCase()}</td>
                    <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.billing_anchor_date || "—"}</td>
                    <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>Every {r.service_interval} {r.service_frequency.toLowerCase()}</td>
                    <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.service_anchor_date || "—"}</td>
                    <td className="px-5 py-5"><span style={retainerStatusStyle(r.status)}>{r.status}</span></td>
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        {r.status !== "ACTIVE" && <button onClick={() => updateRetainerStatus(r.id, "ACTIVE")} className="rounded-lg border border-green-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-green-400 transition hover:bg-green-900/20">Activate</button>}
                        {r.status !== "PAUSED" && <button onClick={() => updateRetainerStatus(r.id, "PAUSED")} className="rounded-lg border border-amber-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-400 transition hover:bg-amber-900/20">Pause</button>}
                        {r.status !== "CANCELED" && <button onClick={() => updateRetainerStatus(r.id, "CANCELED")} className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]">Cancel</button>}
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
