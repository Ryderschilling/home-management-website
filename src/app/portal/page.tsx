"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Client = { id: string; name: string };
type Property = {
  id: string;
  name: string;
  client_id: string | null;
  address_line1: string | null;
};
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
  service_id?: string | null;
};

function formatMoney(cents: number | null) {
  if (cents === null || cents === undefined) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function toLocalDateKeyFromDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalDateKeyFromISO(iso: string) {
  return toLocalDateKeyFromDate(new Date(iso));
}

function formatDayLabel(dayKey: string) {
  const d = new Date(`${dayKey}T12:00:00`);
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(year: number, monthIndex: number) {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay(); // 0=Sun..6=Sat
}

function toDatetimeLocalValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState<string>(
    toLocalDateKeyFromDate(now)
  );

  const [showAddJob, setShowAddJob] = useState(false);

  // Job form fields
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");

  // Recurrence fields
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState("WEEKLY");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [error, setError] = useState<string>("");

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const addJobRef = useRef<HTMLDivElement | null>(null);

  async function loadAll() {
    setLoading(true);
    setError("");

    const [jobsRes, clientsRes, propsRes, servicesRes] = await Promise.all([
      fetch("/api/admin/jobs"),
      fetch("/api/admin/clients"),
      fetch("/api/admin/properties"),
      fetch("/api/admin/services"),
    ]);

    if (!jobsRes.ok) throw new Error("Failed to load jobs");
    if (!clientsRes.ok) throw new Error("Failed to load clients");
    if (!propsRes.ok) throw new Error("Failed to load properties");
    if (!servicesRes.ok) throw new Error("Failed to load services");

    const jobsJson = await jobsRes.json();
    const clientsJson = await clientsRes.json();
    const propsJson = await propsRes.json();
    const servicesJson = await servicesRes.json();

    setJobs(jobsJson.data ?? []);
    setClients(clientsJson.data ?? []);
    setProperties(propsJson.data ?? []);
    setServices(servicesJson.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      const key = toLocalDateKeyFromISO(job.scheduled_for);
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    for (const [k, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduled_for).getTime() -
          new Date(b.scheduled_for).getTime()
      );
      map.set(k, list);
    }
    return map;
  }, [jobs]);

  const selectedDayJobs = useMemo(() => {
    return jobsByDay.get(selectedDayKey) ?? [];
  }, [jobsByDay, selectedDayKey]);

  const scheduledValue = useMemo(
    () => jobs.reduce((sum, job) => sum + (job.price_cents ?? 0), 0),
    [jobs]
  );

  const scheduledHours = useMemo(() => {
    return jobs.reduce((sum, job) => {
      const value =
        job.hours_numeric === null || job.hours_numeric === ""
          ? 0
          : Number(job.hours_numeric);
      return sum + (Number.isNaN(value) ? 0 : value);
    }, 0);
  }, [jobs]);

  const propertiesForClient = useMemo(() => {
    if (!clientId) return [];
    return properties.filter((p) => p.client_id === clientId);
  }, [properties, clientId]);

  useEffect(() => {
    if (!clientId) {
      setPropertyId("");
      return;
    }
    if (propertiesForClient.length === 1) {
      setPropertyId(propertiesForClient[0].id);
      return;
    }
    if (!propertiesForClient.some((p) => p.id === propertyId)) {
      setPropertyId("");
    }
  }, [clientId, propertiesForClient, propertyId]);

  const selectedService = useMemo(() => {
    return services.find((s: any) => s.id === serviceId) ?? null;
  }, [services, serviceId]);

  // If a service is selected, fill title/price only when those fields are empty
  useEffect(() => {
    if (!selectedService) return;

    if (!title.trim()) setTitle(selectedService.name ?? "");
    if (!price.trim() && typeof selectedService.unit_price_cents === "number") {
      setPrice((selectedService.unit_price_cents / 100).toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService]);

  function clientName(id: string | null) {
    if (!id) return "—";
    return clients.find((c) => c.id === id)?.name ?? "—";
  }

  function propertyName(id: string | null) {
    if (!id) return "—";
    return properties.find((p) => p.id === id)?.name ?? "—";
  }

  function propertyAddress(id: string | null) {
    if (!id) return "";
    return properties.find((p) => p.id === id)?.address_line1 ?? "";
  }

  const monthGrid = useMemo(() => {
    const firstDow = startDayOfMonth(viewYear, viewMonth);
    const dim = daysInMonth(viewYear, viewMonth);

    const cells: Array<
      { kind: "blank" } | { kind: "day"; date: Date; key: string }
    > = [];

    for (let i = 0; i < firstDow; i++) cells.push({ kind: "blank" });

    for (let d = 1; d <= dim; d++) {
      const date = new Date(viewYear, viewMonth, d, 12, 0, 0);
      const key = toLocalDateKeyFromDate(date);
      cells.push({ kind: "day", date, key });
    }

    while (cells.length % 7 !== 0) cells.push({ kind: "blank" });

    return cells;
  }, [viewYear, viewMonth]);

  function goPrevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function goNextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function jumpToday() {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelectedDayKey(toLocalDateKeyFromDate(d));
  }

  function onClickDay(dayKey: string) {
    setSelectedDayKey(dayKey);

    if (showAddJob) {
      const current = scheduledFor?.trim();
      if (!current) {
        const pref = new Date(`${dayKey}T09:00:00`);
        setScheduledFor(toDatetimeLocalValue(pref));
      }
    }
  }

  function openAddJob() {
    setShowAddJob(true);
    if (!scheduledFor?.trim()) {
      const pref = new Date(`${selectedDayKey}T09:00:00`);
      setScheduledFor(toDatetimeLocalValue(pref));
    }
    setTimeout(() => {
      addJobRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function createJob() {
    setError("");

    // If no service selected, title required. If service selected, backend can default title.
    if (!serviceId && !title.trim()) return setError("Title is required");
    if (!scheduledFor) return setError("Scheduled date/time is required");
    if (!clientId) return setError("Client is required");
    if (!propertyId) return setError("Property is required");

    const priceCents =
      price.trim() === "" ? null : Math.round(Number(price) * 100);
    if (priceCents !== null && (Number.isNaN(priceCents) || priceCents < 0)) {
      return setError("Price must be a valid number");
    }

    const hoursNum = hours.trim() === "" ? null : Number(hours);
    if (hoursNum !== null && (Number.isNaN(hoursNum) || hoursNum < 0)) {
      return setError("Hours must be a valid number");
    }

    if (recurrenceEnabled && !recurrenceEndDate) {
      return setError("Repeat until date is required for recurring jobs");
    }

    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        scheduledFor: new Date(scheduledFor).toISOString(),
        clientId,
        propertyId,
        serviceId: serviceId || null,
        notes: notes.trim() || null,
        priceCents: priceCents === null ? "" : priceCents,
        hours: hoursNum === null ? "" : hoursNum,
        recurrenceEnabled,
        recurrenceFrequency: recurrenceEnabled ? recurrenceFrequency : null,
        recurrenceInterval: recurrenceEnabled
          ? Number(recurrenceInterval || "1")
          : null,
        recurrenceEndDate:
          recurrenceEnabled && recurrenceEndDate
            ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString()
            : null,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json?.error?.message ?? "Failed to create job");
      return;
    }

    // reset form
    setServiceId("");
    setTitle("");
    setNotes("");
    setPrice("");
    setHours("");
    setClientId("");
    setPropertyId("");

    setRecurrenceEnabled(false);
    setRecurrenceFrequency("WEEKLY");
    setRecurrenceInterval("1");
    setRecurrenceEndDate("");

    await loadAll();

    const newDayKey = toLocalDateKeyFromISO(
      json?.data?.scheduled_for ?? new Date().toISOString()
    );
    setSelectedDayKey(newDayKey);
    setShowAddJob(false);
  }

  const activeJob = useMemo(() => {
    if (!activeJobId) return null;
    return jobs.find((j) => j.id === activeJobId) ?? null;
  }, [activeJobId, jobs]);

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-8">
      {/* Header / Metrics */}
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
              Monthly calendar view. Click a day to see tasks. Click a task for
              full details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Scheduled jobs
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {jobs.length}
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

      {/* Calendar + Day Panel */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                Month
              </div>
              <div className="mt-2 font-serif text-2xl text-stone-900">
                {formatMonthLabel(viewYear, viewMonth)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={jumpToday}
                className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
              >
                Today
              </button>
              <button
                onClick={goPrevMonth}
                className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
              >
                Prev
              </button>
              <button
                onClick={goNextMonth}
                className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
              >
                Next
              </button>

              <div className="w-px self-stretch bg-stone-200 mx-1 hidden sm:block" />

              <button
                onClick={openAddJob}
                className="rounded-full bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-stone-700"
              >
                Add job
              </button>
              <Link
                href="/portal/clients"
                className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
              >
                Add client
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {weekdayLabels.map((w) => (
              <div
                key={w}
                className="text-[10px] uppercase tracking-[0.22em] text-stone-500 px-1"
              >
                {w}
              </div>
            ))}

            {monthGrid.map((cell, idx) => {
              if (cell.kind === "blank") {
                return (
                  <div key={`b-${idx}`} className="h-24 rounded-xl bg-transparent" />
                );
              }

              const dayNum = cell.date.getDate();
              const dayKey = cell.key;
              const isSelected = dayKey === selectedDayKey;

              const isToday = dayKey === toLocalDateKeyFromDate(new Date());
              const dayJobs = jobsByDay.get(dayKey) ?? [];
              const count = dayJobs.length;

              return (
                <button
                  key={dayKey}
                  onClick={() => onClickDay(dayKey)}
                  className={[
                    "h-24 rounded-2xl border text-left p-3 transition",
                    isSelected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{dayNum}</div>
                    {isToday ? (
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em]",
                          isSelected
                            ? "bg-white/15 text-white"
                            : "bg-white text-stone-700 border border-stone-200",
                        ].join(" ")}
                      >
                        Today
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    {count > 0 ? (
                      <div
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]",
                          isSelected
                            ? "bg-white/15 text-white"
                            : "bg-white text-stone-700 border border-stone-200",
                        ].join(" ")}
                      >
                        {count} task{count === 1 ? "" : "s"}
                      </div>
                    ) : (
                      <div
                        className={[
                          "text-[11px] tracking-wide",
                          isSelected ? "text-white/70" : "text-stone-500",
                        ].join(" ")}
                      >
                        —
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {loading ? <div className="mt-5 text-sm text-stone-500">Loading…</div> : null}
        </div>

        {/* Day Panel */}
        <div className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Selected day
          </div>
          <div className="mt-2 font-serif text-2xl text-stone-900">
            {formatDayLabel(selectedDayKey)}
          </div>

          <div className="mt-4 text-sm text-stone-500">
            {selectedDayJobs.length} task{selectedDayJobs.length === 1 ? "" : "s"}
          </div>

          <div className="mt-5 space-y-3">
            {selectedDayJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                No tasks scheduled for this day.
              </div>
            ) : (
              selectedDayJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setActiveJobId(job.id)}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/70 p-4 text-left transition hover:bg-stone-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-stone-900 truncate">
                        {job.title}
                      </div>
                      <div className="mt-1 text-xs text-stone-600">
                        {new Date(job.scheduled_for).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {clientName(job.client_id)} • {propertyName(job.property_id)}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-stone-600">
                      {job.status}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={openAddJob}
              className="w-full rounded-full bg-stone-900 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-stone-700"
            >
              Add task to this day
            </button>
          </div>
        </div>
      </section>

      {/* Add Job (toggle) */}
      {showAddJob ? (
        <section
          ref={addJobRef}
          className="rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-stone-900">Add job</h2>
              <p className="mt-1 text-sm text-stone-500">
                Choose a service or create a custom job. Set a recurring schedule if needed.
              </p>
            </div>

            <button
              onClick={() => setShowAddJob(false)}
              className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Service */}
            <div className="space-y-2 md:col-span-2">
              <label className={labelClassName()}>Service</label>
              <select
                className={inputClassName()}
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">Custom job / no predefined service</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${(s.unit_price_cents / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className={labelClassName()}>Title</label>
              <input
                className={inputClassName()}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Custom job title"
              />
            </div>

            {/* Scheduled For */}
            <div className="space-y-2">
              <label className={labelClassName()}>Scheduled for</label>
              <input
                type="datetime-local"
                className={inputClassName()}
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>

            {/* Client */}
            <div className="space-y-2">
              <label className={labelClassName()}>Client</label>
              <select
                className={inputClassName()}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property */}
            <div className="space-y-2">
              <label className={labelClassName()}>Property</label>
              <select
                className={inputClassName()}
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={!clientId || propertiesForClient.length === 0}
              >
                <option value="">
                  {!clientId
                    ? "Select client first"
                    : propertiesForClient.length === 0
                    ? "No properties for this client"
                    : "Select property"}
                </option>
                {propertiesForClient.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.address_line1 ? ` — ${p.address_line1}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className={labelClassName()}>Price (USD)</label>
              <input
                className={inputClassName()}
                placeholder="e.g. 125"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <label className={labelClassName()}>Hours</label>
              <input
                className={inputClassName()}
                placeholder="e.g. 1.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-3 md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                    Recurring schedule
                  </div>
                  <div className="mt-1 text-sm text-stone-600">
                    Repeat this job on a schedule.
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={recurrenceEnabled}
                    onChange={(e) => setRecurrenceEnabled(e.target.checked)}
                  />
                  Enable
                </label>
              </div>

              {recurrenceEnabled ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className={labelClassName()}>Frequency</label>
                    <select
                      className={inputClassName()}
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value)}
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
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClassName()}>Repeat until</label>
                    <input
                      type="date"
                      className={inputClassName()}
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-5 space-y-2">
            <label className={labelClassName()}>Notes</label>
            <textarea
              className={`${inputClassName()} min-h-[130px] resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Access notes, supplies used, special client requests, issues found..."
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={createJob}
              className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              Save job
            </button>

            <button
              onClick={() => setShowAddJob(false)}
              className="rounded-full border border-stone-300 px-6 py-3 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {/* Job Detail Modal */}
      {activeJob ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setActiveJobId(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[28px] border border-stone-200 bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                  Task details
                </div>
                <div className="mt-2 font-serif text-3xl text-stone-900 truncate">
                  {activeJob.title}
                </div>
                <div className="mt-2 text-sm text-stone-600">
                  {new Date(activeJob.scheduled_for).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveJobId(null)}
                className="rounded-full border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.22em] text-stone-700 transition hover:bg-stone-100"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Client
                </div>
                <div className="mt-1 text-sm font-medium text-stone-900">
                  {clientName(activeJob.client_id)}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Property
                </div>
                <div className="mt-1 text-sm font-medium text-stone-900">
                  {propertyName(activeJob.property_id)}
                </div>
                <div className="mt-1 text-xs text-stone-600">
                  {propertyAddress(activeJob.property_id) || "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Status
                </div>
                <div className="mt-1 text-sm font-medium text-stone-900">
                  {activeJob.status}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                  Value / Hours
                </div>
                <div className="mt-1 text-sm font-medium text-stone-900">
                  {formatMoney(activeJob.price_cents)} •{" "}
                  {activeJob.hours_numeric ? `${activeJob.hours_numeric}h` : "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                Notes
              </div>
              <div className="mt-2 text-sm leading-6 text-stone-800">
                {activeJob.notes || "—"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}