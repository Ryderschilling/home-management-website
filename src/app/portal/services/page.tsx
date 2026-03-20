"use client";

import { useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  unit_price_cents: number;
  cost_cents: number;
  gross_profit_cents?: number;
  active?: boolean;
};

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhostLg: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
};

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

export default function PortalServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to load services");
      setServices(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load services");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => [s.name, s.description, s.active ? "active" : "inactive"].map((v) => String(v ?? "").toLowerCase()).join(" • ").includes(q));
  }, [services, search]);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.active !== false).length;
    const totalPrice = services.reduce((sum, s) => sum + (s.unit_price_cents ?? 0), 0);
    const totalCost = services.reduce((sum, s) => sum + (s.cost_cents ?? 0), 0);
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    const avgMargin = total > 0 ? Math.round((totalPrice - totalCost) / total) : 0;
    return { total, active, avgPrice, avgMargin };
  }, [services]);

  async function createService() {
    setError("");
    if (!name.trim()) { setError("Service name is required"); return; }
    const unitPriceCents = Math.round(Number(unitPrice) * 100);
    const costCents = cost.trim() === "" ? 0 : Math.round(Number(cost) * 100);
    if (Number.isNaN(unitPriceCents) || unitPriceCents <= 0) { setError("Price must be a number greater than 0"); return; }
    if (Number.isNaN(costCents) || costCents < 0) { setError("Cost must be a number 0 or greater"); return; }
    try {
      const res = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), description: description.trim() || null, unitPriceCents, costCents }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to create service");
      setName(""); setUnitPrice(""); setCost(""); setDescription(""); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create service"); }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Services</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Service management</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Manage pricing, cost basis, and margin visibility from one clean service catalog.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Total services", value: stats.total }, { label: "Active", value: stats.active }, { label: "Avg. price", value: money(stats.avgPrice) }, { label: "Avg. margin", value: money(stats.avgMargin) }].map((s) => (
              <div key={s.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
            <button onClick={() => { setShowForm((p) => !p); setError(""); }} className={S.btnPrimary}>{showForm ? "Close form" : "Create service"}</button>
          </div>
        </div>
        <div className="mt-6">
          <input className={S.input} placeholder="Search services by name or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error && <div className="mt-6 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      {showForm && (
        <section className={`${S.card} p-5 sm:p-7`}>
          <div className="mb-6">
            <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Create service</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>Set the sale price and true cost so margin stays visible.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2"><label className={S.label}>Service name</label><input className={S.input} placeholder="Service name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><label className={S.label}>Price (USD)</label><input className={S.input} placeholder="e.g. 250" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></div>
            <div className="space-y-2"><label className={S.label}>Cost (USD)</label><input className={S.input} placeholder="e.g. 120" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><label className={S.label}>Description</label><textarea className={`${S.input} min-h-[100px] resize-none`} placeholder="Optional notes about what is included" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={createService} className={S.btnPrimary}>Save service</button>
            <button onClick={() => setShowForm(false)} className={S.btnGhostLg}>Cancel</button>
          </div>
        </section>
      )}

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Services</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredServices.length} visible services`}</div>
        </div>
        {filteredServices.length === 0 ? (
          <div className="px-5 py-8 sm:px-7 sm:py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading services..." : "No services found."}</div>
        ) : (
          <div className="portal-table-scroll">
            <table className="min-w-[760px] w-full text-left md:min-w-[900px]">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <tr>{["Service", "Description", "Price", "Cost", "Margin", "Status"].map((h) => (<th key={h} className="px-5 py-4" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => {
                  const profit = typeof service.gross_profit_cents === "number" ? service.gross_profit_cents : (service.unit_price_cents ?? 0) - (service.cost_cents ?? 0);
                  const isActive = service.active !== false;
                  return (
                    <tr key={service.id} style={{ borderBottom: "1px solid var(--border)" }} className="align-top">
                      <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{service.name}</td>
                      <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 380 }}>{service.description || "—"}</td>
                      <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{money(service.unit_price_cents)}</td>
                      <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{money(service.cost_cents)}</td>
                      <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-warm, #c9b89a)" }}>{money(profit)}</td>
                      <td className="px-5 py-5">
                        <span style={{ borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", ...(isActive ? { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" } : { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }) }}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
