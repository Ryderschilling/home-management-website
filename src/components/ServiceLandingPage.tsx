import Link from "next/link";
import { siteData } from "@/data/siteData";
import type { ServicePageData } from "@/data/servicePages";
import ServiceLeadForm from "@/components/ServiceLeadForm";

export default function ServiceLandingPage({
  service,
}: {
  service: ServicePageData;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.metaDescription,
    areaServed: siteData.serviceArea,
    provider: {
      "@type": "LocalBusiness",
      name: siteData.businessName,
      email: siteData.contactEmail,
    },
  };

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-[#f8f5ef]">
        <div className="mx-auto max-w-4xl px-6 py-20 md:py-28 text-center">
          <div className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
            {siteData.businessName}
          </div>
          <h1 className="mt-5 text-4xl font-serif leading-tight md:text-6xl">
            {service.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-700 md:text-lg">
            {service.intro}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#lead-form"
              className="inline-flex min-w-[180px] items-center justify-center border border-black px-6 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
            >
              Get a Free Walkthrough
            </a>
            <Link
              href="/"
              className="inline-flex min-w-[180px] items-center justify-center border border-gray-300 px-6 py-3 text-xs uppercase tracking-[0.18em] text-gray-700 transition hover:border-black hover:text-black"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <img
            src={service.image}
            alt={service.title}
            className="aspect-[16/9] w-full border border-gray-200 object-cover"
          />
        </div>
      </section>

      {/* Highlights & Ideal For */}
      <section className="px-6 pb-14 md:pb-20">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="border border-gray-200 bg-white p-8 md:p-10">
            <h2 className="text-2xl font-serif md:text-3xl">
              What this service includes
            </h2>
            <ul className="mt-5 space-y-3 text-gray-700">
              {service.highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-200 bg-white p-8 md:p-10">
            <h2 className="text-2xl font-serif md:text-3xl">Ideal for</h2>
            <ul className="mt-5 space-y-3 text-gray-700">
              {service.idealFor.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="border-y border-gray-200 bg-[#faf8f3] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-serif md:text-3xl">How it works</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {service.process.map((step, index) => (
              <div key={step} className="border border-gray-200 bg-white p-8">
                <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
                  Step {index + 1}
                </div>
                <p className="mt-4 leading-7 text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & CTA */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-serif md:text-3xl">
              Frequently asked questions
            </h2>
          </div>
          <div className="mt-10 space-y-6">
            {service.faqs.map((faq) => (
              <div key={faq.q} className="border border-gray-200 bg-white p-7 md:p-8">
                <h3 className="text-lg font-medium">{faq.q}</h3>
                <p className="mt-3 leading-7 text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <ServiceLeadForm />
          </div>
        </div>
      </section>

      {/* External Authority Links */}
      <section className="border-t border-gray-100 bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-gray-500">
            Resources for 30A Property Owners
          </p>
          <div className="flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:flex-wrap">
            <a
              href="https://www.co.walton.fl.us/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-black"
            >
              Walton County, FL — Official Government Site
            </a>
            <a
              href="https://www.floridadisaster.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-black"
            >
              Florida Division of Emergency Management
            </a>
            <a
              href="https://www.ready.gov/home"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-black"
            >
              FEMA Ready.gov — Home Preparedness Guide
            </a>
            <a
              href="https://www.myfloridalicense.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:text-black"
            >
              Florida DBPR — License Verification
            </a>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6 text-sm text-gray-600">
            <Link href="/about" className="underline transition hover:text-black">
              About Coastal Home Management 30A — company story, credentials, and team
            </Link>
          </div>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}