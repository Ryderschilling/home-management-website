import type { Metadata } from "next";
import ServiceLandingPage from "@/components/ServiceLandingPage";
import { servicePages } from "@/data/servicePages";

const service = servicePages["second-home-management-inlet-beach"];

export const metadata: Metadata = {
  title: service.metaTitle,
  description: service.metaDescription,
};

export default function Page() {
  return <ServiceLandingPage service={service} />;
}