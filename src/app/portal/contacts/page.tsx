"use client";

import { useEffect, useMemo, useState } from "react";

type Client = { id: string; name: string; email?: string | null; phone?: string | null; };
type Order = { id: string; client_id?: string | null; customer_name?: string | null; customer_email?: string | null; customer_phone?: string | null; total_amount_cents?: number | null; created_at?: string | null; fulfillment_status?: string | null; };
type ContactRow = { email: string; name: string; phone: string; source: "CLIENT" | "ORDER" | "CLIENT+ORDER"; totalSpendCents: number; orderCount: number; lastOrderDate: string | null; };

function money(cents: number | null | undefined) { return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`; }
function fmtDate(value: string | null | undefined) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); }
function csvEscape(value: string) { const v = value ?? ""; return (v.includes(",") || v.includes('"') || v.includes("\n")) ? `"${v.replace(/"/g, '""')}"` : v; }

export default function PortalContactsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [clientsRes, ordersRes] = await Promise.all([fetch("/api/admin/clients"), fetch("/api/admin/orders")]);
      const clientsJson = await clientsRes.json();
      const ordersJson = await ordersRes.json();
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      if (!ordersRes.ok || !ordersJson.ok) throw new Error(ordersJson?.error?.message ?? "Failed to load orders");
      setClients(clientsJson.data ?? []); setOrders(ordersJson.data ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load contacts"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const contacts = useMemo(() => {
    const map = new Map<string, ContactRow>();
    for (const client of clients) {
      const email = String(client.email ?? "").trim().toLowerCase();
      if (!email) continue;
      map.set(email, { email, name: client.name?.trim() || "—", phone: client.phone?.trim() || "—", source: "CLIENT", totalSpendCents: 0, orderCount: 0, lastOrderDate: null });
    }
    for (const order of orders) {
      const email = String(order.customer_email ?? "").trim().toLowerCase();
      if (!email) continue;
      const existing = map.get(email);
      const orderAmount = typeof order.total_amount_cents === "number" ? order.total_amount_cents : 0;
      const orderDate = order.created_at ?? null;
      if (!existing) { map.set(email, { email, name: String(order.customer_name ?? "").trim() || "—", phone: String(order.customer_phone ?? "").trim() || "—", source: "ORDER", totalSpendCents: orderAmount, orderCount: 1, lastOrderDate: orderDate }); continue; }
      const nextName = existing.name === "—" && String(order.customer_name ?? "").trim() ? String(order.customer_name ?? "").trim() : existing.name;
      const nextPhone = existing.phone === "—" && String(order.customer_phone ?? "").trim() ? String(order.customer_phone ?? "").trim() : existing.phone;
      const existingTime = existing.lastOrderDate ? new Date(existing.lastOrderDate).getTime() : 0;
      const incomingTime = orderDate ? new Date(orderDate).getTime() : 0;
      map.set(email, { ...existing, name: nextName, phone: nextPhone, source: existing.source === "CLIENT" ? "CLIENT+ORDER" : existing.source, totalSpendCents: existing.totalSpendCents + orderAmount, orderCount: existing.orderCount + 1, lastOrderDate: incomingTime > existingTime ? orderDate : existing.lastOrderDate });
    }
    return Array.from(map.values()).sort((a, b) => (b.totalSpendCents ?? 0) - (a.totalSpendCents ?? 0) || a.email.localeCompare(b.email));
  }, [clients, orders]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => [c.name, c.email, c.phone, c.source, String(c.orderCount)].map((v) => String(v ?? "").toLowerCase()).join(" • ").includes(q));
  }, [contacts, search]);

  const stats = useMemo(() => ({
    totalContacts: contacts.length,
    buyers: contacts.filter((c) => c.orderCount > 0).length,
    totalRevenue: contacts.reduce((sum, c) => sum + (c.totalSpendCents ?? 0), 0),
  }), [contacts]);

  function downloadCsv() {
    const rows = [["Name", "Email", "Phone", "Source", "Order Count", "Total Spend", "Last Order Date"], ...filteredContacts.map((c) => [c.name, c.email, c.phone, c.source, String(c.orderCount), (c.totalSpendCents / 100).toFixed(2), c.lastOrderDate ?? ""])];
    const csv = rows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "contacts-export.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Contacts</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Email list</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>View all known customer and client emails in one place and export them for outreach.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Total contacts", value: stats.totalContacts }, { label: "Buyers", value: stats.buyers }, { label: "Revenue tracked", value: money(stats.totalRevenue), accent: true }].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]" style={{ padding: "16px 20px" }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: (s as any).accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
            <button onClick={downloadCsv} className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110">Download CSV</button>
          </div>
        </div>
        <div className="mt-6">
          <input className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none" placeholder="Search name, email, phone, source..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error && <div className="mt-6 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Contacts</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredContacts.length} visible contacts`}</div>
        </div>
        {filteredContacts.length === 0 ? (
          <div className="px-5 py-8 sm:px-7 sm:py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading contacts..." : "No contacts found."}</div>
        ) : (
          <div className="portal-table-scroll">
            <table className="min-w-[860px] w-full text-left md:min-w-[1100px]">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <tr>{["Name", "Email", "Phone", "Source", "Orders", "Total Spend", "Last Order"].map((h) => (<th key={h} className="px-5 py-4" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.email} style={{ borderBottom: "1px solid var(--border)" }} className="align-top">
                    <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{contact.name}</td>
                    <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{contact.email}</td>
                    <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{contact.phone}</td>
                    <td className="px-5 py-5"><span style={{ border: "1px solid var(--border)", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--surface-2)" }}>{contact.source}</span></td>
                    <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{contact.orderCount}</td>
                    <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-warm, #c9b89a)" }}>{money(contact.totalSpendCents)}</td>
                    <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{fmtDate(contact.lastOrderDate)}</td>
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
