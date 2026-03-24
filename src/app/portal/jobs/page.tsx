"use client";

import { useRouter } from "next/navigation";
import {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PortalDrawer } from "@/app/portal/_components/PortalDrawer";

type JobPhoto = {
  id: string;
  url: string;
  caption?: string | null;
  uploaded_at?: string | null;
};

type Job = {
  id: string;
  title: string;
  notes?: string | null;
  status: string;
  scheduled_for: string;
  duration_minutes?: number | null;
  hours_numeric?: string | number | null;
  price_cents?: number | null;
  client_id?: string | null;
  property_id?: string | null;
  retainer_id?: string | null;
  recurrence_enabled?: boolean | null;
  recurrence_frequency?: string | null;
  recurrence_interval?: number | null;
  recurrence_end_date?: string | null;
  parent_job_id?: string | null;
  recurring_series_id?: string | null;
  client_name?: string | null;
  property_name?: string | null;
  property_address_line1?: string | null;
  plan_name?: string | null;
  source_type?: string | null;
  plan_visit_modified?: boolean | null;
  completed_at?: string | null;
  photo_count?: number | null;
  photos?: JobPhoto[] | null;
};

type Client = { id: string; name: string };
type Property = {
  id: string;
  client_id?: string | null;
  name: string;
  address_line1?: string | null;
};

type CalendarView = "day" | "week" | "month" | "agenda";
type DrawerMode = "create" | "edit";
type ResizeState = {
  jobId: string;
  startY: number;
  startDuration: number;
  currentDuration: number;
};
type RecurrenceScope =
  | "THIS"
  | "FUTURE"
  | "SERIES"
  | "THIS_VISIT_ONLY"
  | "FUTURE_PLAN_VISITS";
type JobPayload = {
  title: string;
  clientId: string | null;
  propertyId: string | null;
  notes: string | null;
  status: string;
  scheduledFor: string;
  durationMinutes: number | null;
  hours: number | null;
  priceCents: number | null;
};
type ScopeOption = {
  value: RecurrenceScope;
  label: string;
  description: string;
  disabled?: boolean;
  actionLabel?: string;
  tone?: "primary" | "danger" | "neutral";
};
type ScopeModalState = {
  action: "edit" | "delete";
  title: string;
  description: string;
  options: ScopeOption[];
  payload?: Partial<JobPayload>;
};
type DeleteJobResult = {
  deleted: boolean;
  deletedCount: number;
  skippedCompletedCount: number;
  skippedModifiedCount: number;
  recurrenceScope: RecurrenceScope | "NONE";
};

type DraftState = {
  id?: string;
  title: string;
  clientId: string;
  propertyId: string;
  notes: string;
  status: string;
  scheduledFor: string;
  durationMinutes: string;
  hours: string;
  price: string;
  photoFile: File | null;
  photoCaption: string;
};

const S = {
  input:
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary:
    "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhost:
    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
  btnGhostLg:
    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-5 py-3 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
  btnDanger:
    "inline-flex items-center justify-center rounded-lg border border-red-900/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-900/20",
};

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "agenda", label: "Agenda" },
];

const STATUS_OPTIONS = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"];
const START_HOUR = 6;
const END_HOUR = 20;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 28;

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function fmtShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateTimeInputValue(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeInputValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function getDurationMinutes(job: Job, liveResize?: number) {
  if (liveResize) return liveResize;
  if (typeof job.duration_minutes === "number" && job.duration_minutes > 0) {
    return job.duration_minutes;
  }
  const hours = Number(job.hours_numeric ?? 0);
  if (Number.isFinite(hours) && hours > 0) {
    return Math.round(hours * 60);
  }
  return 60;
}

function statusPillStyle(status: string): CSSProperties {
  const normalized = status.toUpperCase();
  if (normalized === "SCHEDULED") {
    return {
      background: "rgba(96,165,250,0.1)",
      border: "1px solid rgba(96,165,250,0.24)",
      color: "#60a5fa",
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 10,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  }
  if (normalized === "IN_PROGRESS") {
    return {
      background: "rgba(251,191,36,0.1)",
      border: "1px solid rgba(251,191,36,0.24)",
      color: "#fbbf24",
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 10,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  }
  if (normalized === "COMPLETED") {
    return {
      background: "rgba(74,222,128,0.1)",
      border: "1px solid rgba(74,222,128,0.24)",
      color: "#4ade80",
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 10,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
    };
  }
  return {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.24)",
    color: "#f87171",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: 10,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  };
}

function getRangeForView(date: Date, view: CalendarView) {
  if (view === "day") {
    const start = startOfDay(date);
    return { start, end: addDays(start, 1) };
  }

  if (view === "week") {
    const start = startOfWeek(date);
    return { start, end: addDays(start, 7) };
  }

  if (view === "month") {
    const monthStart = startOfMonth(date);
    const gridStart = startOfWeek(monthStart);
    const monthEnd = endOfMonth(date);
    const gridEnd = addDays(startOfWeek(addDays(monthEnd, 1)), 7);
    return { start: gridStart, end: gridEnd };
  }

  const start = startOfDay(date);
  return { start, end: addDays(start, 30) };
}

function createEmptyDraft(initialDate?: Date, clientId?: string, propertyId?: string): DraftState {
  const scheduledFor = initialDate ? initialDate.toISOString() : new Date().toISOString();
  return {
    title: "",
    clientId: clientId ?? "",
    propertyId: propertyId ?? "",
    notes: "",
    status: "SCHEDULED",
    scheduledFor: toDateTimeInputValue(scheduledFor),
    durationMinutes: "60",
    hours: "",
    price: "",
    photoFile: null,
    photoCaption: "",
  };
}

function normalizeDraftPayload(draft: DraftState): JobPayload {
  const priceCents = draft.price.trim() === "" ? null : Math.round(Number(draft.price) * 100);
  if (priceCents !== null && Number.isNaN(priceCents)) {
    throw new Error("Price must be a valid number");
  }

  const hours = draft.hours.trim() === "" ? null : Number(draft.hours);
  if (hours !== null && Number.isNaN(hours)) {
    throw new Error("Hours must be a valid number");
  }

  const durationMinutes =
    draft.durationMinutes.trim() === "" ? null : Number(draft.durationMinutes);
  if (durationMinutes !== null && Number.isNaN(durationMinutes)) {
    throw new Error("Duration must be a valid number");
  }

  return {
    title: draft.title.trim(),
    clientId: draft.clientId || null,
    propertyId: draft.propertyId || null,
    notes: draft.notes.trim() || null,
    status: draft.status,
    scheduledFor: fromDateTimeInputValue(draft.scheduledFor),
    durationMinutes,
    hours,
    priceCents,
  };
}

function buildEditPayload(draft: DraftState, job: Job): Partial<JobPayload> {
  const next = normalizeDraftPayload(draft);
  const current: JobPayload = {
    title: job.title ?? "",
    clientId: job.client_id ?? null,
    propertyId: job.property_id ?? null,
    notes: job.notes ?? null,
    status: job.status ?? "SCHEDULED",
    scheduledFor: new Date(job.scheduled_for).toISOString(),
    durationMinutes: getDurationMinutes(job),
    hours:
      job.hours_numeric === undefined || job.hours_numeric === null || job.hours_numeric === ""
        ? null
        : Number(job.hours_numeric),
    priceCents: typeof job.price_cents === "number" ? job.price_cents : null,
  };

  const payload: Partial<JobPayload> = {};
  if (next.title !== current.title) payload.title = next.title;
  if (next.clientId !== current.clientId) payload.clientId = next.clientId;
  if (next.propertyId !== current.propertyId) payload.propertyId = next.propertyId;
  if (next.notes !== current.notes) payload.notes = next.notes;
  if (next.status !== current.status) payload.status = next.status;
  if (next.scheduledFor !== current.scheduledFor) payload.scheduledFor = next.scheduledFor;
  if (next.durationMinutes !== current.durationMinutes) {
    payload.durationMinutes = next.durationMinutes;
  }
  if (next.hours !== current.hours) payload.hours = next.hours;
  if (next.priceCents !== current.priceCents) payload.priceCents = next.priceCents;
  return payload;
}

function isPlanGeneratedJob(job: Job | null | undefined) {
  return String(job?.source_type ?? "").toUpperCase() === "PLAN";
}

function isManualRecurringJob(job: Job | null | undefined) {
  if (!job || isPlanGeneratedJob(job)) return false;
  return Boolean(job.recurring_series_id || job.parent_job_id || job.recurrence_enabled);
}

function hasManualScopedEditRestrictions(payload: Partial<JobPayload>) {
  const allowedKeys = new Set([
    "title",
    "notes",
    "status",
    "durationMinutes",
    "hours",
    "priceCents",
  ]);

  return Object.keys(payload).some((key) => !allowedKeys.has(key));
}

function buildMonthGrid(date: Date) {
  const range = getRangeForView(date, "month");
  const days: Date[] = [];
  let cursor = new Date(range.start);
  while (cursor < range.end) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

function describeRange(view: CalendarView, date: Date) {
  if (view === "day") return fmtShortDate(date.toISOString());
  if (view === "week") {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${fmtShortDate(start.toISOString())} - ${fmtShortDate(end.toISOString())}`;
  }
  if (view === "month") {
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  const end = addDays(date, 29);
  return `${fmtShortDate(date.toISOString())} - ${fmtShortDate(end.toISOString())}`;
}

function nextCursor(date: Date, view: CalendarView, delta: number) {
  const next = new Date(date);
  if (view === "day") next.setDate(next.getDate() + delta);
  else if (view === "week") next.setDate(next.getDate() + delta * 7);
  else if (view === "month") next.setMonth(next.getMonth() + delta);
  else next.setDate(next.getDate() + delta * 30);
  return next;
}

export default function PortalJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<CalendarView>("week");
  const [cursorDate, setCursorDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState>(() => createEmptyDraft());
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [scopeModal, setScopeModal] = useState<ScopeModalState | null>(null);

  const range = useMemo(() => getRangeForView(cursorDate, view), [cursorDate, view]);
  const monthGrid = useMemo(() => buildMonthGrid(cursorDate), [cursorDate]);

  const propertiesForFilterClient = useMemo(() => {
    if (!clientFilter) return properties;
    return properties.filter((property) => property.client_id === clientFilter);
  }, [clientFilter, properties]);

  const draftProperties = useMemo(() => {
    if (!draft.clientId) return properties;
    return properties.filter((property) => property.client_id === draft.clientId);
  }, [draft.clientId, properties]);

  useEffect(() => {
    if (!clientFilter) return;
    if (!propertiesForFilterClient.some((property) => property.id === propertyFilter)) {
      setPropertyFilter("");
    }
  }, [clientFilter, propertiesForFilterClient, propertyFilter]);

  useEffect(() => {
    if (!draft.clientId) return;
    if (!draftProperties.some((property) => property.id === draft.propertyId)) {
      setDraft((current) => ({ ...current, propertyId: "" }));
    }
  }, [draft.clientId, draft.propertyId, draftProperties]);

  async function loadReferenceData() {
    const [clientsRes, propertiesRes] = await Promise.all([
      fetch("/api/admin/clients"),
      fetch("/api/admin/properties"),
    ]);
    const clientsJson = await clientsRes.json();
    const propertiesJson = await propertiesRes.json();
    if (!clientsRes.ok || !clientsJson.ok) {
      throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
    }
    if (!propertiesRes.ok || !propertiesJson.ok) {
      throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
    }
    setClients(clientsJson.data ?? []);
    setProperties(propertiesJson.data ?? []);
  }

  async function loadJobs() {
    const params = new URLSearchParams({
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      includeCompleted: includeCompleted ? "true" : "false",
    });

    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (clientFilter) params.set("clientId", clientFilter);
    if (propertyFilter) params.set("propertyId", propertyFilter);

    const response = await fetch(`/api/admin/jobs?${params.toString()}`);
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json?.error?.message ?? "Failed to load jobs");
    }
    setJobs(json.data ?? []);
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await Promise.all([loadReferenceData(), loadJobs()]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshRangeJobs() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          start: range.start.toISOString(),
          end: range.end.toISOString(),
          includeCompleted: includeCompleted ? "true" : "false",
        });
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (clientFilter) params.set("clientId", clientFilter);
        if (propertyFilter) params.set("propertyId", propertyFilter);

        const response = await fetch(`/api/admin/jobs?${params.toString()}`);
        const json = await response.json();
        if (!response.ok || !json.ok) {
          throw new Error(json?.error?.message ?? "Failed to load jobs");
        }
        if (!cancelled) setJobs(json.data ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load jobs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refreshRangeJobs();
    return () => {
      cancelled = true;
    };
  }, [clientFilter, includeCompleted, propertyFilter, range.end, range.start, statusFilter]);

  const stats = useMemo(() => {
    const scheduled = jobs.filter((job) => job.status === "SCHEDULED").length;
    const inProgress = jobs.filter((job) => job.status === "IN_PROGRESS").length;
    const completed = jobs.filter((job) => job.status === "COMPLETED").length;
    return {
      total: jobs.length,
      scheduled,
      inProgress,
      completed,
    };
  }, [jobs]);

  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? null;

  useEffect(() => {
    if (!selectedJob || !drawerOpen || drawerMode !== "edit") return;
    setDraft({
      id: selectedJob.id,
      title: selectedJob.title ?? "",
      clientId: selectedJob.client_id ?? "",
      propertyId: selectedJob.property_id ?? "",
      notes: selectedJob.notes ?? "",
      status: selectedJob.status ?? "SCHEDULED",
      scheduledFor: toDateTimeInputValue(selectedJob.scheduled_for),
      durationMinutes: String(getDurationMinutes(selectedJob)),
      hours: selectedJob.hours_numeric ? String(selectedJob.hours_numeric) : "",
      price:
        typeof selectedJob.price_cents === "number"
          ? (selectedJob.price_cents / 100).toFixed(2)
          : "",
      photoFile: null,
      photoCaption: "",
    });
  }, [drawerMode, drawerOpen, selectedJob]);

  useEffect(() => {
    if (!resizeState) return;

    function onMove(event: MouseEvent) {
      setResizeState((current) => {
        if (!current) return current;
        const delta = event.clientY - current.startY;
        const slotsMoved = Math.round(delta / SLOT_HEIGHT);
        const minutes = Math.max(30, current.startDuration + slotsMoved * SLOT_MINUTES);
        return { ...current, currentDuration: minutes };
      });
    }

    async function onUp() {
      const current = resizeState;
      setResizeState(null);
      if (!current || current.currentDuration === current.startDuration) return;
      await updateJobDuration(current.jobId, current.currentDuration);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizeState]);

  useEffect(() => {
    if (drawerOpen) return;
    setScopeModal(null);
  }, [drawerOpen]);

  function closeDrawer() {
    setDrawerOpen(false);
    setScopeModal(null);
  }

  function openCreateDrawer(date: Date) {
    setDrawerMode("create");
    setSelectedJobId(null);
    setDraft(createEmptyDraft(date, clientFilter || undefined, propertyFilter || undefined));
    setScopeModal(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(job: Job) {
    setDrawerMode("edit");
    setSelectedJobId(job.id);
    setScopeModal(null);
    setDrawerOpen(true);
  }

  async function refreshJobsOnly() {
    try {
      await loadJobs();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to refresh jobs");
    }
  }

  async function uploadPhoto(jobId: string) {
    if (!draft.photoFile) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("photo", draft.photoFile);
      form.append("caption", draft.photoCaption);
      const response = await fetch(`/api/admin/jobs/${jobId}/photos`, {
        method: "POST",
        body: form,
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to upload photo");
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function refreshSelectedJob(jobId: string) {
    const detailResponse = await fetch(`/api/admin/jobs/${jobId}`);
    const detailJson = await detailResponse.json();
    if (detailResponse.ok && detailJson.ok) {
      setSelectedJobId(jobId);
    }
  }

  async function submitCreateJob(payload: JobPayload) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to save job");
      }

      const savedJobId = json.data?.id as string;
      if (draft.photoFile && savedJobId) {
        await uploadPhoto(savedJobId);
      }

      await refreshJobsOnly();
      if (savedJobId) await refreshSelectedJob(savedJobId);
      closeDrawer();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save job");
    } finally {
      setSaving(false);
    }
  }

  async function submitJobUpdate(payload: Partial<JobPayload>, recurrenceScope?: RecurrenceScope) {
    if (!draft.id) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/jobs/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          recurrenceScope ? { ...payload, recurrenceScope } : payload
        ),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to save job");
      }

      const savedJobId = (json.data?.id as string | undefined) ?? draft.id;
      if (draft.photoFile && savedJobId) {
        await uploadPhoto(savedJobId);
      }

      await refreshJobsOnly();
      if (savedJobId) await refreshSelectedJob(savedJobId);
      closeDrawer();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save job");
    } finally {
      setSaving(false);
    }
  }

  async function submitPhotoOnly(jobId: string) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await uploadPhoto(jobId);
      await refreshJobsOnly();
      await refreshSelectedJob(jobId);
      closeDrawer();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save job");
    } finally {
      setSaving(false);
    }
  }

  function openManualScopeModal(action: "edit" | "delete", payload?: Partial<JobPayload>) {
    const editHasRestrictions =
      action === "edit" && payload ? hasManualScopedEditRestrictions(payload) : false;
    const restrictedDescription =
      "Date, client, property, and recurrence pattern changes stay single-event only in this pass.";

    setScopeModal({
      action,
      title: action === "delete" ? "Delete recurring visit" : "Apply changes to recurring visit",
      description:
        action === "delete"
          ? "Choose how far this manual recurring series action should reach."
          : "Choose how far these manual recurring job updates should reach.",
      payload,
      options: [
        {
          value: "THIS",
          label: "This event only",
          description:
            action === "delete"
              ? "Only this scheduled visit will be removed."
              : "Update only this scheduled visit.",
          actionLabel: action === "delete" ? "Delete this event" : "Save this event",
          tone: action === "delete" ? "danger" : "primary",
        },
        {
          value: "FUTURE",
          label: "This and future events",
          description: editHasRestrictions
            ? restrictedDescription
            : action === "delete"
              ? "Delete this visit and later incomplete visits in the same series."
              : "Update this visit and later incomplete visits in the same series.",
          disabled: editHasRestrictions,
          actionLabel: action === "delete" ? "Delete future events" : "Save future events",
          tone: action === "delete" ? "danger" : "neutral",
        },
        {
          value: "SERIES",
          label: "Entire series",
          description: editHasRestrictions
            ? restrictedDescription
            : action === "delete"
              ? "Delete every incomplete visit in this manual recurring series."
              : "Update every incomplete visit in this manual recurring series.",
          disabled: editHasRestrictions,
          actionLabel: action === "delete" ? "Delete series" : "Save series",
          tone: action === "delete" ? "danger" : "neutral",
        },
      ],
    });
  }

  function openPlanScopeModal(action: "edit" | "delete", payload?: Partial<JobPayload>) {
    setScopeModal({
      action,
      title: action === "delete" ? "Plan-generated visit" : "Apply changes to plan-generated visit",
      description:
        action === "delete"
          ? "Delete only this plan visit or delete this visit and later plan-generated visits for the same plan while preserving completed and manually modified future visits."
          : "Plan-generated visits are owned by the plan. Single-visit changes stay here; future-plan changes go through Plans.",
      payload,
      options: [
        {
          value: "THIS_VISIT_ONLY",
          label: "This visit only",
          description:
            action === "delete"
              ? "Only this visit will be deleted."
              : "Only this visit will be updated.",
          actionLabel: action === "delete" ? "Delete this visit" : "Save this visit",
          tone: action === "delete" ? "danger" : "primary",
        },
        {
          value: "FUTURE_PLAN_VISITS",
          label: "Future plan visits",
          description: action === "delete"
            ? "Delete this visit and later plan-generated visits for the same plan. Completed visits and manually modified future visits are preserved."
            : "Open Plans to regenerate or adjust future visits safely.",
          actionLabel: action === "delete" ? "Delete future plan visits" : "Open Plans",
          tone: "neutral",
        },
      ],
    });
  }

  async function saveJob() {
    try {
      if (drawerMode === "create") {
        await submitCreateJob(normalizeDraftPayload(draft));
        return;
      }

      if (!selectedJob || !draft.id) return;

      const payload = buildEditPayload(draft, selectedJob);
      if (Object.keys(payload).length === 0) {
        if (draft.photoFile) {
          await submitPhotoOnly(draft.id);
          return;
        }

        closeDrawer();
        return;
      }

      if (isPlanGeneratedJob(selectedJob)) {
        openPlanScopeModal("edit", payload);
        return;
      }

      if (isManualRecurringJob(selectedJob)) {
        openManualScopeModal("edit", payload);
        return;
      }

      await submitJobUpdate(payload);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save job");
    }
  }

  async function submitJobDelete(recurrenceScope?: RecurrenceScope) {
    if (!draft.id) return;

    setDeleting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/jobs/${draft.id}`, {
        method: "DELETE",
        headers: recurrenceScope ? { "Content-Type": "application/json" } : undefined,
        body: recurrenceScope ? JSON.stringify({ recurrenceScope }) : undefined,
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to delete job");
      }
      const result = (json.data ?? {}) as DeleteJobResult;
      if (recurrenceScope === "FUTURE_PLAN_VISITS") {
        const messageParts = [`Deleted ${result.deletedCount} future plan visit${result.deletedCount === 1 ? "" : "s"}`];
        if (result.skippedCompletedCount > 0) {
          messageParts.push(`preserved ${result.skippedCompletedCount} completed`);
        }
        if (result.skippedModifiedCount > 0) {
          messageParts.push(`preserved ${result.skippedModifiedCount} manually modified`);
        }
        setNotice(messageParts.join(" • "));
      } else if (
        (recurrenceScope === "FUTURE" || recurrenceScope === "SERIES") &&
        result.skippedCompletedCount > 0
      ) {
        setNotice(
          `Deleted ${result.deletedCount} recurring visit${result.deletedCount === 1 ? "" : "s"} • preserved ${result.skippedCompletedCount} completed`
        );
      }

      closeDrawer();
      setSelectedJobId(null);
      await refreshJobsOnly();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  }

  async function deleteSelectedJob() {
    if (!draft.id || !selectedJob) return;

    if (isPlanGeneratedJob(selectedJob)) {
      openPlanScopeModal("delete");
      return;
    }

    if (isManualRecurringJob(selectedJob)) {
      openManualScopeModal("delete");
      return;
    }

    if (!window.confirm("Delete this job? This cannot be undone.")) return;
    await submitJobDelete();
  }

  async function handleScopeOption(value: RecurrenceScope) {
    if (!scopeModal || !selectedJob) return;

    if (value === "FUTURE_PLAN_VISITS" && scopeModal.action === "edit") {
      closeDrawer();
      const target = selectedJob.retainer_id
        ? `/portal/retainers?plan=${selectedJob.retainer_id}`
        : "/portal/retainers";
      router.push(target);
      return;
    }

    setScopeModal(null);
    if (scopeModal.action === "delete") {
      await submitJobDelete(value);
      return;
    }

    if (scopeModal.payload) {
      await submitJobUpdate(scopeModal.payload, value);
    }
  }

  async function moveJob(jobId: string, nextDate: Date) {
    setError("");
    const response = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledFor: nextDate.toISOString() }),
    });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json?.error?.message ?? "Failed to reschedule job");
    }
    await refreshJobsOnly();
  }

  async function updateJobDuration(jobId: string, durationMinutes: number) {
    setError("");
    const response = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes }),
    });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(json?.error?.message ?? "Failed to update duration");
    }
    await refreshJobsOnly();
  }

  const weekDays = useMemo(() => {
    if (view === "day") return [startOfDay(cursorDate)];
    return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(cursorDate), index));
  }, [cursorDate, view]);

  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const firstDay = weekDays[0] ?? startOfDay(cursorDate);
    for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        const slot = new Date(firstDay);
        slot.setHours(hour, minute, 0, 0);
        slots.push(slot);
      }
    }
    return slots;
  }, [cursorDate, weekDays]);

  function jobsForDay(day: Date) {
    return jobs.filter((job) => sameDay(new Date(job.scheduled_for), day));
  }

  function renderTimeGrid() {
    const totalMinutes = (END_HOUR - START_HOUR) * 60;

    return (
      <div className={`${S.card} overflow-hidden`}>
        <div className="grid border-b border-[var(--border)] bg-[var(--surface-2)]" style={{ gridTemplateColumns: `72px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          <div className="border-r border-[var(--border)] px-3 py-4 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Time
          </div>
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => openCreateDrawer(new Date(day))}
              className="border-r border-[var(--border)] px-3 py-4 text-left transition last:border-r-0 hover:bg-[rgba(255,255,255,0.02)]"
            >
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            </button>
          ))}
        </div>

        <div className="grid overflow-x-auto" style={{ gridTemplateColumns: `72px repeat(${weekDays.length}, minmax(180px, 1fr))` }}>
          <div className="border-r border-[var(--border)] bg-[rgba(255,255,255,0.01)]">
            {timeSlots.map((slot) => (
              <div
                key={slot.toISOString()}
                className="border-b border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-muted)]"
                style={{ height: SLOT_HEIGHT }}
              >
                {slot.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dayJobs = jobsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className="relative border-r border-[var(--border)] last:border-r-0"
                onDragOver={(event) => event.preventDefault()}
              >
                {timeSlots.map((baseSlot) => {
                  const slot = new Date(day);
                  slot.setHours(baseSlot.getHours(), baseSlot.getMinutes(), 0, 0);
                  return (
                    <button
                      key={slot.toISOString()}
                      type="button"
                      className="block w-full border-b border-[var(--border)] bg-transparent text-left transition hover:bg-[rgba(232,224,208,0.04)]"
                      style={{ height: SLOT_HEIGHT }}
                      onClick={() => openCreateDrawer(slot)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={async (event) => {
                        event.preventDefault();
                        const jobId = event.dataTransfer.getData("text/plain");
                        if (!jobId) return;
                        try {
                          await moveJob(jobId, slot);
                        } catch (moveError) {
                          setError(moveError instanceof Error ? moveError.message : "Failed to reschedule job");
                        }
                      }}
                    />
                  );
                })}

                <div className="pointer-events-none absolute inset-0">
                  {dayJobs.map((job) => {
                    const scheduledFor = new Date(job.scheduled_for);
                    const liveResize =
                      resizeState?.jobId === job.id ? resizeState.currentDuration : undefined;
                    const duration = getDurationMinutes(job, liveResize);
                    const startMinutes = minutesFromMidnight(scheduledFor);
                    const clampedStart = Math.max(START_HOUR * 60, Math.min(startMinutes, END_HOUR * 60 - 30));
                    const topPercent =
                      ((clampedStart - START_HOUR * 60) / totalMinutes) * 100;
                    const heightPercent = (Math.max(duration, 30) / totalMinutes) * 100;

                    return (
                      <button
                        key={job.id}
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", job.id);
                        }}
                        onClick={() => openEditDrawer(job)}
                        className="pointer-events-auto absolute left-2 right-2 overflow-hidden rounded-xl border text-left shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition hover:brightness-110"
                        style={{
                          top: `calc(${topPercent}% + 1px)`,
                          height: `calc(${heightPercent}% - 4px)`,
                          minHeight: 34,
                          background:
                            job.status === "COMPLETED"
                              ? "linear-gradient(180deg, rgba(74,222,128,0.16), rgba(74,222,128,0.08))"
                              : job.status === "IN_PROGRESS"
                              ? "linear-gradient(180deg, rgba(251,191,36,0.16), rgba(251,191,36,0.08))"
                              : "linear-gradient(180deg, rgba(232,224,208,0.2), rgba(201,184,154,0.08))",
                          borderColor:
                            job.status === "COMPLETED"
                              ? "rgba(74,222,128,0.32)"
                              : job.status === "IN_PROGRESS"
                              ? "rgba(251,191,36,0.32)"
                              : "rgba(232,224,208,0.2)",
                        }}
                      >
                        <div className="px-3 py-2">
                          <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                            {job.title}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">
                            {job.client_name || "Unassigned client"}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {scheduledFor.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                        <div
                          role="presentation"
                          onMouseDown={(event) => {
                            event.stopPropagation();
                            setResizeState({
                              jobId: job.id,
                              startY: event.clientY,
                              startDuration: getDurationMinutes(job),
                              currentDuration: getDurationMinutes(job),
                            });
                          }}
                          className="absolute inset-x-0 bottom-0 h-2 cursor-row-resize bg-[rgba(255,255,255,0.06)]"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMonthView() {
    return (
      <div className={`${S.card} overflow-hidden`}>
        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-2)]">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div
              key={label}
              className="border-r border-[var(--border)] px-3 py-4 text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)] last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthGrid.map((day) => {
            const dayJobs = jobsForDay(day);
            const isOutsideMonth = day.getMonth() !== cursorDate.getMonth();
            return (
              <div
                key={day.toISOString()}
                className="min-h-[150px] border-r border-b border-[var(--border)] p-3 last:border-r-0"
                onDragOver={(event) => event.preventDefault()}
                onDrop={async (event) => {
                  event.preventDefault();
                  const jobId = event.dataTransfer.getData("text/plain");
                  const existing = jobs.find((job) => job.id === jobId);
                  if (!existing) return;
                  const next = new Date(day);
                  const original = new Date(existing.scheduled_for);
                  next.setHours(original.getHours(), original.getMinutes(), 0, 0);
                  try {
                    await moveJob(jobId, next);
                  } catch (moveError) {
                    setError(moveError instanceof Error ? moveError.message : "Failed to reschedule job");
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => openCreateDrawer(new Date(day))}
                  className="mb-3 text-left"
                >
                  <div
                    className={`text-sm font-medium ${
                      isOutsideMonth ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </button>
                <div className="space-y-2">
                  {dayJobs.slice(0, 4).map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", job.id)}
                      onClick={() => openEditDrawer(job)}
                      className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left transition hover:bg-[var(--surface-3)]"
                    >
                      <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                        {job.title}
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                        {new Date(job.scheduled_for).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  ))}
                  {dayJobs.length > 4 ? (
                    <div className="text-[11px] text-[var(--text-muted)]">
                      +{dayJobs.length - 4} more visits
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderAgenda() {
    const grouped = jobs.reduce<Record<string, Job[]>>((accumulator, job) => {
      const key = new Date(job.scheduled_for).toDateString();
      accumulator[key] = accumulator[key] ?? [];
      accumulator[key].push(job);
      return accumulator;
    }, {});

    const days = Object.entries(grouped).sort(
      (left, right) =>
        new Date(left[0]).getTime() - new Date(right[0]).getTime()
    );

    return (
      <div className="space-y-4">
        {days.length === 0 ? (
          <div className={`${S.card} px-5 py-8 text-sm text-[var(--text-muted)]`}>
            No visits scheduled in this agenda window.
          </div>
        ) : null}
        {days.map(([dayKey, dayJobs]) => (
          <section key={dayKey} className={`${S.card} overflow-hidden`}>
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Day
              </div>
              <div className="mt-1 text-lg font-medium text-[var(--text-primary)]">
                {fmtShortDate(new Date(dayKey).toISOString())}
              </div>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {dayJobs
                .sort(
                  (left, right) =>
                    new Date(left.scheduled_for).getTime() -
                    new Date(right.scheduled_for).getTime()
                )
                .map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => openEditDrawer(job)}
                    className="flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-[rgba(255,255,255,0.02)] md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {job.title}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-secondary)]">
                        {job.client_name || "Unassigned client"}
                        {job.property_name ? ` • ${job.property_name}` : ""}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">
                        {job.notes || "No notes"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-sm text-[var(--text-secondary)]">
                        {new Date(job.scheduled_for).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <span style={statusPillStyle(job.status)}>{job.status}</span>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  const selectedJobPhotos = Array.isArray(selectedJob?.photos) ? selectedJob?.photos : [];

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-5 py-6 sm:px-7 sm:py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label} style={{ marginBottom: 6 }}>
              Schedule
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                fontSize: 32,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              Service calendar workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-light text-[var(--text-secondary)]">
              Jobs are execution instances only. Use this workspace to see the active
              schedule, drag visits to a new slot, adjust duration inline, and open one
              drawer for create, edit, photos, and deletion.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Visible jobs", value: stats.total },
              { label: "Scheduled", value: stats.scheduled },
              { label: "In progress", value: stats.inProgress },
              { label: "Completed", value: stats.completed },
            ].map((stat) => (
              <div key={stat.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                <div className={S.label}>{stat.label}</div>
                <div
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontSize: 22,
                    color: "var(--text-primary)",
                    marginTop: 8,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                className={S.btnGhost}
                style={
                  view === option.value
                    ? {
                        background: "rgba(232,224,208,0.1)",
                        borderColor: "rgba(232,224,208,0.2)",
                        color: "var(--text-primary)",
                      }
                    : undefined
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setCursorDate(new Date())} className={S.btnGhost}>
              Today
            </button>
            <button
              type="button"
              onClick={() => setCursorDate((current) => nextCursor(current, view, -1))}
              className={S.btnGhost}
            >
              Prev
            </button>
            <div className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)]">
              {describeRange(view, cursorDate)}
            </div>
            <button
              type="button"
              onClick={() => setCursorDate((current) => nextCursor(current, view, 1))}
              className={S.btnGhost}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => openCreateDrawer(new Date())}
              className={S.btnPrimary}
            >
              Create visit
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <select
            className={S.input}
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select
            className={S.input}
            value={propertyFilter}
            onChange={(event) => setPropertyFilter(event.target.value)}
          >
            <option value="">All properties</option>
            {propertiesForFilterClient.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
                {property.address_line1 ? ` - ${property.address_line1}` : ""}
              </option>
            ))}
          </select>
          <select
            className={S.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
          <label className={`${S.cardInner} flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]`}>
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(event) => setIncludeCompleted(event.target.checked)}
            />
            Show completed visits
          </label>
          <div className={`${S.cardInner} flex items-center px-4 py-3 text-sm text-[var(--text-muted)]`}>
            Loading scope: {fmtShortDate(range.start.toISOString())} - {fmtShortDate(addDays(range.end, -1).toISOString())}
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        ) : null}
        {!error && notice ? (
          <div className="mt-5 rounded-xl border border-emerald-900/30 bg-emerald-900/10 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </div>
        ) : null}
      </section>

      {loading ? (
        <section className={`${S.card} px-5 py-10 text-sm text-[var(--text-muted)]`}>
          Loading schedule workspace...
        </section>
      ) : view === "month" ? (
        renderMonthView()
      ) : view === "agenda" ? (
        renderAgenda()
      ) : (
        renderTimeGrid()
      )}

      <PortalDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === "create" ? "Create visit" : draft.title || "Edit visit"}
        subtitle={
          drawerMode === "create"
            ? "Schedule a new execution instance without leaving the calendar."
            : "Update timing, ownership, pricing, notes, status, proof photos, or delete the visit."
        }
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {drawerMode === "edit" ? (
                <button
                  type="button"
                  onClick={deleteSelectedJob}
                  disabled={deleting || saving}
                  className={S.btnDanger}
                >
                  {deleting ? "Deleting..." : "Delete job"}
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={closeDrawer} className={S.btnGhostLg}>
                Cancel
              </button>
              <button
                type="button"
                onClick={saveJob}
                disabled={saving || deleting || uploadingPhoto}
                className={S.btnPrimary}
              >
                {saving ? "Saving..." : drawerMode === "create" ? "Create visit" : "Save changes"}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {drawerMode === "edit" && selectedJob ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className={S.cardInner} style={{ padding: "14px 16px" }}>
                <div className={S.label}>Visit source</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedJob.source_type === "PLAN"
                    ? selectedJob.plan_name || "Plan-generated visit"
                    : isManualRecurringJob(selectedJob)
                      ? "Manual recurring series"
                      : "Manual visit"}
                </div>
              </div>
              <div className={S.cardInner} style={{ padding: "14px 16px" }}>
                <div className={S.label}>Scheduled</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {fmtDateTime(selectedJob.scheduled_for)}
                </div>
              </div>
              <div className={S.cardInner} style={{ padding: "14px 16px" }}>
                <div className={S.label}>Photos</div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {selectedJob.photo_count ?? selectedJobPhotos.length} attached
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className={S.label}>Title</label>
              <input
                className={S.input}
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Weekly property walk, maintenance visit..."
              />
            </div>
            <div className="space-y-2">
              <label className={S.label}>Client</label>
              <select
                className={S.input}
                value={draft.clientId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    clientId: event.target.value,
                    propertyId: current.propertyId,
                  }))
                }
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
              <label className={S.label}>Property</label>
              <select
                className={S.input}
                value={draft.propertyId}
                onChange={(event) => setDraft((current) => ({ ...current, propertyId: event.target.value }))}
              >
                <option value="">No property</option>
                {draftProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                    {property.address_line1 ? ` - ${property.address_line1}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={S.label}>Status</label>
              <select
                className={S.input}
                value={draft.status}
                onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={S.label}>Scheduled date / time</label>
              <input
                type="datetime-local"
                className={S.input}
                value={draft.scheduledFor}
                onChange={(event) => setDraft((current) => ({ ...current, scheduledFor: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className={S.label}>Duration minutes</label>
              <input
                className={S.input}
                value={draft.durationMinutes}
                onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: event.target.value }))}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <label className={S.label}>Hours</label>
              <input
                className={S.input}
                value={draft.hours}
                onChange={(event) => setDraft((current) => ({ ...current, hours: event.target.value }))}
                placeholder="Optional billable hours"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={S.label}>Price (USD)</label>
              <input
                className={S.input}
                value={draft.price}
                onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                placeholder="Optional visit price"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className={S.label}>Notes</label>
              <textarea
                className={`${S.input} min-h-[120px] resize-none`}
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Arrival instructions, scope notes, follow-up items..."
              />
            </div>
          </div>

          <div>
            <div className={S.label}>Photo upload</div>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Photo file</label>
                <input
                  type="file"
                  accept="image/*"
                  className={S.input}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      photoFile: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Caption</label>
                <input
                  className={S.input}
                  value={draft.photoCaption}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, photoCaption: event.target.value }))
                  }
                  placeholder="Optional caption"
                />
              </div>
            </div>
          </div>

          {drawerMode === "edit" ? (
            <div>
              <div className={S.label}>Existing photos</div>
              <div className="mt-3">
                {selectedJobPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {selectedJobPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-[var(--border)]"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "Job photo"}
                          className="h-40 w-full object-cover"
                        />
                        <div className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
                          {photo.caption || "View photo"}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--text-muted)]">
                    No proof photos saved yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </PortalDrawer>

      {scopeModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  {scopeModal.action === "delete" ? "Delete scope" : "Edit scope"}
                </div>
                <h3 className="mt-2 text-xl font-medium text-[var(--text-primary)]">
                  {scopeModal.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  {scopeModal.description}
                </p>
              </div>
              <button
                type="button"
                className={S.btnGhost}
                onClick={() => setScopeModal(null)}
                disabled={saving || deleting}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {scopeModal.options.map((option) => {
                const toneClass =
                  option.tone === "danger"
                    ? "border-red-900/40 bg-red-950/20 hover:bg-red-950/30"
                    : option.tone === "primary"
                      ? "border-[var(--accent)]/40 bg-[rgba(232,224,208,0.08)] hover:bg-[rgba(232,224,208,0.12)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] hover:bg-[rgba(255,255,255,0.04)]";

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleScopeOption(option.value)}
                    disabled={option.disabled || saving || deleting}
                    className={`rounded-2xl border p-4 text-left transition ${
                      option.disabled
                        ? "cursor-not-allowed border-[var(--border)] bg-[var(--surface-2)] opacity-55"
                        : toneClass
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {option.label}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {option.description}
                        </div>
                      </div>
                      <div className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        {option.actionLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
              Bulk manual recurring actions skip completed visits. Future plan changes stay in Plans so the plan can regenerate safely.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
