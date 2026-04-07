"use client";

import { useCallback, useEffect, useState } from "react";
import {
  templateRegistry,
  type TemplateDefinition,
} from "@/lib/templates/registry";

// ─── Styles ──────────────────────────────────────────────────────────────────

const PANEL =
  "rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_60px_rgba(0,0,0,0.24)]";
const PANEL_INNER = "rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]";
const LABEL = "text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]";
const BTN_GHOST =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]";
const BTN_MUTE =
  "inline-flex items-center justify-center rounded-lg border border-red-900/40 bg-red-900/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-red-300 transition hover:border-red-700/60 hover:bg-red-900/20";
const BTN_MUTED =
  "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)] cursor-default";

// ─── Types ───────────────────────────────────────────────────────────────────

type Lead = {
  id: string;
  first_name: string | null;
  email: string;
  status: string;
  drip_status: string;
  source_page: string | null;
  campaign_code: string | null;
  drip_suppressed_at: string | null;
  created_at: string;
};

type Tab = "templates" | "queue";

// ─── Email template card ──────────────────────────────────────────────────────

function EmailTemplateCard({ template }: { template: TemplateDefinition }) {
  const isLive = template.status === "live";

  return (
    <article className={`${PANEL_INNER} flex flex-col gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
                isLive
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-muted)]"
              }`}
            >
              {isLive ? "Live" : "Draft"}
            </span>
            {template.trigger && (
              <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                {template.trigger}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-serif text-[20px] leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            {template.name}
          </h3>
        </div>
      </div>

      {template.subject && (
        <div className={`${PANEL_INNER} px-3.5 py-2.5`} style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className={`${LABEL} mb-1`}>Subject</div>
          <div className="text-sm text-[var(--text-primary)] font-medium leading-snug">
            {template.subject}
          </div>
        </div>
      )}

      <p className="text-sm leading-[1.65] text-[var(--text-secondary)]">{template.description}</p>
    </article>
  );
}

// ─── Lead queue row ───────────────────────────────────────────────────────────

function LeadRow({
  lead,
  onMute,
  muting,
}: {
  lead: Lead;
  onMute: (email: string) => void;
  muting: boolean;
}) {
  const isSuppressed = lead.drip_status === "suppressed";
  const name = lead.first_name?.trim() || "—";
  const date = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : "—";
  const source = lead.source_page
    ? lead.source_page.replace(/^https?:\/\/[^/]+/, "").replace("/qr", "/qr (postcard)") || "/"
    : "—";

  return (
    <div className={`${PANEL_INNER} grid grid-cols-[1fr_1fr_auto] items-center gap-4 px-4 py-3`}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)] truncate">{name}</div>
        <div className="mt-0.5 text-xs text-[var(--text-secondary)] truncate">{lead.email}</div>
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[var(--text-muted)] truncate">{source}</div>
        <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{date}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isSuppressed ? (
          <span className={BTN_MUTED}>Muted</span>
        ) : muting ? (
          <span className={BTN_MUTED}>Muting…</span>
        ) : (
          <button type="button" onClick={() => onMute(lead.email)} className={BTN_MUTE}>
            Mute
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PortalTemplatesPage() {
  const [tab, setTab] = useState<Tab>("templates");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState("");
  const [mutingEmails, setMutingEmails] = useState<Set<string>>(new Set());

  const emailTemplates = templateRegistry.filter(
    (t) => t.category === "email" && t.status === "live"
  );
  const liveCount = templateRegistry.filter((t) => t.status === "live").length;
  const activeLeads = leads.filter((l) => l.drip_status === "active").length;

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError("");
    try {
      const res = await fetch("/api/admin/leads");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to load leads");
      setLeads(json.data ?? []);
    } catch (err) {
      setLeadsError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "queue" && leads.length === 0 && !leadsLoading) {
      void loadLeads();
    }
  }, [tab, leads.length, leadsLoading, loadLeads]);

  const handleMute = useCallback(async (email: string) => {
    setMutingEmails((prev) => new Set([...prev, email]));
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Suppress failed");
      // Optimistically mark suppressed in local state
      setLeads((prev) =>
        prev.map((l) =>
          l.email.toLowerCase() === email.toLowerCase()
            ? { ...l, drip_status: "suppressed", drip_suppressed_at: new Date().toISOString() }
            : l
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not mute lead");
    } finally {
      setMutingEmails((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
    }
  }, []);

  return (
    <div className="space-y-6">

      {/* Header + stats */}
      <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className={LABEL}>Template Library</div>
            <h1 className="mt-3 font-serif text-[34px] leading-none tracking-[-0.03em] text-[var(--text-primary)]">
              Templates
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              All active email sequences, subjects, and triggers in one place. Mute specific leads from the queue tab.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[340px]">
            {[
              { label: "Live templates", value: liveCount },
              { label: "Active in queue", value: activeLeads || "—" },
              { label: "Total leads", value: leads.length || "—" },
            ].map((stat) => (
              <div key={stat.label} className={PANEL_INNER} style={{ padding: "var(--portal-card-pad)" }}>
                <div className={LABEL}>{stat.label}</div>
                <div className="mt-2 font-serif text-[26px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-7 flex gap-1 border-b border-[var(--border)]">
          {(["templates", "queue"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 pb-3 text-[11px] font-medium uppercase tracking-[0.2em] transition border-b-2 -mb-px ${
                tab === t
                  ? "border-[var(--accent-warm)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {t === "templates" ? "Email Templates" : "Lead Queue"}
            </button>
          ))}
        </div>
      </section>

      {/* Tab: Email Templates */}
      {tab === "templates" && (
        <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
          <div className={LABEL}>Active sequences</div>
          <h2 className="mt-3 font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
            Email Templates
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {emailTemplates.length} live templates across the lead drip sequence and rock order follow-ups.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {emailTemplates.map((template) => (
              <EmailTemplateCard key={template.slug} template={template} />
            ))}
          </div>
        </section>
      )}

      {/* Tab: Lead Queue */}
      {tab === "queue" && (
        <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className={LABEL}>Email queue</div>
              <h2 className="mt-3 font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                Lead Queue
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Everyone currently receiving or who has received the drip sequence. Click Mute to stop all pending emails for a lead.
              </p>
            </div>
            <button type="button" onClick={loadLeads} className={BTN_GHOST} disabled={leadsLoading}>
              {leadsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {leadsError && (
            <div className="mb-4 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">
              {leadsError}
            </div>
          )}

          {leadsLoading && leads.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">Loading leads…</div>
          ) : leads.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-muted)]">No leads yet.</div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 pb-1">
                <div className={LABEL}>Name / Email</div>
                <div className={LABEL}>Source / Date</div>
                <div className={LABEL} style={{ minWidth: 64 }}>Status</div>
              </div>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onMute={handleMute}
                  muting={mutingEmails.has(lead.email)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
