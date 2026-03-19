import type { Metadata } from "next";
import ServiceLandingPage from "@/components/ServiceLandingPage";
import { servicePages } from "@/data/servicePages";

const service = servicePages["home-check-services-30a"];

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
};

export default function Page() {
  return <ServiceLandingPage service={service} />;
}