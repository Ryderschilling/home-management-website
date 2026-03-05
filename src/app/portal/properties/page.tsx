"use client";

import { useEffect, useState } from "react";

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-0";
}

function labelClassName() {
  return "text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500";
}

export default function PortalPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [clientId, setClientId] = useState("");

  async function loadAll() {
    const [p, c] = await Promise.all([
      fetch("/api/admin/properties"),
      fetch("/api/admin/clients"),
    ]);

    const pj = await p.json();
    const cj = await c.json();

    setProperties(pj.data ?? []);
    setClients(cj.data ?? []);
  }

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load"));
  }, []);

  async function createProperty() {
    setError("");

    const res = await fetch("/api/admin/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        addressLine1,
        clientId: clientId || null,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      return setError(json?.error?.message ?? "Failed to create property");
    }

    setName("");
    setAddressLine1("");
    setClientId("");
    await loadAll();
  }

  function clientName(id: string | null) {
    if (!id) return "Unassigned";
    return clients.find((c: any) => c.id === id)?.name ?? "Unassigned";
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Properties
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Property records
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Save the homes you manage and tie each property to the correct client
              record for long-term history.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Total properties
            </div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">
              {properties.length}
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
          <h2 className="font-serif text-2xl text-stone-900">Add property</h2>
          <p className="mt-1 text-sm text-stone-500">
            Save the home name, address, and optional client assignment.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClassName()}>Property name</label>
            <input
              className={inputClassName()}
              placeholder="Property name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClassName()}>Address line 1</label>
            <input
              className={inputClassName()}
              placeholder="Address line 1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label className={labelClassName()}>Client</label>
          <select
            className={inputClassName()}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Client (optional)</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <button
            onClick={createProperty}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
          >
            Save property
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Portfolio
          </div>
          <h2 className="mt-2 font-serif text-2xl text-stone-900">
            Saved properties
          </h2>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-10 text-sm text-stone-500">
            No properties yet.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {properties.map((p) => (
            <div
              key={p.id}
              className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="text-lg font-medium text-stone-900">{p.name}</div>
              <div className="mt-2 text-sm text-stone-600">{p.address_line1}</div>
              <div className="mt-4 inline-flex rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                {clientName(p.client_id)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}