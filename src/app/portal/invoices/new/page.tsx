import type { Metadata } from "next";

import { InvoiceComposer } from "../_components/InvoiceComposer";

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
  const rawJobId = params.jobId;
  const jobIds = Array.isArray(rawJobId) ? rawJobId : rawJobId ? [rawJobId] : [];

  return (
    <InvoiceComposer
      mode="create"
      initialPrefill={{
        clientId: params.clientId,
        propertyId: params.propertyId,
        jobIds,
      }}
    />
  );
}
