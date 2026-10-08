import type { Metadata } from "next";
import Image from "next/image";
import StormForm from "@/components/away/StormForm";
import { primaryPhone, primaryPhoneDisplay } from "@/data/siteData";

// Hurricane Isaias Meta ad landing page (10/8/26). Deliberately bare: satellite
// shot, one line, one form, Ryder at work. Funnel header (logo only) comes from
// PublicShell because the path starts with /away-on-30a. noindex: paid traffic.
// Satellite image: NOAA/NESDIS STAR GOES-19 GeoColor, 8 Oct 2026 (public domain).
// No price on the page, no insurance language, never "inspection".

export const metadata: Metadata = {
  title: "After Isaias: We'll Check Your 30A Home",
  description: "Not in town after Hurricane Isaias? Ryder walks your 30A home inside and out once roads are safe and emails you the photos.",
  robots: { index: false, follow: true },
};

export default function AfterTheStormPage() {
  return (
    <main className="bg-[var(--ch-paper)]">
      {/* Full-bleed hero: the storm is the background, headline on top. */}
      <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-[var(--ch-ink)] px-4 pt-28 pb-14 md:min-h-[86vh] md:px-8 md:pb-20">
        <Image src="/isaias-hero-wide.jpg" alt="Hurricane Isaias from above over the Gulf, satellite view" fill priority sizes="100vw" className="-z-20 object-cover object-[53%_63%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/25 to-black/75" />
        <div className="mx-auto w-full max-w-[900px] text-center text-white">
          <h1 className="mb-5" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 88, 'wght' 760", fontSize: "clamp(44px, 9vw, 104px)", lineHeight: 0.95, letterSpacing: "-0.02em" }}>
            Not in town after Isaias?
          </h1>
          <p className="mx-auto max-w-[40ch] text-[18px] leading-[1.55] text-white/90 md:text-[21px]">
            I&apos;ll check your 30A home once the roads are safe. Inside and out, with photos sent straight to you.
          </p>
          <a href="#request" className="ch-btn mt-8 border-white bg-white !text-[var(--ch-ink)]">Request a check</a>
          <p className="mt-10 text-[11px] text-white/55">Hurricane Isaias, Oct 8. Image: NOAA GOES-19</p>
        </div>
      </section>

      <section id="request" className="scroll-mt-20 bg-[var(--ch-paper)] px-4 pt-12 pb-16 md:px-8 md:pt-16">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="ch-label mb-6">Tell me about the house</p>
          <StormForm />
        </div>
      </section>

      <section className="bg-[var(--ch-paper-alt)] px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-[900px] items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image src="/ryder-at-work.jpg" alt="Ryder Schilling working at a client's home on 30A" fill sizes="(min-width: 768px) 500px, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="text-[20px] leading-[1.45] text-[var(--ch-ink)]">I&apos;m Ryder. I live in Watersound Origins and I check the homes myself.</p>
            <p className="mt-3 text-[15px] text-[var(--ch-muted)]">
              Rather text? <a href={`sms:${primaryPhone()}`} className="underline underline-offset-4">{primaryPhoneDisplay()}</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
