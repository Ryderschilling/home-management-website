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

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-0";
}

function labelClassName() {
  return "text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500";
}

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
}

function money(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
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
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to load services");
      }

      setServices(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return services;

    return services.filter((service) => {
      const haystack = [
        service.name,
        service.description,
        service.active ? "active" : "inactive",
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" • ");

      return haystack.includes(q);
    });
  }, [services, search]);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.active !== false).length;
    const inactive = total - active;

    const totalPrice = services.reduce((sum, s) => sum + (s.unit_price_cents ?? 0), 0);
    const totalCost = services.reduce((sum, s) => sum + (s.cost_cents ?? 0), 0);
    const avgPrice = total > 0 ? Math.round(totalPrice / total) : 0;
    const avgMargin = total > 0 ? Math.round((totalPrice - totalCost) / total) : 0;

    return {
      total,
      active,
      inactive,
      avgPrice,
      avgMargin,
    };
  }, [services]);

  async function createService() {
    setError("");

    if (!name.trim()) {
      setError("Service name is required");
      return;
    }

    const unitPriceCents = Math.round(Number(unitPrice) * 100);
    const costCents = cost.trim() === "" ? 0 : Math.round(Number(cost) * 100);

    if (Number.isNaN(unitPriceCents) || unitPriceCents <= 0) {
      setError("Price must be a number greater than 0");
      return;
    }

    if (Number.isNaN(costCents) || costCents < 0) {
      setError("Cost must be a number 0 or greater");
      return;
    }

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          unitPriceCents,
          costCents,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to create service");
      }

      setName("");
      setUnitPrice("");
      setCost("");
      setDescription("");
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create service");
    }
  }

  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Services
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Service management
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Manage pricing, cost basis, and margin visibility from one clean service catalog.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Total services
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.total}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Active
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.active}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Avg. price
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {money(stats.avgPrice)}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Avg. margin
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {money(stats.avgMargin)}
              </div>
            </div>

            <button
              onClick={() => {
                setShowForm((prev) => !prev);
                setError("");
              }}
              className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              {showForm ? "Close form" : "Create service"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <input
            className={inputClassName()}
            placeholder="Search services by name or description..."
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

      {showForm ? (
        <section className={`${cardClass()} p-7`}>
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-stone-900">Create service</h2>
            <p className="mt-1 text-sm text-stone-500">
              Set the sale price and true cost so margin stays visible.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClassName()}>Service name</label>
              <input
                className={inputClassName()}
                placeholder="Service name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Price (USD)</label>
              <input
                className={inputClassName()}
                placeholder="e.g. 250"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Cost (USD)</label>
              <input
                className={inputClassName()}
                placeholder="e.g. 120"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className={labelClassName()}>Description</label>
              <textarea
                className={`${inputClassName()} min-h-[100px] resize-none`}
                placeholder="Optional notes about what is included"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={createService}
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              Save service
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-stone-700 transition hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <section className={cardClass()}>
        <div className="border-b border-stone-200 px-7 py-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Services</h2>
            <p className="text-sm text-stone-500">
              {loading ? "Loading..." : `${filteredServices.length} visible services`}
            </p>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="px-7 py-10 text-sm text-stone-500">
            {loading ? "Loading services..." : "No services found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  <th className="px-5 py-4 font-medium">Service</th>
                  <th className="px-5 py-4 font-medium">Description</th>
                  <th className="px-5 py-4 font-medium">Price</th>
                  <th className="px-5 py-4 font-medium">Cost</th>
                  <th className="px-5 py-4 font-medium">Margin</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service) => {
                  const profit =
                    typeof service.gross_profit_cents === "number"
                      ? service.gross_profit_cents
                      : (service.unit_price_cents ?? 0) - (service.cost_cents ?? 0);

                  const isActive = service.active !== false;

                  return (
                    <tr key={service.id} className="border-b border-stone-100 align-top">
                      <td className="px-5 py-5">
                        <div className="font-medium text-stone-900">{service.name}</div>
                      </td>

                      <td className="px-5 py-5 text-sm text-stone-600">
                        <div className="max-w-[420px]">
                          {service.description || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-5 text-sm font-medium text-stone-900">
                        {money(service.unit_price_cents)}
                      </td>

                      <td className="px-5 py-5 text-sm text-stone-700">
                        {money(service.cost_cents)}
                      </td>

                      <td className="px-5 py-5 text-sm font-medium text-stone-900">
                        {money(profit)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={[
                            "inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]",
                            isActive
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-stone-200 bg-stone-50 text-stone-600",
                          ].join(" ")}
                        >
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