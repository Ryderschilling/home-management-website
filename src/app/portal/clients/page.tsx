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

export default function PortalClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [propertyForms, setPropertyForms] = useState<Property[]>([emptyProperty()]);

  async function load() {
    const [clientsRes, propertiesRes] = await Promise.all([
      fetch("/api/admin/clients"),
      fetch("/api/admin/properties"),
    ]);

    const clientsJson = await clientsRes.json();
    const propertiesJson = await propertiesRes.json();

    setClients(clientsJson.data ?? []);
    setProperties(propertiesJson.data ?? []);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load clients"));
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

  function resetForm() {
    setEditingClientId(null);
    setName("");
    setEmail("");
    setPhone("");
    setClientNotes("");
    setPropertyForms([emptyProperty()]);
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
    setName(client.name ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setClientNotes(client.notes ?? "");

    const clientProperties = (propertiesByClient.get(client.id) ?? []).map(mapApiProperty);
    setPropertyForms(clientProperties.length > 0 ? clientProperties : [emptyProperty()]);
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
    resetForm();
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
              Client accounts
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Manage the homeowner and every property under that client in one place.
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
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-stone-900">
              {editingClientId ? "Edit client" : "Add client"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Add the homeowner, then attach one or more managed properties with access info.
            </p>
          </div>

          {editingClientId ? (
            <button
              onClick={resetForm}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
            >
              Cancel edit
            </button>
          ) : null}
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

        <div className="mt-6">
          <button
            onClick={saveClient}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
          >
            {editingClientId ? "Save client changes" : "Save client"}
          </button>
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

        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => {
            const clientProperties = propertiesByClient.get(client.id) ?? [];

            return (
              <div
                key={client.id}
                className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-lg font-medium text-stone-900">
                      {client.name}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-stone-600">
                      <div>{client.email || "No email saved"}</div>
                      <div>{client.phone || "No phone saved"}</div>
                    </div>

                    {client.notes ? (
                      <div className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
                        {client.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">
                      {clientProperties.length} propert
                      {clientProperties.length === 1 ? "y" : "ies"}
                    </div>

                    <button
                      onClick={() => startEditClient(client)}
                      className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {clientProperties.length > 0 ? (
                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {clientProperties.map((property: any) => (
                      <div
                        key={property.id}
                        className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4"
                      >
                        <div className="font-medium text-stone-900">
                          {property.name}
                        </div>
                        <div className="mt-1 text-sm text-stone-600">
                          {property.address_line1}
                          {property.city ? `, ${property.city}` : ""}
                          {property.state ? `, ${property.state}` : ""}
                          {property.postal_code ? ` ${property.postal_code}` : ""}
                        </div>

                        <div className="mt-3 text-sm text-stone-700">
                          <span className="font-medium">Entry:</span>{" "}
                          {property.entry ||
                            property.gate_code ||
                            property.door_code ||
                            property.garage_code ||
                            property.alarm_code ||
                            "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-stone-500">
                    No properties saved under this client yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}