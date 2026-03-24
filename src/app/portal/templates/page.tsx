import Link from "next/link";

import {
  getTemplatesByCategory,
  templateCategories,
  templateRegistry,
  type TemplateStatus,
} from "@/lib/templates/registry";

const PANEL =
  "rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_60px_rgba(0,0,0,0.24)]";
const PANEL_INNER = "rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]";
const LABEL =
  "text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]";
const BUTTON_GHOST =
  "inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]";

function statusClassName(status: TemplateStatus) {
  if (status === "live") {
    return "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  return "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]";
}

export default function PortalTemplatesPage() {
  const liveCount = templateRegistry.filter((template) => template.status === "live").length;

  return (
    <div className="space-y-6">
      <section className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className={LABEL}>Template Library</div>
            <h1 className="mt-3 font-serif text-[34px] leading-none tracking-[-0.03em] text-[var(--text-primary)]">
              Templates
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Centralized preview hub for reusable business templates across email, invoicing,
              contracts, and future portal documents.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
            <div className={PANEL_INNER} style={{ padding: "var(--portal-card-pad)" }}>
              <div className={LABEL}>Tracked</div>
              <div className="mt-3 font-serif text-[28px] leading-none tracking-[-0.03em] text-[var(--text-primary)]">
                {templateRegistry.length}
              </div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">Templates in library</div>
            </div>
            <div className={PANEL_INNER} style={{ padding: "var(--portal-card-pad)" }}>
              <div className={LABEL}>Live</div>
              <div className="mt-3 font-serif text-[28px] leading-none tracking-[-0.03em] text-[var(--accent-warm)]">
                {liveCount}
              </div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">Production-backed previews</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        {templateCategories.map((category) => {
          const templates = getTemplatesByCategory(category.slug);

          return (
            <section key={category.slug} className={PANEL} style={{ padding: "var(--portal-card-pad-lg)" }}>
              <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5">
                <div className={LABEL}>{category.slug}</div>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="font-serif text-[24px] leading-none tracking-[-0.02em] text-[var(--text-primary)]">
                      {category.name}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
                      {category.description}
                    </p>
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {templates.length} template{templates.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <article
                    key={template.slug}
                    className={`${PANEL_INNER} flex h-full flex-col justify-between`}
                    style={{ padding: "var(--portal-card-pad)" }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className={LABEL}>{category.name}</span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${statusClassName(template.status)}`}
                        >
                          {template.status}
                        </span>
                      </div>
                      <h3 className="mt-4 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
                        {template.name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                        {template.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {template.previewRoute.replace("/portal/templates/", "")}
                      </div>
                      <Link href={template.previewRoute} className={BUTTON_GHOST}>
                        Preview
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
