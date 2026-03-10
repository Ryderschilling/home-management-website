// src/app/qr/terms/page.tsx
import Link from "next/link";

export const runtime = "nodejs";

export default function QrTermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
              Coastal Home Management 30A
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Terms of Service & Installation Agreement
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Effective date: {new Date().toLocaleDateString()}
            </p>
          </div>

          <Link
            href="/qr"
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/80 transition hover:bg-white/10"
          >
            Back
          </Link>
        </div>

        <div className="mt-8 space-y-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-white/80">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">1) Acceptance of Terms</h2>
            <p>
              By placing an order, paying through Stripe, or submitting photos/information through the QR page,
              you (“Customer”) agree to these Terms of Service & Installation Agreement (“Agreement”).
              If you do not agree, do not purchase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">2) Services & Product</h2>
            <p>
              Coastal Home Management 30A (“CHM”, “we”, “us”) coordinates the installation of an artificial rock
              cover intended to conceal or protect exterior fixtures/pipes. Color selection is based on photos
              and may vary due to lighting, materials, and manufacturer variation.
            </p>
            <p>
              Unless explicitly stated in writing, the purchase covers (a) the rock cover and (b) standard installation
              at one location. Additional labor, parts, or non-standard site conditions may require an additional fee
              with Customer approval.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">3) Fit Verification Required</h2>
            <p>
              Customer must provide clear photos and accurate details (dimensions, location conditions, obstructions).
              CHM may require additional photos or measurements. Installation scheduling begins only after CHM confirms
              fit feasibility based on the information provided.
            </p>
            <p>
              If Customer provides inaccurate information, CHM is not responsible for incorrect fit, delays, or
              additional costs required to correct/redo work.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">4) Scheduling, Access, and Site Conditions</h2>
            <p>
              Customer agrees to provide safe and timely access to the property, including gate codes, entry instructions,
              and any required HOA/vendor permissions. Customer is responsible for securing pets, clearing access paths,
              and identifying any hazards.
            </p>
            <p>
              CHM may refuse or reschedule service if conditions are unsafe (e.g., aggressive animals, exposed electrical hazards,
              unstable ground, severe weather, or other risks).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">5) Payments, Taxes, and Fees</h2>
            <p>
              Payment is processed by Stripe at the time of purchase. Prices may change at any time prior to payment.
              Customer is responsible for any applicable taxes unless otherwise stated.
            </p>
            <p>
              If additional work is required due to site conditions or Customer changes, CHM will request approval before proceeding.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">6) Cancellations & Refunds</h2>
            <p>
              Because materials and scheduling may be initiated immediately after purchase, refunds are limited.
              If you cancel before scheduling and before materials are committed, CHM may refund at its discretion,
              less processing fees and any non-refundable costs incurred.
            </p>
            <p>
              If installation has been scheduled or materials committed/ordered, refunds may be denied or reduced to cover costs.
              Chargebacks without first contacting CHM may result in cancellation of service and collection efforts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">7) Limited Warranty / No Guarantee</h2>
            <p>
              CHM makes no guarantee that the artificial rock will fully prevent all damage, corrosion, freezing,
              leaks, or other issues. Outcomes depend on the underlying system condition and environment.
            </p>
            <p>
              Any manufacturer warranty (if applicable) is provided by the manufacturer, not CHM. CHM does not provide
              any express warranty beyond performing services in a commercially reasonable manner.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">8) Assumption of Risk</h2>
            <p>
              Customer understands exterior installations involve risk, including hidden defects in pipes/fixtures,
              brittle materials, buried utilities, insects/animals, weather, and other unknown conditions.
              Customer assumes these risks to the fullest extent permitted by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">9) Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, CHM will not be liable for indirect, incidental, special, consequential,
              or punitive damages, including lost profits, loss of use, or loss of enjoyment.
            </p>
            <p>
              CHM’s total liability for any claim arising out of or relating to this Agreement shall not exceed the amount
              paid by Customer for the specific service giving rise to the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">10) Indemnification</h2>
            <p>
              Customer agrees to indemnify and hold harmless CHM and its personnel from claims, liabilities, damages, and expenses
              (including reasonable attorneys’ fees) arising from (a) Customer’s breach of this Agreement,
              (b) inaccurate information provided by Customer, or (c) unsafe property conditions not disclosed to CHM.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">11) Photos, Privacy, and Communications</h2>
            <p>
              Customer authorizes CHM to use submitted photos for fit verification and service planning. CHM may retain contact
              information (name/email/phone/address) to manage the order and provide service updates.
            </p>
            <p>
              Customer agrees CHM may contact Customer by email or phone regarding the purchase, scheduling, and related services.
              Marketing emails (if sent) will include an unsubscribe option where required.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">12) Disputes, Governing Law, Venue</h2>
            <p>
              This Agreement is governed by Florida law, without regard to conflict-of-law rules. Any dispute shall be brought
              in the state or federal courts located in Florida, and Customer consents to jurisdiction and venue there.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">13) Force Majeure</h2>
            <p>
              CHM is not liable for delays or failure to perform due to events beyond reasonable control, including weather,
              disasters, supplier issues, utility outages, or governmental actions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">14) Changes to Terms</h2>
            <p>
              CHM may update these Terms from time to time. The version in effect at the time of purchase applies to that purchase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-white">15) Contact</h2>
            <p>
              Questions: reply to the confirmation email or contact CHM through the main website.
            </p>
          </section>

          <div className="pt-4 text-xs text-white/55">
            Attorney review recommended before relying on these terms for your specific business and jurisdiction.
          </div>
        </div>
      </div>
    </main>
  );
}