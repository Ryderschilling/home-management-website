"use client";

import { useEffect, useMemo, useState } from "react";

type Property = {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  name: string;
  address_line1: string;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  entry?: string | null;
  irrigation_notes?: string | null;
  access_notes?: string | null;
  notes?: string | null;
  active_plan_count?: number | null;
  recent_job_count?: number | null;
  next_job_at?: string | null;
  last_job_at?: string | null;
};

type Client = {
  id: string;
  name: string;
};

type Retainer = {
  id: string;
  property_id?: string | null;
  name: string;
  status: string;
  archived_at?: string | null;
  next_visit_at?: string | null;
};

type Job = {
  id: string;
  property_id?: string | null;
  title: string;
  status: string;
  scheduled_for?: string | null;
  completed_at?: string | null;
  client_name?: string | null;
};

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhost: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
};

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function emptyForm() {
  return {
    id: "",
    name: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    clientId: "",
    entry: "",
    accessNotes: "",
    irrigationNotes: "",
    notes: "",
  };
}

export default function PortalPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [propertiesRes, clientsRes, retainersRes, jobsRes] = await Promise.all([
        fetch("/api/admin/properties"),
        fetch("/api/admin/clients"),
        fetch("/api/admin/retainers"),
        fetch(`/api/admin/jobs?includeCompleted=true&start=${encodeURIComponent(new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString())}&end=${encodeURIComponent(new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString())}`),
      ]);
      const [propertiesJson, clientsJson, retainersJson, jobsJson] = await Promise.all([
        propertiesRes.json(),
        clientsRes.json(),
        retainersRes.json(),
        jobsRes.json(),
      ]);
      if (!propertiesRes.ok || !propertiesJson.ok) throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      if (!retainersRes.ok || !retainersJson.ok) throw new Error(retainersJson?.error?.message ?? "Failed to load plans");
      if (!jobsRes.ok || !jobsJson.ok) throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      const nextProperties = propertiesJson.data ?? [];
      setProperties(nextProperties);
      setClients(clientsJson.data ?? []);
      setRetainers(retainersJson.data ?? []);
      setJobs(jobsJson.data ?? []);
      if (!selectedPropertyId && nextProperties.length > 0) {
        setSelectedPropertyId(nextProperties[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const selectedProperty =
    properties.find((property) => property.id === selectedPropertyId) ?? properties[0] ?? null;
  const selectedPropertyPlans = useMemo(() => {
    if (!selectedProperty) return [];
    return retainers.filter((retainer) => retainer.property_id === selectedProperty.id);
  }, [retainers, selectedProperty]);
  const selectedPropertyJobs = useMemo(() => {
    if (!selectedProperty) return [];
    return jobs
      .filter((job) => job.property_id === selectedProperty.id)
      .sort((a, b) => new Date(b.completed_at ?? b.scheduled_for ?? 0).getTime() - new Date(a.completed_at ?? a.scheduled_for ?? 0).getTime());
  }, [jobs, selectedProperty]);

  function editProperty(property: Property) {
    setSelectedPropertyId(property.id);
    setForm({
      id: property.id,
      name: property.name ?? "",
      addressLine1: property.address_line1 ?? "",
      city: property.city ?? "",
      state: property.state ?? "",
      postalCode: property.postal_code ?? "",
      clientId: property.client_id ?? "",
      entry: property.entry ?? "",
      accessNotes: property.access_notes ?? "",
      irrigationNotes: property.irrigation_notes ?? "",
      notes: property.notes ?? "",
    });
  }

  function resetForm() {
    setForm(emptyForm());
  }

  async function saveProperty() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        clientId: form.clientId || null,
        name: form.name,
        addressLine1: form.addressLine1,
        city: form.city || null,
        state: form.state || null,
        postalCode: form.postalCode || null,
        entry: form.entry || null,
        accessNotes: form.accessNotes || null,
        irrigationNotes: form.irrigationNotes || null,
        notes: form.notes || null,
      };
      const response = await fetch(form.id ? `/api/admin/properties/${form.id}` : "/api/admin/properties", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to save property");
      }
      resetForm();
      await loadAll();
      setSelectedPropertyId(json.data?.id ?? selectedPropertyId);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>Properties</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Property records</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 560 }}>Keep each home practical: address, access, house memory, linked client, and quick context on plans and recent work.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Total properties", value: properties.length }, { label: "Linked plans", value: retainers.filter((retainer) => !retainer.archived_at && retainer.status === "ACTIVE").length }, { label: "Jobs in scope", value: jobs.length }].map((stat) => (
              <div key={stat.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: "var(--text-primary)", marginTop: 8 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
        {error ? <div className="mt-6 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className={`${S.card} p-5 sm:p-7`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className={S.label}>{form.id ? "Edit property" : "Add property"}</div>
              <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)", marginTop: 4 }}>{form.id ? "Update house memory" : "Create property"}</h2>
            </div>
            {form.id ? <button onClick={resetForm} className={S.btnGhost}>Clear</button> : null}
          </div>
          <div className="space-y-4">
            <div className="space-y-2"><label className={S.label}>Property name</label><input className={S.input} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Beach house, 30A condo..." /></div>
            <div className="space-y-2"><label className={S.label}>Address line 1</label><input className={S.input} value={form.addressLine1} onChange={(e) => setForm((current) => ({ ...current, addressLine1: e.target.value }))} placeholder="123 Example St" /></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2"><label className={S.label}>City</label><input className={S.input} value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} /></div>
              <div className="space-y-2"><label className={S.label}>State</label><input className={S.input} value={form.state} onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))} /></div>
              <div className="space-y-2"><label className={S.label}>ZIP</label><input className={S.input} value={form.postalCode} onChange={(e) => setForm((current) => ({ ...current, postalCode: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <label className={S.label}>Client</label>
              <select className={S.input} value={form.clientId} onChange={(e) => setForm((current) => ({ ...current, clientId: e.target.value }))}>
                <option value="">Optional client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><label className={S.label}>Entry</label><textarea className={`${S.input} min-h-[80px] resize-none`} value={form.entry} onChange={(e) => setForm((current) => ({ ...current, entry: e.target.value }))} placeholder="Gate code, lockbox, alarm, key location..." /></div>
            <div className="space-y-2"><label className={S.label}>Access notes</label><textarea className={`${S.input} min-h-[90px] resize-none`} value={form.accessNotes} onChange={(e) => setForm((current) => ({ ...current, accessNotes: e.target.value }))} placeholder="Arrival steps, parking, preferred entry door..." /></div>
            <div className="space-y-2"><label className={S.label}>Irrigation notes</label><textarea className={`${S.input} min-h-[90px] resize-none`} value={form.irrigationNotes} onChange={(e) => setForm((current) => ({ ...current, irrigationNotes: e.target.value }))} placeholder="Timers, zones, seasonal reminders..." /></div>
            <div className="space-y-2"><label className={S.label}>House notes</label><textarea className={`${S.input} min-h-[110px] resize-none`} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Small but important house memory only." /></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={saveProperty} className={S.btnPrimary} disabled={saving}>{saving ? "Saving..." : form.id ? "Save property" : "Create property"}</button>
            <button onClick={resetForm} className={S.btnGhost}>Reset</button>
          </div>
        </div>

        <div className="space-y-6">
          <section className={S.card}>
            <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Saved properties</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${properties.length} visible properties`}</div>
            </div>
            {properties.length === 0 ? (
              <div className="px-5 py-8 sm:px-7 sm:py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading properties..." : "No properties yet."}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-5 sm:p-7 xl:grid-cols-2">
                {properties.map((property) => (
                  <button key={property.id} onClick={() => setSelectedPropertyId(property.id)} className={`${S.cardInner} text-left transition hover:border-[var(--border-hover)]`} style={{ padding: 18, background: selectedProperty?.id === property.id ? "rgba(232,224,208,0.08)" : undefined }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{property.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{property.address_line1}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{property.client_name || "No linked client"}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{property.active_plan_count ?? 0} active plans</div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>Recent jobs {property.recent_job_count ?? 0} • Next {fmtDate(property.next_job_at)}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={`${S.card} p-5 sm:p-7`}>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <div className={S.label}>Property detail</div>
                <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)", marginTop: 4 }}>{selectedProperty?.name || "No property selected"}</h2>
              </div>
              {selectedProperty ? <button onClick={() => editProperty(selectedProperty)} className={S.btnGhost}>Edit property</button> : null}
            </div>
            {!selectedProperty ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Select a property to view details.</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[{ label: "Client", value: selectedProperty.client_name || "Unassigned" }, { label: "Active plans", value: selectedProperty.active_plan_count ?? 0 }, { label: "Recent jobs", value: selectedProperty.recent_job_count ?? 0 }, { label: "Next job", value: fmtDate(selectedProperty.next_job_at) }].map((field) => (
                    <div key={field.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                      <div className={S.label}>{field.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>{field.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {[{ label: "Entry", value: selectedProperty.entry || "No entry notes saved." }, { label: "Access notes", value: selectedProperty.access_notes || "No access notes saved." }, { label: "Irrigation notes", value: selectedProperty.irrigation_notes || "No irrigation notes saved." }, { label: "House notes", value: selectedProperty.notes || "No property notes saved." }].map((field) => (
                    <div key={field.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                      <div className={S.label}>{field.label}</div>
                      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>{field.value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className={S.label}>Linked plans</div>
                  <div className="mt-3 space-y-3">
                    {selectedPropertyPlans.length === 0 ? (
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No plans linked to this property yet.</div>
                    ) : (
                      selectedPropertyPlans.map((plan) => (
                        <div key={plan.id} className={S.cardInner} style={{ padding: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{plan.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{plan.status}{plan.archived_at ? " • Archived" : ""}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Next visit {fmtDate(plan.next_visit_at)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className={S.label}>Recent jobs</div>
                  <div className="mt-3 space-y-3">
                    {selectedPropertyJobs.length === 0 ? (
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No recent jobs at this property yet.</div>
                    ) : (
                      selectedPropertyJobs.slice(0, 6).map((job) => (
                        <div key={job.id} className={S.cardInner} style={{ padding: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{job.title}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{job.client_name || "No client"} • {job.status}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Scheduled {fmtDate(job.scheduled_for)} • Completed {fmtDate(job.completed_at)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
