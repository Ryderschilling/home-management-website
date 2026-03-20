"use client";

import { useEffect, useState } from "react";

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
};

export default function PortalPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [clientId, setClientId] = useState("");

  async function loadAll() {
    const [p, c] = await Promise.all([fetch("/api/admin/properties"), fetch("/api/admin/clients")]);
    const pj = await p.json();
    const cj = await c.json();
    setProperties(pj.data ?? []);
    setClients(cj.data ?? []);
  }

  useEffect(() => { loadAll().catch(() => setError("Failed to load")); }, []);

  async function createProperty() {
    setError("");
    const res = await fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, addressLine1, clientId: clientId || null }) });
    const json = await res.json();
    if (!res.ok || !json.ok) return setError(json?.error?.message ?? "Failed to create property");
    setName(""); setAddressLine1(""); setClientId("");
    await loadAll();
  }

  function clientName(id: string | null) {
    if (!id) return "Unassigned";
    return clients.find((c: any) => c.id === id)?.name ?? "Unassigned";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Properties</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Property records</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Save the homes you manage and tie each property to the correct client record for long-term history.</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]" style={{ padding: "16px 20px" }}>
            <div className={S.label}>Total properties</div>
            <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 26, color: "var(--text-primary)", marginTop: 8 }}>{properties.length}</div>
          </div>
        </div>
        {error && <div className="mt-6 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
        <div className="mb-6">
          <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Add property</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>Save the home name, address, and optional client assignment.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2"><label className={S.label}>Property name</label><input className={S.input} placeholder="Property name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><label className={S.label}>Address line 1</label><input className={S.input} placeholder="Address line 1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} /></div>
        </div>
        <div className="mt-5 space-y-2">
          <label className={S.label}>Client</label>
          <select className={S.input} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Client (optional)</option>
            {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="mt-6">
          <button onClick={createProperty} className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110">Save property</button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className={S.label} style={{ marginBottom: 6 }}>Portfolio</div>
          <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Saved properties</h2>
        </div>
        {properties.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>No properties yet.</div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {properties.map((p) => (
            <div key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{p.address_line1}</div>
              <div style={{ marginTop: 12, display: "inline-block", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>{clientName(p.client_id)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
