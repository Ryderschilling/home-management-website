import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home Watch Pricing & Plans on 30A",
  description:
    "View home watch and property management service plans for Inlet Beach and 30A. Transparent monthly pricing, no contracts required, and 6 or 12-month rate locks that save up to 10%.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
