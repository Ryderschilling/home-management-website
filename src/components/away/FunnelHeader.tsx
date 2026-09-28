/**
 * Logo only. The ad funnel has one job per page, so no nav, no second
 * "book" button, no way to wander off before the opt-in.
 */
export default function FunnelHeader() {
  return (
    <header className="absolute top-0 z-50 flex w-full items-center px-4 py-5 md:px-8">
      <span className="flex items-center gap-3 text-[var(--ch-ink)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" draggable={false} className="h-9 w-auto" />
        <span
          className="text-[13px] uppercase tracking-[0.14em]"
          style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 104, 'wght' 620" }}
        >
          Coastal Home Management
        </span>
      </span>
    </header>
  );
}
