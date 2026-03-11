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

function normalizeFulfillment(v: unknown): Fulfillment {
  const s = String(v ?? "NEW").toUpperCase().trim();
  if (s === "NEW" || s === "ORDERED" || s === "INSTALLED" || s === "CANCELED") return s;
  return "NEW";
}

function statusPillClass(status: Fulfillment) {
  if (status === "NEW") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "ORDERED") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "INSTALLED") return "border-green-200 bg-green-50 text-green-800";
  if (status === "CANCELED") return "border-red-200 bg-red-50 text-red-800";
  return "border-stone-200 bg-stone-50 text-stone-700";
}

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
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
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to load orders");
      setOrders(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const colors = useMemo(() => {
    const unique = new Set<string>();
    for (const o of orders) {
      const c = String(o.rock_color ?? "").trim();
      if (c) unique.add(c);
    }
    return ["ALL", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    const list = orders.filter((o) => {
      const status = normalizeFulfillment(o.fulfillment_status);

      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      const color = String(o.rock_color ?? "");
      if (colorFilter !== "ALL" && color !== colorFilter) return false;

      if (!query) return true;

      const haystack = [
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.client_name,
        o.client_email,
        o.client_phone,
        o.service_address,
        o.client_address,
        o.product_key,
        o.rock_color,
        o.stripe_session_id,
        o.notes,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" • ");

      return haystack.includes(query);
    });

    const priority: Record<Fulfillment, number> = {
      NEW: 0,
      ORDERED: 1,
      INSTALLED: 2,
      CANCELED: 3,
    };

    return list.sort((a, b) => {
      const aS = normalizeFulfillment(a.fulfillment_status);
      const bS = normalizeFulfillment(b.fulfillment_status);

      const diff = priority[aS] - priority[bS];
      if (diff !== 0) return diff;

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [orders, statusFilter, colorFilter, search]);

  const stats = useMemo(() => {
    const base = {
      totalOrders: orders.length,
      newCount: 0,
      orderedCount: 0,
      installedCount: 0,
      canceledCount: 0,
      needsAttention: 0,
      totalRevenue: 0,
      estimatedProfit: 0,
    };

    for (const o of orders) {
      const s = normalizeFulfillment(o.fulfillment_status);
      const amount = typeof o.total_amount_cents === "number" ? o.total_amount_cents : 0;

      if (s === "NEW") base.newCount += 1;
      if (s === "ORDERED") base.orderedCount += 1;
      if (s === "INSTALLED") base.installedCount += 1;
      if (s === "CANCELED") base.canceledCount += 1;

      if (s === "NEW" || s === "ORDERED") base.needsAttention += 1;

      base.totalRevenue += amount;
    }

    // placeholder estimate, replace later once you store costs in DB
    base.estimatedProfit = Math.round(base.totalRevenue * 0.55);

    return base;
  }, [orders]);

  async function setFulfillment(orderId: string, next: Fulfillment) {
    setError("");
    setBusyId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillment_status: next }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update order");

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setBusyId(null);
    }
  }

  // ✅ Send thank-you via POST (matches the API route I gave you)
  async function sendThankYou(orderId: string) {
    setError("");
    setBusyId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to send thank-you");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send thank-you");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOrder(orderId: string) {
    setError("");

    const ok = confirm("Delete this order? This cannot be undone.");
    if (!ok) return;

    setBusyId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete order");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete order");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Orders
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Fulfillment dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Workflow: <span className="font-medium text-stone-800">NEW</span> (paid, needs ordering) →{" "}
              <span className="font-medium text-stone-800">ORDERED</span> →{" "}
              <span className="font-medium text-stone-800">INSTALLED</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "NEW", "ORDERED", "INSTALLED", "CANCELED"] as const).map((value) => {
              const active = statusFilter === value;

              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={[
                    "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition",
                    active
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300 text-stone-700 hover:bg-stone-100",
                  ].join(" ")}
                >
                  {value === "ALL" ? "All" : value}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Needs Action</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.needsAttention}</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">New</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.newCount}</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Ordered</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.orderedCount}</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Installed</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.installedCount}</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Total Orders</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.totalOrders}</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Revenue</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{money(stats.totalRevenue)}</div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Est. Profit</div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">{money(stats.estimatedProfit)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
          <select
            className="rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900"
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
          >
            {colors.map((color) => (
              <option key={color} value={color}>
                {color === "ALL" ? "All colors" : color}
              </option>
            ))}
          </select>

          <input
            className="rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900"
            placeholder="Search name, email, phone, address, session, product, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className={cardClass()}>
        <div className="border-b border-stone-200 px-7 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Orders</h2>
              <p className="text-sm text-stone-500">
                {loading ? "Loading..." : `${filteredOrders.length} visible orders`}
              </p>
            </div>

            <button
              onClick={load}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-7 py-10 text-sm text-stone-500">
            {loading ? "Loading orders..." : "No orders found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1680px] w-full text-left">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  <th className="px-5 py-4 font-medium">Photo</th>
                  <th className="px-5 py-4 font-medium">Created</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-5 py-4 font-medium">Color</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Ordered</th>
                  <th className="px-5 py-4 font-medium">Installed</th>
                  <th className="px-5 py-4 font-medium">Thank You</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
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
                    <tr key={o.id} className="border-b border-stone-100 align-top">
                      <td className="px-5 py-5">
                        {o.latest_photo_url ? (
                          <a
                            href={o.latest_photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-[120px]"
                          >
                            <img
                              src={o.latest_photo_url}
                              alt="Order upload"
                              className="h-24 w-24 rounded-2xl border border-stone-200 object-cover shadow-sm"
                            />
                            <div className="mt-2 text-xs text-stone-500">
                              {photoCount} photo{photoCount === 1 ? "" : "s"}
                            </div>
                          </a>
                        ) : (
                          <div className="w-[120px]">
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 text-xs text-stone-400">
                              No photo
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-5 text-sm text-stone-700">
                        {fmtShortDate(o.created_at)}
                        <div className="mt-2 text-xs text-stone-500">{o.stripe_session_id ? `Stripe: ${o.stripe_session_id}` : ""}</div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="max-w-[280px]">
                          <div className="font-medium text-stone-900">{customerName}</div>
                          <div className="mt-1 text-sm text-stone-600">{customerEmail}</div>
                          <div className="mt-1 text-sm text-stone-600">{customerPhone}</div>
                          <div className="mt-2 text-sm text-stone-500">
                            {o.service_address || o.client_address || "—"}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-sm text-stone-700">
                        <div className="font-medium text-stone-900">
                          {cleanProductLabel(o.product_key)}
                        </div>
                        {o.notes ? (
                          <div className="mt-2 max-w-[260px] text-sm text-stone-500">
                            {o.notes}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-5 py-5 text-sm text-stone-700">{o.rock_color || "—"}</td>

                      <td className="px-5 py-5 text-sm font-medium text-stone-900">
                        {money(o.total_amount_cents)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusPillClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-sm text-stone-700">{fmtDate(o.ordered_at)}</td>
                      <td className="px-5 py-5 text-sm text-stone-700">{fmtDate(o.installed_at)}</td>

                      <td className="px-5 py-5 text-sm text-stone-700">
                        {thankYouSent ? (
                          <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-green-800">
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-stone-600">
                            Not sent
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex max-w-[320px] flex-wrap gap-2">
                          {status === "NEW" ? (
                            <button
                              onClick={() => setFulfillment(o.id, "ORDERED")}
                              disabled={isBusy}
                              className="rounded-full bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-stone-700 disabled:opacity-60"
                            >
                              {isBusy ? "Working…" : "Mark ordered"}
                            </button>
                          ) : null}

                          {status === "ORDERED" ? (
                            <button
                              onClick={() => setFulfillment(o.id, "INSTALLED")}
                              disabled={isBusy}
                              className="rounded-full bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-stone-700 disabled:opacity-60"
                            >
                              {isBusy ? "Working…" : "Mark installed"}
                            </button>
                          ) : null}

                          {status === "INSTALLED" ? (
                            <button
                              onClick={() => sendThankYou(o.id)}
                              disabled={isBusy || thankYouSent}
                              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {thankYouSent ? "Thank-you sent" : isBusy ? "Sending…" : "Send thank-you"}
                            </button>
                          ) : null}

                          {(status === "NEW" || status === "ORDERED") ? (
                            <button
                              onClick={() => setFulfillment(o.id, "CANCELED")}
                              disabled={isBusy}
                              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          ) : null}

                          <button
                            onClick={() => deleteOrder(o.id)}
                            disabled={isBusy}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            Delete
                          </button>
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