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

function money(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function inputClass() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500";
}

function labelClass() {
  return "text-[11px] uppercase tracking-[0.22em] text-stone-500";
}

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
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
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/campaigns", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to load campaigns");
      }

      setCampaigns(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCampaign() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          campaign_code: campaignCode,
          channel: "flyer",
          landing_path: "/qr",
          flyers_sent: flyersSent,
          print_cost_dollars: printCost,
          distribution_cost_dollars: distributionCost,
          notes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to create campaign");
      }

      setName("");
      setCampaignCode("");
      setFlyersSent("");
      setPrintCost("");
      setDistributionCost("");
      setNotes("");

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  async function updateCampaign(campaign: Campaign) {
    setError("");

    const nextFlyersSent = window.prompt(
      "Flyers sent",
      String(campaign.flyers_sent ?? 0)
    );
    if (nextFlyersSent === null) return;

    const nextPrintCost = window.prompt(
      "Print cost (dollars)",
      String((campaign.print_cost_cents ?? 0) / 100)
    );
    if (nextPrintCost === null) return;

    const nextDistributionCost = window.prompt(
      "Distribution cost (dollars)",
      String((campaign.distribution_cost_cents ?? 0) / 100)
    );
    if (nextDistributionCost === null) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaign.name,
          channel: campaign.channel,
          landing_path: campaign.landing_path,
          flyers_sent: nextFlyersSent,
          print_cost_dollars: nextPrintCost,
          distribution_cost_dollars: nextDistributionCost,
          notes: campaign.notes ?? "",
          active: campaign.active,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to update campaign");
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update campaign");
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    setError("");

    const confirmed = window.confirm(
      `Delete campaign "${campaign.name}"?\n\nThis will permanently remove its campaign tracking history and unlink any attributed orders from this campaign.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to delete campaign");
      }

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete campaign");
    }
  }

  const summary = useMemo(() => {
    return campaigns.reduce(
      (acc, campaign) => {
        acc.flyers += campaign.flyers_sent || 0;
        acc.visits += campaign.visits || 0;
        acc.orders += campaign.paid_orders || 0;
        acc.revenue += campaign.revenue_cents || 0;
        return acc;
      },
      { flyers: 0, visits: 0, orders: 0, revenue: 0 }
    );
  }, [campaigns]);

  return (
    <div className="space-y-8">
      <section className={cardClass()}>
        <div className="border-b border-stone-200 px-6 py-5">
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Marketing
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Campaigns
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-600">
            Create a flyer campaign, use its code in your QR URL, and track visits,
            checkout starts, paid orders, discount usage, revenue, CAC, and customer
            value.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 px-6 py-6 md:grid-cols-4">
          <div>
            <div className={labelClass()}>Flyers sent</div>
            <div className="mt-2 text-2xl font-semibold">{summary.flyers}</div>
          </div>
          <div>
            <div className={labelClass()}>Visits</div>
            <div className="mt-2 text-2xl font-semibold">{summary.visits}</div>
          </div>
          <div>
            <div className={labelClass()}>Paid orders</div>
            <div className="mt-2 text-2xl font-semibold">{summary.orders}</div>
          </div>
          <div>
            <div className={labelClass()}>Revenue</div>
            <div className="mt-2 text-2xl font-semibold">{money(summary.revenue)}</div>
          </div>
        </div>
      </section>

      <section className={cardClass()}>
        <div className="border-b border-stone-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-stone-900">Create flyer campaign</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
          <div>
            <div className={labelClass()}>Campaign name</div>
            <input
              className={inputClass()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Watersound Origins Flyer Drop"
            />
          </div>

          <div>
            <div className={labelClass()}>Campaign code</div>
            <input
              className={inputClass()}
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value.toLowerCase())}
              placeholder="watersound-flyer-001"
            />
          </div>

          <div>
            <div className={labelClass()}>Flyers sent</div>
            <input
              className={inputClass()}
              value={flyersSent}
              onChange={(e) => setFlyersSent(e.target.value)}
              placeholder="500"
              inputMode="numeric"
            />
          </div>

          <div>
            <div className={labelClass()}>Print cost ($)</div>
            <input
              className={inputClass()}
              value={printCost}
              onChange={(e) => setPrintCost(e.target.value)}
              placeholder="95"
              inputMode="decimal"
            />
          </div>

          <div>
            <div className={labelClass()}>Distribution cost ($)</div>
            <input
              className={inputClass()}
              value={distributionCost}
              onChange={(e) => setDistributionCost(e.target.value)}
              placeholder="0"
              inputMode="decimal"
            />
          </div>

          <div className="md:col-span-2">
            <div className={labelClass()}>Notes</div>
            <textarea
              className={`${inputClass()} min-h-[96px] resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Neighborhood, print run, drop date, etc."
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={createCampaign}
              disabled={saving}
              className="rounded-full bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-stone-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Create campaign"}
            </button>
          </div>
        </div>
      </section>

      <section className={cardClass()}>
        <div className="border-b border-stone-200 px-6 py-5">
          <h2 className="text-xl font-semibold text-stone-900">Live campaign performance</h2>
        </div>

        <div className="px-6 py-6">
          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="text-sm text-stone-600">Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className="text-sm text-stone-600">No campaigns yet.</div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const totalCostCents =
                  (campaign.print_cost_cents ?? 0) +
                  (campaign.distribution_cost_cents ?? 0);

                const cacCents =
                  campaign.paid_orders > 0
                    ? Math.round(totalCostCents / campaign.paid_orders)
                    : 0;

                const customerValueCents =
                  campaign.paid_orders > 0
                    ? Math.round((campaign.revenue_cents ?? 0) / campaign.paid_orders)
                    : 0;

                const flyerToVisit =
                  campaign.flyers_sent > 0
                    ? ((campaign.unique_visitors / campaign.flyers_sent) * 100).toFixed(1)
                    : "0.0";

                const rawVisitToOrder =
                  campaign.unique_visitors > 0
                    ? (campaign.paid_orders / campaign.unique_visitors) * 100
                    : 0;

                const visitToOrder = Math.min(rawVisitToOrder, 100).toFixed(1);

                return (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                          {campaign.channel} • {campaign.campaign_code}
                        </div>
                        <div className="mt-1 text-xl font-semibold text-stone-900">
                          {campaign.name}
                        </div>
                        <div className="mt-2 text-sm text-stone-600">
                          QR URL:{" "}
                          <span className="font-medium text-stone-900">
                            {`/qr?c=${campaign.campaign_code}`}
                          </span>
                        </div>
                        {campaign.notes ? (
                          <div className="mt-2 text-sm text-stone-600">
                            {campaign.notes}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateCampaign(campaign)}
                          className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-800 transition hover:bg-white"
                        >
                          Update counts / costs
                        </button>

                        <button
                          onClick={() => deleteCampaign(campaign)}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
                      <div>
                        <div className={labelClass()}>Flyers</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.flyers_sent}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Unique visitors</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.unique_visitors}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Checkout starts</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.checkout_starts}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Paid orders</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.paid_orders}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Discount uses</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.discount_uses}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Email leads</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.email_leads}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Customer value</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.paid_orders > 0 ? money(customerValueCents) : "—"}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Revenue</div>
                        <div className="mt-1 text-lg font-semibold">
                          {money(campaign.revenue_cents)}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Total cost</div>
                        <div className="mt-1 text-lg font-semibold">
                          {money(totalCostCents)}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>CAC</div>
                        <div className="mt-1 text-lg font-semibold">
                          {campaign.paid_orders > 0 ? money(cacCents) : "—"}
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Flyer → visit</div>
                        <div className="mt-1 text-lg font-semibold">
                          {flyerToVisit}%
                        </div>
                      </div>

                      <div>
                        <div className={labelClass()}>Visit → order</div>
                        <div className="mt-1 text-lg font-semibold">
                          {visitToOrder}%
                        </div>
                      </div>
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