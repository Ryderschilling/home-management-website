import type { Metadata } from "next";
import { primaryPhone } from "@/data/siteData";
import { loadSampleReport } from "@/lib/sampleReport";
import { LEGAL_DISCLAIMER } from "@/data/protection";

// The opt-in's reward: a REAL visit report, the one Ryder marked "Use as ad
// sample" in CHM Ops. Town only, no names, no street address, FINAL only.
// Until he picks one, a clearly labeled example layout shows instead.

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "A Real 30A Visit Report",
  robots: { index: false, follow: false },
};

const EXAMPLE = [
  { category: "Inside", items: [["Kitchen sink and dishwasher", "OK", ""], ["Bathrooms, under every sink", "OK", ""], ["Water heater", "OK", ""], ["Thermostat", "OK", "Holding at 78"]] },
  { category: "Systems", items: [["AC running and draining", "OK", ""], ["Breaker panel", "OK", ""], ["Irrigation", "ISSUE", "Zone 3 head broken, spraying the driveway. Texted the owner a photo."]] },
  { category: "Outside", items: [["Doors, windows, locks", "OK", ""], ["Roofline and gutters", "OK", ""], ["Packages and mail", "OK", "Brought in two boxes"]] },
] as const;

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" });
}

export default async function SampleReportPage() {
  const r = await loadSampleReport();

  const groups = new Map<string, { label: string; state: string; note: string | null }[]>();
  if (r) {
    for (const f of r.findings) {
      const list = groups.get(f.category) ?? [];
      list.push({ label: f.label, state: f.state, note: f.note });
      groups.set(f.category, list);
    }
  } else {
    for (const g of EXAMPLE) groups.set(g.category, g.items.map(([label, state, note]) => ({ label, state, note: note || null })));
  }
  const all = [...groups.values()].flat();
  const issues = all.filter((f) => f.state === "ISSUE").length;

  return (
    <main className="bg-[var(--ch-paper-alt)]">
      <section className="px-4 pt-28 pb-20 md:px-8 md:pt-36">
        <div className="mx-auto max-w-[760px]">
          <p className="ch-eyebrow">{r ? "A real visit report" : "Example visit report"}</p>
          <h1 className="ch-display ch-display--sm mb-3">{r ? `${fmt(r.visitDate)} · ${r.town}` : "Tuesday walkthrough · Inlet Beach"}</h1>
          <p className="mb-8 text-[14px] text-[var(--ch-muted)]">
            {r ? "Owner's name and street address removed. Everything else is exactly what they got on their phone." : "This shows the layout. Every owner gets their own, with photos, the same day."}
            {r?.weather ? ` Weather: ${r.weather}.` : ""}
          </p>

          <div className={`mb-8 border-l-2 px-4 py-3 text-[16px] text-[var(--ch-ink)] ${issues ? "border-[#e0a63e] bg-[#fdf7ec]" : "border-[#3dae7a] bg-[#f3faf6]"}`}>
            {issues === 0 ? "Everything checked was dry and in good order." : `${issues} thing${issues === 1 ? "" : "s"} needed attention. Details below.`}
          </div>

          {r && r.photos.length > 0 && (
            <div className="mb-10 grid grid-cols-2 gap-2 md:grid-cols-3">
              {r.photos.map((p) => (
                <figure key={p.id} className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/sample-photo/${p.id}`} alt={p.caption ?? "Visit photo"} loading="lazy" width={p.width ?? undefined} height={p.height ?? undefined} className="aspect-square w-full border border-[var(--ch-hairline)] object-cover" />
                  {p.caption && <figcaption className="mt-1 text-[12px] text-[var(--ch-soft)]">{p.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {[...groups.entries()].map(([cat, list]) => (
              <div key={cat} className="border border-[var(--ch-hairline)] bg-white p-5 md:p-6">
                <h2 className="ch-label mb-2">{cat}</h2>
                <ul>
                  {list.map((f, i) => (
                    <li key={i} className="flex gap-3 border-t border-[var(--ch-hairline)] py-3 text-[15px] first:border-0">
                      <span className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${f.state === "ISSUE" ? "bg-[#e0a63e]" : f.state === "NA" ? "bg-[var(--ch-hairline-2)]" : "bg-[#3dae7a]"}`} />
                      <span>
                        <span className="text-[var(--ch-ink)]">{f.label}</span>{" "}
                        <span className="text-[13px] text-[var(--ch-soft)]">{f.state === "ISSUE" ? "Needs attention" : f.state === "NA" ? "Not applicable" : "Dry, good"}</span>
                        {f.note && <span className="block text-[13.5px] text-[var(--ch-muted)]">{f.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 border border-[var(--ch-hairline)] bg-white p-7 md:p-9">
            <h2 className="ch-display ch-display--sm mb-3">Want this for your house?</h2>
            <p className="mb-6 text-[15px] leading-[1.7] text-[var(--ch-muted)]">Reply to Ryder&apos;s email, or send him a text. You don&apos;t need to be in town to start.</p>
            <a href={`sms:${primaryPhone()}`} className="ch-btn ch-btn--solid" data-track="Report: text Ryder">Text Ryder</a>
          </div>
          <p className="mt-8 text-[12px] leading-[1.6] text-[var(--ch-soft)]">{LEGAL_DISCLAIMER}</p>
        </div>
      </section>
    </main>
  );
}
