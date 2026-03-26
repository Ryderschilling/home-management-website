export const INVOICE_STATUSES = [
  "DRAFT",
  "READY_TO_SEND",
  "SCHEDULED",
  "OUTSTANDING",
  "OVERDUE",
  "PAID",
  "VOID",
  "FINALIZATION_FAILED",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const EDITABLE_INVOICE_STATUSES = new Set<InvoiceStatus>([
  "DRAFT",
  "READY_TO_SEND",
  "FINALIZATION_FAILED",
]);

export const ACTIVE_INVOICE_STATUSES = new Set<InvoiceStatus>([
  "DRAFT",
  "READY_TO_SEND",
  "SCHEDULED",
  "OUTSTANDING",
  "OVERDUE",
  "FINALIZATION_FAILED",
]);

export const INVOICE_GROUPS = [
  { key: "drafts", label: "Drafts", statuses: ["DRAFT"] as InvoiceStatus[] },
  {
    key: "readyToSend",
    label: "Ready to Send",
    statuses: ["READY_TO_SEND", "FINALIZATION_FAILED"] as InvoiceStatus[],
  },
  { key: "scheduled", label: "Scheduled", statuses: ["SCHEDULED"] as InvoiceStatus[] },
  {
    key: "sentOutstanding",
    label: "Sent / Outstanding",
    statuses: ["OUTSTANDING"] as InvoiceStatus[],
  },
  { key: "overdue", label: "Overdue", statuses: ["OVERDUE"] as InvoiceStatus[] },
  { key: "paid", label: "Paid", statuses: ["PAID"] as InvoiceStatus[] },
] as const;

const VALID_STATUSES = new Set<string>(INVOICE_STATUSES);

export function normalizeInvoiceStatus(
  value: unknown,
  fallback: InvoiceStatus = "DRAFT"
): InvoiceStatus {
  const status = String(value ?? fallback).trim().toUpperCase();
  if (!VALID_STATUSES.has(status)) {
    throw new Error("Invalid invoice status");
  }
  return status as InvoiceStatus;
}

export function isEditableInvoiceStatus(value: unknown) {
  return EDITABLE_INVOICE_STATUSES.has(normalizeInvoiceStatus(value));
}

export function getInvoiceGroupKey(value: unknown) {
  const status = normalizeInvoiceStatus(value);

  for (const group of INVOICE_GROUPS) {
    if (group.statuses.includes(status)) {
      return group.key;
    }
  }

  return "drafts";
}
