import type { Metadata } from "next";

import { InvoiceDetailClient } from "../_components/InvoiceDetailClient";

export const metadata: Metadata = {
  title: "Invoice Detail | Coastal Home Management",
};

type PageProps = {
  params: Promise<{ invoiceId: string }>;
};

export default async function PortalInvoiceDetailPage({ params }: PageProps) {
  const { invoiceId } = await params;
  return <InvoiceDetailClient invoiceId={invoiceId} />;
}
