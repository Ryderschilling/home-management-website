"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
};

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
  completed_at?: string | null;
};

type Order = {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  client_name?: string | null;
  product_key?: string | null;
  rock_color?: string | null;
  total_amount_cents?: number | null;
  fulfillment_status?: string | null;
  created_at?: string | null;
  ordered_at?: string | null;
  installed_at?: string | null;
};

function formatMoney(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
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
  return new Date(year, monthIndex, 1).getDay();
}

function toDatetimeLocalValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function cleanProductLabel(value: string | null | undefined) {
  if (!value) return "Order";
  return value.replaceAll("_", " ");
}

const S = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  cardInner: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
  },
  label: {
    fontFamily: "var(--font-mono), monospace",
    fontSize: "9px",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
  },
  heading: {
    fontFamily: "var(--font-serif), 'Instrument Serif', serif",
    color: "var(--text-primary)",
  },
  subtext: { fontSize: "13px", color: "var(--text-secondary)", fontWeight: 300 },
  input: {
    width: "100%",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.15s",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 18px",
    background: "var(--accent)",
    color: "#0e0e0f",
    border: "none",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    padding: "9px 14px",
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "all 0.15s ease",
    textDecoration: "none",
  },
  btnSmall: {
    padding: "8px 12px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    fontSize: "11px",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
};

const shellPadding = "clamp(20px, 4vw, 32px)";
const shellPaddingCompact = "clamp(18px, 3vw, 24px)";

function statusPillStyle(status: string): React.CSSProperties {
  const s = status.toUpperCase();
  if (s === "NEW") return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: "999px", padding: "3px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "ORDERED") return { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", borderRadius: "999px", padding: "3px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "INSTALLED") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: "999px", padding: "3px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "CANCELED") return { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: "999px", padding: "3px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "999px", padding: "3px 10px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" };
}

export default function PortalDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState<string>(toLocalDateKeyFromDate(now));

  const [showAddJob, setShowAddJob] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
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
    const [jobsRes, clientsRes, propsRes, servicesRes, ordersRes] = await Promise.all([
      fetch("/api/admin/jobs"),
      fetch("/api/admin/clients"),
      fetch("/api/admin/properties"),
      fetch("/api/admin/services"),
      fetch("/api/admin/orders"),
    ]);
    if (!jobsRes.ok) throw new Error("Failed to load jobs");
    if (!clientsRes.ok) throw new Error("Failed to load clients");
    if (!propsRes.ok) throw new Error("Failed to load properties");
    if (!servicesRes.ok) throw new Error("Failed to load services");
    if (!ordersRes.ok) throw new Error("Failed to load orders");
    const jobsJson = await jobsRes.json();
    const clientsJson = await clientsRes.json();
    const propsJson = await propsRes.json();
    const servicesJson = await servicesRes.json();
    const ordersJson = await ordersRes.json();
    setJobs(jobsJson.data ?? []);
    setClients(clientsJson.data ?? []);
    setProperties(propsJson.data ?? []);
    setServices(servicesJson.data ?? []);
    setOrders(ordersJson.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll().catch((e) => {
      setError(e instanceof Error ? e.message : "Failed to load");
      setLoading(false);
    });
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
      list.sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());
      map.set(k, list);
    }
    return map;
  }, [jobs]);

  const selectedDayJobs = useMemo(() => jobsByDay.get(selectedDayKey) ?? [], [jobsByDay, selectedDayKey]);
  const scheduledValue = useMemo(() => jobs.reduce((sum, job) => sum + (job.price_cents ?? 0), 0), [jobs]);
  const scheduledHours = useMemo(() => jobs.reduce((sum, job) => {
    const value = job.hours_numeric === null || job.hours_numeric === "" ? 0 : Number(job.hours_numeric);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0), [jobs]);

  const todayKey = toLocalDateKeyFromDate(new Date());
  const todayJobs = useMemo(() =>
    jobs.filter((job) => toLocalDateKeyFromISO(job.scheduled_for) === todayKey)
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()),
    [jobs, todayKey]
  );

  const upcomingJobs = useMemo(() => {
    const nowTs = Date.now();
    return jobs.filter((job) => new Date(job.scheduled_for).getTime() >= nowTs)
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
      .slice(0, 8);
  }, [jobs]);

  const actionOrders = useMemo(() =>
    orders.filter((order) => {
      const status = String(order.fulfillment_status ?? "NEW").toUpperCase();
      return status === "NEW" || status === "ORDERED";
    }).sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    }).slice(0, 8),
    [orders]
  );

  const dashboardStats = useMemo(() => {
    const newOrders = orders.filter((o) => String(o.fulfillment_status ?? "NEW").toUpperCase() === "NEW").length;
    const ordered = orders.filter((o) => String(o.fulfillment_status ?? "NEW").toUpperCase() === "ORDERED").length;
    const installed = orders.filter((o) => String(o.fulfillment_status ?? "NEW").toUpperCase() === "INSTALLED").length;
    return {
      clients: clients.length,
      jobs: jobs.length,
      revenue: orders.reduce((sum, order) => sum + (order.total_amount_cents ?? 0), 0),
      newOrders, ordered, installed,
      todayJobs: todayJobs.length,
    };
  }, [clients.length, jobs.length, orders, todayJobs.length]);

  const propertiesForClient = useMemo(() =>
    !clientId ? [] : properties.filter((p) => p.client_id === clientId),
    [properties, clientId]
  );

  useEffect(() => {
    if (!clientId) { setPropertyId(""); return; }
    if (propertiesForClient.length === 1) { setPropertyId(propertiesForClient[0].id); return; }
    if (!propertiesForClient.some((p) => p.id === propertyId)) setPropertyId("");
  }, [clientId, propertiesForClient, propertyId]);

  const selectedService = useMemo(() => services.find((s: any) => s.id === serviceId) ?? null, [services, serviceId]);

  useEffect(() => {
    if (!selectedService) return;
    if (!title.trim()) setTitle(selectedService.name ?? "");
    if (!price.trim() && typeof selectedService.unit_price_cents === "number")
      setPrice((selectedService.unit_price_cents / 100).toFixed(2));
  }, [selectedService, title, price]);

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
    const cells: Array<{ kind: "blank" } | { kind: "day"; date: Date; key: string }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ kind: "blank" });
    for (let d = 1; d <= dim; d++) {
      const date = new Date(viewYear, viewMonth, d, 12, 0, 0);
      cells.push({ kind: "day", date, key: toLocalDateKeyFromDate(date) });
    }
    while (cells.length % 7 !== 0) cells.push({ kind: "blank" });
    return cells;
  }, [viewYear, viewMonth]);

  function goPrevMonth() { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  function goNextMonth() { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  function jumpToday() { const d = new Date(); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setSelectedDayKey(toLocalDateKeyFromDate(d)); }

  function onClickDay(dayKey: string) {
    setSelectedDayKey(dayKey);
    if (showAddJob && !scheduledFor?.trim()) setScheduledFor(toDatetimeLocalValue(new Date(`${dayKey}T09:00:00`)));
  }

  function openAddJob() {
    setShowAddJob(true);
    if (!scheduledFor?.trim()) setScheduledFor(toDatetimeLocalValue(new Date(`${selectedDayKey}T09:00:00`)));
    setTimeout(() => addJobRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function deleteActiveJob() {
    if (!activeJobId) return;
    if (!window.confirm("Delete this task permanently?")) return;
    try {
      setError("");
      const res = await fetch(`/api/admin/jobs/${activeJobId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete task");
      setActiveJobId(null);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  async function createJob() {
    setError("");
    if (!serviceId && !title.trim()) return setError("Title is required");
    if (!scheduledFor) return setError("Scheduled date/time is required");
    if (!clientId) return setError("Client is required");
    if (!propertyId) return setError("Property is required");
    const priceCents = price.trim() === "" ? null : Math.round(Number(price) * 100);
    if (priceCents !== null && (Number.isNaN(priceCents) || priceCents < 0)) return setError("Price must be a valid number");
    const hoursNum = hours.trim() === "" ? null : Number(hours);
    if (hoursNum !== null && (Number.isNaN(hoursNum) || hoursNum < 0)) return setError("Hours must be a valid number");
    if (recurrenceEnabled && !recurrenceEndDate) return setError("Repeat until date is required for recurring jobs");
    const res = await fetch("/api/admin/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        scheduledFor: new Date(scheduledFor).toISOString(),
        clientId, propertyId,
        serviceId: serviceId || null,
        notes: notes.trim() || null,
        priceCents: priceCents === null ? "" : priceCents,
        hours: hoursNum === null ? "" : hoursNum,
        recurrenceEnabled,
        recurrenceFrequency: recurrenceEnabled ? recurrenceFrequency : null,
        recurrenceInterval: recurrenceEnabled ? Number(recurrenceInterval || "1") : null,
        recurrenceEndDate: recurrenceEnabled && recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString() : null,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) { setError(json?.error?.message ?? "Failed to create job"); return; }
    setServiceId(""); setTitle(""); setNotes(""); setPrice(""); setHours("");
    setClientId(""); setPropertyId("");
    setRecurrenceEnabled(false); setRecurrenceFrequency("WEEKLY"); setRecurrenceInterval("1"); setRecurrenceEndDate("");
    await loadAll();
    setSelectedDayKey(toLocalDateKeyFromISO(json?.data?.scheduled_for ?? new Date().toISOString()));
    setShowAddJob(false);
  }

  const activeJob = useMemo(() => (!activeJobId ? null : jobs.find((j) => j.id === activeJobId) ?? null), [activeJobId, jobs]);
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">

      {/* Command Center */}
      <section style={{ ...S.card, padding: shellPadding }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div style={{ maxWidth: "520px" }}>
            <div style={S.label}>Dashboard</div>
            <h1 style={{ ...S.heading, fontSize: "32px", lineHeight: 1.1, marginTop: "8px", letterSpacing: "-0.01em" }}>
              Business command center
            </h1>
            <p style={{ ...S.subtext, marginTop: "8px", lineHeight: 1.6 }}>
              See today&apos;s work, orders needing action, recent clients, and the live operating picture of the business.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={openAddJob} style={S.btnPrimary}>+ Add job</button>
            {[
              { href: "/portal/orders", label: "Orders" },
              { href: "/portal/clients", label: "Clients" },
              { href: "/portal/services", label: "Services" },
              { href: "/portal/jobs", label: "Jobs" },
              { href: "/portal/contacts", label: "Contacts" },
              { href: "/portal/retainers", label: "Retainers" },
              { href: "/portal/exports", label: "Exports" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={S.btnGhost}>{l.label}</Link>
            ))}
          </div>
        </div>
        {error ? (
          <div style={{ borderRadius: "8px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", padding: "12px 16px", fontSize: "13px", color: "#f87171", marginTop: "16px" }}>
            {error}
          </div>
        ) : null}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Revenue", value: formatMoney(dashboardStats.revenue), accent: true },
          { label: "Clients", value: dashboardStats.clients },
          { label: "Jobs", value: dashboardStats.jobs },
          { label: "New Orders", value: dashboardStats.newOrders },
          { label: "Ordered", value: dashboardStats.ordered },
          { label: "Today's Jobs", value: dashboardStats.todayJobs },
        ].map((stat) => (
          <div key={stat.label} style={{ ...S.card, padding: shellPaddingCompact, ...(stat.accent ? { borderColor: "rgba(201,184,154,0.2)", background: "linear-gradient(135deg, var(--surface) 0%, rgba(201,184,154,0.04) 100%)" } : {}) }}>
            <div style={S.label}>{stat.label}</div>
            <div style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: "26px", letterSpacing: "-0.02em", lineHeight: 1, marginTop: "10px", color: stat.accent ? "var(--accent-warm)" : "var(--text-primary)" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      {/* Today + Orders */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div style={{ ...S.card }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ padding: `${shellPaddingCompact} ${shellPaddingCompact} 16px`, borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={S.label}>Today</div>
              <div style={{ ...S.heading, fontSize: "18px", marginTop: "2px" }}>Today&apos;s tasks</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#4ade80", fontFamily: "var(--font-mono), monospace" }}>
              <span style={{ width: "5px", height: "5px", background: "#4ade80", borderRadius: "50%", display: "inline-block", animation: "livePulse 2s infinite" }} />
              Live
            </div>
          </div>
          <div style={{ padding: `16px ${shellPaddingCompact}`, display: "flex", flexDirection: "column", gap: "8px" }}>
            {todayJobs.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "10px" }}>
                No jobs scheduled today
              </div>
            ) : todayJobs.map((job) => (
              <button key={job.id} onClick={() => setActiveJobId(job.id)}
                style={{ width: "100%", ...S.cardInner, padding: "14px 16px", textAlign: "left", cursor: "pointer" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{job.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "3px" }}>
                  {new Date(job.scheduled_for).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {clientName(job.client_id)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...S.card }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ padding: `${shellPaddingCompact} ${shellPaddingCompact} 16px`, borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={S.label}>Fulfillment</div>
              <div style={{ ...S.heading, fontSize: "18px", marginTop: "2px" }}>Orders needing action</div>
            </div>
            <Link href="/portal/orders" style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-mono), monospace" }}>
              View all
            </Link>
          </div>
          <div style={{ padding: `16px ${shellPaddingCompact}`, display: "flex", flexDirection: "column", gap: "8px" }}>
            {actionOrders.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "10px" }}>
                No active orders need action
              </div>
            ) : actionOrders.map((order) => {
              const status = String(order.fulfillment_status ?? "NEW").toUpperCase();
              return (
                <div key={order.id} style={{ ...S.cardInner, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{order.customer_name || order.client_name || "—"}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "3px" }}>{cleanProductLabel(order.product_key)} · {order.rock_color || "—"}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{formatMoney(order.total_amount_cents)}</div>
                    </div>
                    <span style={statusPillStyle(status)}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming + Calendar */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div style={{ ...S.card }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ padding: `${shellPaddingCompact} ${shellPaddingCompact} 16px`, borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={S.label}>Upcoming</div>
              <div style={{ ...S.heading, fontSize: "18px", marginTop: "2px" }}>Upcoming jobs</div>
            </div>
            <div style={{ fontSize: "11px", color: "var(--accent-warm)", fontFamily: "var(--font-mono), monospace", letterSpacing: "0.04em" }}>
              {formatMoney(scheduledValue)} · {scheduledHours.toFixed(1)}h
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {upcomingJobs.length === 0 ? (
              <div style={{ padding: `32px ${shellPaddingCompact}`, textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>No upcoming jobs scheduled.</div>
            ) : upcomingJobs.map((job) => (
<button
  key={job.id}
  onClick={() => setActiveJobId(job.id)}
  className="flex w-full flex-col items-start gap-3 text-left transition sm:flex-row sm:items-center sm:justify-between"
  style={{
    padding: `14px ${shellPaddingCompact}`,
    cursor: "pointer",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid var(--border)",
    width: "100%",
  } as React.CSSProperties}
  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-2)")}
  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{job.title}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "3px", fontFamily: "var(--font-mono), monospace", letterSpacing: "0.02em" }}>
                    {new Date(job.scheduled_for).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {clientName(job.client_id)} · {propertyName(job.property_id)}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono), monospace", flexShrink: 0, marginLeft: "16px" }}>
                  {formatMoney(job.price_cents)}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...S.card }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ padding: `${shellPaddingCompact} ${shellPaddingCompact} 16px`, borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={S.label}>Calendar</div>
              <div style={{ ...S.heading, fontSize: "18px", marginTop: "2px" }}>Monthly view</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={jumpToday} style={S.btnSmall}>Today</button>
              <button onClick={goPrevMonth} style={S.btnSmall}>‹</button>
              <button onClick={goNextMonth} style={S.btnSmall}>›</button>
            </div>
          </div>
          <div style={{ padding: shellPaddingCompact }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px", fontWeight: 300 }}>
              {formatMonthLabel(viewYear, viewMonth)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
              {weekdayLabels.map((w) => (
                <div key={w} style={{ ...S.label, fontSize: "9px", textAlign: "center", paddingBottom: "8px" }}>{w}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
              {monthGrid.map((cell, idx) => {
                if (cell.kind === "blank") return <div key={`b-${idx}`} style={{ aspectRatio: "1" }} />;
                const dayNum = cell.date.getDate();
                const dayKey = cell.key;
                const isSelected = dayKey === selectedDayKey;
                const isToday = dayKey === toLocalDateKeyFromDate(new Date());
                const count = (jobsByDay.get(dayKey) ?? []).length;
                return (
                  <button key={dayKey} onClick={() => onClickDay(dayKey)}
                    style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "6px", cursor: "pointer", fontSize: "12px", color: isSelected ? "#0e0e0f" : isToday ? "var(--accent-warm)" : "var(--text-secondary)", background: isSelected ? "var(--accent)" : "transparent", border: isToday && !isSelected ? "1px solid rgba(201,184,154,0.3)" : "1px solid transparent", fontWeight: isSelected || isToday ? 600 : 400, gap: "2px", transition: "all 0.15s" }}>
                    <span>{dayNum}</span>
                    <span style={{ fontSize: "9px", color: isSelected ? "rgba(14,14,15,0.6)" : "var(--text-muted)", opacity: count > 0 ? 1 : 0.4 }}>
                      {count > 0 ? count : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <div style={S.label}>Selected day</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{formatDayLabel(selectedDayKey)}</div>
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedDayJobs.length === 0 ? (
                  <div style={{ padding: "14px", fontSize: "12px", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "8px", textAlign: "center" }}>No tasks scheduled</div>
                ) : selectedDayJobs.slice(0, 4).map((job) => (
                  <button key={job.id} onClick={() => setActiveJobId(job.id)}
                    style={{ ...S.cardInner, padding: "10px 12px", textAlign: "left", cursor: "pointer", width: "100%" }}>
                    <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{job.title}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px", fontFamily: "var(--font-mono), monospace" }}>
                      {new Date(job.scheduled_for).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Job Form */}
      {showAddJob ? (
        <section ref={addJobRef} style={{ ...S.card, padding: shellPadding }}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div style={{ ...S.heading, fontSize: "22px" }}>Add job</div>
              <p style={{ ...S.subtext, marginTop: "4px" }}>Choose a service or create a custom job. Set a recurring schedule if needed.</p>
            </div>
            <button onClick={() => setShowAddJob(false)} style={S.btnGhost}>Close</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div style={{ ...S.label, marginBottom: "6px" }}>Service</div>
              <select style={{ ...S.input, fontFamily: "inherit" }} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Custom job / no predefined service</option>
                {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} — ${(s.unit_price_cents / 100).toFixed(2)}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Title</div>
              <input style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Custom job title" />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Scheduled for</div>
              <input type="datetime-local" style={S.input} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Client</div>
              <select style={{ ...S.input, fontFamily: "inherit" }} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Property</div>
              <select style={{ ...S.input, fontFamily: "inherit" }} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={!clientId || propertiesForClient.length === 0}>
                <option value="">{!clientId ? "Select client first" : propertiesForClient.length === 0 ? "No properties for this client" : "Select property"}</option>
                {propertiesForClient.map((p) => <option key={p.id} value={p.id}>{p.name}{p.address_line1 ? ` — ${p.address_line1}` : ""}</option>)}
              </select>
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Price (USD)</div>
              <input style={S.input} placeholder="e.g. 125" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Hours</div>
              <input style={S.input} placeholder="e.g. 1.5" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="md:col-span-2" style={{ ...S.cardInner, padding: "16px" }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div style={S.label}>Recurring schedule</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Repeat this job on a schedule.</div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={recurrenceEnabled} onChange={(e) => setRecurrenceEnabled(e.target.checked)} />
                  Enable
                </label>
              </div>
              {recurrenceEnabled ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <div style={{ ...S.label, marginBottom: "6px" }}>Frequency</div>
                    <select style={{ ...S.input, fontFamily: "inherit" }} value={recurrenceFrequency} onChange={(e) => setRecurrenceFrequency(e.target.value)}>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ ...S.label, marginBottom: "6px" }}>Every</div>
                    <input style={S.input} value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(e.target.value)} placeholder="1" />
                  </div>
                  <div>
                    <div style={{ ...S.label, marginBottom: "6px" }}>Repeat until</div>
                    <input type="date" style={S.input} value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <div style={{ ...S.label, marginBottom: "6px" }}>Notes</div>
            <textarea style={{ ...S.input, minHeight: "120px", resize: "vertical", fontFamily: "inherit" }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access notes, supplies used, special client requests, issues found..." />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <button onClick={createJob} style={S.btnPrimary}>Save job</button>
            <button onClick={() => setShowAddJob(false)} style={S.btnGhost}>Cancel</button>
          </div>
        </section>
      ) : null}

      {/* Job Detail Modal */}
      {activeJob ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", padding: "max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))" }} onClick={() => setActiveJobId(null)}>
          <div style={{ width: "100%", maxWidth: "560px", ...S.card, padding: shellPadding, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div style={{ minWidth: 0 }}>
                <div style={S.label}>Task details</div>
                <div style={{ ...S.heading, fontSize: "26px", marginTop: "6px", overflowWrap: "anywhere" }}>{activeJob.title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px", fontFamily: "var(--font-mono), monospace", letterSpacing: "0.02em" }}>
                  {new Date(activeJob.scheduled_for).toLocaleString([], { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end" style={{ flexShrink: 0 }}>
                <button onClick={deleteActiveJob} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#f87171", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>Delete</button>
                <button onClick={() => setActiveJobId(null)} style={S.btnGhost}>Close</button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Client", value: clientName(activeJob.client_id) },
                { label: "Property", value: propertyName(activeJob.property_id), sub: propertyAddress(activeJob.property_id) || undefined },
                { label: "Status", value: activeJob.status },
                { label: "Value / Hours", value: `${formatMoney(activeJob.price_cents)} · ${activeJob.hours_numeric ? `${activeJob.hours_numeric}h` : "—"}` },
              ].map((field) => (
                <div key={field.label} style={{ ...S.cardInner, padding: "14px" }}>
                  <div style={S.label}>{field.label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginTop: "4px" }}>{field.value}</div>
                  {field.sub ? <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{field.sub}</div> : null}
                </div>
              ))}
            </div>
            <div style={{ ...S.cardInner, padding: "14px", marginTop: "10px" }}>
              <div style={S.label}>Notes</div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: activeJob.notes ? "var(--text-primary)" : "var(--text-muted)", marginTop: "6px" }}>
                {activeJob.notes || "—"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
