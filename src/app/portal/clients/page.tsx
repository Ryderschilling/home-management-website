"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  property_count?: number;
};

type Property = {
  id?: string;
  client_id?: string | null;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  entry: string;
  irrigationNotes: string;
  accessNotes: string;
  notes: string;
};

type Order = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  product_key?: string | null;
  rock_color?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  service_address?: string | null;
  fulfillment_status?: string | null;
  total_amount_cents?: number | null;
  notes?: string | null;
  created_at?: string | null;
  ordered_at?: string | null;
  installed_at?: string | null;
  thank_you_sent_at?: string | null;
};

type JobPhoto = {
  id: string;
  url: string;
  caption?: string | null;
  uploaded_at?: string | null;
};

type Job = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  order_id?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: string | null;
  scheduled_for?: string | null;
  completed_at?: string | null;
  hours_numeric?: number | null;
  price_cents?: number | null;
  created_at?: string | null;
  photo_count?: number | null;
  photos?: JobPhoto[] | null;
};

type EmailRecord = {
  email: string;
  name: string;
  source: string;
  clientId?: string | null;
};

const emptyProperty = (): Property => ({
  name: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  entry: "",
  irrigationNotes: "",
  accessNotes: "",
  notes: "",
});

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhost: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnGhostLg: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnDanger: "inline-flex items-center justify-center rounded-lg border border-red-900/40 px-4 py-2 text-xs uppercase tracking-[0.22em] text-red-400 transition hover:bg-red-900/20",
};

function money(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function fmtShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function cleanProductLabel(value: string | null | undefined) {
  if (!value) return "Order";
  return value.replaceAll("_", " ");
}

function mapApiProperty(row: any): Property {
  return {
    id: row.id,
    client_id: row.client_id,
    name: row.name ?? "",
    addressLine1: row.address_line1 ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    postalCode: row.postal_code ?? "",
    entry: row.entry ?? row.gate_code ?? row.door_code ?? row.garage_code ?? row.alarm_code ?? "",
    irrigationNotes: row.irrigation_notes ?? "",
    accessNotes: row.access_notes ?? "",
    notes: row.notes ?? "",
  };
}

function propertyPayload(property: Property, clientId: string) {
  return {
    clientId,
    name: property.name,
    addressLine1: property.addressLine1,
    city: property.city || null,
    state: property.state || null,
    postalCode: property.postalCode || null,
    entry: property.entry || null,
    irrigationNotes: property.irrigationNotes || null,
    accessNotes: property.accessNotes || null,
    notes: property.notes || null,
  };
}

function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function statusPillStyle(status: string): React.CSSProperties {
  const s = status.toUpperCase();
  if (s === "NEW") return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: "999px", padding: "2px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "ORDERED") return { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", borderRadius: "999px", padding: "2px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "INSTALLED") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: "999px", padding: "2px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "CANCELED") return { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: "999px", padding: "2px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "999px", padding: "2px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
}

export default function PortalClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [propertyForms, setPropertyForms] = useState<Property[]>([emptyProperty()]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [clientsRes, propertiesRes, ordersRes, jobsRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/properties"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/jobs"),
      ]);
      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();
      const ordersJson = await ordersRes.json();
      const jobsJson = await jobsRes.json();
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      if (!propertiesRes.ok || !propertiesJson.ok) throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      if (!ordersRes.ok || !ordersJson.ok) throw new Error(ordersJson?.error?.message ?? "Failed to load orders");
      if (!jobsRes.ok || !jobsJson.ok) throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      const nextClients = clientsJson.data ?? [];
      setClients(nextClients);
      setProperties(propertiesJson.data ?? []);
      setOrders(ordersJson.data ?? []);
      setJobs(jobsJson.data ?? []);
      if (!selectedClientId && nextClients.length > 0) setSelectedClientId(nextClients[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const propertiesByClient = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const property of properties) {
      const key = property.client_id;
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(property);
      map.set(key, list);
    }
    return map;
  }, [properties]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const clientProperties = propertiesByClient.get(client.id) ?? [];
      const haystack = [client.name, client.email, client.phone, client.notes, ...clientProperties.map((p: any) => p.name), ...clientProperties.map((p: any) => p.address_line1), ...clientProperties.map((p: any) => p.city)]
        .map((v) => String(v ?? "").toLowerCase()).join(" • ");
      return haystack.includes(q);
    });
  }, [clients, propertiesByClient, search]);

  const emailRecords = useMemo(() => {
    const map = new Map<string, EmailRecord>();
    for (const client of clients) {
      const normalized = normalizeEmail(client.email);
      if (!normalized) continue;
      if (!map.has(normalized)) map.set(normalized, { email: normalized, name: client.name || "—", source: "client", clientId: client.id });
    }
    for (const order of orders) {
      const normalized = normalizeEmail(order.customer_email);
      if (!normalized) continue;
      if (!map.has(normalized)) map.set(normalized, { email: normalized, name: order.customer_name || "—", source: "order" });
    }
    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [clients, orders]);

  const selectedClient = filteredClients.find((c) => c.id === selectedClientId) ?? clients.find((c) => c.id === selectedClientId) ?? filteredClients[0] ?? clients[0] ?? null;
  const selectedClientProperties = selectedClient ? propertiesByClient.get(selectedClient.id) ?? [] : [];

  const selectedClientOrders = useMemo(() => {
    if (!selectedClient) return [];
    return orders.filter((o) => o.client_id === selectedClient.id).sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  }, [orders, selectedClient]);

  const selectedClientJobs = useMemo(() => {
    if (!selectedClient) return [];
    return jobs.filter((j) => j.client_id === selectedClient.id).sort((a, b) => new Date(b.scheduled_for ?? 0).getTime() - new Date(a.scheduled_for ?? 0).getTime());
  }, [jobs, selectedClient]);

  const totalProperties = properties.length;
  const selectedClientRevenue = selectedClientOrders.reduce((sum, o) => sum + (typeof o.total_amount_cents === "number" ? o.total_amount_cents : 0), 0);

  function downloadEmailsCsv() {
    const header = ["email", "name", "source"];
    const rows = emailRecords.map((r) => [csvEscape(r.email), csvEscape(r.name), csvEscape(r.source)]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "client-emails.csv";
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }

  async function deleteClientRecord(emailToDelete: string, clientName?: string | null) {
    const normalized = normalizeEmail(emailToDelete);
    const matchingClients = clients.filter((c) => normalizeEmail(c.email) === normalized);
    if (matchingClients.length === 0) { setError("No matching client record found for this email."); return; }
    if (!window.confirm(`Delete ${matchingClients.length} client record(s) for "${clientName || normalized}"?\n\nThis cannot be undone.`)) return;
    setError("");
    try {
      for (const client of matchingClients) {
        const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete client");
        if (selectedClientId === client.id) setSelectedClientId(null);
      }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete client"); }
  }

  function resetForm() { setEditingClientId(null); setName(""); setEmail(""); setPhone(""); setClientNotes(""); setPropertyForms([emptyProperty()]); setShowForm(false); setError(""); }
  function startCreateClient() { setEditingClientId(null); setName(""); setEmail(""); setPhone(""); setClientNotes(""); setPropertyForms([emptyProperty()]); setShowForm(true); setError(""); }
  function addPropertyBlock() { setPropertyForms((prev) => [...prev, emptyProperty()]); }
  function removePropertyBlock(index: number) { setPropertyForms((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index)); }
  function updatePropertyBlock(index: number, key: keyof Property, value: string) { setPropertyForms((prev) => prev.map((p, i) => i === index ? { ...p, [key]: value } : p)); }

  function startEditClient(client: Client) {
    setEditingClientId(client.id); setSelectedClientId(client.id);
    setName(client.name ?? ""); setEmail(client.email ?? ""); setPhone(client.phone ?? ""); setClientNotes(client.notes ?? "");
    const clientProperties = (propertiesByClient.get(client.id) ?? []).map(mapApiProperty);
    setPropertyForms(clientProperties.length > 0 ? clientProperties : [emptyProperty()]);
    setShowForm(true); setError("");
  }

  async function deleteSelectedClient() {
    if (!selectedClient) return;
    if (!window.confirm(`Delete client "${selectedClient.name}"?\n\nThis cannot be undone.`)) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${selectedClient.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete client");
      setSelectedClientId(null);
      if (editingClientId === selectedClient.id) resetForm();
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete client"); }
  }

  async function saveClient() {
    setError("");
    if (!name.trim()) { setError("Client name is required"); return; }
    const validProperties = propertyForms.filter((p) => p.name.trim() || p.addressLine1.trim());
    for (const p of validProperties) {
      if (!p.name.trim()) { setError("Each saved property must have a property name"); return; }
      if (!p.addressLine1.trim()) { setError("Each saved property must have address line 1"); return; }
    }
    let clientId = editingClientId;
    if (editingClientId) {
      const res = await fetch(`/api/admin/clients/${editingClientId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: email || null, phone: phone || null, notes: clientNotes || null }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setError(json?.error?.message ?? "Failed to update client"); return; }
    } else {
      const res = await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: email || null, phone: phone || null, notes: clientNotes || null }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setError(json?.error?.message ?? "Failed to create client"); return; }
      clientId = json.data.id;
    }
    if (!clientId) { setError("Missing client id"); return; }
    const existingIds = new Set((propertiesByClient.get(clientId) ?? []).map((p) => p.id));
    const formIds = new Set(propertyForms.filter((p) => p.id).map((p) => p.id as string));
    for (const existingId of existingIds) { if (!formIds.has(existingId)) await fetch(`/api/admin/properties/${existingId}`, { method: "DELETE" }); }
    for (const p of validProperties) {
      if (p.id) {
        const res = await fetch(`/api/admin/properties/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(propertyPayload(p, clientId)) });
        const json = await res.json();
        if (!res.ok || !json.ok) { setError(json?.error?.message ?? "Failed to update property"); return; }
      } else {
        const res = await fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(propertyPayload(p, clientId)) });
        const json = await res.json();
        if (!res.ok || !json.ok) { setError(json?.error?.message ?? "Failed to create property"); return; }
      }
    }
    await load(); setSelectedClientId(clientId); resetForm();
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Clients</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Client management</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Manage homeowners, properties, notes, purchase history, service history, and your email list from one operator view.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Total clients", value: clients.length }, { label: "Properties", value: totalProperties }, { label: "Saved emails", value: emailRecords.length }].map((s) => (
              <div key={s.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
            <button onClick={() => setShowEmails((p) => !p)} className={S.btnGhostLg}>{showEmails ? "Hide emails" : "View all emails"}</button>
            <button onClick={startCreateClient} className={S.btnPrimary}>Create client</button>
          </div>
        </div>
        <div className="mt-6">
          <input className={S.input} placeholder="Search clients, email, phone, notes, property name, or address..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {showEmails && (
          <div className={`mt-6 ${S.cardInner} p-5`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className={S.label}>Email list</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>All stored customer emails</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Deduplicated from clients and orders.</div>
              </div>
              <button onClick={downloadEmailsCsv} className={S.btnPrimary}>Download CSV</button>
            </div>
            {emailRecords.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 16 }}>No emails saved yet.</div>
            ) : (
              <div className="mt-4 max-h-[320px] overflow-y-auto rounded-xl border border-[var(--border)]">
                <table className="min-w-full text-left">
                  <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-3)" }}>
                    <tr>
                      {["Email", "Name", "Source", "Action"].map((h) => (
                        <th key={h} className="px-4 py-3" style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emailRecords.map((r) => (
                      <tr key={r.email} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "var(--text-primary)" }}>{r.email}</td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.name}</td>
                        <td className="px-4 py-3" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.source}</td>
                        <td className="px-4 py-3 text-right">
                          {r.clientId ? <button onClick={() => deleteClientRecord(r.clientId as string, r.name)} className={S.btnDanger}>Delete</button> : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {error && <div className="mt-6 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className={`${S.card} overflow-hidden`}>
          <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>All clients</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredClients.length} visible clients`}</div>
          </div>
          {filteredClients.length === 0 ? (
            <div className="px-6 py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading clients..." : "No clients found."}</div>
          ) : (
            <div className="max-h-[820px] overflow-y-auto">
              {filteredClients.map((client) => {
                const isActive = selectedClient?.id === client.id;
                const clientProperties = propertiesByClient.get(client.id) ?? [];
                return (
                  <button key={client.id} onClick={() => setSelectedClientId(client.id)} className="block w-full text-left transition"
                    style={{ borderBottom: "1px solid var(--border)", padding: "18px 24px", background: isActive ? "var(--surface-2)" : "transparent" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{client.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{client.email || "No email saved"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{client.phone || "No phone saved"}</div>
                      </div>
                      <span style={{ flexShrink: 0, border: "1px solid var(--border)", borderRadius: 999, padding: "2px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--surface-3)" }}>
                        {clientProperties.length} {clientProperties.length === 1 ? "property" : "properties"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {showForm && (
            <section className={`${S.card} p-7`}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>{editingClientId ? "Edit client" : "Create client"}</h2>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>Save the homeowner first, then attach one or more managed properties.</p>
                </div>
                <button onClick={resetForm} className={S.btnGhost}>Close</button>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[{ label: "Client name", val: name, set: setName, placeholder: "Full client name" }, { label: "Phone", val: phone, set: setPhone, placeholder: "Phone" }, { label: "Email", val: email, set: setEmail, placeholder: "Email" }].map((f) => (
                  <div key={f.label} className="space-y-2">
                    <label className={S.label}>{f.label}</label>
                    <input className={S.input} placeholder={f.placeholder} value={f.val} onChange={(e) => f.set(e.target.value)} />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <label className={S.label}>Client notes</label>
                  <textarea className={`${S.input} min-h-[100px] resize-none`} placeholder="Billing notes, homeowner preferences, general reminders..." value={clientNotes} onChange={(e) => setClientNotes(e.target.value)} />
                </div>
              </div>
              <div className="mt-8 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className={S.label}>Properties</div>
                    <h3 style={{ fontFamily: "var(--font-serif), serif", fontSize: 18, color: "var(--text-primary)", marginTop: 4 }}>Managed homes under this client</h3>
                  </div>
                  <button onClick={addPropertyBlock} className={S.btnGhost}>Add property</button>
                </div>
                {propertyForms.map((property, index) => (
                  <div key={property.id ?? `new-${index}`} className={S.cardInner} style={{ padding: 20 }}>
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>Property {index + 1}</div>
                      {propertyForms.length > 1 && <button onClick={() => removePropertyBlock(index)} className={S.btnDanger}>Remove</button>}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[{ label: "Property name", key: "name" as keyof Property, placeholder: "Beach house, Main home..." }, { label: "Address line 1", key: "addressLine1" as keyof Property, placeholder: "123 Example St" }, { label: "City", key: "city" as keyof Property, placeholder: "" }].map((f) => (
                        <div key={f.key} className="space-y-2">
                          <label className={S.label}>{f.label}</label>
                          <input className={S.input} value={property[f.key] as string} onChange={(e) => updatePropertyBlock(index, f.key, e.target.value)} placeholder={f.placeholder} />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-4">
                        {[{ label: "State", key: "state" as keyof Property }, { label: "ZIP", key: "postalCode" as keyof Property }].map((f) => (
                          <div key={f.key} className="space-y-2">
                            <label className={S.label}>{f.label}</label>
                            <input className={S.input} value={property[f.key] as string} onChange={(e) => updatePropertyBlock(index, f.key, e.target.value)} />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className={S.label}>Entry</label>
                        <input className={S.input} value={property.entry} onChange={(e) => updatePropertyBlock(index, "entry", e.target.value)} placeholder="Gate code, door code, lockbox, key location..." />
                      </div>
                      {[{ label: "Access notes", key: "accessNotes" as keyof Property, placeholder: "Gate instructions, which door to use, arrival steps..." }, { label: "Irrigation notes", key: "irrigationNotes" as keyof Property, placeholder: "" }, { label: "Property notes", key: "notes" as keyof Property, placeholder: "House specifics, systems, quirks, vendor info..." }].map((f) => (
                        <div key={f.key} className="space-y-2 md:col-span-2">
                          <label className={S.label}>{f.label}</label>
                          <textarea className={`${S.input} min-h-[90px] resize-none`} value={property[f.key] as string} onChange={(e) => updatePropertyBlock(index, f.key, e.target.value)} placeholder={f.placeholder} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={saveClient} className={S.btnPrimary}>{editingClientId ? "Save client changes" : "Save client"}</button>
                <button onClick={resetForm} className={S.btnGhostLg}>Cancel</button>
              </div>
            </section>
          )}

          <section className={`${S.card} p-7`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={S.label} style={{ marginBottom: 4 }}>Client detail</div>
                <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>{selectedClient ? selectedClient.name : "No client selected"}</h2>
              </div>
              {selectedClient && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => startEditClient(selectedClient)} className={S.btnGhost}>Edit client</button>
                  <button onClick={deleteSelectedClient} className={S.btnDanger}>Delete client</button>
                </div>
              )}
            </div>
            {!selectedClient ? (
              <div style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>Select a client to view details.</div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[{ label: "Email", value: selectedClient.email || "No email saved" }, { label: "Phone", value: selectedClient.phone || "No phone saved" }, { label: "Properties", value: selectedClientProperties.length }, { label: "Revenue to Date", value: money(selectedClientRevenue) }].map((f) => (
                    <div key={f.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                      <div className={S.label}>{f.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className={S.label} style={{ marginBottom: 6 }}>Client notes</div>
                  <div className={S.cardInner} style={{ padding: "14px 16px", fontSize: 13, lineHeight: 1.6, color: selectedClient.notes ? "var(--text-secondary)" : "var(--text-muted)" }}>{selectedClient.notes || "No notes saved for this client."}</div>
                </div>
                <div className="mt-8">
                  <div className={S.label}>Properties</div>
                  <h3 style={{ fontFamily: "var(--font-serif), serif", fontSize: 18, color: "var(--text-primary)", marginTop: 4, marginBottom: 12 }}>Managed homes</h3>
                  {selectedClientProperties.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No properties saved under this client yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {selectedClientProperties.map((p: any) => (
                        <div key={p.id} className={S.cardInner} style={{ padding: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{p.address_line1}{p.city ? `, ${p.city}` : ""}{p.state ? `, ${p.state}` : ""}{p.postal_code ? ` ${p.postal_code}` : ""}</div>
                          {[{ label: "Entry", value: p.entry || p.gate_code || p.door_code || p.garage_code || p.alarm_code || "—" }, { label: "Access notes", value: p.access_notes || "—" }, { label: "Irrigation notes", value: p.irrigation_notes || "—" }, { label: "Property notes", value: p.notes || "—" }].map((f) => (
                            <div key={f.label} style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}><span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{f.label}:</span> {f.value}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <div className={S.label}>Purchase history</div>
                  <h3 style={{ fontFamily: "var(--font-serif), serif", fontSize: 18, color: "var(--text-primary)", marginTop: 4, marginBottom: 12 }}>Orders and purchases</h3>
                  {selectedClientOrders.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No purchases saved for this client yet.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                      <table className="min-w-full text-left">
                        <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                          <tr>
                            {["Date", "Product", "Color", "Amount", "Status", "Installed", "Notes"].map((h) => (
                              <th key={h} className="px-4 py-3" style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClientOrders.map((o) => (
                            <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }} className="align-top">
                              <td className="px-4 py-4" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtShortDate(o.created_at)}</td>
                              <td className="px-4 py-4" style={{ fontSize: 12, color: "var(--text-primary)" }}>{cleanProductLabel(o.product_key)}</td>
                              <td className="px-4 py-4" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{o.rock_color || "—"}</td>
                              <td className="px-4 py-4" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{money(o.total_amount_cents)}</td>
                              <td className="px-4 py-4"><span style={statusPillStyle(o.fulfillment_status || "NEW")}>{o.fulfillment_status || "—"}</span></td>
                              <td className="px-4 py-4" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtDate(o.installed_at)}</td>
                              <td className="px-4 py-4" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{o.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <div className={S.label}>Service history</div>
                  <h3 style={{ fontFamily: "var(--font-serif), serif", fontSize: 18, color: "var(--text-primary)", marginTop: 4, marginBottom: 12 }}>Jobs, visits, notes, and photos</h3>
                  {selectedClientJobs.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No jobs or service history saved for this client yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {selectedClientJobs.map((job) => {
                        const photos = Array.isArray(job.photos) ? job.photos : [];
                        const photoCount = typeof job.photo_count === "number" ? job.photo_count : photos.length;
                        return (
                          <div key={job.id} className={S.cardInner} style={{ padding: 16 }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{job.title || "Untitled job"}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Scheduled: {fmtDate(job.scheduled_for)}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Completed: {fmtDate(job.completed_at)}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Status: {job.status || "—"}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Price: {money(job.price_cents)}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Hours: {job.hours_numeric ?? "—"}</div>
                                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3" style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
                                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Service notes:</span> {job.notes || "No notes saved for this service."}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>Photos attached: {photoCount}</div>
                                {photos.length > 0 && (
                                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {photos.map((photo) => (
                                      <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-[var(--border)]">
                                        <img src={photo.url} alt={photo.caption || "Job photo"} className="h-32 w-full object-cover" />
                                        <div className="px-3 py-2" style={{ fontSize: 11, color: "var(--text-muted)" }}>{photo.caption || "View photo"}</div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {job.order_id && <span style={{ flexShrink: 0, border: "1px solid var(--border)", borderRadius: 999, padding: "2px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Linked to order</span>}
                                {photoCount > 0 && <span style={{ flexShrink: 0, border: "1px solid rgba(74,222,128,0.25)", borderRadius: 999, padding: "2px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4ade80", background: "rgba(74,222,128,0.1)" }}>{photoCount} photo{photoCount === 1 ? "" : "s"}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
