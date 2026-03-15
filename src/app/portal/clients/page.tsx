"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  property_count?: number;
};

type Property = {
  id?: string;
  client_id?: string | null;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  entry: string;
  irrigationNotes: string;
  accessNotes: string;
  notes: string;
};

type Order = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  product_key?: string | null;
  rock_color?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  service_address?: string | null;
  fulfillment_status?: string | null;
  total_amount_cents?: number | null;
  notes?: string | null;
  created_at?: string | null;
  ordered_at?: string | null;
  installed_at?: string | null;
  thank_you_sent_at?: string | null;
};

type JobPhoto = {
  id: string;
  url: string;
  caption?: string | null;
  uploaded_at?: string | null;
};

type Job = {
  id: string;
  client_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  order_id?: string | null;
  title?: string | null;
  notes?: string | null;
  status?: string | null;
  scheduled_for?: string | null;
  completed_at?: string | null;
  hours_numeric?: number | null;
  price_cents?: number | null;
  created_at?: string | null;
  photo_count?: number | null;
  photos?: JobPhoto[] | null;
};

type EmailRecord = {
  email: string;
  name: string;
  source: string;
  clientId?: string | null;
};

const emptyProperty = (): Property => ({
  name: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  entry: "",
  irrigationNotes: "",
  accessNotes: "",
  notes: "",
});

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

function mapApiProperty(row: any): Property {
  return {
    id: row.id,
    client_id: row.client_id,
    name: row.name ?? "",
    addressLine1: row.address_line1 ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    postalCode: row.postal_code ?? "",
    entry:
      row.entry ??
      row.gate_code ??
      row.door_code ??
      row.garage_code ??
      row.alarm_code ??
      "",
    irrigationNotes: row.irrigation_notes ?? "",
    accessNotes: row.access_notes ?? "",
    notes: row.notes ?? "",
  };
}

function propertyPayload(property: Property, clientId: string) {
  return {
    clientId,
    name: property.name,
    addressLine1: property.addressLine1,
    city: property.city || null,
    state: property.state || null,
    postalCode: property.postalCode || null,
    entry: property.entry || null,
    irrigationNotes: property.irrigationNotes || null,
    accessNotes: property.accessNotes || null,
    notes: property.notes || null,
  };
}

function normalizeEmail(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export default function PortalClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showEmails, setShowEmails] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [propertyForms, setPropertyForms] = useState<Property[]>([emptyProperty()]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [clientsRes, propertiesRes, ordersRes, jobsRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/properties"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/jobs"),
      ]);

      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();
      const ordersJson = await ordersRes.json();
      const jobsJson = await jobsRes.json();

      if (!clientsRes.ok || !clientsJson.ok) {
        throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      }

      if (!propertiesRes.ok || !propertiesJson.ok) {
        throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      }

      if (!ordersRes.ok || !ordersJson.ok) {
        throw new Error(ordersJson?.error?.message ?? "Failed to load orders");
      }

      if (!jobsRes.ok || !jobsJson.ok) {
        throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      }

      const nextClients = clientsJson.data ?? [];
      setClients(nextClients);
      setProperties(propertiesJson.data ?? []);
      setOrders(ordersJson.data ?? []);
      setJobs(jobsJson.data ?? []);

      if (!selectedClientId && nextClients.length > 0) {
        setSelectedClientId(nextClients[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const propertiesByClient = useMemo(() => {
    const map = new Map<string, any[]>();

    for (const property of properties) {
      const key = property.client_id;
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(property);
      map.set(key, list);
    }

    return map;
  }, [properties]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return clients;

    return clients.filter((client) => {
      const clientProperties = propertiesByClient.get(client.id) ?? [];

      const haystack = [
        client.name,
        client.email,
        client.phone,
        client.notes,
        ...clientProperties.map((property: any) => property.name),
        ...clientProperties.map((property: any) => property.address_line1),
        ...clientProperties.map((property: any) => property.city),
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" • ");

      return haystack.includes(q);
    });
  }, [clients, propertiesByClient, search]);

  const emailRecords = useMemo(() => {
    const map = new Map<string, EmailRecord>();

    for (const client of clients) {
      const normalized = normalizeEmail(client.email);
      if (!normalized) continue;

      if (!map.has(normalized)) {
        map.set(normalized, {
          email: normalized,
          name: client.name || "—",
          source: "client",
          clientId: client.id,
        });
      }
    }

    for (const order of orders) {
      const normalized = normalizeEmail(order.customer_email);
      if (!normalized) continue;

      if (!map.has(normalized)) {
        map.set(normalized, {
          email: normalized,
          name: order.customer_name || "—",
          source: "order",
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [clients, orders]);

  const selectedClient =
    filteredClients.find((client) => client.id === selectedClientId) ??
    clients.find((client) => client.id === selectedClientId) ??
    filteredClients[0] ??
    clients[0] ??
    null;

  const selectedClientProperties = selectedClient
    ? propertiesByClient.get(selectedClient.id) ?? []
    : [];

  const selectedClientOrders = useMemo(() => {
    if (!selectedClient) return [];

    return orders
      .filter((order) => order.client_id === selectedClient.id)
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [orders, selectedClient]);

  const selectedClientJobs = useMemo(() => {
    if (!selectedClient) return [];

    return jobs
      .filter((job) => job.client_id === selectedClient.id)
      .sort((a, b) => {
        const aTime = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
        const bTime = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
        return bTime - aTime;
      });
  }, [jobs, selectedClient]);

  const totalProperties = properties.length;
  const selectedClientRevenue = selectedClientOrders.reduce(
    (sum, order) => sum + (typeof order.total_amount_cents === "number" ? order.total_amount_cents : 0),
    0
  );

  function downloadEmailsCsv() {
    const header = ["email", "name", "source"];
    const rows = emailRecords.map((record) => [
      csvEscape(record.email),
      csvEscape(record.name),
      csvEscape(record.source),
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "client-emails.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function deleteClientRecord(clientId: string, clientName?: string | null) {
    const confirmed = window.confirm(
      `Delete client "${clientName || "this client"}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");

    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to delete client");
      }

      if (selectedClientId === clientId) {
        setSelectedClientId(null);
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete client");
    }
  }

  function resetForm() {
    setEditingClientId(null);
    setName("");
    setEmail("");
    setPhone("");
    setClientNotes("");
    setPropertyForms([emptyProperty()]);
    setShowForm(false);
    setError("");
  }

  function startCreateClient() {
    setEditingClientId(null);
    setName("");
    setEmail("");
    setPhone("");
    setClientNotes("");
    setPropertyForms([emptyProperty()]);
    setShowForm(true);
    setError("");
  }

  function addPropertyBlock() {
    setPropertyForms((prev) => [...prev, emptyProperty()]);
  }

  function removePropertyBlock(index: number) {
    setPropertyForms((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function updatePropertyBlock(index: number, key: keyof Property, value: string) {
    setPropertyForms((prev) =>
      prev.map((property, i) =>
        i === index ? { ...property, [key]: value } : property
      )
    );
  }

  function startEditClient(client: Client) {
    setEditingClientId(client.id);
    setSelectedClientId(client.id);
    setName(client.name ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setClientNotes(client.notes ?? "");

    const clientProperties = (propertiesByClient.get(client.id) ?? []).map(mapApiProperty);
    setPropertyForms(clientProperties.length > 0 ? clientProperties : [emptyProperty()]);
    setShowForm(true);
    setError("");
  }

  async function saveClient() {
    setError("");

    if (!name.trim()) {
      setError("Client name is required");
      return;
    }

    const validProperties = propertyForms.filter(
      (property) => property.name.trim() || property.addressLine1.trim()
    );

    for (const property of validProperties) {
      if (!property.name.trim()) {
        setError("Each saved property must have a property name");
        return;
      }

      if (!property.addressLine1.trim()) {
        setError("Each saved property must have address line 1");
        return;
      }
    }

    let clientId = editingClientId;

    if (editingClientId) {
      const res = await fetch(`/api/admin/clients/${editingClientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
          notes: clientNotes || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to update client");
        return;
      }
    } else {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
          notes: clientNotes || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? "Failed to create client");
        return;
      }

      clientId = json.data.id;
    }

    if (!clientId) {
      setError("Missing client id");
      return;
    }

    const existingIds = new Set(
      (propertiesByClient.get(clientId) ?? []).map((property) => property.id)
    );
    const formIds = new Set(propertyForms.filter((p) => p.id).map((p) => p.id as string));

    for (const existingId of existingIds) {
      if (!formIds.has(existingId)) {
        await fetch(`/api/admin/properties/${existingId}`, { method: "DELETE" });
      }
    }

    for (const property of validProperties) {
      if (property.id) {
        const res = await fetch(`/api/admin/properties/${property.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(propertyPayload(property, clientId)),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json?.error?.message ?? "Failed to update property");
          return;
        }
      } else {
        const res = await fetch("/api/admin/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(propertyPayload(property, clientId)),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json?.error?.message ?? "Failed to create property");
          return;
        }
      }
    }

    await load();
    setSelectedClientId(clientId);
    resetForm();
  }

  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Clients
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Client management
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Manage homeowners, properties, notes, purchase history, service history, and your email list from one operator view.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Total clients
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {clients.length}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Properties
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {totalProperties}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Saved emails
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {emailRecords.length}
              </div>
            </div>

            <button
              onClick={() => setShowEmails((prev) => !prev)}
              className="rounded-full border border-stone-300 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-stone-700 transition hover:bg-stone-100"
            >
              {showEmails ? "Hide emails" : "View all emails"}
            </button>

            <button
              onClick={startCreateClient}
              className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              Create client
            </button>
          </div>
        </div>

        <div className="mt-6">
          <input
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900"
            placeholder="Search clients, email, phone, notes, property name, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showEmails ? (
          <div className="mt-6 rounded-[24px] border border-stone-200 bg-stone-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  Email list
                </div>
                <h2 className="mt-1 text-lg font-semibold text-stone-900">
                  All stored customer emails
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Deduplicated from clients and orders.
                </p>
              </div>

              <button
                onClick={downloadEmailsCsv}
                className="rounded-full bg-stone-900 px-5 py-3 text-xs font-medium uppercase tracking-[0.22em] text-white transition hover:bg-stone-700"
              >
                Download CSV
              </button>
            </div>

            {emailRecords.length === 0 ? (
              <div className="mt-4 text-sm text-stone-500">No emails saved yet.</div>
            ) : (
              <div className="mt-4 max-h-[320px] overflow-y-auto rounded-2xl border border-stone-200 bg-white">
                <table className="min-w-full text-left">
                  <thead className="border-b border-stone-200 bg-stone-50">
                  <tr className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                  {emailRecords.map((record) => (
                      <tr key={record.email} className="border-b border-stone-100">
                        <td className="px-4 py-3 text-sm text-stone-900">{record.email}</td>
                        <td className="px-4 py-3 text-sm text-stone-700">{record.name}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">{record.source}</td>
                        <td className="px-4 py-3 text-right">
                          {record.clientId ? (
                            <button
                              onClick={() => deleteClientRecord(record.clientId as string, record.name)}
                              className="rounded-full border border-red-200 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-red-700 transition hover:bg-red-50"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className={`${cardClass()} overflow-hidden`}>
          <div className="border-b border-stone-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-stone-900">All clients</h2>
            <p className="mt-1 text-sm text-stone-500">
              {loading ? "Loading..." : `${filteredClients.length} visible clients`}
            </p>
          </div>

          {filteredClients.length === 0 ? (
            <div className="px-6 py-10 text-sm text-stone-500">
              {loading ? "Loading clients..." : "No clients found."}
            </div>
          ) : (
            <div className="max-h-[820px] overflow-y-auto">
              {filteredClients.map((client) => {
                const isActive = selectedClient?.id === client.id;
                const clientProperties = propertiesByClient.get(client.id) ?? [];

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={[
                      "block w-full border-b border-stone-100 px-6 py-5 text-left transition",
                      isActive ? "bg-stone-50" : "hover:bg-stone-50/70",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-stone-900">{client.name}</div>
                        <div className="mt-2 text-sm text-stone-600">
                          {client.email || "No email saved"}
                        </div>
                        <div className="mt-1 text-sm text-stone-600">
                          {client.phone || "No phone saved"}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                        {clientProperties.length} {clientProperties.length === 1 ? "property" : "properties"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {showForm ? (
            <section className={`${cardClass()} p-7`}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl text-stone-900">
                    {editingClientId ? "Edit client" : "Create client"}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Save the homeowner first, then attach one or more managed properties.
                  </p>
                </div>

                <button
                  onClick={resetForm}
                  className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClassName()}>Client name</label>
                  <input
                    className={inputClassName()}
                    placeholder="Full client name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClassName()}>Phone</label>
                  <input
                    className={inputClassName()}
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className={labelClassName()}>Email</label>
                  <input
                    className={inputClassName()}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={labelClassName()}>Client notes</label>
                  <textarea
                    className={`${inputClassName()} min-h-[100px] resize-none`}
                    placeholder="Billing notes, homeowner preferences, general reminders..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                      Properties
                    </div>
                    <h3 className="mt-1 font-serif text-xl text-stone-900">
                      Managed homes under this client
                    </h3>
                  </div>

                  <button
                    onClick={addPropertyBlock}
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
                  >
                    Add property
                  </button>
                </div>

                {propertyForms.map((property, index) => (
                  <div
                    key={property.id ?? `new-${index}`}
                    className="rounded-[24px] border border-stone-200 bg-stone-50/70 p-5"
                  >
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="font-medium text-stone-900">
                        Property {index + 1}
                      </div>

                      {propertyForms.length > 1 ? (
                        <button
                          onClick={() => removePropertyBlock(index)}
                          className="rounded-full border border-red-200 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-red-700 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className={labelClassName()}>Property name</label>
                        <input
                          className={inputClassName()}
                          value={property.name}
                          onChange={(e) => updatePropertyBlock(index, "name", e.target.value)}
                          placeholder="Beach house, Main home, Rental home..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={labelClassName()}>Address line 1</label>
                        <input
                          className={inputClassName()}
                          value={property.addressLine1}
                          onChange={(e) =>
                            updatePropertyBlock(index, "addressLine1", e.target.value)
                          }
                          placeholder="123 Example St"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={labelClassName()}>City</label>
                        <input
                          className={inputClassName()}
                          value={property.city}
                          onChange={(e) => updatePropertyBlock(index, "city", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className={labelClassName()}>State</label>
                          <input
                            className={inputClassName()}
                            value={property.state}
                            onChange={(e) => updatePropertyBlock(index, "state", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={labelClassName()}>ZIP</label>
                          <input
                            className={inputClassName()}
                            value={property.postalCode}
                            onChange={(e) =>
                              updatePropertyBlock(index, "postalCode", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className={labelClassName()}>Entry</label>
                        <input
                          className={inputClassName()}
                          value={property.entry}
                          onChange={(e) => updatePropertyBlock(index, "entry", e.target.value)}
                          placeholder="Gate code, door code, lockbox, key location, garage note..."
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className={labelClassName()}>Access notes</label>
                        <textarea
                          className={`${inputClassName()} min-h-[90px] resize-none`}
                          value={property.accessNotes}
                          onChange={(e) =>
                            updatePropertyBlock(index, "accessNotes", e.target.value)
                          }
                          placeholder="Gate instructions, which door to use, arrival steps..."
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className={labelClassName()}>Irrigation notes</label>
                        <textarea
                          className={`${inputClassName()} min-h-[90px] resize-none`}
                          value={property.irrigationNotes}
                          onChange={(e) =>
                            updatePropertyBlock(index, "irrigationNotes", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className={labelClassName()}>Property notes</label>
                        <textarea
                          className={`${inputClassName()} min-h-[110px] resize-none`}
                          value={property.notes}
                          onChange={(e) => updatePropertyBlock(index, "notes", e.target.value)}
                          placeholder="House specifics, systems, quirks, vendor info..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={saveClient}
                  className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
                >
                  {editingClientId ? "Save client changes" : "Save client"}
                </button>

                <button
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-stone-700 transition hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          <section className={`${cardClass()} p-7`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                  Client detail
                </div>
                <h2 className="mt-1 font-serif text-2xl text-stone-900">
                  {selectedClient ? selectedClient.name : "No client selected"}
                </h2>
              </div>

              {selectedClient ? (
                <button
                  onClick={() => startEditClient(selectedClient)}
                  className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
                >
                  Edit client
                </button>
              ) : null}
            </div>

            {!selectedClient ? (
              <div className="mt-6 text-sm text-stone-500">
                Select a client to view details.
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Email
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {selectedClient.email || "No email saved"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Phone
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {selectedClient.phone || "No phone saved"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Properties
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {selectedClientProperties.length}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Revenue to Date
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {money(selectedClientRevenue)}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Client notes
                  </div>
                  <div className="mt-2 rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-6 text-stone-700">
                    {selectedClient.notes || "No notes saved for this client."}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Properties
                  </div>
                  <h3 className="mt-1 font-serif text-xl text-stone-900">
                    Managed homes
                  </h3>

                  {selectedClientProperties.length === 0 ? (
                    <div className="mt-4 text-sm text-stone-500">
                      No properties saved under this client yet.
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {selectedClientProperties.map((property: any) => (
                        <div
                          key={property.id}
                          className="rounded-[24px] border border-stone-200 bg-stone-50/70 p-5"
                        >
                          <div className="font-medium text-stone-900">
                            {property.name}
                          </div>

                          <div className="mt-2 text-sm leading-6 text-stone-600">
                            {property.address_line1}
                            {property.city ? `, ${property.city}` : ""}
                            {property.state ? `, ${property.state}` : ""}
                            {property.postal_code ? ` ${property.postal_code}` : ""}
                          </div>

                          <div className="mt-4 text-sm text-stone-700">
                            <span className="font-medium">Entry:</span>{" "}
                            {property.entry ||
                              property.gate_code ||
                              property.door_code ||
                              property.garage_code ||
                              property.alarm_code ||
                              "—"}
                          </div>

                          <div className="mt-3 text-sm text-stone-700">
                            <span className="font-medium">Access notes:</span>{" "}
                            {property.access_notes || "—"}
                          </div>

                          <div className="mt-3 text-sm text-stone-700">
                            <span className="font-medium">Irrigation notes:</span>{" "}
                            {property.irrigation_notes || "—"}
                          </div>

                          <div className="mt-3 text-sm text-stone-700">
                            <span className="font-medium">Property notes:</span>{" "}
                            {property.notes || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Purchase history
                  </div>
                  <h3 className="mt-1 font-serif text-xl text-stone-900">
                    Orders and purchases
                  </h3>

                  {selectedClientOrders.length === 0 ? (
                    <div className="mt-4 text-sm text-stone-500">
                      No purchases saved for this client yet.
                    </div>
                  ) : (
                    <div className="mt-4 overflow-x-auto rounded-[24px] border border-stone-200">
                      <table className="min-w-full text-left">
                        <thead className="border-b border-stone-200 bg-stone-50">
                          <tr className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Product</th>
                            <th className="px-4 py-3 font-medium">Color</th>
                            <th className="px-4 py-3 font-medium">Amount</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Installed</th>
                            <th className="px-4 py-3 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClientOrders.map((order) => (
                            <tr key={order.id} className="border-b border-stone-100 align-top">
                              <td className="px-4 py-4 text-sm text-stone-700">
                                {fmtShortDate(order.created_at)}
                              </td>
                              <td className="px-4 py-4 text-sm text-stone-900">
                                {cleanProductLabel(order.product_key)}
                              </td>
                              <td className="px-4 py-4 text-sm text-stone-700">
                                {order.rock_color || "—"}
                              </td>
                              <td className="px-4 py-4 text-sm font-medium text-stone-900">
                                {money(order.total_amount_cents)}
                              </td>
                              <td className="px-4 py-4 text-sm text-stone-700">
                                {order.fulfillment_status || "—"}
                              </td>
                              <td className="px-4 py-4 text-sm text-stone-700">
                                {fmtDate(order.installed_at)}
                              </td>
                              <td className="px-4 py-4 text-sm text-stone-700">
                                {order.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Service history
                  </div>
                  <h3 className="mt-1 font-serif text-xl text-stone-900">
                    Jobs, visits, notes, and photos
                  </h3>

                  {selectedClientJobs.length === 0 ? (
                    <div className="mt-4 text-sm text-stone-500">
                      No jobs or service history saved for this client yet.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {selectedClientJobs.map((job) => {
                        const photos = Array.isArray(job.photos) ? job.photos : [];
                        const photoCount =
                          typeof job.photo_count === "number"
                            ? job.photo_count
                            : photos.length;

                        return (
                          <div
                            key={job.id}
                            className="rounded-[24px] border border-stone-200 bg-stone-50/70 p-5"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <div className="font-medium text-stone-900">
                                  {job.title || "Untitled job"}
                                </div>

                                <div className="mt-2 text-sm text-stone-600">
                                  Scheduled: {fmtDate(job.scheduled_for)}
                                </div>

                                <div className="mt-1 text-sm text-stone-600">
                                  Completed: {fmtDate(job.completed_at)}
                                </div>

                                <div className="mt-1 text-sm text-stone-600">
                                  Status: {job.status || "—"}
                                </div>

                                <div className="mt-1 text-sm text-stone-600">
                                  Price: {money(job.price_cents)}
                                </div>

                                <div className="mt-1 text-sm text-stone-600">
                                  Hours: {job.hours_numeric ?? "—"}
                                </div>

                                <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700">
                                  <span className="font-medium text-stone-900">Service notes:</span>{" "}
                                  {job.notes || "No notes saved for this service."}
                                </div>

                                <div className="mt-4 text-sm text-stone-600">
                                  Photos attached: {photoCount}
                                </div>

                                {photos.length > 0 ? (
                                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                                    {photos.map((photo) => (
                                      <a
                                        key={photo.id}
                                        href={photo.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block overflow-hidden rounded-2xl border border-stone-200 bg-white"
                                      >
                                        <img
                                          src={photo.url}
                                          alt={photo.caption || "Job photo"}
                                          className="h-32 w-full object-cover"
                                        />
                                        <div className="px-3 py-2 text-xs text-stone-600">
                                          {photo.caption || "View photo"}
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                              </div>

                              <div className="flex flex-col gap-2">
                                {job.order_id ? (
                                  <div className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                                    Linked to order
                                  </div>
                                ) : null}

                                {photoCount > 0 ? (
                                  <div className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-green-700">
                                    {photoCount} photo{photoCount === 1 ? "" : "s"}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}