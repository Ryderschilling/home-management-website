# CHM Codebase Instructions

## Context
Read this before touching any code:
`/CHM context/CHM_MASTER_CONTEXT.md`

This is the source of truth for the business — services, pricing, goals, architecture, and open decisions.

## Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4, Vercel
- Prisma 7 client over the CHM OPS database (see below), Resend (email), Square (portal payments)
- There is NO Clerk and NO Stripe in live code. Stripe files under src/lib/server/services are dead leftovers.

## Two databases, on purpose
- `DATABASE_URL` is the OLD website database. Only the legacy marketing lead code
  (src/lib/server/db.ts, /api/marketing/lead, lead drip) still uses it, through
  raw SQL. Leave it alone.
- `OPS_DATABASE_URL` is the CHM Ops dashboard's Neon database, THE system of record.
  `src/lib/prisma.ts` connects here. The homeowner portal reads and writes it.
- `prisma/schema.prisma` is GENERATED from the dashboard repo. Never edit it by
  hand and NEVER run `prisma migrate` or `prisma db push` from this repo. Schema
  changes happen in chm-dashboard, get pushed from there, then run
  `node scripts/sync-schema.mjs` here.

## Homeowner portal (`/portal`, added 2026-09-23)
- Routes: `src/app/portal/(auth)/*` (login, signup, verify, forgot, reset) and
  `src/app/portal/(app)/*` (calendar home, checkout, orders/[id], account,
  history, reports/[id]). `middleware.ts` gates /portal on the session cookie;
  the (app) layout does the real check.
- Server actions: `src/app/portal/actions/{auth,account,orders}.ts`.
  Libs: `src/lib/portal/*` (dates = Chicago day math, rules = booking rules,
  square = raw Square REST, email = Resend template, placement = monthly
  auto-placement, session, password, rateLimit, serviceNotes, dashboardBridge).
- UI: `src/components/portal/*`, styles are the `.pt-*` classes at the end of
  globals.css, inside `@layer components`. Light theme, big type, older clients.
- Money: the PORTAL is the only thing that writes to Square (card on file,
  one-time payments with tip, monthly subscriptions, refunds). Webhook at
  `/api/portal/square/webhook`. With no SQUARE_* env set, checkout falls back to
  "Ryder invoices you" (order goes through as PENDING with a Task).
- The 3-day rule: nothing can be booked, moved or canceled for a date less than
  3 days out (`LEAD_DAYS` in src/lib/portal/dates.ts). Enforced server side.
- Access codes are encrypted at rest with `src/lib/secrets.ts` (same file and
  same `CODES_KEY` as the dashboard).
- The price list is the `ServiceCatalog` table, seeded from the dashboard
  (`scripts/seed-portal.ts` over there). The public pricing page still has its
  own copy in src/data/siteData.ts and src/app/pricing/page.tsx; keep them in step.
- Plans, two terms (PlanSubscription.term):
  - MONTHLY = ONE month bought at a time. Client picks the exact days for that
    month, the plan line is charged at checkout (amount = rate), start/end =
    first/last day of the month. No Square subscription. Renewal = buying next
    month (`?renew=1` opens the picker on it). `/api/portal/cron/renewals` on
    the 24th emails "renew for next month"; `/api/portal/cron/monthly` on the
    1st expires unrenewed months (sub CANCELED, client PAUSED, nudge email).
  - LOCK12 = weekday pattern (preferredWeekday + weekOrdinals: [1,3], [2,4],
    or [] for every week), Square subscription bills monthly, the 1st cron
    places next month's visits with `patternDays()` in rules.ts. Early cancel
    charges $150 to the card on file (`cancelPlan` in actions/orders.ts).
- Tips at checkout are 10/15/20% of what is charged today (or Other).
- Env: OPS_DATABASE_URL, CODES_KEY, CRON_SECRET, INTAKE_SECRET + DASHBOARD_INTAKE_URL
  (existing), DASHBOARD_URL (optional), RESEND_API_KEY, FROM_EMAIL, APP_URL,
  SQUARE_ENV, SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_WEBHOOK_SIGNATURE_KEY,
  NEXT_PUBLIC_SQUARE_APP_ID, NEXT_PUBLIC_SQUARE_LOCATION_ID, NEXT_PUBLIC_SQUARE_ENV,
  PORTAL_NOTIFY_EMAIL (optional).

## Architecture
- `/src/app/portal/` — the homeowner portal (above)
- `/src/app/api/` — API routes (marketing, booking, away, storm-check, pricing, site-data, portal/*)
- Public SEO landing pages target inlet beach / 30A search terms

## THE INSURANCE LANGUAGE RULE (read before writing any copy)

`src/data/protection.ts` is the source of truth and carries the citations.
Short version, and it is a hard line:

- CHM sells two claim-protection services: **Water Shutoff Protection**
  ($1,295 installed + $35/mo, monitoring included on Coastal Elite) and the
  **Annual Coverage Record** ($195/yr, included on Coastal Elite).
- Verified August 2026: **no US insurance carrier gives a premium discount for
  a home watch service.** Never say or imply CHM lowers, reduces, or discounts
  anyone's premium.
- Never say "second insurance" or any variant.
- Never say a carrier requires, endorses, approves, or recognizes CHM.
- Never call a CHM visit an "inspection." Home inspection is a licensed
  profession in Florida (Fla. Stat. 468.8311) and practicing without the
  license is a first-degree misdemeanor (468.8319). Use visit, walkthrough,
  check, property check, condition report.
- Never give advice about a person's coverage. CHM is not a licensed agent
  (Fla. Stat. 626.112).
- What IS true and may be said: the shutoff **device** carries a published
  premium credit at some carriers (PURE publishes up to 5%). That credit is
  the client's carrier's doing and attaches to the device, not to our service.
  Always phrase it as "ask your agent."
- Any page that mentions insurance must render `<LegalDisclaimer />`.

## THE GOOGLE LISTING RULE (read before writing any schema)

On 9/10/26 Google AI Mode showed our name with Coast Property Management's photo,
87 reviews, and listing. Their name is nearly ours and they share our category.

- Our real Google listing is `siteData.gbpMapsUrl` (Maps CID 1620304355006096316).
- Every `LocalBusiness` block uses `"@id": "https://coastalhomemngt30a.com/#business"`.
  Never invent a page-specific business @id. As a Service provider, use the same @id.
- `sameAs` and `hasMap` use `siteData.gbpMapsUrl`. Never the g.page review link
  (`siteData.gbpUrl` is only for "leave a review" buttons).
- Never use `google.com/maps/place/<name>` URLs. They resolve to nothing.
- `scripts/check-entity.mjs` runs as `prebuild` and fails the Vercel build if any
  of this is broken. Fix the schema, never delete the check.

## Build principles
- This is a solo operator's ops platform, not a toy demo — build for reliability and maintainability
- Primary pain being solved: scattered comms + no central client info
- Square handles portal payments (subscriptions + one-time charges). No Stripe.
- Visit reports and photos live in the dashboard's VisitReport/VisitPhoto tables and the portal shows them read-only (FINAL only)
- When adding features, check the Open Questions section of the context file first

## Auto-update
If architectural decisions are made during a session (new routes, schema changes, major refactors), update the Application Architecture section of CHM_MASTER_CONTEXT.md.
