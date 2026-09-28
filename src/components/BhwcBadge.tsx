import { businessContact } from "@/data/siteData";

// Our own rendering of the BestHomeWatchCompanies.com ranking, added 9/27/26.
// Deliberately NOT their embed script (third-party JS on every page, decided
// against 9/11/26). This is plain markup linking to the public profile, so the
// claim is verifiable in one click. The ranking text lives in
// businessContact.bhwcRanking; change it there if it changes on their site.
export default function BhwcBadge({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const dark = variant === "dark";
  return (
    <a
      href={businessContact.bhwcUrl}
      target="_blank"
      rel="noopener"
      className={`group inline-flex items-center gap-4 border px-5 py-4 transition-colors ${dark ? "border-white/15 bg-white/[0.03] hover:border-[var(--ch-teal-bright)]" : "border-[var(--ch-hairline)] bg-[var(--ch-paper)] hover:border-[var(--ch-teal)]"} ${className}`}
      aria-label={`Ranked ${businessContact.bhwcRanking} on BestHomeWatchCompanies.com, view the profile`}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="shrink-0">
        <circle cx="17" cy="17" r="16" fill="none" stroke={dark ? "var(--ch-teal-bright)" : "var(--ch-teal)"} strokeWidth="1.5" />
        <path d="M10 18l4.5 4.5L24 12.5" fill="none" stroke={dark ? "var(--ch-teal-bright)" : "var(--ch-teal)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-left">
        <span className={`block text-[15px] leading-tight ${dark ? "text-white" : "text-[var(--ch-ink)]"}`}>
          Ranked {businessContact.bhwcRanking}
        </span>
        <span className={`mt-1 block text-[12px] uppercase tracking-[0.14em] ${dark ? "text-white/50 group-hover:text-[var(--ch-teal-bright)]" : "text-[var(--ch-muted)] group-hover:text-[var(--ch-teal)]"}`}>
          BestHomeWatchCompanies.com
        </span>
      </span>
    </a>
  );
}
