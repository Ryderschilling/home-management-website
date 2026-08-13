import type { Metadata } from "next";
import ServiceLandingPage from "@/components/ServiceLandingPage";
import { servicePages } from "@/data/servicePages";

const service = servicePages["property-care-inlet-beach"];

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
  alternates: {
    canonical: `https://coastalhomemngt30a.com/${service.slug}`,
  },
};

export default function Page() {
  return <ServiceLandingPage service={service} />;
}