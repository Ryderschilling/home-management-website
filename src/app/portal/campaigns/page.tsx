"use client";

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
  discount_uses: number;
  revenue_cents: number;
  email_leads: number;
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

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

export default function PortalCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
  const [flyersSent, setFlyersSent] = useState("");
  const [printCost, setPrintCost] = useState("");
  const [distributionCost, setDistributionCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
      const res = await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, campaign_code: campaignCode, channel: "flyer", landing_path: "/qr", flyers_sent: flyersSent, print_cost_dollars: printCost, distribution_cost_dollars: distributionCost, notes }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to create campaign");
      setName(""); setCampaignCode(""); setFlyersSent(""); setPrintCost(""); setDistributionCost(""); setNotes("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to create campaign"); }
    finally { setSaving(false); }
  }

  async function updateCampaign(campaign: Campaign) {
    setError("");
    const nextFlyersSent = window.prompt("Flyers sent", String(campaign.flyers_sent ?? 0));
    if (nextFlyersSent === null) return;
    const nextPrintCost = window.prompt("Print cost (dollars)", String((campaign.print_cost_cents ?? 0) / 100));
    if (nextPrintCost === null) return;
    const nextDistributionCost = window.prompt("Distribution cost (dollars)", String((campaign.distribution_cost_cents ?? 0) / 100));
    if (nextDistributionCost === null) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: campaign.name, channel: campaign.channel, landing_path: campaign.landing_path, flyers_sent: nextFlyersSent, print_cost_dollars: nextPrintCost, distribution_cost_dollars: nextDistributionCost, notes: campaign.notes ?? "", active: campaign.active }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to update campaign");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to update campaign"); }
  }

  async function deleteCampaign(campaign: Campaign) {
    setError("");
    if (!window.confirm(`Delete campaign "${campaign.name}"?\n\nThis will permanently remove its campaign tracking history and unlink any attributed orders from this campaign.`)) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json?.error?.message ?? "Failed to delete campaign");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete campaign"); }
  }

  const summary = useMemo(() =>
    campaigns.reduce((acc, c) => ({ flyers: acc.flyers + (c.flyers_sent || 0), visits: acc.visits + (c.visits || 0), orders: acc.orders + (c.paid_orders || 0), revenue: acc.revenue + (c.revenue_cents || 0) }),
    { flyers: 0, visits: 0, orders: 0, revenue: 0 }), [campaigns]);

  return (
    <div className="space-y-6">
      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "24px 28px" }}>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Marketing</div>
          <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Campaigns</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 560 }}>Create a flyer campaign, use its code in your QR URL, and track visits, checkout starts, paid orders, discount usage, revenue, CAC, and customer value.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 px-7 py-6 md:grid-cols-4">
          {[{ label: "Flyers sent", value: summary.flyers }, { label: "Visits", value: summary.visits }, { label: "Paid orders", value: summary.orders }, { label: "Revenue", value: money(summary.revenue), accent: true }].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>{s.label}</div>
              <div style={{ fontFamily: "var(--font-serif), serif", fontSize: 26, color: (s as any).accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 8 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 20, color: "var(--text-primary)" }}>Create flyer campaign</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 px-7 py-6 md:grid-cols-2">
          {[{ label: "Campaign name", val: name, set: setName, placeholder: "Watersound Origins Flyer Drop" }, { label: "Campaign code", val: campaignCode, set: (v: string) => setCampaignCode(v.toLowerCase()), placeholder: "watersound-flyer-001" }, { label: "Flyers sent", val: flyersSent, set: setFlyersSent, placeholder: "500" }, { label: "Print cost ($)", val: printCost, set: setPrintCost, placeholder: "95" }, { label: "Distribution cost ($)", val: distributionCost, set: setDistributionCost, placeholder: "0" }].map((f) => (
            <div key={f.label}>
              <div className={S.label} style={{ marginBottom: 6 }}>{f.label}</div>
              <input className={S.input} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="md:col-span-2">
            <div className={S.label} style={{ marginBottom: 6 }}>Notes</div>
            <textarea className={`${S.input} min-h-[96px] resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Neighborhood, print run, drop date, etc." />
          </div>
          <div className="md:col-span-2">
            <button onClick={createCampaign} disabled={saving} className={S.btnPrimary}>{saving ? "Saving…" : "Create campaign"}</button>
          </div>
        </div>
      </section>

      <section className={S.card}>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 28px" }}>
          <h2 style={{ fontFamily: "var(--font-serif), serif", fontSize: 20, color: "var(--text-primary)" }}>Live campaign performance</h2>
        </div>
        <div className="px-7 py-6">
          {error && <div className="mb-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">{error}</div>}
          {loading ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading campaigns…</div>
          : campaigns.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No campaigns yet.</div>
          : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const totalCostCents = (campaign.print_cost_cents ?? 0) + (campaign.distribution_cost_cents ?? 0);
                const cacCents = campaign.paid_orders > 0 ? Math.round(totalCostCents / campaign.paid_orders) : 0;
                const customerValueCents = campaign.paid_orders > 0 ? Math.round((campaign.revenue_cents ?? 0) / campaign.paid_orders) : 0;
                const flyerToVisit = campaign.flyers_sent > 0 ? ((campaign.unique_visitors / campaign.flyers_sent) * 100).toFixed(1) : "0.0";
                const visitToOrder = Math.min(campaign.unique_visitors > 0 ? (campaign.paid_orders / campaign.unique_visitors) * 100 : 0, 100).toFixed(1);
                return (
                  <div key={campaign.id} className={S.cardInner} style={{ padding: 20 }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>{campaign.channel} · {campaign.campaign_code}</div>
                        <div style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>{campaign.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>QR URL: <span style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono), monospace" }}>{`/qr?c=${campaign.campaign_code}`}</span></div>
                        {campaign.notes && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{campaign.notes}</div>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateCampaign(campaign)} className={S.btnGhost}>Update counts / costs</button>
                        <button onClick={() => deleteCampaign(campaign)} className={S.btnDanger}>Delete</button>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                      {[{ label: "Flyers", value: campaign.flyers_sent }, { label: "Unique visitors", value: campaign.unique_visitors }, { label: "Checkout starts", value: campaign.checkout_starts }, { label: "Paid orders", value: campaign.paid_orders }, { label: "Discount uses", value: campaign.discount_uses }, { label: "Email leads", value: campaign.email_leads }, { label: "Customer value", value: campaign.paid_orders > 0 ? money(customerValueCents) : "—" }, { label: "Revenue", value: money(campaign.revenue_cents), accent: true }, { label: "Total cost", value: money(totalCostCents) }, { label: "CAC", value: campaign.paid_orders > 0 ? money(cacCents) : "—" }, { label: "Flyer → visit", value: `${flyerToVisit}%` }, { label: "Visit → order", value: `${visitToOrder}%` }].map((m) => (
                        <div key={m.label}>
                          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>{m.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 500, color: (m as any).accent ? "var(--accent-warm, #c9b89a)" : "var(--text-primary)", marginTop: 4 }}>{m.value}</div>
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
