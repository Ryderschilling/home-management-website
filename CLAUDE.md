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

## Build principles
- This is a solo operator's ops platform, not a toy demo — build for reliability and maintainability
- Primary pain being solved: scattered comms + no central client info
- Stripe handles all payments (subscriptions + one-time invoices)
- ProofPhoto model exists in schema — proof-of-visit photo UI is a priority feature not yet built
- When adding features, check the Open Questions section of the context file first

## Auto-update
If architectural decisions are made during a session (new routes, schema changes, major refactors), update the Application Architecture section of CHM_MASTER_CONTEXT.md.
