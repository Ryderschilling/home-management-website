"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type Communication = {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  property_name?: string | null;
  job_title?: string | null;
  invoice_number?: string | null;
  channel?: string | null;
  direction?: string | null;
  type?: string | null;
  status?: string | null;
  subject?: string | null;
  body?: string | null;
  requires_approval?: boolean;
  approved_at?: string | null;
  sent_at?: string | null;
  last_client_response_at?: string | null;
  follow_up_due_at?: string | null;
  created_at?: string | null;
};

type Client = {
  id: string;
  name: string;
};

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110",
  btnGhost: "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
};

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function statusStyle(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "DRAFT") return { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" } as CSSProperties;
  if (normalized === "APPROVED") return { background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" } as CSSProperties;
  if (normalized === "SENT") return { background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" } as CSSProperties;
  return { background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 999, padding: "3px 10px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" } as CSSProperties;
}

export default function PortalContactsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientFilter, setClientFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [communicationsRes, clientsRes] = await Promise.all([
        fetch("/api/admin/communications?includeResolved=true"),
        fetch("/api/admin/clients"),
      ]);
      const [communicationsJson, clientsJson] = await Promise.all([
        communicationsRes.json(),
        clientsRes.json(),
      ]);
      if (!communicationsRes.ok || !communicationsJson.ok) throw new Error(communicationsJson?.error?.message ?? "Failed to load communications");
      if (!clientsRes.ok || !clientsJson.ok) throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      setCommunications(communicationsJson.data ?? []);
      setClients(clientsJson.data ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load communications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredCommunications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return communications.filter((communication) => {
      if (clientFilter && communication.client_id !== clientFilter) return false;
      if (!q) return true;
      return [
        communication.client_name,
        communication.subject,
        communication.body,
        communication.type,
        communication.status,
        communication.property_name,
        communication.job_title,
        communication.invoice_number,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" • ")
        .includes(q);
    });
  }, [clientFilter, communications, search]);

  const stats = useMemo(() => {
    return {
      drafts: communications.filter((communication) => communication.status === "DRAFT").length,
      awaitingApproval: communications.filter((communication) => communication.status === "DRAFT" && communication.requires_approval && !communication.approved_at).length,
      sentAwaitingResponse: communications.filter((communication) => communication.status === "SENT" && !communication.last_client_response_at).length,
      followUpsDue: communications.filter((communication) => communication.follow_up_due_at && new Date(communication.follow_up_due_at).getTime() <= Date.now()).length,
    };
  }, [communications]);

  async function patchCommunication(id: string, payload: Record<string, unknown>) {
    setSavingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/communications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to update communication");
      }
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update communication");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={S.label}>Communications</div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[{ label: "Drafts", value: stats.drafts }, { label: "Awaiting approval", value: stats.awaitingApproval }, { label: "Sent, no response", value: stats.sentAwaitingResponse }, { label: "Follow-ups due", value: stats.followUpsDue }].map((stat) => (
              <div key={stat.label} className={S.cardInner} style={{ padding: "16px 20px" }}>
                <div className={S.label}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 24, color: "var(--text-primary)", marginTop: 8 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <select className={S.input} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          <input className={S.input} placeholder="Search client, subject, job, invoice, or body..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {error ? <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div> : null}
      </section>

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>Queue</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{loading ? "Loading..." : `${filteredCommunications.length} visible records`}</div>
        </div>
        {filteredCommunications.length === 0 ? (
          <div className="px-5 py-8 sm:px-7 sm:py-10" style={{ fontSize: 13, color: "var(--text-muted)" }}>{loading ? "Loading queue..." : "No communications found."}</div>
        ) : (
          <div className="space-y-4 p-5 sm:p-7">
            {filteredCommunications.map((communication) => (
              <div key={communication.id} className={S.cardInner} style={{ padding: 18 }}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{communication.subject || communication.type || "Communication"}</div>
                      <span style={statusStyle(communication.status || "DRAFT")}>{communication.status || "DRAFT"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                      {communication.client_name || "No client"}
                      {communication.property_name ? ` • ${communication.property_name}` : ""}
                      {communication.job_title ? ` • ${communication.job_title}` : ""}
                      {communication.invoice_number ? ` • ${communication.invoice_number}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                      Type {communication.type?.replaceAll("_", " ") || "GENERAL"} • Approval {communication.approved_at ? "complete" : communication.requires_approval ? "required" : "not required"} • Follow-up due {fmtDate(communication.follow_up_due_at)}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{communication.body || "No body saved."}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 xl:w-[280px] xl:justify-end">
                    {!communication.approved_at && communication.status === "DRAFT" ? <button onClick={() => patchCommunication(communication.id, { status: "APPROVED" })} className={S.btnGhost} disabled={savingId === communication.id}>{savingId === communication.id ? "Saving..." : "Approve"}</button> : null}
                    {communication.status !== "SENT" ? <button onClick={() => patchCommunication(communication.id, { status: "SENT" })} className={S.btnPrimary} disabled={savingId === communication.id || (communication.requires_approval && !communication.approved_at)}>{savingId === communication.id ? "Saving..." : "Mark sent"}</button> : null}
                    {communication.status !== "RESPONDED" ? <button onClick={() => patchCommunication(communication.id, { status: "RESPONDED", lastClientResponseAt: new Date().toISOString() })} className={S.btnGhost} disabled={savingId === communication.id}>{savingId === communication.id ? "Saving..." : "Log response"}</button> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
