# CHM Codebase Instructions

## Context
Read this before touching any code:
`/CHM context/CHM_MASTER_CONTEXT.md`

This is the source of truth for the business — services, pricing, goals, architecture, and open decisions.

## Stack
- Next.js 16 App Router, TypeScript
- Clerk (auth), NeonDB + Prisma (database), Stripe (payments), Resend (email)
- Tailwind CSS v4, Vercel deployment

## Architecture
- `/src/app/admin/` — backend CRM (clients, properties, orders, retainers, jobs, invoices, services, campaigns, templates, analytics, exports)
- `/src/app/portal/` — client-facing portal
- `/src/app/api/` — API routes (admin, cron, health, marketing, qr, site-data, stripe, test)
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

## Build principles
- This is a solo operator's ops platform, not a toy demo — build for reliability and maintainability
- Primary pain being solved: scattered comms + no central client info
- Stripe handles all payments (subscriptions + one-time invoices)
- ProofPhoto model exists in schema — proof-of-visit photo UI is a priority feature not yet built
- When adding features, check the Open Questions section of the context file first

## Auto-update
If architectural decisions are made during a session (new routes, schema changes, major refactors), update the Application Architecture section of CHM_MASTER_CONTEXT.md.
