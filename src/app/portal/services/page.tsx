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
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110 disabled:opacity-60",
  btnGhostLg: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnGhost: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnDanger: "inline-flex items-center justify-center rounded-lg border border-red-900/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-red-400 transition hover:bg-red-900/20",
};

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

export default function PortalServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");

  // Edit modal
  const [editService, setEditService] = useState<Service | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Inline delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    return services.filter((s) =>
      [s.name, s.description, s.active ? "active" : "inactive"]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" • ")
        .includes(q)
    );
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
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null, unitPriceCents, costCents }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to create service");
      setName(""); setUnitPrice(""); setCost(""); setDescription(""); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create service"); }
  }

  function openEdit(service: Service) {
    setEditService(service);
    setEditName(service.name);
    setEditUnitPrice(String((service.unit_price_cents ?? 0) / 100));
    setEditCost(String((service.cost_cents ?? 0) / 100));
    setEditDescription(service.description ?? "");
    setEditActive(service.active !== false);
    setEditError("");
  }

  function closeEdit() {
    setEditService(null);
    setEditError("");
  }

  async function saveEdit() {
    if (!editService) return;
    setEditError("");
    if (!editName.trim()) { setEditError("Service name is required"); return; }
    const unitPriceCents = Math.round(Number(editUnitPrice) * 100);
    const costCents = editCost.trim() === "" ? 0 : Math.round(Number(editCost) * 100);
    if (Number.isNaN(unitPriceCents) || unitPriceCents <= 0) { setEditError("Price must be a number greater than 0"); return; }
    if (Number.isNaN(costCents) || costCents < 0) { setEditError("Cost must be a number 0 or greater"); return; }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${editService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() || null, unitPriceCents, costCents, active: editActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update service");
      closeEdit();
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update service");
    } finally { setEditSaving(false); }
  }

  async function executeDelete(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete service");
      setDeletingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete service");
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Header + Stats */}
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Services</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Service management</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Manage pricing, cost basis, and margin visibility from one clean service catalog.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Total services", value: stats.total },
              { label: "Active", value: stats.active },
              { label: "Avg. price", value: money(stats.avgPrice) },
              { label: "Avg. margin", value: money(stats.avgMargin) },
            ].map((s) => (
              <div key={s.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
            <button onClick={() => { setShowForm((p) => !p); setError(""); }} className={S.btnPrimary}>
              {showForm ? "Close form" : "Add service"}
            </button>
          </div>
        </div>
        <div className="mt-6">
          <input className={S.input} placeholder="Search services by name or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error && <div className="mt-6 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      {/* Create Form */}
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

      {/* Edit Modal */}
      {editService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className={`${S.card} w-full max-w-lg p-6 sm:p-8`} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Edit service</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>Changes apply immediately to all new invoices and jobs.</p>
              </div>
              <button onClick={closeEdit} style={{ fontSize: 22, color: "var(--text-muted)", lineHeight: 1, flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}>×</button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Service name</label>
                <input className={S.input} value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={S.label}>Price (USD)</label>
                <input className={S.input} value={editUnitPrice} onChange={(e) => setEditUnitPrice(e.target.value)} placeholder="e.g. 250" />
              </div>
              <div className="space-y-2">
                <label className={S.label}>Cost (USD)</label>
                <input className={S.input} value={editCost} onChange={(e) => setEditCost(e.target.value)} placeholder="e.g. 120" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Description</label>
                <textarea className={`${S.input} min-h-[80px] resize-none`} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Status</label>
                <div className="flex gap-2">
                  {[{ val: true, label: "Active" }, { val: false, label: "Inactive" }].map(({ val, label }) => (
                    <button
                      key={label}
                      onClick={() => setEditActive(val)}
                      style={{
                        borderRadius: 8, padding: "8px 18px", fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.15em", textTransform: "uppercase",
                        border: editActive === val ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: editActive === val ? "rgba(201,184,154,0.12)" : "var(--surface-2)",
                        color: editActive === val ? "var(--accent)" : "var(--text-muted)",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {editError && <div className="mt-4 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{editError}</div>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={saveEdit} disabled={editSaving} className={S.btnPrimary}>{editSaving ? "Saving…" : "Save changes"}</button>
              <button onClick={closeEdit} className={S.btnGhostLg}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Services</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredServices.length} visible`}</div>
        </div>
        {filteredServices.length === 0 ? (
          <div className="px-5 py-8 sm:px-7 sm:py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {loading ? "Loading services..." : "No services found."}
          </div>
        ) : (
          <div className="portal-table-scroll">
            <table className="min-w-[840px] w-full text-left">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <tr>
                  {["Service", "Description", "Price", "Cost", "Margin", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-4" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => {
                  const profit = typeof service.gross_profit_cents === "number"
                    ? service.gross_profit_cents
                    : (service.unit_price_cents ?? 0) - (service.cost_cents ?? 0);
                  const isActive = service.active !== false;
                  const isDeleting = deletingId === service.id;
                  return (
                    <tr key={service.id} style={{ borderBottom: "1px solid var(--border)" }} className="align-middle">
                      <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{service.name}</td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 280 }}>{service.description || "—"}</td>
                      <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{money(service.unit_price_cents)}</td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{money(service.cost_cents)}</td>
                      <td className="px-5 py-4" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-warm, #c9b89a)" }}>{money(profit)}</td>
                      <td className="px-5 py-4">
                        <span style={{
                          borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
                          ...(isActive
                            ? { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }
                            : { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }),
                        }}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isDeleting ? (
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Delete?</span>
                            <button onClick={() => executeDelete(service.id)} className={S.btnDanger}>Yes, delete</button>
                            <button onClick={() => setDeletingId(null)} className={S.btnGhost}>Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(service)} className={S.btnGhost}>Edit</button>
                            <button onClick={() => setDeletingId(service.id)} className={S.btnDanger}>Delete</button>
                          </div>
                        )}
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
