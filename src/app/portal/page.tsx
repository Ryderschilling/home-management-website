"use client";

import { useEffect, useMemo, useState } from "react";

type Client = { id: string; name: string };
type Property = { id: string; name: string; client_id: string | null };
type Job = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  scheduled_for: string;
  client_id: string | null;
  property_id: string | null;
  price_cents: number | null;
  hours_numeric: string | number | null;
};

function formatMoney(cents: number | null) {
  if (cents === null || cents === undefined) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

function toLocalDateKey(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDayLabel(day: string) {
  const d = new Date(`${day}T12:00:00`);
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-0";
}

function labelClassName() {
  return "text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500";
}

export default function PortalCalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [error, setError] = useState<string>("");

  async function loadAll() {
    setLoading(true);
    setError("");

    const [jobsRes, clientsRes, propsRes] = await Promise.all([
      fetch("/api/admin/jobs"),
      fetch("/api/admin/clients"),
      fetch("/api/admin/properties"),
    ]);

    if (!jobsRes.ok) throw new Error("Failed to load jobs");
    if (!clientsRes.ok) throw new Error("Failed to load clients");
    if (!propsRes.ok) throw new Error("Failed to load properties");

    const jobsJson = await jobsRes.json();
    const clientsJson = await clientsRes.json();
    const propsJson = await propsRes.json();

    setJobs(jobsJson.data ?? []);
    setClients(clientsJson.data ?? []);
    setProperties(propsJson.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLoading(false);
    });
  }, []);

  const propertiesForClient = useMemo(() => {
    if (!clientId) return properties;
    return properties.filter((p) => p.client_id === clientId);
  }, [properties, clientId]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();

    for (const job of jobs) {
      const key = toLocalDateKey(job.scheduled_for);
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }

    for (const [k, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      );
      map.set(k, list);
    }

    return map;
  }, [jobs]);

  const sortedDays = useMemo(() => {
    return Array.from(jobsByDay.keys()).sort();
  }, [jobsByDay]);

  const upcomingCount = jobs.length;
  const scheduledValue = jobs.reduce(
    (sum, job) => sum + (job.price_cents ?? 0),
    0
  );
  const scheduledHours = jobs.reduce((sum, job) => {
    const value =
      job.hours_numeric === null || job.hours_numeric === ""
        ? 0
        : Number(job.hours_numeric);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

  async function createJob() {
    setError("");

    if (!title.trim()) return setError("Title is required");
    if (!scheduledFor) return setError("Scheduled date/time is required");

    const priceCents =
      price.trim() === "" ? null : Math.round(Number(price) * 100);

    if (priceCents !== null && (Number.isNaN(priceCents) || priceCents < 0)) {
      return setError("Price must be a valid number");
    }

    const hoursNum = hours.trim() === "" ? null : Number(hours);

    if (hoursNum !== null && (Number.isNaN(hoursNum) || hoursNum < 0)) {
      return setError("Hours must be a valid number");
    }

    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        scheduledFor: new Date(scheduledFor).toISOString(),
        clientId: clientId || null,
        propertyId: propertyId || null,
        notes: notes.trim() || null,
        priceCents: priceCents === null ? "" : priceCents,
        hours: hoursNum === null ? "" : hoursNum,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to create job");
      return;
    }

    setTitle("");
    setScheduledFor("");
    setClientId("");
    setPropertyId("");
    setNotes("");
    setPrice("");
    setHours("");

    await loadAll();
  }

  function clientName(id: string | null) {
    if (!id) return "";
    return clients.find((c) => c.id === id)?.name ?? "";
  }

  function propertyName(id: string | null) {
    if (!id) return "";
    return properties.find((p) => p.id === id)?.name ?? "";
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-white px-7 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Calendar
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Operational schedule
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Jobs are your live operational tasks. Add and track them here, and they
              stay attached to the client record for history.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Scheduled jobs
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {upcomingCount}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Scheduled value
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {formatMoney(scheduledValue)}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Scheduled hours
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {scheduledHours.toFixed(1)}h
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

      <section className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-stone-900">Add job</h2>
            <p className="mt-1 text-sm text-stone-500">
              Capture the task, timing, client link, and notes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelClassName()}>Title</label>
            <input
              className={inputClassName()}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly home check"
            />
          </div>

          <div className="space-y-2">
            <label className={labelClassName()}>Scheduled for</label>
            <input
              type="datetime-local"
              className={inputClassName()}
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClassName()}>Client</label>
            <select
              className={inputClassName()}
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setPropertyId("");
              }}
            >
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
            >
              <option value="">—</option>
              {propertiesForClient.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={labelClassName()}>Price (USD)</label>
            <input
              className={inputClassName()}
              placeholder="e.g. 125"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClassName()}>Hours</label>
            <input
              className={inputClassName()}
              placeholder="e.g. 1.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label className={labelClassName()}>Notes</label>
          <textarea
            className={`${inputClassName()} min-h-[130px] resize-none`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Access notes, supplies used, special client requests, issues found..."
          />
        </div>

        <div className="mt-6">
          <button
            onClick={createJob}
            className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
          >
            Save job
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Pipeline
            </div>
            <h2 className="mt-2 font-serif text-2xl text-stone-900">
              Upcoming & scheduled
            </h2>
          </div>

          {loading ? (
            <div className="text-sm text-stone-500">Loading…</div>
          ) : (
            <div className="text-sm text-stone-500">
              {jobs.length} total job{jobs.length === 1 ? "" : "s"}
            </div>
          )}
        </div>

        {!loading && sortedDays.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-stone-300 bg-white px-6 py-10 text-sm text-stone-500">
            No jobs yet. Add your first job above.
          </div>
        ) : null}

        {sortedDays.map((day) => (
          <div
            key={day}
            className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-col gap-2 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                  {day}
                </div>
                <div className="mt-1 font-serif text-2xl text-stone-900">
                  {formatDayLabel(day)}
                </div>
              </div>

              <div className="text-sm text-stone-500">
                {jobsByDay.get(day)?.length ?? 0} job
                {(jobsByDay.get(day)?.length ?? 0) === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {(jobsByDay.get(day) ?? []).map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-medium text-stone-900">
                          {job.title}
                        </h3>
                        <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-600">
                          {job.status}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-stone-600">
                        {new Date(job.scheduled_for).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {job.client_id ? ` • ${clientName(job.client_id)}` : ""}
                        {job.property_id ? ` • ${propertyName(job.property_id)}` : ""}
                      </div>

                      {job.notes ? (
                        <div className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
                          {job.notes}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid min-w-[170px] grid-cols-2 gap-3 md:grid-cols-1">
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                          Value
                        </div>
                        <div className="mt-1 text-sm font-medium text-stone-900">
                          {formatMoney(job.price_cents) || "—"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                          Hours
                        </div>
                        <div className="mt-1 text-sm font-medium text-stone-900">
                          {job.hours_numeric ? `${job.hours_numeric}h` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}