import type { Metadata } from "next";
import { PRICING_FAQS } from "@/data/pricingFaqs";

export const metadata: Metadata = {
  title: "Home Watch Pricing & Plans on 30A",
  description:
    "View home watch and property management service plans for Inlet Beach and 30A. Transparent monthly pricing, no contracts required, and 6 or 12-month rate locks that save up to 10%.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com/pricing",
  },
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
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
