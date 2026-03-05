"use client";

import { useEffect, useState } from "react";

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/orders");
    const json = await res.json();
    setOrders(json.data ?? []);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load orders"));
  }, []);

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (order.total_amount_cents ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Orders
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Order history
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Review saved order totals, status, notes, and basic item counts in one
              place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Total orders
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {orders.length}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Total value
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                ${(totalRevenue / 100).toFixed(2)}
              </div>
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
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Ledger
          </div>
          <h2 className="mt-2 font-serif text-2xl text-stone-900">Saved orders</h2>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-10 text-sm text-stone-500">
            No orders yet.
          </div>
        ) : null}

        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-lg font-medium text-stone-900">
                      {o.status}
                    </div>
                    <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                      {o.items?.length ?? 0} item(s)
                    </div>
                  </div>

                  {o.notes ? (
                    <div className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
                      {o.notes}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-stone-500">
                      No notes on this order.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-right">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Total
                  </div>
                  <div className="mt-1 text-lg font-semibold text-stone-900">
                    ${(o.total_amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}