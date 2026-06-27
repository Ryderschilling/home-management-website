import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Coastal Home Management 30A",
  description:
    "Privacy policy for Coastal Home Management 30A. How we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
          Coastal Home Management 30A
        </div>
        <h1 className="mt-5 text-4xl font-serif leading-tight md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-gray-500">Last updated: June 2025</p>

        <div className="mt-12 space-y-10 text-gray-700 leading-8">
          <section>
            <h2 className="text-xl font-serif text-black mb-3">1. Who We Are</h2>
            <p>
              Coastal Home Management 30A is a second-home property management service
              operating in Watersound Origins, Naturewalk, Inlet Beach, and surrounding
              30A communities in Florida. Our website is coastalhomemngt30a.com.
              You can reach us at coastalhomemanagement30a@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">2. Information We Collect</h2>
            <p>
              We collect information you provide directly when you submit a contact form,
              request a walkthrough, or communicate with us. This may include your name,
              email address, phone number, property address, and message content.
            </p>
            <p className="mt-4">
              We also collect standard website analytics data through anonymized tools.
              We do not collect or store payment information directly — all payments are
              processed securely through Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">3. How We Use Your Information</h2>
            <p>We use the information you provide to respond to inquiries and service requests,
            schedule property visits and coordinate services, send service updates and relevant
            communications, and improve our services and website experience.</p>
            <p className="mt-4">
              We do not sell, rent, or share your personal information with third parties
              for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">4. Cookies</h2>
            <p>
              Our website uses essential cookies required for core functionality and analytics
              cookies to understand site usage. You can disable cookies in your browser
              settings, though some features may not function as expected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">5. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide services or as
              required by law. You may request deletion of your data at any time by
              contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or request deletion of your personal
              information. To make a request, email coastalhomemanagement30a@gmail.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">7. Third-Party Services</h2>
            <p>
              We use the following third-party services: Stripe (payment processing),
              Resend (transactional email), Clerk (secure authentication), and Vercel
              (hosting). Each has its own privacy policy governing their data practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-black mb-3">8. Contact</h2>
            <p>
              Questions about this policy? Email coastalhomemanagement30a@gmail.com.
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-gray-200 pt-8">
          <Link href="/" className="text-sm text-gray-500 underline hover:text-black">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
