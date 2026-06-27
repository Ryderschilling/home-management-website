import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Coastal Home Management 30A",
  description: "Privacy policy for Coastal Home Management 30A — how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-black px-6 py-16 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
        <p className="text-gray-700 leading-relaxed">
          When you submit a contact form, request a quote, or reach out through our website or ads,
          we collect information you provide including your name, email address, and phone number.
          We may also collect general usage data through Google Analytics and Google Ads tracking
          to understand how visitors interact with our site.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
        <p className="text-gray-700 leading-relaxed">
          We use the information you provide solely to respond to your inquiry, schedule a
          consultation, or provide home management services. We do not sell, rent, or share your
          personal information with third parties for marketing purposes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. Google Ads & Lead Forms</h2>
        <p className="text-gray-700 leading-relaxed">
          If you submit a lead form through a Google ad, your information is collected by Google
          and shared with Coastal Home Management 30A in accordance with Google&apos;s privacy
          policy. We use that information only to follow up with you about our services.
          Google&apos;s privacy policy is available at{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            policies.google.com/privacy
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Cookies & Tracking</h2>
        <p className="text-gray-700 leading-relaxed">
          Our website uses Google Analytics and Google Ads conversion tracking. These tools may
          place cookies on your device to help us understand site usage and measure the
          effectiveness of our advertising. You can opt out of Google Analytics tracking at{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-700"
          >
            tools.google.com/dlpage/gaoptout
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
        <p className="text-gray-700 leading-relaxed">
          We take reasonable precautions to protect your information. Contact form submissions are
          transmitted securely. We store minimal personal data and retain it only as long as
          necessary to provide services or respond to your inquiry.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have any questions about this privacy policy or how your information is used,
          please contact us at{" "}
          <a href="mailto:coastalhomemanagement30a@gmail.com" className="underline text-blue-700">
            coastalhomemanagement30a@gmail.com
          </a>{" "}
          or by phone at (309) 415-8793.
        </p>
      </section>

      <p className="text-sm text-gray-400 mt-12">
        Coastal Home Management 30A &mdash; Watersound Origins &amp; Inlet Beach, FL
      </p>
    </main>
  );
}
