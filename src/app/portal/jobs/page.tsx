"use client";

import { useEffect, useMemo, useState } from "react";

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
  client_id?: string | null;
  property_id?: string | null;
  price_cents?: number | null;
  hours_numeric?: string | number | null;
  completed_at?: string | null;
  photo_count?: number | null;
  photos?: JobPhoto[] | null;
};

type Client = {
  id: string;
  name: string;
};

type Property = {
  id: string;
  name: string;
  address_line1?: string | null;
};

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
}

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900";
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

function statusPill(status: string) {
  const s = status.toUpperCase();

  if (s === "SCHEDULED") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "IN_PROGRESS") return "border-amber-200 bg-amber-50 text-amber-700";
  if (s === "COMPLETED") return "border-green-200 bg-green-50 text-green-700";
  if (s === "CANCELED") return "border-red-200 bg-red-50 text-red-700";

  return "border-stone-200 bg-stone-50 text-stone-700";
}

export default function PortalJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editHours, setEditHours] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [jobsRes, clientsRes, propertiesRes] = await Promise.all([
        fetch("/api/admin/jobs"),
        fetch("/api/admin/clients"),
        fetch("/api/admin/properties"),
      ]);

      const jobsJson = await jobsRes.json();
      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();

      if (!jobsRes.ok || !jobsJson.ok) {
        throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      }

      if (!clientsRes.ok || !clientsJson.ok) {
        throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      }

      if (!propertiesRes.ok || !propertiesJson.ok) {
        throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      }

      const nextJobs = jobsJson.data ?? [];
      setJobs(nextJobs);
      setClients(clientsJson.data ?? []);
      setProperties(propertiesJson.data ?? []);

      if (!selectedJobId && nextJobs.length > 0) {
        setSelectedJobId(nextJobs[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        String(job.status ?? "").toUpperCase() === statusFilter;

      if (!matchesStatus) return false;

      if (!q) return true;

      const client = clients.find((c) => c.id === job.client_id);
      const property = properties.find((p) => p.id === job.property_id);

      const haystack = [
        job.title,
        job.notes,
        job.status,
        client?.name,
        property?.name,
        property?.address_line1,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" • ");

      return haystack.includes(q);
    });
  }, [jobs, clients, properties, search, statusFilter]);

  const selectedJob =
    filteredJobs.find((job) => job.id === selectedJobId) ??
    jobs.find((job) => job.id === selectedJobId) ??
    filteredJobs[0] ??
    jobs[0] ??
    null;

  useEffect(() => {
    if (!selectedJob) return;

    setEditStatus(selectedJob.status || "SCHEDULED");
    setEditNotes(selectedJob.notes || "");
    setEditTitle(selectedJob.title || "");
    setEditPrice(
      typeof selectedJob.price_cents === "number"
        ? (selectedJob.price_cents / 100).toFixed(2)
        : ""
    );
    setEditHours(
      selectedJob.hours_numeric === null || selectedJob.hours_numeric === undefined
        ? ""
        : String(selectedJob.hours_numeric)
    );
    setPhotoFile(null);
    setPhotoCaption("");
  }, [selectedJobId, selectedJob]);

  const stats = useMemo(() => {
    return {
      total: jobs.length,
      scheduled: jobs.filter((j) => String(j.status).toUpperCase() === "SCHEDULED").length,
      inProgress: jobs.filter((j) => String(j.status).toUpperCase() === "IN_PROGRESS").length,
      completed: jobs.filter((j) => String(j.status).toUpperCase() === "COMPLETED").length,
    };
  }, [jobs]);

  function clientName(id: string | null | undefined) {
    if (!id) return "—";
    return clients.find((client) => client.id === id)?.name ?? "—";
  }

  function propertyLabel(id: string | null | undefined) {
    if (!id) return "—";
    const property = properties.find((p) => p.id === id);
    if (!property) return "—";
    return property.address_line1
      ? `${property.name} — ${property.address_line1}`
      : property.name;
  }

  async function saveJobChanges() {
    if (!selectedJob) return;

    setError("");

    const priceCents =
      editPrice.trim() === "" ? "" : Math.round(Number(editPrice) * 100);

    if (priceCents !== "" && (Number.isNaN(priceCents) || priceCents < 0)) {
      setError("Price must be a valid number");
      return;
    }

    const hoursValue = editHours.trim() === "" ? "" : Number(editHours);
    if (hoursValue !== "" && (Number.isNaN(hoursValue) || hoursValue < 0)) {
      setError("Hours must be a valid number");
      return;
    }

    try {
      const res = await fetch(`/api/admin/jobs/${selectedJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          notes: editNotes,
          status: editStatus,
          priceCents,
          hours: hoursValue,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to update job");
      }

      await load();
      setSelectedJobId(selectedJob.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update job");
    }
  }

  async function uploadJobPhoto() {
    if (!selectedJob) return;
    if (!photoFile) {
      setError("Choose a photo first");
      return;
    }

    setError("");
    setUploadingPhoto(true);

    try {
      const form = new FormData();
      form.append("photo", photoFile);
      form.append("caption", photoCaption);

      const res = await fetch(`/api/admin/jobs/${selectedJob.id}/photos`, {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to upload photo");
      }

      setPhotoFile(null);
      setPhotoCaption("");
      await load();
      setSelectedJobId(selectedJob.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Jobs
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Job execution
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Manage scheduled work, update status, log notes, and attach completion photos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Total</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.total}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Scheduled</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.scheduled}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">In progress</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.inProgress}</div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">Completed</div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">{stats.completed}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
          <select
            className={inputClassName()}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
          </select>

          <input
            className={inputClassName()}
            placeholder="Search title, notes, client, property..."
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

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className={`${cardClass()} overflow-hidden`}>
          <div className="border-b border-stone-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-stone-900">All jobs</h2>
            <p className="mt-1 text-sm text-stone-500">
              {loading ? "Loading..." : `${filteredJobs.length} visible jobs`}
            </p>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="px-6 py-10 text-sm text-stone-500">
              {loading ? "Loading jobs..." : "No jobs found."}
            </div>
          ) : (
            <div className="max-h-[860px] overflow-y-auto">
              {filteredJobs.map((job) => {
                const isActive = selectedJob?.id === job.id;

                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={[
                      "block w-full border-b border-stone-100 px-6 py-5 text-left transition",
                      isActive ? "bg-stone-50" : "hover:bg-stone-50/70",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium text-stone-900">{job.title}</div>
                        <div className="mt-2 text-sm text-stone-600">
                          {clientName(job.client_id)}
                        </div>
                        <div className="mt-1 text-sm text-stone-600">
                          {fmtDate(job.scheduled_for)}
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${statusPill(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <section className={`${cardClass()} p-7`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
                  Job detail
                </div>
                <h2 className="mt-1 font-serif text-2xl text-stone-900">
                  {selectedJob ? selectedJob.title : "No job selected"}
                </h2>
              </div>
            </div>

            {!selectedJob ? (
              <div className="mt-6 text-sm text-stone-500">
                Select a job to view and manage it.
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Client
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {clientName(selectedJob.client_id)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Property
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {propertyLabel(selectedJob.property_id)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Scheduled
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {fmtDate(selectedJob.scheduled_for)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                      Completed
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-900">
                      {fmtDate(selectedJob.completed_at)}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                      Title
                    </label>
                    <input
                      className={inputClassName()}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                      Status
                    </label>
                    <select
                      className={inputClassName()}
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELED">Canceled</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                      Price (USD)
                    </label>
                    <input
                      className={inputClassName()}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                      Hours
                    </label>
                    <input
                      className={inputClassName()}
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                      Notes
                    </label>
                    <textarea
                      className={`${inputClassName()} min-h-[140px] resize-none`}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={saveJobChanges}
                    className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
                  >
                    Save job changes
                  </button>

                  <button
                    onClick={() => setEditStatus("COMPLETED")}
                    className="rounded-full border border-green-300 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-green-700 transition hover:bg-green-50"
                  >
                    Mark completed
                  </button>

                  <button
                    onClick={() => setEditStatus("IN_PROGRESS")}
                    className="rounded-full border border-amber-300 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-amber-700 transition hover:bg-amber-50"
                  >
                    Mark in progress
                  </button>
                </div>

                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Upload photo
                  </div>
                  <h3 className="mt-1 font-serif text-xl text-stone-900">
                    Add completion photos
                  </h3>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                        Photo file
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className={inputClassName()}
                        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500">
                        Caption
                      </label>
                      <input
                        className={inputClassName()}
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        placeholder="Optional caption"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={uploadJobPhoto}
                      disabled={uploadingPhoto || !photoFile}
                      className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700 disabled:opacity-50"
                    >
                      {uploadingPhoto ? "Uploading..." : "Upload photo"}
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Completion photos
                  </div>
                  <h3 className="mt-1 font-serif text-xl text-stone-900">
                    Proof of work
                  </h3>

                  {Array.isArray(selectedJob.photos) && selectedJob.photos.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selectedJob.photos.map((photo) => (
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
                  ) : (
                    <div className="mt-4 text-sm text-stone-500">
                      No completion photos saved for this job yet.
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