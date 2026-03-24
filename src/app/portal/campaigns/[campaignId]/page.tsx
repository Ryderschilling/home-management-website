"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CampaignIdentity = {
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
};

type CampaignSummary = {
  visits: number;
  unique_visitors: number;
  checkout_starts: number;
  paid_orders: number;
  revenue_cents: number;
  email_leads: number;
  upload_completed: number;
  discount_uses: number;
  add_on_selects: number;
  add_on_checkout_starts: number;
  add_on_paid_orders: number;
  add_on_revenue_cents: number;
  add_on_attach_rate: number;
};

type FunnelRow = {
  key: string;
  label: string;
  count: number;
};

type ConversionRates = {
  visit_to_checkout: number;
  visit_to_paid_order: number;
  checkout_to_paid: number;
  add_on_attach_rate: number;
  lead_conversion_rate: number;
};

type PathTransition = {
  from_step: string;
  to_step: string;
  count: number;
};

type RecentEvent = {
  id: string;
  created_at: string;
  event_type: string;
  session_key?: string | null;
  page_path?: string | null;
  order_id?: string | null;
  metadata?: Record<string, unknown> | null;
  metadata_summary?: string;
};

type CampaignAnalyticsPayload = {
  campaign: CampaignIdentity;
  summary: CampaignSummary;
  funnel: FunnelRow[];
  conversion_rates: ConversionRates;
  path_transitions: PathTransition[];
  recent_events: RecentEvent[];
};

const S = {
  card: "rounded-2xl border border-[var(--border)] bg-[var(--surface)]",
  cardInner: "rounded-xl border border-[var(--border)] bg-[var(--surface-2)]",
  btnGhost:
    "inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]",
};

function money(cents: number | null | undefined) {
  return `$${((typeof cents === "number" ? cents : 0) / 100).toFixed(2)}`;
}

function integer(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(typeof value === "number" ? value : 0);
}

function percent(value: number | null | undefined) {
  const safe = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${(safe * 100).toFixed(1)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventType(eventType: string) {
  if (!eventType) return "Unknown event";
  return eventType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStep(step: string) {
  if (!step) return "—";
  if (step.startsWith("/")) return step;
  return step.replaceAll("_", " ");
}

export default function PortalCampaignDetailPage() {
  const params = useParams<{ campaignId: string }>();
  const campaignIdParam = params?.campaignId;
  const campaignId = Array.isArray(campaignIdParam) ? campaignIdParam[0] : campaignIdParam;

  const [payload, setPayload] = useState<CampaignAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCampaignAnalytics() {
      if (!campaignId) {
        setError("Missing campaign id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/campaigns/${campaignId}/analytics`, {
          cache: "no-store",
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok || !json.ok) {
          throw new Error(json?.error?.message ?? "Failed to load campaign analytics");
        }

        if (!cancelled) {
          setPayload((json.data ?? null) as CampaignAnalyticsPayload | null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load campaign analytics"
          );
          setPayload(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCampaignAnalytics();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const summaryCards = useMemo(() => {
    if (!payload) return [];

    const totalCostCents =
      (payload.campaign.print_cost_cents ?? 0) +
      (payload.campaign.distribution_cost_cents ?? 0);
    const customerValueCents =
      payload.summary.paid_orders > 0
        ? Math.round(payload.summary.revenue_cents / payload.summary.paid_orders)
        : 0;
    const cacCents =
      payload.summary.paid_orders > 0
        ? Math.round(totalCostCents / payload.summary.paid_orders)
        : 0;

    return [
      { label: "Visits", value: integer(payload.summary.visits) },
      { label: "Unique visitors", value: integer(payload.summary.unique_visitors) },
      { label: "Checkout starts", value: integer(payload.summary.checkout_starts) },
      { label: "Paid orders", value: integer(payload.summary.paid_orders) },
      { label: "Revenue", value: money(payload.summary.revenue_cents), accent: true },
      { label: "Email leads", value: integer(payload.summary.email_leads) },
      { label: "Upload completed", value: integer(payload.summary.upload_completed) },
      { label: "Discount uses", value: integer(payload.summary.discount_uses) },
      { label: "Add-on selects", value: integer(payload.summary.add_on_selects) },
      {
        label: "Add-on checkout starts",
        value: integer(payload.summary.add_on_checkout_starts),
      },
      { label: "Add-on paid orders", value: integer(payload.summary.add_on_paid_orders) },
      { label: "Add-on revenue", value: money(payload.summary.add_on_revenue_cents) },
      { label: "Add-on attach rate", value: percent(payload.summary.add_on_attach_rate) },
      { label: "Customer value", value: payload.summary.paid_orders > 0 ? money(customerValueCents) : "—" },
      { label: "Total cost", value: money(totalCostCents) },
      { label: "CAC", value: payload.summary.paid_orders > 0 ? money(cacCents) : "—" },
    ];
  }, [payload]);

  if (loading) {
    return (
      <div className="space-y-6">
        <section className={S.card}>
          <div className="px-6 py-8 text-sm text-[var(--text-muted)]">
            Loading campaign analytics…
          </div>
        </section>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="space-y-6">
        <section className={S.card}>
          <div className="flex flex-col gap-4 px-6 py-8">
            <div className="text-sm text-red-400">
              {error || "Campaign analytics could not be loaded."}
            </div>
            <div>
              <Link href="/portal/campaigns" className={S.btnGhost}>
                Back to campaigns
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const totalCostCents =
    (payload.campaign.print_cost_cents ?? 0) +
    (payload.campaign.distribution_cost_cents ?? 0);

  return (
    <div className="space-y-6">
      <section className={S.card}>
        <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Campaign detail
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                  fontSize: 32,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                  marginTop: 8,
                }}
              >
                {payload.campaign.name}
              </h1>
              <div className="mt-3 text-sm text-[var(--text-secondary)]">
                {payload.campaign.channel} · {payload.campaign.campaign_code}
              </div>
            </div>
            <Link href="/portal/campaigns" className={S.btnGhost}>
              Back to campaigns
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Campaign code", value: payload.campaign.campaign_code },
              { label: "Landing path", value: payload.campaign.landing_path || "/qr" },
              { label: "QR URL", value: `/qr?c=${payload.campaign.campaign_code}` },
              { label: "Created", value: formatDate(payload.campaign.created_at) },
              { label: "Flyers sent", value: integer(payload.campaign.flyers_sent) },
              { label: "Print cost", value: money(payload.campaign.print_cost_cents) },
              {
                label: "Distribution cost",
                value: money(payload.campaign.distribution_cost_cents),
              },
              { label: "Total cost", value: money(totalCostCents) },
              { label: "Status", value: payload.campaign.active ? "Active" : "Inactive" },
            ].map((item) => (
              <div key={item.label} className={S.cardInner} style={{ padding: 16 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {item.label}
                </div>
                <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {payload.campaign.notes ? (
            <div className={S.cardInner} style={{ padding: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Notes
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {payload.campaign.notes}
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-6 sm:px-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className={S.cardInner} style={{ padding: 16 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: card.accent
                      ? "var(--accent-warm, #c9b89a)"
                      : "var(--text-primary)",
                    marginTop: 6,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={S.card}>
          <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7">
            <h2
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 22,
                color: "var(--text-primary)",
              }}
            >
              Funnel breakdown
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 py-6 sm:grid-cols-2 sm:px-7">
            {payload.funnel.map((row) => (
              <div key={row.key} className={S.cardInner} style={{ padding: 16 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {row.label}
                </div>
                <div className="mt-2 text-2xl font-medium text-[var(--text-primary)]">
                  {integer(row.count)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={S.card}>
          <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7">
            <h2
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 22,
                color: "var(--text-primary)",
              }}
            >
              Conversion rates
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 px-5 py-6 sm:px-7">
            {[
              {
                label: "Visit to checkout",
                value: percent(payload.conversion_rates.visit_to_checkout),
              },
              {
                label: "Visit to paid order",
                value: percent(payload.conversion_rates.visit_to_paid_order),
              },
              {
                label: "Checkout to paid",
                value: percent(payload.conversion_rates.checkout_to_paid),
              },
              {
                label: "Add-on attach rate",
                value: percent(payload.conversion_rates.add_on_attach_rate),
              },
              {
                label: "Lead conversion rate",
                value: percent(payload.conversion_rates.lead_conversion_rate),
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4"
              >
                <div className="text-sm text-[var(--text-secondary)]">{row.label}</div>
                <div className="text-lg font-medium text-[var(--text-primary)]">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={S.card}>
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7">
          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 22,
              color: "var(--text-primary)",
            }}
          >
            Path flow
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Transition counts across tracked funnel steps and key campaign events.
          </p>
        </div>
        <div className="px-5 py-6 sm:px-7">
          {payload.path_transitions.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">No path transitions tracked yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <th className="pb-3 pr-4 font-medium">From step</th>
                    <th className="pb-3 pr-4 font-medium">To step</th>
                    <th className="pb-3 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.path_transitions.map((row) => (
                    <tr key={`${row.from_step}-${row.to_step}`} className="border-b border-[var(--border)]/70">
                      <td className="py-3 pr-4 text-[var(--text-primary)]">{formatStep(row.from_step)}</td>
                      <td className="py-3 pr-4 text-[var(--text-primary)]">{formatStep(row.to_step)}</td>
                      <td className="py-3 text-[var(--text-secondary)]">{integer(row.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className={S.card}>
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7">
          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 22,
              color: "var(--text-primary)",
            }}
          >
            Recent activity
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Latest campaign events in reverse chronological order.
          </p>
        </div>
        <div className="px-5 py-6 sm:px-7">
          {payload.recent_events.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)]">No campaign events yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <th className="pb-3 pr-4 font-medium">Timestamp</th>
                    <th className="pb-3 pr-4 font-medium">Event</th>
                    <th className="pb-3 pr-4 font-medium">Path</th>
                    <th className="pb-3 pr-4 font-medium">Session</th>
                    <th className="pb-3 font-medium">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.recent_events.map((event) => (
                    <tr key={event.id} className="border-b border-[var(--border)]/70 align-top">
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {formatDateTime(event.created_at)}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-primary)]">
                        <div>{formatEventType(event.event_type)}</div>
                        {event.order_id ? (
                          <div className="mt-1 text-xs text-[var(--text-muted)]">
                            Order: {event.order_id.slice(0, 8)}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {event.page_path || "—"}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {event.session_key ? (
                          <span className="font-mono text-xs text-[var(--text-primary)]">
                            {event.session_key.slice(0, 12)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {event.metadata_summary || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
