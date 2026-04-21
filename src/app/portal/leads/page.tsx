"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type QualAnswers = {
  owns_property?: string;
  property_type?: string;
  visit_frequency?: string;
  currently_watched?: string;
};

type PipelineStatus = "new" | "contacted" | "quoted" | "converted" | "dead";

type Lead = {
  id: string;
  first_name: string | null;
  email: string;
  phone: string | null;
  neighborhood: string | null;
  status: string;
  source_page: string | null;
  campaign_code: string | null;
  drip_status: string;
  qualification_json: QualAnswers | null;
  lead_score: number | null;
  lead_grade: "A" | "B" | "C" | "D" | null;
  qualified_at: string | null;
  pipeline_status: PipelineStatus;
  pipeline_notes: string | null;
  pipeline_updated_at: string | null;
  created_at: string;
};

// ── Config ───────────────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  A: { label: "Hot", bg: "rgba(220,38,38,0.12)", text: "#991b1b", border: "rgba(220,38,38,0.3)", dot: "#dc2626" },
  B: { label: "Warm", bg: "rgba(234,88,12,0.1)", text: "#9a3412", border: "rgba(234,88,12,0.28)", dot: "#ea580c" },
  C: { label: "Cool", bg: "rgba(59,130,246,0.1)", text: "#1e40af", border: "rgba(59,130,246,0.25)", dot: "#3b82f6" },
  D: { label: "Cold", bg: "rgba(107,114,128,0.1)", text: "#374151", border: "rgba(107,114,128,0.22)", dot: "#9ca3af" },
};

const PIPELINE_CONFIG: Record<PipelineStatus, { label: string; bg: string; text: string; border: string }> = {
  new:       { label: "New",       bg: "rgba(0,0,0,0.04)",         text: "rgba(0,0,0,0.5)",   border: "rgba(0,0,0,0.12)" },
  contacted: { label: "Contacted", bg: "rgba(59,130,246,0.1)",     text: "#1e40af",           border: "rgba(59,130,246,0.3)" },
  quoted:    { label: "Quoted",    bg: "rgba(234,88,12,0.1)",      text: "#9a3412",           border: "rgba(234,88,12,0.3)" },
  converted: { label: "Converted", bg: "rgba(22,163,74,0.1)",      text: "#15803d",           border: "rgba(22,163,74,0.3)" },
  dead:      { label: "Dead",      bg: "rgba(107,114,128,0.08)",   text: "rgba(0,0,0,0.35)",  border: "rgba(0,0,0,0.1)" },
};

const PIPELINE_ORDER: PipelineStatus[] = ["new", "contacted", "quoted", "converted", "dead"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: "A" | "B" | "C" | "D" | null }) {
  if (!grade) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "3px 9px", fontSize: "11px", fontWeight: 500,
        letterSpacing: "0.04em", fontFamily: "ui-sans-serif, system-ui, sans-serif",
        background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,0,0,0.1)",
      }}>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(0,0,0,0.25)", display: "inline-block" }} />
        Ungraded
      </span>
    );
  }
  const cfg = GRADE_CONFIG[grade];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px", fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.06em", fontFamily: "ui-sans-serif, system-ui, sans-serif",
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {grade} — {cfg.label}
    </span>
  );
}

function PipelineBadge({ status }: { status: PipelineStatus }) {
  const cfg = PIPELINE_CONFIG[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px", fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em", fontFamily: "ui-sans-serif, system-ui, sans-serif",
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
      borderRadius: "4px",
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function qualLabel(key: string, value: string): string {
  const map: Record<string, Record<string, string>> = {
    owns_property:     { yes: "Owns property", looking: "Still looking" },
    property_type:     { single_family: "Single-family", condo_townhome: "Condo/TH", other: "Other" },
    visit_frequency:   { monthly: "Monthly visits", few_times: "Few times/yr", rarely: "Rarely visits" },
    currently_watched: { no: "No watcher ⚠", yes: "Has watcher" },
  };
  return map[key]?.[value] ?? value;
}

// ── Stage selector ───────────────────────────────────────────────────────────

function StageSelector({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (id: string, status: PipelineStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function select(status: PipelineStatus) {
    if (status === lead.pipeline_status) { setOpen(false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, pipeline_status: status }),
      });
      if (res.ok) {
        onUpdate(lead.id, status);
      }
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  const cfg = PIPELINE_CONFIG[lead.pipeline_status];

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 10px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: cfg.bg,
          color: cfg.text,
          border: `1px solid ${cfg.border}`,
          borderRadius: "4px",
          cursor: saving ? "not-allowed" : "pointer",
          transition: "opacity 150ms",
          opacity: saving ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {saving ? "Saving…" : cfg.label}
        {!saving && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.6 }}>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          {/* Dropdown */}
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            minWidth: "140px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}>
            {PIPELINE_ORDER.map(s => {
              const c = PIPELINE_CONFIG[s];
              const isActive = s === lead.pipeline_status;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => select(s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "9px 12px",
                    background: isActive ? "var(--surface-2)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? c.text : "var(--text-secondary)",
                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                    textAlign: "left",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: c.text, display: "inline-block", flexShrink: 0,
                  }} />
                  {c.label}
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "auto" }}>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Filter types ─────────────────────────────────────────────────────────────

type GradeFilter = "all" | "A" | "B" | "C" | "D" | "ungraded";
type StageFilter = "all" | PipelineStatus;

const GRADE_FILTER_LABELS: { value: GradeFilter; label: string }[] = [
  { value: "all", label: "All grades" },
  { value: "A", label: "🔥 Hot (A)" },
  { value: "B", label: "Warm (B)" },
  { value: "C", label: "Cool (C)" },
  { value: "D", label: "Cold (D)" },
  { value: "ungraded", label: "Ungraded" },
];

const STAGE_FILTER_LABELS: { value: StageFilter; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "converted", label: "Converted" },
  { value: "dead", label: "Dead" },
];

// ── Main component ───────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/leads")
      .then(r => r.json())
      .then(data => {
        if (data.ok) setLeads(data.data ?? []);
        else setError(data.error?.message ?? "Failed to load leads");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  // Optimistic pipeline status update
  const handlePipelineUpdate = useCallback((id: string, status: PipelineStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, pipeline_status: status } : l));
  }, []);

  const filtered = useMemo(() => {
    let result = leads;

    if (gradeFilter !== "all") {
      if (gradeFilter === "ungraded") result = result.filter(l => !l.lead_grade);
      else result = result.filter(l => l.lead_grade === gradeFilter);
    }

    if (stageFilter !== "all") {
      result = result.filter(l => (l.pipeline_status ?? "new") === stageFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(l =>
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.first_name ?? "").toLowerCase().includes(q) ||
        (l.neighborhood ?? "").toLowerCase().includes(q) ||
        (l.phone ?? "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [leads, gradeFilter, stageFilter, search]);

  // Summary counts
  const gradeCounts = useMemo(() => {
    const c: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, ungraded: 0 };
    for (const l of leads) {
      if (l.lead_grade) c[l.lead_grade] = (c[l.lead_grade] ?? 0) + 1;
      else c.ungraded++;
    }
    return c;
  }, [leads]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = { new: 0, contacted: 0, quoted: 0, converted: 0, dead: 0 };
    for (const l of leads) {
      const s = l.pipeline_status ?? "new";
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [leads]);

  if (loading) {
    return (
      <div style={{ padding: "48px 32px", color: "var(--text-muted)", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "14px" }}>
        Loading leads…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "48px 32px", color: "#b91c1c", fontFamily: "ui-sans-serif, system-ui, sans-serif", fontSize: "14px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: "1040px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          margin: "0 0 4px 0", fontSize: "22px", fontWeight: 700,
          letterSpacing: "-0.02em", color: "var(--text-primary)", fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}>
          Leads
        </h1>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          {leads.length} total · {gradeCounts.A ?? 0} hot · {gradeCounts.B ?? 0} warm · {stageCounts.converted ?? 0} converted
        </p>
      </div>

      {/* Grade summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
        {(["A", "B", "C", "D"] as const).map(grade => {
          const cfg = GRADE_CONFIG[grade];
          return (
            <button
              key={grade}
              type="button"
              onClick={() => setGradeFilter(f => f === grade ? "all" : grade)}
              style={{
                border: gradeFilter === grade ? `1.5px solid ${cfg.border}` : "1px solid var(--border)",
                background: gradeFilter === grade ? cfg.bg : "var(--surface-2)",
                borderRadius: "10px", padding: "14px 16px", cursor: "pointer",
                textAlign: "left", transition: "border-color 150ms, background 150ms",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 700, color: cfg.text, fontFamily: "ui-sans-serif, system-ui, sans-serif", lineHeight: 1 }}>
                {gradeCounts[grade] ?? 0}
              </div>
              <div style={{ fontSize: "11px", letterSpacing: "0.06em", color: cfg.text, marginTop: "4px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                {grade} — {cfg.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pipeline stage summary */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {PIPELINE_ORDER.map(s => {
          const cfg = PIPELINE_CONFIG[s];
          const count = stageCounts[s] ?? 0;
          const isActive = stageFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStageFilter(f => f === s ? "all" : s)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: isActive ? 600 : 400,
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                border: isActive ? `1.5px solid ${cfg.border}` : "1px solid var(--border)",
                background: isActive ? cfg.bg : "transparent",
                color: isActive ? cfg.text : "var(--text-muted)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {cfg.label}
              <span style={{
                minWidth: "18px", height: "18px",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                borderRadius: "10px",
                background: isActive ? cfg.text : "var(--surface-2)",
                color: isActive ? cfg.bg : "var(--text-muted)",
                fontSize: "10px", fontWeight: 600,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grade filter pills + search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {GRADE_FILTER_LABELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGradeFilter(value)}
              style={{
                padding: "5px 12px", fontSize: "11px",
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                border: gradeFilter === value ? "1.5px solid var(--text-primary)" : "1px solid var(--border)",
                background: gradeFilter === value ? "var(--surface-2)" : "transparent",
                color: gradeFilter === value ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer", borderRadius: "6px",
                transition: "all 150ms ease", fontWeight: gradeFilter === value ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search name, email, phone, neighborhood…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft: "auto", height: "34px", padding: "0 12px", fontSize: "13px",
            border: "1px solid var(--border)", background: "var(--surface-2)",
            color: "var(--text-primary)", borderRadius: "6px", outline: "none",
            fontFamily: "ui-sans-serif, system-ui, sans-serif", width: "260px",
          }}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "14px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          No leads match this filter.
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                {["Grade", "Name / Contact", "Neighborhood", "Stage", "Source", "Captured", ""].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "10px 14px", textAlign: "left", fontSize: "10px",
                      fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, idx) => {
                const isExpanded = expandedId === lead.id;
                const isLast = idx === filtered.length - 1;
                const hasQual = !!lead.qualification_json;

                return (
                  <>
                    <tr
                      key={lead.id}
                      style={{
                        borderBottom: isLast && !isExpanded ? "none" : "1px solid var(--border)",
                        background: isExpanded ? "rgba(var(--accent-warm-rgb,201,184,154),0.05)" : "transparent",
                        transition: "background 150ms",
                      }}
                    >
                      {/* Grade */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <GradeBadge grade={lead.lead_grade} />
                      </td>

                      {/* Name / Contact */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        {lead.first_name && (
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                            {lead.first_name}
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <a href={`mailto:${lead.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            <a href={`tel:${lead.phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                              {lead.phone}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Neighborhood */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {lead.neighborhood ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>

                      {/* Stage selector */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <StageSelector lead={lead} onUpdate={handlePipelineUpdate} />
                      </td>

                      {/* Source */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        <span style={{
                          fontSize: "11px", color: "var(--text-muted)",
                          background: "var(--surface-2)", border: "1px solid var(--border)",
                          borderRadius: "4px", padding: "2px 7px",
                        }}>
                          {lead.source_page ?? "website"}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(lead.created_at)}
                      </td>

                      {/* Expand */}
                      <td style={{ padding: "12px 14px", verticalAlign: "middle" }}>
                        {hasQual && (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                            style={{
                              background: "none", border: "1px solid var(--border)",
                              borderRadius: "6px", padding: "4px 10px", fontSize: "11px",
                              cursor: "pointer", color: "var(--text-muted)",
                              fontFamily: "ui-sans-serif, system-ui, sans-serif",
                              display: "flex", alignItems: "center", gap: "4px",
                            }}
                          >
                            {isExpanded ? "Hide" : "Details"}
                            <svg
                              width="9" height="9" viewBox="0 0 10 10" fill="none"
                              style={{ transition: "transform 200ms", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                            >
                              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded qual detail */}
                    {isExpanded && lead.qualification_json && (
                      <tr
                        key={`${lead.id}-detail`}
                        style={{ borderBottom: isLast ? "none" : "1px solid var(--border)", background: "rgba(0,0,0,0.015)" }}
                      >
                        <td colSpan={7} style={{ padding: "12px 16px 16px 58px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                            {Object.entries(
                              typeof lead.qualification_json === "string"
                                ? JSON.parse(lead.qualification_json)
                                : lead.qualification_json
                            )
                              .filter(([, v]) => v)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  style={{
                                    fontSize: "11px", padding: "4px 10px",
                                    border: "1px solid var(--border)", background: "var(--surface-2)",
                                    color: "var(--text-secondary)", borderRadius: "4px",
                                    fontFamily: "ui-sans-serif, system-ui, sans-serif",
                                  }}
                                >
                                  {qualLabel(k, v as string)}
                                </span>
                              ))}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                            Score: <strong style={{ color: "var(--text-secondary)" }}>{lead.lead_score}</strong>
                            {lead.qualified_at && <> · Qualified {formatDate(lead.qualified_at)}</>}
                            {lead.pipeline_updated_at && (
                              <> · Stage last updated {formatDate(lead.pipeline_updated_at)}</>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
