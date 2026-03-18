"use client";

import { useEffect, useMemo, useState } from "react";

type Fulfillment = "NEW" | "ORDERED" | "INSTALLED" | "CANCELED";

type Order = {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  service_address?: string | null;
  pipe_height_inches?: string | null;
  pipe_width_inches?: string | null;
  product_key?: string | null;
  rock_color?: string | null;
  stripe_session_id?: string | null;
  notes?: string | null;
  created_at?: string | null;
  ordered_at?: string | null;
  installed_at?: string | null;
  thank_you_sent_at?: string | null;
  fulfillment_status?: Fulfillment | string | null;
  total_amount_cents?: number | null;
  photo_count?: number | null;
  latest_photo_url?: string | null;
};

const S = {
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  btnPrimary: "rounded-lg bg-[var(--accent)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#0e0e0f] transition hover:brightness-110 disabled:opacity-60",
  btnGhost: "rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:opacity-60",
  btnDanger: "rounded-lg border border-red-900/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-400 transition hover:bg-red-900/20 disabled:opacity-60",
};

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}
function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function fmtShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
function cleanProductLabel(value: string | null | undefined) {
  if (!value) return "Order";
  return value.replaceAll("_", " ");
}
function normalizeFulfillment(v: unknown): Fulfillment {
  const s = String(v ?? "NEW").toUpperCase().trim();
  if (s === "NEW" || s === "ORDERED" || s === "INSTALLED" || s === "CANCELED") return s;
  return "NEW";
}
function statusPillStyle(status: Fulfillment): React.CSSProperties {
  if (status === "NEW") return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (status === "ORDERED") return { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (status === "INSTALLED") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (status === "CANCELED") return { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
}

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Fulfillment>("ALL");
  const [colorFilter, setColorFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to load orders");
      setOrders(json.data ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load orders"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const colors = useMemo(() => {
    const unique = new Set<string>();
    for (const o of orders) { const c = String(o.rock_color ?? "").trim(); if (c) unique.add(c); }
    return ["ALL", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = orders.filter((o) => {
      const status = normalizeFulfillment(o.fulfillment_status);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (colorFilter !== "ALL" && String(o.rock_color ?? "") !== colorFilter) return false;
      if (!query) return true;
      const haystack = [o.customer_name, o.customer_email, o.customer_phone, o.client_name, o.client_email, o.client_phone, o.service_address, o.client_address, o.product_key, o.rock_color, o.stripe_session_id, o.notes].map((v) => String(v ?? "").toLowerCase()).join(" • ");
      return haystack.includes(query);
    });
    const priority: Record<Fulfillment, number> = { NEW: 0, ORDERED: 1, INSTALLED: 2, CANCELED: 3 };
    return list.sort((a, b) => {
      const diff = priority[normalizeFulfillment(a.fulfillment_status)] - priority[normalizeFulfillment(b.fulfillment_status)];
      if (diff !== 0) return diff;
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
  }, [orders, statusFilter, colorFilter, search]);

  const stats = useMemo(() => {
    const base = { totalOrders: orders.length, newCount: 0, orderedCount: 0, installedCount: 0, needsAttention: 0, totalRevenue: 0 };
    for (const o of orders) {
      const s = normalizeFulfillment(o.fulfillment_status);
      const amount = typeof o.total_amount_cents === "number" ? o.total_amount_cents : 0;
      if (s === "NEW") base.newCount++;
      if (s === "ORDERED") base.orderedCount++;
      if (s === "INSTALLED") base.installedCount++;
      if (s === "NEW" || s === "ORDERED") base.needsAttention++;
      base.totalRevenue += amount;
    }
    return base;
  }, [orders]);

  async function setFulfillment(orderId: string, next: Fulfillment) {
    setError(""); setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fulfillment_status: next }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update order");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update order"); }
    finally { setBusyId(null); }
  }

  async function sendThankYou(orderId: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to send thank-you");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to send thank-you"); }
  }

  async function deleteOrder(orderId: string) {
    setError("");
    if (!confirm("Delete this order? This cannot be undone.")) return;
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete order");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete order"); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Orders</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Fulfillment dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300 }}>
              Workflow: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>NEW</span> (paid, needs ordering) → <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>ORDERED</span> → <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>INSTALLED</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "NEW", "ORDERED", "INSTALLED", "CANCELED"] as const).map((value) => (
              <button key={value} onClick={() => setStatusFilter(value)}
                style={{ borderRadius: 8, padding: "6px 14px", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s", ...(statusFilter === value ? { background: "var(--accent)", color: "#0e0e0f", border: "1px solid transparent", fontWeight: 600 } : { background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }) }}>
                {value === "ALL" ? "All" : value}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[{ label: "Needs Action", value: stats.needsAttention }, { label: "New", value: stats.newCount }, { label: "Ordered", value: stats.orderedCount }, { label: "Installed", value: stats.installedCount }, { label: "Total Orders", value: stats.totalOrders }, { label: "Revenue", value: money(stats.totalRevenue), accent: true }].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]" style={{ padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: (s as any).accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
          <select className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-primary)]" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
            {colors.map((c) => <option key={c} value={c}>{c === "ALL" ? "All colors" : c}</option>)}
          </select>
          <input className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" placeholder="Search name, email, phone, address, session, product, notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error && <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Orders</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredOrders.length} visible orders`}</div>
          </div>
          <button onClick={load} className={S.btnGhost}>Refresh</button>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="px-7 py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading orders..." : "No orders found."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1600px] w-full text-left">
              <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <tr>{["Photo", "Created", "Customer", "Product", "Color", "Amount", "Status", "Ordered", "Installed", "Thank You", "Actions"].map((h) => (<th key={h} className="px-5 py-4" style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>))}</tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const status = normalizeFulfillment(o.fulfillment_status);
                  const thankYouSent = Boolean(o.thank_you_sent_at);
                  const customerName = o.customer_name || o.client_name || "—";
                  const customerEmail = o.customer_email || o.client_email || "—";
                  const customerPhone = o.customer_phone || o.client_phone || "—";
                  const photoCount = typeof o.photo_count === "number" ? o.photo_count : 0;
                  const isBusy = busyId === o.id;
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }} className="align-top">
                      <td className="px-5 py-5">
                        {o.latest_photo_url ? (
                          <a href={o.latest_photo_url} target="_blank" rel="noreferrer" className="block w-[100px]">
                            <img src={o.latest_photo_url} alt="Order upload" className="h-20 w-20 rounded-xl object-cover" style={{ border: "1px solid var(--border)" }} />
                            <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>{photoCount} photo{photoCount === 1 ? "" : "s"}</div>
                          </a>
                        ) : (
                          <div className="w-[100px]">
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl" style={{ border: "1px dashed var(--border)", background: "var(--surface-2)", fontSize: 11, color: "var(--text-muted)" }}>No photo</div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtShortDate(o.created_at)}</td>
                      <td className="px-5 py-5">
                        <div style={{ maxWidth: 260 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{customerName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>{customerEmail}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{customerPhone}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{o.service_address || o.client_address || "—"}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Pipe: {o.pipe_height_inches || "—"} in × {o.pipe_width_inches || "—"} in</div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{cleanProductLabel(o.product_key)}</div>
                        {o.notes && <div style={{ marginTop: 6, maxWidth: 240, fontSize: 12, color: "var(--text-muted)" }}>{o.notes}</div>}
                      </td>
                      <td className="px-5 py-5" style={{ fontSize: 13, color: "var(--text-secondary)" }}>{o.rock_color || "—"}</td>
                      <td className="px-5 py-5" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent-warm, #c9b89a)" }}>{money(o.total_amount_cents)}</td>
                      <td className="px-5 py-5"><span style={statusPillStyle(status)}>{status}</span></td>
                      <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtDate(o.ordered_at)}</td>
                      <td className="px-5 py-5" style={{ fontSize: 12, color: "var(--text-secondary)" }}>{fmtDate(o.installed_at)}</td>
                      <td className="px-5 py-5">
                        {thankYouSent
                          ? <span style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>Sent</span>
                          : <span style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>Not sent</span>}
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex max-w-[300px] flex-wrap gap-2">
                          {status === "NEW" && <button onClick={() => setFulfillment(o.id, "ORDERED")} disabled={isBusy} className={S.btnPrimary}>{isBusy ? "Working…" : "Mark ordered"}</button>}
                          {status === "ORDERED" && <button onClick={() => setFulfillment(o.id, "INSTALLED")} disabled={isBusy} className={S.btnPrimary}>{isBusy ? "Working…" : "Mark installed"}</button>}
                          {status === "INSTALLED" && <button onClick={() => sendThankYou(o.id)} disabled={isBusy || thankYouSent} className={S.btnGhost}>{thankYouSent ? "Thank-you sent" : isBusy ? "Sending…" : "Send thank-you"}</button>}
                          {(status === "NEW" || status === "ORDERED") && <button onClick={() => setFulfillment(o.id, "CANCELED")} disabled={isBusy} className={S.btnGhost}>Cancel</button>}
                          <button onClick={() => deleteOrder(o.id)} disabled={isBusy} className={S.btnDanger}>Delete</button>
                        </div>
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
