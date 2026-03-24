import Link from "next/link";
import { notFound } from "next/navigation";

import { getTemplatePreviewBySlug } from "@/lib/server/template-previews";

export const dynamic = "force-dynamic";

const PANEL =
  "rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_60px_rgba(0,0,0,0.24)]";
const PANEL_INNER = "rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]";
const LABEL =
  "text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]";
const BUTTON_GHOST =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]";

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function statusClassName(status: "live" | "placeholder") {
  if (status === "live") {
    return "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  return "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]";
}

type PageProps = {
  params: Promise<{ templateSlug: string }>;
  searchParams: Promise<{ orderId?: string | string[] }>;
};

export default async function PortalTemplatePreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { templateSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const orderId = readSearchParam(resolvedSearchParams.orderId);

  const preview = await getTemplatePreviewBySlug(templateSlug, { orderId });
  if (!preview) notFound();

  const hasRenderedTemplate = Boolean(preview.subject || preview.html || preview.text);

  return (
    <div className="space-y-6">
      <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <Link href="/portal/templates" className="inline-flex text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
              Back to templates
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={LABEL}>{preview.template.category}</span>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${statusClassName(preview.template.status)}`}
              >
                {preview.template.status}
              </span>
            </div>
            <h1 className="mt-4 font-serif text-[34px] leading-none tracking-[-0.03em] text-[var(--text-primary)]">
              {preview.template.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              {preview.template.description}
            </p>
          </div>

          {preview.template.slug === "post-install-follow-up-email" ? (
            <div className={`${BUTTON_GHOST} cursor-default`}>
              Supports <code className="rounded bg-black/20 px-1.5 py-0.5 text-[var(--text-primary)]">?orderId=</code>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
            <div className={LABEL}>Preview Source</div>
            <h2 className="mt-3 font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
              {preview.sourceLabel}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {preview.sourceDescription}
            </p>

            {preview.note ? (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
                {preview.note}
              </div>
            ) : null}

            {preview.template.slug === "post-install-follow-up-email" ? (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
                Append <code className="rounded bg-black/20 px-1.5 py-0.5 text-[var(--text-primary)]">?orderId=&lt;portal-order-id&gt;</code>{" "}
                to preview this email with a live portal order when available.
              </div>
            ) : null}
          </section>

          <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
            <div className={LABEL}>Template Data</div>
            <div className="mt-5 space-y-3">
              {preview.fields.map((field) => (
                <div
                  key={field.label}
                  className={`${PANEL_INNER} flex items-start justify-between gap-3`}
                  style={{ padding: "var(--portal-card-pad)" }}
                >
                  <div className="min-w-0">
                    <div className={LABEL}>{field.label}</div>
                    <div className="mt-2 break-words text-sm leading-6 text-[var(--text-primary)]">
                      {field.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          {hasRenderedTemplate ? (
            <>
              <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
                <div className={LABEL}>Subject Line</div>
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-5 py-4 text-base text-[var(--text-primary)]">
                  {preview.subject}
                </div>
              </section>

              <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className={LABEL}>HTML Preview</div>
                    <h2 className="mt-3 font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                      Browser render
                    </h2>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <iframe
                    title={`${preview.template.name} HTML preview`}
                    srcDoc={preview.html ?? ""}
                    className="min-h-[720px] w-full bg-white"
                    sandbox=""
                  />
                </div>
              </section>

              <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
                <div className={LABEL}>Plain Text</div>
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
                  <pre className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-primary)]">
                    {preview.text}
                  </pre>
                </div>
              </section>
            </>
          ) : (
            <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
              <div className={LABEL}>Preview</div>
              <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-8">
                <h2 className="font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                  Preview coming soon
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  This template is already registered in the shared library, but it does not have a
                  dedicated renderer yet. When the invoice or contract template is implemented, it
                  can plug into this same route without changing the Templates index.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
