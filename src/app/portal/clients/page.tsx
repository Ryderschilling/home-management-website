"use client";

import { useEffect, useState } from "react";

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-0";
}

function labelClassName() {
  return "text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500";
}

export default function PortalClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/clients");
    const json = await res.json();
    setClients(json.data ?? []);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load clients"));
  }, []);

  async function createClient() {
    setError("");

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || null, phone: phone || null }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      return setError(json?.error?.message ?? "Failed to create client");
    }

    setName("");
    setEmail("");
    setPhone("");
    await load();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Clients
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Client records
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Store homeowner information so each job, property, and order has a clean
              historical record.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
              Total clients
            </div>
            <div className="mt-2 text-2xl font-semibold text-stone-900">
              {clients.length}
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
          <h2 className="font-serif text-2xl text-stone-900">Add client</h2>
          <p className="mt-1 text-sm text-stone-500">
            Create a clean homeowner record before attaching jobs or properties.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className={labelClassName()}>Name</label>
            <input
              className={inputClassName()}
              placeholder="Full client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className={labelClassName()}>Email</label>
              <input
                className={inputClassName()}
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Phone</label>
              <input
                className={inputClassName()}
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              onClick={createClient}
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              Save client
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Directory
          </div>
          <h2 className="mt-2 font-serif text-2xl text-stone-900">Saved clients</h2>
        </div>

        {clients.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-10 text-sm text-stone-500">
            No clients yet.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {clients.map((c) => (
            <div
              key={c.id}
              className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="text-lg font-medium text-stone-900">{c.name}</div>
              <div className="mt-3 space-y-1 text-sm text-stone-600">
                <div>{c.email || "No email saved"}</div>
                <div>{c.phone || "No phone saved"}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}