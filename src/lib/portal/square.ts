/**
 * Square, raw fetch, no SDK. The portal is the ONLY thing that writes to
 * Square; the CHM Ops dashboard stays read-only and syncs from it.
 *
 * Env (Vercel + .env.local):
 *   SQUARE_ENV                      sandbox | production
 *   SQUARE_ACCESS_TOKEN             the token for that environment
 *   SQUARE_LOCATION_ID              LA4134BAKSB68 in production ("Coastal Home Care")
 *   SQUARE_WEBHOOK_SIGNATURE_KEY    from the webhook subscription in the Square developer dashboard
 *   NEXT_PUBLIC_SQUARE_APP_ID       the application id (sandbox-sq0idb-... or sq0idp-...)
 *   NEXT_PUBLIC_SQUARE_LOCATION_ID  same as SQUARE_LOCATION_ID, exposed for the card form
 *   NEXT_PUBLIC_SQUARE_ENV          sandbox | production, picks the Web Payments SDK script
 *
 * Money is in cents everywhere in this file.
 */
import { createHmac, randomUUID } from "crypto";

const VERSION = "2025-01-23";

export function squareEnv(): "sandbox" | "production" {
  return process.env.SQUARE_ENV === "production" ? "production" : "sandbox";
}

export function squareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

function base(): string {
  return squareEnv() === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
}

export function locationId(): string {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) throw new Error("SQUARE_LOCATION_ID is not set.");
  return id;
}

export class SquareError extends Error {
  status: number;
  code: string | null;
  detail: string | null;
  constructor(status: number, errors: Array<{ code?: string; detail?: string; category?: string }>) {
    const first = errors[0];
    super(first?.detail || first?.code || `Square error ${status}`);
    this.status = status;
    this.code = first?.code ?? null;
    this.detail = first?.detail ?? null;
  }
}

async function sq<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | undefined> } = {}): Promise<T> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("SQUARE_ACCESS_TOKEN is not set.");
  const url = new URL(base() + "/v2" + path);
  for (const [k, v] of Object.entries(init.query ?? {})) if (v != null) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${token}`,
      "Square-Version": VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) {
    throw new SquareError(res.status, (json.errors as Array<{ code?: string; detail?: string }>) ?? []);
  }
  return json as T;
}

/** A card decline reads as a plain sentence for the client, not an error code. */
export function friendlySquareMessage(e: unknown): string {
  if (e instanceof SquareError) {
    const c = e.code ?? "";
    if (c.includes("CVV")) return "The security code on the back of the card did not match.";
    if (c.includes("EXPIR")) return "That card has expired.";
    if (c.includes("INSUFFICIENT")) return "The card was declined for insufficient funds.";
    if (c.includes("DECLINED") || c.includes("GENERIC_DECLINE")) return "The card was declined. Try another card, or call your bank.";
    if (c.includes("INVALID_CARD") || c.includes("INVALID_ACCOUNT")) return "That card number does not look right.";
    if (c.includes("ADDRESS") || c.includes("POSTAL")) return "The zip code did not match the card.";
    return e.detail ?? "The payment did not go through. Please try again or text Ryder.";
  }
  return e instanceof Error ? e.message : "Something went wrong with the payment.";
}

/* -------------------------------------------------------------- customers */

export type SquareCustomer = { id: string; given_name?: string; family_name?: string; email_address?: string; phone_number?: string };

export async function findCustomerByEmail(email: string): Promise<SquareCustomer | null> {
  const r = await sq<{ customers?: SquareCustomer[] }>("/customers/search", {
    body: { query: { filter: { email_address: { exact: email } } }, limit: 1 },
  });
  return r.customers?.[0] ?? null;
}

export async function ensureCustomer(input: { existingId?: string | null; name: string; email: string; phone?: string | null }): Promise<string> {
  if (input.existingId) {
    try {
      const r = await sq<{ customer?: SquareCustomer }>(`/customers/${input.existingId}`);
      if (r.customer?.id) return r.customer.id;
    } catch {
      /* fall through and find or create */
    }
  }
  const found = await findCustomerByEmail(input.email);
  if (found) return found.id;
  const parts = input.name.trim().split(/\s+/);
  const given = parts.shift() ?? input.name;
  const family = parts.join(" ") || undefined;
  const r = await sq<{ customer: SquareCustomer }>("/customers", {
    body: {
      idempotency_key: randomUUID(),
      given_name: given,
      family_name: family,
      email_address: input.email,
      phone_number: input.phone || undefined,
      reference_id: undefined,
      note: "Created by the CHM homeowner portal",
    },
  });
  return r.customer.id;
}

/* ------------------------------------------------------------------ cards */

export type SquareCard = { id: string; card_brand?: string; last_4?: string; exp_month?: number; exp_year?: number; enabled?: boolean };

export async function saveCard(input: { customerId: string; sourceId: string; cardholderName: string; verificationToken?: string }): Promise<SquareCard> {
  const r = await sq<{ card: SquareCard }>("/cards", {
    body: {
      idempotency_key: randomUUID(),
      source_id: input.sourceId,
      verification_token: input.verificationToken,
      card: { customer_id: input.customerId, cardholder_name: input.cardholderName },
    },
  });
  return r.card;
}

export async function listCards(customerId: string): Promise<SquareCard[]> {
  const r = await sq<{ cards?: SquareCard[] }>("/cards", { query: { customer_id: customerId, include_disabled: "false" } });
  return r.cards ?? [];
}

export async function disableCard(cardId: string): Promise<void> {
  await sq(`/cards/${cardId}/disable`, { method: "POST", body: {} });
}

/* --------------------------------------------------------------- payments */

export type SquarePayment = { id: string; status: string; receipt_url?: string; amount_money?: { amount: number }; tip_money?: { amount: number }; order_id?: string; customer_id?: string; reference_id?: string; note?: string; created_at?: string; card_details?: { card?: SquareCard } };

export async function createPayment(input: {
  sourceId: string;
  customerId?: string;
  amountCents: number;
  tipCents?: number;
  note: string;
  referenceId: string;
  idempotencyKey: string;
  verificationToken?: string;
}): Promise<SquarePayment> {
  const r = await sq<{ payment: SquarePayment }>("/payments", {
    body: {
      idempotency_key: input.idempotencyKey,
      source_id: input.sourceId,
      customer_id: input.customerId,
      location_id: locationId(),
      amount_money: { amount: input.amountCents, currency: "USD" },
      tip_money: input.tipCents ? { amount: input.tipCents, currency: "USD" } : undefined,
      note: input.note.slice(0, 500),
      reference_id: input.referenceId.slice(0, 40),
      verification_token: input.verificationToken,
      autocomplete: true,
    },
  });
  return r.payment;
}

export async function getPayment(paymentId: string): Promise<SquarePayment> {
  const r = await sq<{ payment: SquarePayment }>(`/payments/${paymentId}`);
  return r.payment;
}

export async function refundPayment(input: { paymentId: string; amountCents: number; reason: string; idempotencyKey: string }): Promise<{ id: string; status: string }> {
  const r = await sq<{ refund: { id: string; status: string } }>("/refunds", {
    body: {
      idempotency_key: input.idempotencyKey,
      payment_id: input.paymentId,
      amount_money: { amount: input.amountCents, currency: "USD" },
      reason: input.reason.slice(0, 192),
    },
  });
  return r.refund;
}

/* ---------------------------------------------------------- subscriptions */

type CatalogObject = { id: string; type: string; version?: number };

/**
 * Make sure a subscription plan variation exists in the Square catalog for a
 * service + term + monthly rate. Returns the variation id. The caller stores it
 * on ServiceCatalog so this runs once per price.
 */
export async function ensurePlanVariation(input: {
  planId: string | null;
  planName: string;
  variationName: string;
  monthlyCents: number;
  periods: number | null; // null = until canceled, 12 = locked year
}): Promise<{ planId: string; variationId: string }> {
  let planId = input.planId;
  if (!planId) {
    const r = await sq<{ catalog_object: CatalogObject }>("/catalog/object", {
      body: {
        idempotency_key: randomUUID(),
        object: {
          type: "SUBSCRIPTION_PLAN",
          id: "#plan",
          subscription_plan_data: { name: input.planName, all_items: true },
        },
      },
    });
    planId = r.catalog_object.id;
  }
  const v = await sq<{ catalog_object: CatalogObject }>("/catalog/object", {
    body: {
      idempotency_key: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN_VARIATION",
        id: "#variation",
        subscription_plan_variation_data: {
          name: input.variationName,
          subscription_plan_id: planId,
          phases: [
            {
              cadence: "MONTHLY",
              ordinal: 0,
              periods: input.periods ?? undefined,
              pricing: { type: "STATIC", price_money: { amount: input.monthlyCents, currency: "USD" } },
            },
          ],
        },
      },
    },
  });
  return { planId, variationId: v.catalog_object.id };
}

export type SquareSubscription = {
  id: string;
  status: string;
  start_date?: string;
  charged_through_date?: string;
  canceled_date?: string;
  card_id?: string;
  customer_id?: string;
  plan_variation_id?: string;
};

export async function createSubscription(input: {
  customerId: string;
  cardId: string;
  planVariationId: string;
  startDate: string; // YYYY-MM-DD, Chicago
  idempotencyKey: string;
}): Promise<SquareSubscription> {
  const r = await sq<{ subscription: SquareSubscription }>("/subscriptions", {
    body: {
      idempotency_key: input.idempotencyKey,
      location_id: locationId(),
      plan_variation_id: input.planVariationId,
      customer_id: input.customerId,
      card_id: input.cardId,
      start_date: input.startDate,
      timezone: "America/Chicago",
      source: { name: "CHM Homeowner Portal" },
    },
  });
  return r.subscription;
}

export async function getSubscription(id: string): Promise<SquareSubscription> {
  const r = await sq<{ subscription: SquareSubscription }>(`/subscriptions/${id}`);
  return r.subscription;
}

/** Ends at the close of the current paid period. Nothing is refunded. */
export async function cancelSubscription(id: string): Promise<SquareSubscription> {
  const r = await sq<{ subscription: SquareSubscription }>(`/subscriptions/${id}/cancel`, { method: "POST", body: {} });
  return r.subscription;
}

/** Point an existing subscription at a new card on file. */
export async function updateSubscriptionCard(id: string, cardId: string): Promise<void> {
  await sq(`/subscriptions/${id}`, { method: "PUT", body: { subscription: { card_id: cardId } } });
}

export async function pauseSubscription(id: string): Promise<void> {
  await sq(`/subscriptions/${id}/pause`, { method: "POST", body: {} });
}

export async function resumeSubscription(id: string): Promise<void> {
  await sq(`/subscriptions/${id}/resume`, { method: "POST", body: {} });
}

/* ---------------------------------------------------------------- webhook */

export function verifyWebhookSignature(notificationUrl: string, rawBody: string, signatureHeader: string | null): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !signatureHeader) return false;
  const expected = createHmac("sha256", key).update(notificationUrl + rawBody).digest("base64");
  return expected === signatureHeader;
}
