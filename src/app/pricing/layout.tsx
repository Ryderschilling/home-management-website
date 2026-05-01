import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Plans & Pricing | Coastal Home Management 30A",
  description:
    "View home watch and property management service plans for Inlet Beach and 30A. Transparent monthly pricing with no contracts.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
