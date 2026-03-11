"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
};

type Property = {
  id: string;
  client_id?: string | null;
  name: string;
  address_line1?: string | null;
};

type Retainer = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  name: string;
  amount_cents: number;
  billing_frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  billing_interval: number;
  billing_anchor_date?: string | null;
  service_frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  service_interval: number;
  service_anchor_date?: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELED";
  notes?: string | null;
  created_at?: string | null;
};

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
}

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-0";
}

function labelClassName() {
  return "text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500";
}

function money(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

export default function PortalRetainersPage() {
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [amount, setAmount] = useState("");
  const [billingFrequency, setBillingFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("MONTHLY");
  const [billingInterval, setBillingInterval] = useState("1");
  const [billingAnchorDate, setBillingAnchorDate] = useState("");

  const [serviceFrequency, setServiceFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [serviceInterval, setServiceInterval] = useState("1");
  const [serviceAnchorDate, setServiceAnchorDate] = useState("");

  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [retainersRes, clientsRes, propertiesRes] = await Promise.all([
        fetch("/api/admin/retainers"),
        fetch("/api/admin/clients"),
        fetch("/api/admin/properties"),
      ]);

      const retainersJson = await retainersRes.json();
      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();

      if (!retainersRes.ok || !retainersJson.ok) {
        throw new Error(retainersJson?.error?.message ?? "Failed to load retainers");
      }

      if (!clientsRes.ok || !clientsJson.ok) {
        throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      }

      if (!propertiesRes.ok || !propertiesJson.ok) {
        throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      }

      setRetainers(retainersJson.data ?? []);
      setClients(clientsJson.data ?? []);
      setProperties(propertiesJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load retainers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredRetainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return retainers;

    return retainers.filter((retainer) => {
      const haystack = [
        retainer.name,
        retainer.client_name,
        retainer.property_name,
        retainer.status,
        retainer.billing_frequency,
        retainer.notes,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" • ");

      return haystack.includes(q);
    });
  }, [retainers, search]);

  const propertiesForClient = useMemo(() => {
    if (!clientId) return [];
    return properties.filter((property) => property.client_id === clientId);
  }, [properties, clientId]);

  useEffect(() => {
    if (!clientId) {
      setPropertyId("");
      return;
    }

    if (!propertiesForClient.some((property) => property.id === propertyId)) {
      setPropertyId("");
    }
  }, [clientId, propertiesForClient, propertyId]);

  const stats = useMemo(() => {
    const active = retainers.filter((r) => r.status === "ACTIVE");
    const monthly = active
      .filter((r) => r.billing_frequency === "MONTHLY")
      .reduce((sum, r) => sum + (r.amount_cents ?? 0), 0);

    const weeklyNormalized = active
      .filter((r) => r.billing_frequency === "WEEKLY")
      .reduce((sum, r) => {
        const interval = Math.max(1, r.billing_interval || 1);
        return sum + Math.round((r.amount_cents * 52) / 12 / interval);
      }, 0);

    return {
      total: retainers.length,
      active: active.length,
      paused: retainers.filter((r) => r.status === "PAUSED").length,
      canceled: retainers.filter((r) => r.status === "CANCELED").length,
      estimatedMrr: monthly + weeklyNormalized,
    };
  }, [retainers]);

  async function createRetainer() {
    setError("");

    if (!name.trim()) return setError("Plan name is required");
    if (!clientId) return setError("Client is required");

    const amountCents = Math.round(Number(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      return setError("Amount must be greater than 0");
    }

    const intervalNum = Math.max(1, Number(billingInterval));
    if (Number.isNaN(intervalNum) || intervalNum < 1) {
      return setError("Billing interval must be at least 1");
    }

    const serviceIntervalNum = Math.max(1, Number(serviceInterval));
    if (Number.isNaN(serviceIntervalNum) || serviceIntervalNum < 1) {
      return setError("Service interval must be at least 1");
    }

    try {
      const res = await fetch("/api/admin/retainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          clientId,
          propertyId: propertyId || null,
          amountCents,
          billingFrequency,
          billingInterval: intervalNum,
          billingAnchorDate: billingAnchorDate || null,
          serviceFrequency,
          serviceInterval: serviceIntervalNum,
          serviceAnchorDate: serviceAnchorDate || billingAnchorDate || null,
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to create retainer");
      }

      setName("");
      setClientId("");
      setPropertyId("");
      setAmount("");
      setBillingFrequency("MONTHLY");
      setBillingInterval("1");
      setBillingAnchorDate("");
      setServiceFrequency("WEEKLY");
      setServiceInterval("1");
      setServiceAnchorDate("");
      setNotes("");
      setShowForm(false);

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create retainer");
    }
  }

  async function updateRetainerStatus(
    retainerId: string,
    status: "ACTIVE" | "PAUSED" | "CANCELED"
  ) {
    setError("");

    try {
      const res = await fetch(`/api/admin/retainers/${retainerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to update retainer");
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update retainer");
    }
  }

  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Retainers
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Recurring revenue plans
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Manage recurring homeowner plans so the business compounds beyond one-off jobs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Total plans</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.total}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Active</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.active}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Est. MRR</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{money(stats.estimatedMrr)}</div>
            </div>

            <button
              onClick={() => {
                setShowForm((prev) => !prev);
                setError("");
              }}
              className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              {showForm ? "Close form" : "Create plan"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <input
            className={inputClassName()}
            placeholder="Search plan, client, property, status..."
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
            <h2 className="font-serif text-2xl text-stone-900">Create recurring plan</h2>
            <p className="mt-1 text-sm text-stone-500">
              Set the client, property, billing cadence, and monthly or weekly plan amount.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className={labelClassName()}>Plan name</label>
              <input
                className={inputClassName()}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Second-home weekly care, concierge plan, inspection plan..."
              />
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Client</label>
              <select
                className={inputClassName()}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Property</label>
              <select
                className={inputClassName()}
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={!clientId}
              >
                <option value="">
                  {!clientId ? "Select client first" : "Optional property"}
                </option>
                {propertiesForClient.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                    {property.address_line1 ? ` — ${property.address_line1}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Amount (USD)</label>
              <input
                className={inputClassName()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 350"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Billing frequency</label>
              <select
                className={inputClassName()}
                value={billingFrequency}
                onChange={(e) =>
                  setBillingFrequency(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")
                }
              >
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Every</label>
              <input
                className={inputClassName()}
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value)}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <label className={labelClassName()}>Anchor date</label>
              <input
                type="date"
                className={inputClassName()}
                value={billingAnchorDate}
                onChange={(e) => setBillingAnchorDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2 pt-2">
  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
    Service schedule
  </div>
  <p className="text-sm text-stone-500">
    This controls how often tasks should be performed. It can be different from billing.
  </p>
</div>

<div className="space-y-2">
  <label className={labelClassName()}>Service frequency</label>
  <select
    className={inputClassName()}
    value={serviceFrequency}
    onChange={(e) =>
      setServiceFrequency(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY")
    }
  >
    <option value="DAILY">Daily</option>
    <option value="WEEKLY">Weekly</option>
    <option value="MONTHLY">Monthly</option>
  </select>
</div>

<div className="space-y-2">
  <label className={labelClassName()}>Every</label>
  <input
    className={inputClassName()}
    value={serviceInterval}
    onChange={(e) => setServiceInterval(e.target.value)}
    placeholder="1"
  />
</div>

<div className="space-y-2">
  <label className={labelClassName()}>Service anchor date</label>
  <input
    type="date"
    className={inputClassName()}
    value={serviceAnchorDate}
    onChange={(e) => setServiceAnchorDate(e.target.value)}
  />
</div>

            <div className="space-y-2 md:col-span-2">
              <label className={labelClassName()}>Notes</label>
              <textarea
                className={`${inputClassName()} min-h-[110px] resize-none`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What is included, service expectations, exclusions, homeowner notes..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={createRetainer}
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              Save plan
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
          <h2 className="text-lg font-semibold text-stone-900">Plans</h2>
          <p className="text-sm text-stone-500">
            {loading ? "Loading..." : `${filteredRetainers.length} visible retainers`}
          </p>
        </div>

        {filteredRetainers.length === 0 ? (
          <div className="px-7 py-10 text-sm text-stone-500">
            {loading ? "Loading plans..." : "No recurring plans found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1300px] w-full text-left">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  <th className="px-5 py-4 font-medium">Plan</th>
                  <th className="px-5 py-4 font-medium">Client</th>
                  <th className="px-5 py-4 font-medium">Property</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Billing</th>
                  <th className="px-5 py-4 font-medium">Billing Anchor</th>
                  <th className="px-5 py-4 font-medium">Service</th>
                  <th className="px-5 py-4 font-medium">Service Anchor</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRetainers.map((retainer) => (
                  <tr key={retainer.id} className="border-b border-stone-100 align-top">
                    <td className="px-5 py-5">
                      <div className="font-medium text-stone-900">{retainer.name}</div>
                      <div className="mt-1 text-sm text-stone-600">
                        {retainer.notes || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {retainer.client_name || "—"}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      <div>{retainer.property_name || "—"}</div>
                      <div className="mt-1 text-stone-500">
                        {retainer.property_address_line1 || ""}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-sm font-medium text-stone-900">
                      {money(retainer.amount_cents)}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      Every {retainer.billing_interval} {retainer.billing_frequency.toLowerCase()}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {retainer.billing_anchor_date || "—"}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      Every {retainer.service_interval} {retainer.service_frequency.toLowerCase()}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {retainer.service_anchor_date || "—"}
                    </td>

                    <td className="px-5 py-5">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em]",
                          retainer.status === "ACTIVE"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : retainer.status === "PAUSED"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-stone-200 bg-stone-50 text-stone-600",
                        ].join(" ")}
                      >
                        {retainer.status}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        {retainer.status !== "ACTIVE" ? (
                          <button
                            onClick={() => updateRetainerStatus(retainer.id, "ACTIVE")}
                            className="rounded-full border border-green-300 px-4 py-2 text-xs uppercase tracking-[0.18em] text-green-700 transition hover:bg-green-50"
                          >
                            Activate
                          </button>
                        ) : null}

                        {retainer.status !== "PAUSED" ? (
                          <button
                            onClick={() => updateRetainerStatus(retainer.id, "PAUSED")}
                            className="rounded-full border border-amber-300 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-700 transition hover:bg-amber-50"
                          >
                            Pause
                          </button>
                        ) : null}

                        {retainer.status !== "CANCELED" ? (
                          <button
                            onClick={() => updateRetainerStatus(retainer.id, "CANCELED")}
                            className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.18em] text-stone-700 transition hover:bg-stone-100"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
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