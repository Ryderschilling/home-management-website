<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was already partially integrated (client provider + a few manual events on the QR page), so this pass extended the coverage across the full business funnel:

- **`posthog-node` installed** for server-side event capture
- **`src/lib/posthog-server.ts` created** — singleton server-side PostHog client used in API routes
- **Environment variables** set in `.env.local` (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)
- **8 new events** instrumented across 5 files (client and server)

## Events added

| Event | Description | File |
|---|---|---|
| `pricing_cta_clicked` | User clicked a plan CTA on the pricing page | `src/app/pricing/page.tsx` |
| `pricing_inquiry_submitted` | Pricing inquiry form successfully submitted | `src/app/pricing/page.tsx` |
| `qr_upgrade_viewed` | User reached the upsell/upgrade page in the QR funnel | `src/app/qr/upgrade/page.tsx` |
| `qr_addon_selected` | User chose to add the electrical box cover add-on | `src/app/qr/upgrade/page.tsx` |
| `qr_addon_declined` | User clicked "No thanks" to skip the upsell | `src/app/qr/upgrade/page.tsx` |
| `qr_order_details_submitted` | Customer submitted pipe photo + fit details on success page | `src/app/qr/success/page.tsx` |
| `order_completed` | Stripe `checkout.session.completed` webhook confirmed paid order *(server-side)* | `src/app/api/stripe/webhook/route.ts` |
| `lead_captured` | New or returning lead saved to DB via marketing lead API *(server-side)* | `src/app/api/marketing/lead/route.ts` |

## Next steps

We've built a dashboard and insights to monitor your core business metrics from day one:

**Dashboard:** https://us.posthog.com/project/371716/dashboard/1437059

**Insights:**
- [QR funnel: page view → checkout → upgrade → order](https://us.posthog.com/project/371716/insights/mqRYZHN6)
- [Lead capture volume (weekly)](https://us.posthog.com/project/371716/insights/SQ3UKG9v)
- [Pricing inquiry conversion](https://us.posthog.com/project/371716/insights/778UxCPl)
- [Upsell: add-on selected vs. declined (weekly)](https://us.posthog.com/project/371716/insights/8rOrkDpt)
- [Orders completed (weekly)](https://us.posthog.com/project/371716/insights/apg9g2i2)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
