import { LEGAL_DISCLAIMER } from "@/data/protection";

/**
 * The line that has to appear anywhere this site talks about insurance,
 * claims, or documentation. Read the header comment in src/data/protection.ts
 * before writing any copy near this component.
 *
 * variant "page"  - full-width block, use at the bottom of a content section
 * variant "inline" - quieter, use inside an existing card or under a table
 * variant "dark"  - for placement on the deep navy footer band
 */
export default function LegalDisclaimer({
  variant = "page",
}: {
  variant?: "page" | "inline" | "dark";
}) {
  if (variant === "dark") {
    return (
      <p className="text-[11.5px] leading-[1.7] text-white/38">{LEGAL_DISCLAIMER}</p>
    );
  }

  if (variant === "inline") {
    return (
      <p className="mt-6 text-[11.5px] leading-[1.7] text-[var(--ch-muted)] opacity-70">
        {LEGAL_DISCLAIMER}
      </p>
    );
  }

  return (
    <section className="border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-[860px]">
        <p className="ch-label !text-[var(--ch-muted)] mb-3">The fine print</p>
        <p className="text-[12.5px] leading-[1.8] text-[var(--ch-muted)]">{LEGAL_DISCLAIMER}</p>
      </div>
    </section>
  );
}
