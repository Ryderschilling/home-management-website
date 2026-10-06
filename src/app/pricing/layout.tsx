import type { Metadata } from "next";
import { PRICING_FAQS } from "@/data/pricingFaqs";
import { offerings } from "@/data/siteData";
import PageSchema from "@/components/PageSchema";

export const metadata: Metadata = {
  title: "Home Watch Pricing & Plans on 30A",
  description:
    "Home watch plans on 30A: Essential $200/mo bi-weekly, Home Watch $300/mo weekly, Coastal Elite $600/mo. Photo report every visit. Rate locks save up to 10%.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com/pricing",
  },
};

// The plans and add-ons as Service offers on the canonical #business entity.
// Service, not Product: Google treats Product as merchandise and expects
// shipping and return data. Same offerings array as layout.tsx.
const offerSchema = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  "@id": "https://coastalhomemngt30a.com/pricing#offers",
  name: "Home watch plans and add-ons on 30A",
  url: "https://coastalhomemngt30a.com/pricing",
  itemListElement: offerings.map((o) => ({
    "@type": "Offer",
    price: o.price,
    priceCurrency: "USD",
    url: "https://coastalhomemngt30a.com/pricing",
    seller: { "@id": "https://coastalhomemngt30a.com/#business" },
    itemOffered: {
      "@type": "Service",
      name: o.name,
      description: o.description,
      provider: { "@id": "https://coastalhomemngt30a.com/#business" },
      areaServed: "Scenic 30A, Florida",
    },
    ...(o.unitText
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: o.price,
            priceCurrency: "USD",
            unitText: o.unitText,
          },
        }
      : {}),
  })),
};

// Pulled from the same array the page renders, so the visible FAQ and the
// schema can never drift apart. Targets "how much does home watch cost 30a".
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PRICING_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageSchema path="/pricing" name="Home Watch Pricing & Plans on 30A" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
