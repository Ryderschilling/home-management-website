import Link from "next/link";
import { siteData } from "@/data/siteData";
import type { ServicePageData } from "@/data/servicePages";

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
              href={`mailto:${siteData.contactEmail}`}
              className="inline-flex min-w-[180px] items-center justify-center border border-black px-6 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
            >
              Contact
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
          <div className="mt-12 border border-gray-200 bg-[#f8f5ef] p-8 text-center md:p-10">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gray-500">
              Ready to get started?
            </div>
            <h3 className="mt-3 text-2xl font-serif">
              Talk with {siteData.businessName}
            </h3>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-700">
              Reach out to discuss your property, service needs, and whether this is the right fit.
            </p>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="mt-6 inline-flex min-w-[180px] items-center justify-center border border-black px-6 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
            >
              Email Now
            </a>
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