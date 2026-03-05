"use client";

import { useEffect, useState } from "react";

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-0";
}

function labelClassName() {
  return "text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500";
}

export default function PortalServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  async function load() {
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    setServices(json.data ?? []);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load services"));
  }, []);

  async function createService() {
    setError("");

    const unitPriceCents = Math.round(Number(unitPrice) * 100);
    if (Number.isNaN(unitPriceCents) || unitPriceCents <= 0) {
      return setError("Price must be a number > 0");
    }

    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, unitPriceCents }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      return setError(json?.error?.message ?? "Failed to create service");
    }

    setName("");
    setUnitPrice("");
    await load();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Services
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Service catalog
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Define your standard service line items so pricing and order history stay
              organized.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Total services
            </div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">
              {services.length}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-stone-900">Add service</h2>
          <p className="mt-1 text-sm text-stone-500">
            Create a clean internal service list with standard pricing.
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
            <label className={labelClassName()}>Unit price (USD)</label>
            <input
              className={inputClassName()}
              placeholder="Unit price (USD)"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={createService}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
          >
            Save service
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Catalog
          </div>
          <h2 className="mt-2 font-serif text-2xl text-stone-900">Saved services</h2>
        </div>

        {services.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-10 text-sm text-stone-500">
            No services yet.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((s) => (
            <div
              key={s.id}
              className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-lg font-medium text-stone-900">{s.name}</div>
                <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-700">
                  ${(s.unit_price_cents / 100).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}