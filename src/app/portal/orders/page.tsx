"use client";

import { useEffect, useMemo, useState } from "react";

type Fulfillment = "NEW" | "ORDERED" | "INSTALLED" | "CANCELED";

function money(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function badgeClass(active: boolean) {
  return [
    "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition",
    active
      ? "border-stone-900 bg-stone-900 text-white"
      : "border-stone-300 text-stone-700 hover:bg-stone-100",
  ].join(" ");
}

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<"ALL" | Fulfillment>("ALL");
  const [color, setColor] = useState<string>("ALL");
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/admin/orders");
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to load orders");
    setOrders(json.data ?? []);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders"));
  }, []);

  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) {
      const c = String(o.rock_color ?? "").trim();
      if (c) set.add(c);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [orders]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return orders.filter((o) => {
      const fs = String(o.fulfillment_status ?? "NEW").toUpperCase();
      if (tab !== "ALL" && fs !== tab) return false;

      const c = String(o.rock_color ?? "");
      if (color !== "ALL" && c !== color) return false;

      if (!qq) return true;

      const hay = [
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.service_address,
        o.stripe_session_id,
        o.rock_color,
        o.product_key,
      ]
        .map((x: any) => String(x ?? "").toLowerCase())
        .join(" • ");

      return hay.includes(qq);
    });
  }, [orders, tab, color, q]);

  const stats = useMemo(() => {
    const s = { NEW: 0, ORDERED: 0, INSTALLED: 0, CANCELED: 0 };
    for (const o of orders) {
      const fs = String(o.fulfillment_status ?? "NEW").toUpperCase();
      if (fs in s) (s as any)[fs] += 1;
    }
    return s;
  }, [orders]);

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, o) => sum + (o.total_amount_cents ?? 0), 0),
    [filtered]
  );

  async function setFulfillment(orderId: string, next: Fulfillment) {
    setError("");
    // optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, fulfillment_status: next } : o))
    );

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillment_status: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update order");
      // refresh from server (keeps timestamps correct)
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order");
      await load();
    }
  }

  async function sendThankYou(orderId: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_THANK_YOU" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to send thank-you");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send thank-you");
    }
  }

  function nextAction(fs: string): Fulfillment | null {
    const s = fs.toUpperCase();
    if (s === "NEW") return "ORDERED";
    if (s === "ORDERED") return "INSTALLED";
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Orders
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Fulfillment dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Workflow: <span className="font-medium">NEW</span> (paid, needs ordering) →{" "}
              <span className="font-medium">ORDERED</span> →{" "}
              <span className="font-medium">INSTALLED</span> → send thank-you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Needs action
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.NEW}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Ordered
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.ORDERED}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Installed
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.INSTALLED}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(["NEW", "ORDERED", "INSTALLED", "CANCELED", "ALL"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={badgeClass(tab === k)}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="text-xs uppercase tracking-[0.22em] text-stone-500">
              Color
            </div>
            <select
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              className="w-full sm:w-[420px] rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              placeholder="Search name, email, phone, address, session, color…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
              Revenue: <span className="font-semibold text-stone-900">{money(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-10 text-sm text-stone-500">
            No orders found.
          </div>
        ) : null}

        <div className="space-y-4">
          {filtered.map((o) => {
            const fs = String(o.fulfillment_status ?? "NEW").toUpperCase();
            const next = nextAction(fs);
            const thankYouSent = Boolean(o.thank_you_sent_at);

            return (
              <div
                key={o.id}
                className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-medium text-stone-900">
                        {o.product_key ? String(o.product_key).replaceAll("_", " ") : "Order"}
                      </div>

                      <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                        {fs}
                      </div>

                      {o.rock_color ? (
                        <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                          color: {o.rock_color}
                        </div>
                      ) : null}

                      {thankYouSent ? (
                        <div className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-green-700">
                          thank-you sent
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-2 text-sm text-stone-600">
                      <span className="font-medium text-stone-800">
                        {o.customer_name || o.client_name || "—"}
                      </span>
                      {(o.customer_email || o.client_email) ? (
                        <> • {o.customer_email || o.client_email}</>
                      ) : null}
                      {(o.customer_phone || o.client_phone) ? (
                        <> • {o.customer_phone || o.client_phone}</>
                      ) : null}
                    </div>

                    {(o.service_address || o.client_address) ? (
                      <div className="mt-2 text-sm text-stone-700">
                        <span className="font-medium">Address:</span>{" "}
                        {o.service_address || o.client_address}
                      </div>
                    ) : null}

                    <div className="mt-2 text-xs text-stone-500">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                      {o.stripe_session_id ? ` • Stripe: ${o.stripe_session_id}` : ""}
                    </div>

                    {o.notes ? (
                      <div className="mt-3 text-sm leading-6 text-stone-700">
                        {o.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:items-end">
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-right">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                        Total
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {money(o.total_amount_cents)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {next ? (
                        <button
                          onClick={() => setFulfillment(o.id, next)}
                          className="rounded-full bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-stone-700"
                        >
                          Mark {next}
                        </button>
                      ) : null}

                      {fs !== "CANCELED" ? (
                        <button
                          onClick={() => setFulfillment(o.id, "CANCELED")}
                          className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                      ) : null}

                      <button
                        onClick={() => sendThankYou(o.id)}
                        disabled={fs !== "INSTALLED" || thankYouSent}
                        className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
                      >
                        Send thank-you
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}