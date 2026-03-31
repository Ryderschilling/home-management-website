import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "New Invoice | Coastal Home Management",
};

type PageProps = {
  searchParams: Promise<{
    clientId?: string;
    propertyId?: string;
    jobId?: string | string[];
  }>;
};

export default async function PortalNewInvoicePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();
  nextParams.set("compose", "1");

  if (params.clientId) nextParams.set("clientId", params.clientId);
  if (params.propertyId) nextParams.set("propertyId", params.propertyId);

  const rawJobId = params.jobId;
  const jobIds = Array.isArray(rawJobId) ? rawJobId : rawJobId ? [rawJobId] : [];
  for (const jobId of jobIds) {
    nextParams.append("jobId", jobId);
  }

  redirect(`/portal/invoices?${nextParams.toString()}`);
}
