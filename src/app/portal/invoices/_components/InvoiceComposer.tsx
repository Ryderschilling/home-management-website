"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  S,
  StatusBadge,
  formatDate,
  money,
  type PortalClient,
  type PortalInvoice,
  type PortalJob,
  type PortalProperty,
  type PortalRetainer,
  type PortalService,
} from "./invoice-ui";

type ManualLine = {
  id: string;
  description: string;
  quantity: string;
  unitPriceCents: string;
};

type DraftState = {
  clientId: string;
  propertyId: string;
  retainerId: string;
  issueDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  scheduleAt: string;
  includePlanBase: boolean;
  selectedJobIds: string[];
  manualLines: ManualLine[];
  memo: string;
  internalNotes: string;
};

type InvoiceComposerProps = {
  mode: "create" | "edit";
  initialInvoice?: PortalInvoice | null;
  initialPrefill?: Partial<{
    clientId: string;
    propertyId: string;
    jobIds: string[];
  }>;
  allowSchedule?: boolean;
  onCancel?: () => void;
  onSaved?: (invoice: PortalInvoice) => void | Promise<void>;
};

function emptyManualLine(): ManualLine {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPriceCents: "",
  };
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return value;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolveShiftedDueDate(currentIssueDate: string, nextIssueDate: string, currentDueDate: string) {
  if (!currentIssueDate || !currentDueDate) {
    return addDays(nextIssueDate, 7);
  }

  const defaultCurrentDueDate = addDays(currentIssueDate, 7);
  return currentDueDate === defaultCurrentDueDate ? addDays(nextIssueDate, 7) : currentDueDate;
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function buildDraftFromInvoice(invoice: PortalInvoice): DraftState {
  const manualLines = (invoice.line_items ?? [])
    .filter((item) => item.line_type === "MANUAL")
    .map((item) => ({
      id: item.id,
      description: item.description,
      quantity: String(item.quantity ?? "1"),
      unitPriceCents: String(item.unit_price_cents ?? 0),
    }));
  const selectedJobIds = (invoice.line_items ?? [])
    .filter((item) => item.line_type === "JOB_EXTRA" && item.job_id)
    .map((item) => String(item.job_id));
  const planLine = (invoice.line_items ?? []).find((item) => item.line_type === "PLAN_BASE");

  return {
    clientId: invoice.client_id ?? "",
    propertyId: invoice.property_id ?? "",
    retainerId: planLine?.retainer_id ?? invoice.retainer_id ?? "",
    issueDate: invoice.issue_date ?? todayDateInput(),
    dueDate: invoice.due_date ?? addDays(todayDateInput(), 7),
    periodStart: invoice.period_start ?? "",
    periodEnd: invoice.period_end ?? "",
    scheduleAt: toDateTimeLocal(invoice.send_at),
    includePlanBase: Boolean(planLine),
    selectedJobIds,
    manualLines: manualLines.length > 0 ? manualLines : [emptyManualLine()],
    memo: invoice.memo ?? invoice.notes ?? "",
    internalNotes: invoice.internal_notes ?? "",
  };
}

function buildInitialDraft(prefill?: InvoiceComposerProps["initialPrefill"]): DraftState {
  const issueDate = todayDateInput();
  return {
    clientId: prefill?.clientId ?? "",
    propertyId: prefill?.propertyId ?? "",
    retainerId: "",
    issueDate,
    dueDate: addDays(issueDate, 7),
    periodStart: "",
    periodEnd: "",
    scheduleAt: "",
    includePlanBase: false,
    selectedJobIds: prefill?.jobIds ?? [],
    manualLines: [emptyManualLine()],
    memo: "",
    internalNotes: "",
  };
}

export function InvoiceComposer({
  mode,
  initialInvoice,
  initialPrefill,
  allowSchedule = mode === "edit",
  onCancel,
  onSaved,
}: InvoiceComposerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(() =>
    initialInvoice ? buildDraftFromInvoice(initialInvoice) : buildInitialDraft(initialPrefill)
  );
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [properties, setProperties] = useState<PortalProperty[]>([]);
  const [retainers, setRetainers] = useState<PortalRetainer[]>([]);
  const [services, setServices] = useState<PortalService[]>([]);
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<"saveDraft" | "sendNow" | "schedule" | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialInvoice) return;
    setDraft(buildDraftFromInvoice(initialInvoice));
  }, [initialInvoice]);

  useEffect(() => {
    if (initialInvoice) return;
    setDraft(buildInitialDraft(initialPrefill));
  }, [initialInvoice, initialPrefill]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        const [clientsRes, propertiesRes, retainersRes, servicesRes, jobsRes, invoicesRes] =
          await Promise.all([
            fetch("/api/admin/clients"),
            fetch("/api/admin/properties"),
            fetch("/api/admin/retainers"),
            fetch("/api/admin/services"),
            fetch(
              `/api/admin/jobs?includeCompleted=true&start=${encodeURIComponent(
                new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString()
              )}&end=${encodeURIComponent(
                new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
              )}`
            ),
            fetch("/api/admin/invoices"),
          ]);

        const [clientsJson, propertiesJson, retainersJson, servicesJson, jobsJson, invoicesJson] =
          await Promise.all([
            clientsRes.json(),
            propertiesRes.json(),
            retainersRes.json(),
            servicesRes.json(),
            jobsRes.json(),
            invoicesRes.json(),
          ]);

        if (!clientsRes.ok || !clientsJson.ok) {
          throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
        }
        if (!propertiesRes.ok || !propertiesJson.ok) {
          throw new Error(propertiesJson?.error?.message ?? "Failed to load properties");
        }
        if (!retainersRes.ok || !retainersJson.ok) {
          throw new Error(retainersJson?.error?.message ?? "Failed to load plans");
        }
        if (!servicesRes.ok || !servicesJson.ok) {
          throw new Error(servicesJson?.error?.message ?? "Failed to load services");
        }
        if (!jobsRes.ok || !jobsJson.ok) {
          throw new Error(jobsJson?.error?.message ?? "Failed to load jobs");
        }
        if (!invoicesRes.ok || !invoicesJson.ok) {
          throw new Error(invoicesJson?.error?.message ?? "Failed to load invoices");
        }

        setClients(clientsJson.data ?? []);
        setProperties(propertiesJson.data ?? []);
        setRetainers(retainersJson.data ?? []);
        setServices(servicesJson.data ?? []);
        setJobs(jobsJson.data ?? []);
        setInvoices(invoicesJson.data ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load invoice composer data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const currentInvoiceId = initialInvoice?.id ?? "";
  const selectedClient = clients.find((client) => client.id === draft.clientId) ?? null;
  const selectedClientHasEmail = Boolean(selectedClient?.email?.trim());
  const propertiesForClient = useMemo(() => {
    if (!draft.clientId) return [];
    return properties.filter((property) => property.client_id === draft.clientId);
  }, [draft.clientId, properties]);
  const retainersForClient = useMemo(() => {
    if (!draft.clientId) return [];
    return retainers.filter((retainer) => retainer.client_id === draft.clientId);
  }, [draft.clientId, retainers]);

  useEffect(() => {
    if (!draft.clientId) {
      setDraft((current) => ({ ...current, propertyId: "", retainerId: "" }));
      return;
    }

    if (!propertiesForClient.some((property) => property.id === draft.propertyId)) {
      setDraft((current) => ({ ...current, propertyId: "" }));
    }
    if (!retainersForClient.some((retainer) => retainer.id === draft.retainerId)) {
      setDraft((current) => ({ ...current, retainerId: "" }));
    }
  }, [draft.clientId, draft.propertyId, draft.retainerId, propertiesForClient, retainersForClient]);

  const invoicedJobMap = useMemo(() => {
    const map = new Map<string, { invoiceId: string; invoiceNumber: string }>();

    for (const invoice of invoices) {
      if (invoice.id === currentInvoiceId || invoice.status === "VOID") continue;
      for (const item of invoice.line_items ?? []) {
        if (item.line_type !== "JOB_EXTRA" || !item.job_id || map.has(item.job_id)) continue;
        map.set(item.job_id, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
        });
      }
    }

    return map;
  }, [currentInvoiceId, invoices]);

  const servicePriceMap = useMemo(() => {
    return new Map(services.map((service) => [service.id, service.unit_price_cents]));
  }, [services]);

  const completedJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.status !== "COMPLETED") return false;
      if (draft.clientId && job.client_id !== draft.clientId) return false;
      if (draft.propertyId && job.property_id !== draft.propertyId) return false;
      if (draft.retainerId && job.retainer_id && job.retainer_id !== draft.retainerId) return false;
      return true;
    });
  }, [draft.clientId, draft.propertyId, draft.retainerId, jobs]);

  const selectedJobLineItems = useMemo(() => {
    return draft.selectedJobIds
      .map((jobId) => completedJobs.find((job) => job.id === jobId) ?? jobs.find((job) => job.id === jobId))
      .filter(Boolean)
      .map((job) => {
        const resolvedJob = job as PortalJob;
        const priceCents =
          typeof resolvedJob.price_cents === "number" && resolvedJob.price_cents > 0
            ? resolvedJob.price_cents
            : servicePriceMap.get(resolvedJob.service_id ?? "") ?? 0;

        return {
          id: resolvedJob.id,
          description: `${resolvedJob.title} ${formatDate(
            resolvedJob.completed_at ?? resolvedJob.scheduled_for
          )}`,
          totalCents: priceCents,
        };
      });
  }, [completedJobs, draft.selectedJobIds, jobs, servicePriceMap]);

  const manualLineTotal = useMemo(() => {
    return draft.manualLines.reduce((sum, line) => {
      const quantity = Number(line.quantity || 0);
      const unitPrice = Number(line.unitPriceCents || 0);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return sum;
      return sum + Math.max(0, Math.round(quantity * unitPrice));
    }, 0);
  }, [draft.manualLines]);

  const planAmountCents = useMemo(() => {
    if (!draft.includePlanBase || !draft.retainerId) return 0;
    const retainer = retainers.find((entry) => entry.id === draft.retainerId);
    return Number(retainer?.amount_cents ?? 0);
  }, [draft.includePlanBase, draft.retainerId, retainers]);

  const totalCents = useMemo(() => {
    return (
      planAmountCents +
      selectedJobLineItems.reduce((sum, item) => sum + item.totalCents, 0) +
      manualLineTotal
    );
  }, [manualLineTotal, planAmountCents, selectedJobLineItems]);

  function toggleJob(jobId: string) {
    setDraft((current) => {
      const hasJob = current.selectedJobIds.includes(jobId);
      return {
        ...current,
        selectedJobIds: hasJob
          ? current.selectedJobIds.filter((id) => id !== jobId)
          : [...current.selectedJobIds, jobId],
      };
    });
  }

  function updateManualLine(lineId: string, key: keyof ManualLine, value: string) {
    setDraft((current) => ({
      ...current,
      manualLines: current.manualLines.map((line) =>
        line.id === lineId ? { ...line, [key]: value } : line
      ),
    }));
  }

  function addManualLine() {
    setDraft((current) => ({
      ...current,
      manualLines: [...current.manualLines, emptyManualLine()],
    }));
  }

  function removeManualLine(lineId: string) {
    setDraft((current) => ({
      ...current,
      manualLines:
        current.manualLines.length === 1
          ? [emptyManualLine()]
          : current.manualLines.filter((line) => line.id !== lineId),
    }));
  }

  function buildPayload() {
    return {
      clientId: draft.clientId || null,
      propertyId: draft.propertyId || null,
      retainerId: draft.retainerId || null,
      issueDate: draft.issueDate || null,
      dueDate: draft.dueDate || null,
      periodStart: draft.periodStart || null,
      periodEnd: draft.periodEnd || null,
      includePlanBase: draft.includePlanBase,
      jobIds: draft.selectedJobIds,
      manualLineItems: draft.manualLines
        .filter((line) => line.description.trim())
        .map((line) => ({
          description: line.description.trim(),
          quantity: Number(line.quantity || 1),
          unitPriceCents: Number(line.unitPriceCents || 0),
        })),
      memo: draft.memo || null,
      notes: draft.memo || null,
      internalNotes: draft.internalNotes || null,
    };
  }

  async function submit(action: "saveDraft" | "sendNow" | "schedule") {
    if (!draft.clientId) {
      setError("Select a client before saving the invoice.");
      return;
    }

    if (action === "schedule" && !draft.scheduleAt) {
      setError("Choose a scheduled send date and time.");
      return;
    }

    setSavingAction(action);
    setError("");

    try {
      const payload = buildPayload();
      const request =
        mode === "create"
          ? {
              url: "/api/admin/invoices",
              method: "POST",
              body: {
                ...payload,
                action,
                sendAt: action === "schedule" ? new Date(draft.scheduleAt).toISOString() : null,
              },
            }
          : {
              url: `/api/admin/invoices/${initialInvoice?.id}`,
              method: "PATCH",
              body:
                action === "saveDraft"
                  ? payload
                  : {
                      action,
                      draft: payload,
                      sendAt:
                        action === "schedule" ? new Date(draft.scheduleAt).toISOString() : null,
                    },
            };

      const response = await fetch(request.url, {
        method: request.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Failed to save invoice");
      }

      const savedInvoice = json.data as PortalInvoice;
      if (onSaved) {
        await onSaved(savedInvoice);
      } else if (mode === "create") {
        router.push(`/portal/invoices/${savedInvoice.id}`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save invoice");
    } finally {
      setSavingAction("");
    }
  }

  return (
    <div className="space-y-6">
      <section className={`${S.card} p-5 sm:p-7`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className={S.label}>Composer</div>
            <h2
              className="mt-2 text-[30px] text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-serif), serif", lineHeight: 1.05 }}
            >
              {mode === "create" ? "Build invoice" : "Edit invoice draft"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
              Pull completed work into a client invoice, add manual line items, then save,
              {allowSchedule ? " send, or schedule the Stripe invoice from the portal." : " or send the Stripe invoice from the portal."}
            </p>
          </div>
          {initialInvoice ? (
            <div className={`${S.cardInner} min-w-[220px] p-4`}>
              <div className={S.label}>Current status</div>
              <div className="mt-3 flex items-center gap-3">
                <StatusBadge status={initialInvoice.status} />
                <div className="text-sm text-[var(--text-secondary)]">
                  {initialInvoice.invoice_number}
                </div>
              </div>
              <div className="mt-4 text-2xl text-[var(--text-primary)]" style={{ fontFamily: "var(--font-serif), serif" }}>
                {money(initialInvoice.total_cents)}
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900/30 bg-red-900/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {!selectedClientHasEmail && draft.clientId ? (
          <div className="mt-5 rounded-xl border border-amber-900/30 bg-amber-900/10 px-4 py-3 text-sm text-amber-300">
            This client does not have an email on file. You can save the invoice, but Stripe send
            actions will stay in draft until the client email is added.
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={S.label}>Client</label>
                  <select
                    className={`${S.input} portal-select`}
                    value={draft.clientId}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        clientId: event.target.value,
                        propertyId: "",
                        retainerId: "",
                        selectedJobIds: [],
                      }))
                    }
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={S.label}>Property</label>
                  <select
                    className={`${S.input} portal-select`}
                    value={draft.propertyId}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, propertyId: event.target.value }))
                    }
                    disabled={!draft.clientId}
                  >
                    <option value="">No property</option>
                    {propertiesForClient.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                        {property.address_line1 ? ` - ${property.address_line1}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={S.label}>Plan</label>
                  <select
                    className={`${S.input} portal-select`}
                    value={draft.retainerId}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, retainerId: event.target.value }))
                    }
                    disabled={!draft.clientId}
                  >
                    <option value="">No plan</option>
                    {retainersForClient.map((retainer) => (
                      <option key={retainer.id} value={retainer.id}>
                        {retainer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="w-full space-y-2">
                    <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={draft.includePlanBase}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            includePlanBase: event.target.checked,
                          }))
                        }
                        disabled={!draft.retainerId}
                      />
                      Include monthly plan charge
                    </label>
                    {draft.retainerId ? (
                      <p className="text-xs leading-5 text-[var(--text-muted)]">
                        Adds this plan&apos;s normal recurring charge to the invoice total. Turn off
                        if this invoice is only for extras or one-off work.
                      </p>
                    ) : (
                      <p className="text-xs leading-5 text-[var(--text-muted)]">
                        Select a plan to add its recurring monthly charge.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className={S.label}>Issue date</label>
                  <input
                    className={S.input}
                    type="date"
                    value={draft.issueDate}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        issueDate: event.target.value,
                        dueDate: resolveShiftedDueDate(
                          current.issueDate,
                          event.target.value,
                          current.dueDate
                        ),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className={S.label}>Due date</label>
                  <input
                    className={S.input}
                    type="date"
                    value={draft.dueDate}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, dueDate: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className={S.label}>Period start</label>
                  <input
                    className={S.input}
                    type="date"
                    value={draft.periodStart}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, periodStart: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className={S.label}>Period end</label>
                  <input
                    className={S.input}
                    type="date"
                    value={draft.periodEnd}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, periodEnd: event.target.value }))
                    }
                  />
                </div>
              </div>

              {allowSchedule ? (
                <div className="mt-4 max-w-sm space-y-2">
                  <label className={S.label}>Schedule send</label>
                  <input
                    className={S.input}
                    type="datetime-local"
                    value={draft.scheduleAt}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, scheduleAt: event.target.value }))
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className={S.label}>Completed work</div>
                  <div className="mt-1 text-base font-medium text-[var(--text-primary)]">
                    Pull jobs into invoice line items
                  </div>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Already invoiced jobs are locked out here.
                </div>
              </div>

              {loading ? (
                <div className="mt-4 text-sm text-[var(--text-muted)]">Loading jobs...</div>
              ) : completedJobs.length === 0 ? (
                <div className="mt-4 text-sm text-[var(--text-muted)]">
                  No completed jobs match this client and property yet.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {completedJobs.map((job) => {
                    const blockedBy = invoicedJobMap.get(job.id);
                    const disabled = Boolean(blockedBy);
                    const checked = draft.selectedJobIds.includes(job.id);
                    const fallbackPrice =
                      servicePriceMap.get(job.service_id ?? "") ?? 0;
                    const price =
                      typeof job.price_cents === "number" && job.price_cents > 0
                        ? job.price_cents
                        : fallbackPrice;

                    return (
                      <label
                        key={job.id}
                        className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition ${
                          checked
                            ? "border-[var(--border-hover)] bg-[rgba(232,224,208,0.08)]"
                            : "border-[var(--border)] bg-[rgba(255,255,255,0.02)]"
                        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleJob(job.id)}
                              className="mt-1"
                            />
                            <div>
                              <div className="text-sm font-medium text-[var(--text-primary)]">
                                {job.title}
                              </div>
                              <div className="mt-1 text-xs text-[var(--text-secondary)]">
                                Completed {formatDate(job.completed_at ?? job.scheduled_for)}
                                {job.property_name ? ` • ${job.property_name}` : ""}
                                {job.service_name ? ` • ${job.service_name}` : ""}
                              </div>
                              {blockedBy ? (
                                <div className="mt-2 text-xs text-amber-300">
                                  Already on {blockedBy.invoiceNumber}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {money(price)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className={S.label}>Manual line items</div>
                  <div className="mt-1 text-base font-medium text-[var(--text-primary)]">
                    Add one-off work, materials, or adjustments
                  </div>
                </div>
                <button type="button" onClick={addManualLine} className={S.btnGhost}>
                  Add line
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {draft.manualLines.map((line) => (
                  <div key={line.id} className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] p-4 md:grid-cols-[minmax(0,1fr)_120px_140px_auto]">
                    <input
                      className={S.input}
                      placeholder="Description"
                      value={line.description}
                      onChange={(event) =>
                        updateManualLine(line.id, "description", event.target.value)
                      }
                    />
                    <input
                      className={S.input}
                      type="number"
                      min="1"
                      step="0.25"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(event) =>
                        updateManualLine(line.id, "quantity", event.target.value)
                      }
                    />
                    <input
                      className={S.input}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Unit cents"
                      value={line.unitPriceCents}
                      onChange={(event) =>
                        updateManualLine(line.id, "unitPriceCents", event.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeManualLine(line.id)}
                      className={S.btnDanger}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <label className={S.label}>Client-facing memo</label>
                  <textarea
                    className={`${S.input} min-h-[140px] resize-none`}
                    value={draft.memo}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, memo: event.target.value }))
                    }
                    placeholder="Summary of work performed, payment notes, or service details..."
                  />
                </div>
                <div className="space-y-2">
                  <label className={S.label}>Internal notes</label>
                  <textarea
                    className={`${S.input} min-h-[140px] resize-none`}
                    value={draft.internalNotes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        internalNotes: event.target.value,
                      }))
                    }
                    placeholder="Operator-only notes for follow-up, reminders, or context."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className={S.label}>Invoice summary</div>
              <div
                className="mt-3 text-3xl text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                {money(totalCents)}
              </div>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                {draft.includePlanBase && draft.retainerId ? (
                  <div className="flex items-center justify-between gap-3">
                    <span>Monthly plan charge</span>
                    <span>{money(planAmountCents)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <span>Completed jobs</span>
                  <span>{money(selectedJobLineItems.reduce((sum, item) => sum + item.totalCents, 0))}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Manual items</span>
                  <span>{money(manualLineTotal)}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
                  Stripe send actions will use the client email on file and create a one-off invoice
                  under that customer.
                </div>
              </div>
            </div>

            <div className={`${S.cardInner} p-4 sm:p-5`}>
              <div className={S.label}>Selected items</div>
              <div className="mt-3 space-y-3">
                {selectedJobLineItems.length === 0 &&
                !draft.includePlanBase &&
                !draft.manualLines.some((line) => line.description.trim()) ? (
                  <div className="text-sm text-[var(--text-muted)]">
                    No billable items selected yet.
                  </div>
                ) : (
                  <>
                    {draft.includePlanBase && draft.retainerId ? (
                      <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                        Monthly plan charge
                      </div>
                    ) : null}
                    {selectedJobLineItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]"
                      >
                        {item.description}
                      </div>
                    ))}
                    {draft.manualLines
                      .filter((line) => line.description.trim())
                      .map((line) => (
                        <div
                          key={line.id}
                          className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm text-[var(--text-secondary)]"
                        >
                          {line.description}
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className={S.btnGhost}
              disabled={savingAction !== ""}
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => submit("saveDraft")}
            className={S.btnGhost}
            disabled={savingAction !== ""}
          >
            {savingAction === "saveDraft" ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => submit("sendNow")}
            className={S.btnPrimary}
            disabled={savingAction !== ""}
          >
            {savingAction === "sendNow" ? "Sending..." : "Send now"}
          </button>
          {allowSchedule ? (
            <button
              type="button"
              onClick={() => submit("schedule")}
              className={S.btnGhost}
              disabled={savingAction !== ""}
            >
              {savingAction === "schedule" ? "Scheduling..." : "Schedule send"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
