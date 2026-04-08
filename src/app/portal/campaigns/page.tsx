"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Campaign = {
  id: string;
  name: string;
  campaign_code: string;
  channel: string;
  landing_path: string;
  flyers_sent: number;
  print_cost_cents: number;
  distribution_cost_cents: number;
  notes?: string | null;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  visits: number;
  unique_visitors: number;
  checkout_starts: number;
  paid_orders: number;
  upload_completed: number;
  discount_uses: number;
  revenue_cents: number;
  email_leads: number;
  add_on_selects: number;
  add_on_checkout_starts: number;
  add_on_paid_orders: number;
  add_on_revenue_cents: number;
};

const S = {
  input: "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)]",
  label: "text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]",
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnPrimary: "rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#0e0e0f] transition hover:brightness-110 disabled:opacity-60",
  btnGhost: "rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
  btnDanger: "rounded-lg border border-red-900/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-400 transition hover:bg-red-900/20",
};

type MetricCard = {
  label: string;
  value: string | number;
  accent?: boolean;
};

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${(value * 100).toFixed(1)}%`;
}

export default function PortalCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [flyersSent, setFlyersSent] = useState("");
  const [printCost, setPrintCost] = useState("");
  const [distributionCost, setDistributionCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [editFlyersSent, setEditFlyersSent] = useState("");
  const [editPrintCost, setEditPrintCost] = useState("");
  const [editDistributionCost, setEditDistributionCost] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Inline delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to load campaigns");
      setCampaigns(Array.isArray(json.data) ? json.data : []);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load campaigns"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createCampaign() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, campaign_code: campaignCode, channel: "flyer", landing_path: "/qr", flyers_sent: flyersSent, print_cost_dollars: printCost, distribution_cost_dollars: distributionCost, notes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to create campaign");
      setName(""); setCampaignCode(""); setFlyersSent(""); setPrintCost(""); setDistributionCost(""); setNotes("");
      setShowCreateModal(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create campaign"); }
    finally { setSaving(false); }
  }

  function openEdit(campaign: Campaign) {
    setEditCampaign(campaign);
    setEditFlyersSent(String(campaign.flyers_sent ?? 0));
    setEditPrintCost(String((campaign.print_cost_cents ?? 0) / 100));
    setEditDistributionCost(String((campaign.distribution_cost_cents ?? 0) / 100));
    setEditNotes(campaign.notes ?? "");
    setEditError("");
  }

  function closeEdit() {
    setEditCampaign(null);
    setEditError("");
  }

  async function saveEdit() {
    if (!editCampaign) return;
    setEditError("");
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${editCampaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCampaign.name,
          channel: editCampaign.channel,
          landing_path: editCampaign.landing_path,
          flyers_sent: editFlyersSent,
          print_cost_dollars: editPrintCost,
          distribution_cost_dollars: editDistributionCost,
          notes: editNotes,
          active: editCampaign.active,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update campaign");
      closeEdit();
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update campaign");
    } finally { setEditSaving(false); }
  }

  async function deleteCampaign(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete campaign");
      setDeletingId(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete campaign"); setDeletingId(null); }
  }

  const summary = useMemo(() =>
    campaigns.reduce(
      (acc, c) => ({ flyers: acc.flyers + (c.flyers_sent || 0), visits: acc.visits + (c.visits || 0), orders: acc.orders + (c.paid_orders || 0), revenue: acc.revenue + (c.revenue_cents || 0) }),
      { flyers: 0, visits: 0, orders: 0, revenue: 0 }
    ), [campaigns]);

  const runningCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.active),
    [campaigns]
  );

  return (
    <div className="space-y-6">
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div className={`${S.card} w-full max-w-3xl p-6 sm:p-8`} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Create flyer campaign</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>
                  Add a new campaign, generate its QR code link, and start tracking performance.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ fontSize: 22, color: "var(--text-muted)", lineHeight: 1, flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { label: "Campaign name", val: name, set: setName, placeholder: "Watersound Origins Flyer Drop" },
                { label: "Campaign code", val: campaignCode, set: (v: string) => setCampaignCode(v.toLowerCase()), placeholder: "watersound-flyer-001" },
                { label: "Flyers sent", val: flyersSent, set: setFlyersSent, placeholder: "500" },
                { label: "Print cost ($)", val: printCost, set: setPrintCost, placeholder: "95" },
                { label: "Distribution cost ($)", val: distributionCost, set: setDistributionCost, placeholder: "0" },
              ].map((field) => (
                <div key={field.label}>
                  <div className={S.label} style={{ marginBottom: 6 }}>{field.label}</div>
                  <input className={S.input} value={field.val} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} />
                </div>
              ))}
              <div className="md:col-span-2">
                <div className={S.label} style={{ marginBottom: 6 }}>Notes</div>
                <textarea className={`${S.input} min-h-[96px] resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Neighborhood, print run, drop date, etc." />
              </div>
            </div>
            {error ? (
              <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={createCampaign} disabled={saving} className={S.btnPrimary}>
                {saving ? "Saving…" : "Create campaign"}
              </button>
              <button onClick={() => setShowCreateModal(false)} className={S.btnGhost}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editCampaign && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className={`${S.card} w-full max-w-lg p-6 sm:p-8`} style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 22, color: "var(--text-primary)" }}>Update campaign</h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 300 }}>{editCampaign.name} · {editCampaign.campaign_code}</p>
              </div>
              <button onClick={closeEdit} style={{ fontSize: 22, color: "var(--text-muted)", lineHeight: 1, flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}>×</button>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Flyers sent</label>
                <input className={S.input} type="number" min="0" value={editFlyersSent} onChange={(e) => setEditFlyersSent(e.target.value)} placeholder="500" />
              </div>
              <div className="space-y-2">
                <label className={S.label}>Print cost ($)</label>
                <input className={S.input} type="number" min="0" step="0.01" value={editPrintCost} onChange={(e) => setEditPrintCost(e.target.value)} placeholder="95" />
              </div>
              <div className="space-y-2">
                <label className={S.label}>Distribution cost ($)</label>
                <input className={S.input} type="number" min="0" step="0.01" value={editDistributionCost} onChange={(e) => setEditDistributionCost(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={S.label}>Notes</label>
                <textarea className={`${S.input} min-h-[80px] resize-none`} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Neighborhood, print run, drop date, etc." />
              </div>
            </div>
            {editError && <div className="mt-4 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{editError}</div>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={saveEdit} disabled={editSaving} className={S.btnPrimary}>{editSaving ? "Saving…" : "Save changes"}</button>
              <button onClick={closeEdit} className={S.btnGhost}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Marketing</div>
              <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Campaigns</h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 560 }}>Track live flyer performance here, and create a new campaign only when you need to launch another drop.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowCreateModal(true)} className={S.btnPrimary}>
                Create campaign
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-6 sm:grid-cols-2 sm:px-7 md:grid-cols-4">
          {([
            { label: "Flyers sent", value: summary.flyers },
            { label: "Visits", value: summary.visits },
            { label: "Paid orders", value: summary.orders },
            { label: "Revenue", value: money(summary.revenue), accent: true },
          ] as MetricCard[]).map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 26, color: s.accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
            </div>
          ))}
        </div>
        {error ? (
          <div className="px-5 pb-6 sm:px-7">
            <div className="rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>
          </div>
        ) : null}
      </section>

      {/* Live Performance */}
      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 24px" }}>
          <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 20, color: "var(--text-primary)" }}>Current running campaigns</h2>
        </div>
        <div className="px-5 py-6 sm:px-7">
          {loading ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading campaigns…</div>
          ) : runningCampaigns.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No running campaigns right now.</div>
          ) : (
            <div className="space-y-4">
              {runningCampaigns.map((campaign) => {
                const totalCostCents = (campaign.print_cost_cents ?? 0) + (campaign.distribution_cost_cents ?? 0);
                const cacCents = campaign.paid_orders > 0 ? Math.round(totalCostCents / campaign.paid_orders) : 0;
                const customerValueCents = campaign.paid_orders > 0 ? Math.round((campaign.revenue_cents ?? 0) / campaign.paid_orders) : 0;
                const flyerToVisit = campaign.flyers_sent > 0 ? ((campaign.unique_visitors / campaign.flyers_sent) * 100).toFixed(1) : "0.0";
                const visitToOrder = Math.min(campaign.unique_visitors > 0 ? (campaign.paid_orders / campaign.unique_visitors) * 100 : 0, 100).toFixed(1);
                const addOnAttachRate = campaign.paid_orders > 0 ? campaign.add_on_paid_orders / campaign.paid_orders : 0;
                const isDeleting = deletingId === campaign.id;

                return (
                  <div key={campaign.id} className={S.cardInner} style={{ padding: 20 }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                          {campaign.channel} · {campaign.campaign_code}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>{campaign.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                          QR URL: <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono), monospace" }}>{`/qr?c=${campaign.campaign_code}`}</span>
                        </div>
                        {campaign.notes && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{campaign.notes}</div>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/portal/campaigns/${campaign.id}`} className={S.btnGhost}>View</Link>
                        <button onClick={() => openEdit(campaign)} className={S.btnGhost}>Update counts</button>
                        {isDeleting ? (
                          <>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Delete?</span>
                            <button onClick={() => deleteCampaign(campaign.id)} className={S.btnDanger}>Yes, delete</button>
                            <button onClick={() => setDeletingId(null)} className={S.btnGhost}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setDeletingId(campaign.id)} className={S.btnDanger}>Delete</button>
                        )}
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
                      {([
                        { label: "Flyers", value: campaign.flyers_sent },
                        { label: "Unique visitors", value: campaign.unique_visitors },
                        { label: "Checkout starts", value: campaign.checkout_starts },
                        { label: "Paid orders", value: campaign.paid_orders },
                        { label: "Discount uses", value: campaign.discount_uses },
                        { label: "Email leads", value: campaign.email_leads },
                        { label: "Customer value", value: campaign.paid_orders > 0 ? money(customerValueCents) : "—" },
                        { label: "Revenue", value: money(campaign.revenue_cents), accent: true },
                        { label: "Total cost", value: money(totalCostCents) },
                        { label: "CAC", value: campaign.paid_orders > 0 ? money(cacCents) : "—" },
                        { label: "Flyer → visit", value: `${flyerToVisit}%` },
                        { label: "Visit → order", value: `${visitToOrder}%` },
                        { label: "Add-on selects", value: campaign.add_on_selects },
                        { label: "Add-on checkouts", value: campaign.add_on_checkout_starts },
                        { label: "Add-on paid", value: campaign.add_on_paid_orders },
                        { label: "Add-on revenue", value: money(campaign.add_on_revenue_cents) },
                        { label: "Attach rate", value: percent(addOnAttachRate) },
                      ] as MetricCard[]).map((m) => (
                        <div key={m.label}>
                          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>{m.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 500, color: m.accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 4 }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
