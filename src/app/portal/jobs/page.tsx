"use client";

import { useEffect, useMemo, useState } from "react";

type JobPhoto = { id: string; url: string; caption?: string | null; uploaded_at?: string | null; };
type Job = { id: string; title: string; notes?: string | null; status: string; scheduled_for: string; client_id?: string | null; property_id?: string | null; price_cents?: number | null; hours_numeric?: string | number | null; completed_at?: string | null; photo_count?: number | null; photos?: JobPhoto[] | null; };
type Client = { id: string; name: string; };
type Property = { id: string; name: string; address_line1?: string | null; };

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhostLg: "rounded-lg border border-[var(--border)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnSuccess: "rounded-lg border border-green-900/40 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-green-400 transition hover:bg-green-900/20",
  btnWarn: "rounded-lg border border-amber-900/40 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-amber-400 transition hover:bg-amber-900/20",
};

function money(cents: number | null | undefined) { return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`; }
function fmtDate(value: string | null | undefined) { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(); }

function statusPillStyle(status: string): React.CSSProperties {
  const s = status.toUpperCase();
  if (s === "SCHEDULED") return { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "IN_PROGRESS") return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "COMPLETED") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  if (s === "CANCELED") return { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" };
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
    setLoading(true); setError("");
    try {
      const [jobsRes, clientsRes, propertiesRes] = await Promise.all([fetch("/api/admin/jobs"), fetch("/api/admin/clients"), fetch("/api/admin/properties")]);
      const jobsJson = await jobsRes.json();
      const clientsJson = await clientsRes.json();
      const propertiesJson = await propertiesRes.json();
      if (!jobsRes.ok || !jobsJson.ok) throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      if (!propertiesRes.ok || !propertiesJson.ok) throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
      const nextJobs = jobsJson.data ?? [];
      setJobs(nextJobs); setClients(clientsJson.data ?? []); setProperties(propertiesJson.data ?? []);
      if (!selectedJobId && nextJobs.length > 0) setSelectedJobId(nextJobs[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load jobs"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter !== "ALL" && String(job.status ?? "").toUpperCase() !== statusFilter) return false;
      if (!q) return true;
      const client = clients.find((c) => c.id === job.client_id);
      const property = properties.find((p) => p.id === job.property_id);
      const haystack = [job.title, job.notes, job.status, client?.name, property?.name, property?.address_line1].map((v) => String(v ?? "").toLowerCase()).join(" • ");
      return haystack.includes(q);
    });
  }, [jobs, clients, properties, search, statusFilter]);

  const selectedJob = filteredJobs.find((j) => j.id === selectedJobId) ?? jobs.find((j) => j.id === selectedJobId) ?? filteredJobs[0] ?? jobs[0] ?? null;

  useEffect(() => {
    if (!selectedJob) return;
    setEditStatus(selectedJob.status || "SCHEDULED");
    setEditNotes(selectedJob.notes || "");
    setEditTitle(selectedJob.title || "");
    setEditPrice(typeof selectedJob.price_cents === "number" ? (selectedJob.price_cents / 100).toFixed(2) : "");
    setEditHours(selectedJob.hours_numeric === null || selectedJob.hours_numeric === undefined ? "" : String(selectedJob.hours_numeric));
    setPhotoFile(null); setPhotoCaption("");
  }, [selectedJobId, selectedJob]);

  const stats = useMemo(() => ({
    total: jobs.length,
    scheduled: jobs.filter((j) => String(j.status).toUpperCase() === "SCHEDULED").length,
    inProgress: jobs.filter((j) => String(j.status).toUpperCase() === "IN_PROGRESS").length,
    completed: jobs.filter((j) => String(j.status).toUpperCase() === "COMPLETED").length,
  }), [jobs]);

  function clientName(id: string | null | undefined) { if (!id) return "—"; return clients.find((c) => c.id === id)?.name ?? "—"; }
  function propertyLabel(id: string | null | undefined) { if (!id) return "—"; const p = properties.find((p) => p.id === id); if (!p) return "—"; return p.address_line1 ? `${p.name} — ${p.address_line1}` : p.name; }

  async function saveJobChanges() {
    if (!selectedJob) return;
    setError("");
    const priceCents = editPrice.trim() === "" ? "" : Math.round(Number(editPrice) * 100);
    if (priceCents !== "" && (Number.isNaN(priceCents) || (priceCents as number) < 0)) { setError("Price must be a valid number"); return; }
    const hoursValue = editHours.trim() === "" ? "" : Number(editHours);
    if (hoursValue !== "" && (Number.isNaN(hoursValue) || (hoursValue as number) < 0)) { setError("Hours must be a valid number"); return; }
    try {
      const res = await fetch(`/api/admin/jobs/${selectedJob.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle, notes: editNotes, status: editStatus, priceCents, hours: hoursValue }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update job");
      await load(); setSelectedJobId(selectedJob.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update job"); }
  }

  async function uploadJobPhoto() {
    if (!selectedJob || !photoFile) { setError("Choose a photo first"); return; }
    setError(""); setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("photo", photoFile); form.append("caption", photoCaption);
      const res = await fetch(`/api/admin/jobs/${selectedJob.id}/photos`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to upload photo");
      setPhotoFile(null); setPhotoCaption(""); await load(); setSelectedJobId(selectedJob.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to upload photo"); }
    finally { setUploadingPhoto(false); }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Jobs</div>
            <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Job execution</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Manage scheduled work, update status, log notes, and attach completion photos.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[{ label: "Total", value: stats.total }, { label: "Scheduled", value: stats.scheduled }, { label: "In progress", value: stats.inProgress }, { label: "Completed", value: stats.completed }].map((s) => (
              <div key={s.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                <div className={S.label}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
          <select className={S.input} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
          </select>
          <input className={S.input} placeholder="Search title, notes, client, property..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error && <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className={`${S.card} overflow-hidden`}>
          <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>All jobs</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredJobs.length} visible jobs`}</div>
          </div>
          {filteredJobs.length === 0 ? (
            <div className="px-6 py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading jobs..." : "No jobs found."}</div>
          ) : (
            <div className="max-h-[860px] overflow-y-auto">
              {filteredJobs.map((job) => {
                const isActive = selectedJob?.id === job.id;
                return (
                  <button key={job.id} onClick={() => setSelectedJobId(job.id)} className="block w-full text-left transition"
                    style={{ borderBottom: "1px solid var(--border)", padding: "18px 24px", background: isActive ? "var(--surface-2)" : "transparent" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{clientName(job.client_id)}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono), monospace" }}>{fmtDate(job.scheduled_for)}</div>
                      </div>
                      <span style={statusPillStyle(job.status)}>{job.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <section className={`${S.card} p-7`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className={S.label} style={{ marginBottom: 4 }}>Job detail</div>
                <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>{selectedJob ? selectedJob.title : "No job selected"}</h2>
              </div>
            </div>
            {!selectedJob ? (
              <div style={{ marginTop: 24, fontSize: 13, color: "var(--text-muted)" }}>Select a job to view and manage it.</div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[{ label: "Client", value: clientName(selectedJob.client_id) }, { label: "Property", value: propertyLabel(selectedJob.property_id) }, { label: "Scheduled", value: fmtDate(selectedJob.scheduled_for) }, { label: "Completed", value: fmtDate(selectedJob.completed_at) }].map((f) => (
                    <div key={f.label} className={S.cardInner} style={{ padding: "14px 16px" }}>
                      <div className={S.label}>{f.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2"><label className={S.label}>Title</label><input className={S.input} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
                  <div className="space-y-2"><label className={S.label}>Status</label>
                    <select className={S.input} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELED">Canceled</option>
                    </select>
                  </div>
                  <div className="space-y-2"><label className={S.label}>Price (USD)</label><input className={S.input} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} /></div>
                  <div className="space-y-2"><label className={S.label}>Hours</label><input className={S.input} value={editHours} onChange={(e) => setEditHours(e.target.value)} /></div>
                  <div className="space-y-2 md:col-span-2"><label className={S.label}>Notes</label><textarea className={`${S.input} min-h-[140px] resize-none`} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} /></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={saveJobChanges} className={S.btnPrimary}>Save job changes</button>
                  <button onClick={() => setEditStatus("COMPLETED")} className={S.btnSuccess}>Mark completed</button>
                  <button onClick={() => setEditStatus("IN_PROGRESS")} className={S.btnWarn}>Mark in progress</button>
                </div>
                <div className="mt-8">
                  <div className={S.label} style={{ marginBottom: 4 }}>Upload photo</div>
                  <h3 style={{ fontFamily: "var(--font-serif), serif", fontSize: 18, color: "var(--text-primary)", marginBottom: 16 }}>Add completion photos</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2"><label className={S.label}>Photo file</label><input type="file" accept="image/*" className={S.input} onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} /></div>
                    <div className="space-y-2 md:col-span-2"><label className={S.label}>Caption</label><input className={S.input} value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="Optional caption" /></div>
                  </div>
                  <div className="mt-4">
                    <button onClick={uploadJobPhoto} disabled={uploadingPhoto || !photoFile} className={S.btnPrimary} style={{ opacity: uploadingPhoto || !photoFile ? 0.5 : 1 }}>{uploadingPhoto ? "Uploading..." : "Upload photo"}</button>
                  </div>
                </div>
                <div className="mt-8">
                  <div className={S.label} style={{ marginBottom: 4 }}>Completion photos</div>
                  <h3 style={{ fontFamily: "var(--font-serif), serif", fontSize: 18, color: "var(--text-primary)", marginBottom: 16 }}>Proof of work</h3>
                  {Array.isArray(selectedJob.photos) && selectedJob.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {selectedJob.photos.map((photo) => (
                        <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-[var(--border)]">
                          <img src={photo.url} alt={photo.caption || "Job photo"} className="h-32 w-full object-cover" />
                          <div className="px-3 py-2" style={{ fontSize: 11, color: "var(--text-muted)" }}>{photo.caption || "View photo"}</div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No completion photos saved for this job yet.</div>
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
