import type { Metadata } from "next";
import Image from "next/image";
import OptInForm from "@/components/away/OptInForm";
import { testimonials } from "@/data/siteData";

// Away on 30A, page 1 of 2. One-screen squeeze page.
// 10/4/26 layout (Ryder's direction): thin row of real Google reviews on top,
// everything centered, the email box in the middle, and the pool photo of Ryder
// filling the bottom with its top edge fading up into the button.
// No scrolling, no header, no footer, no links. The email box is the only tap.
// Copy rules: never promise Ryder will call. Never "inspection", "monitoring",
// "security" or "patrol". No insurance language on this page. noindex: paid traffic.

const PAGE_URL = "https://coastalhomemngt30a.com/away-on-30a";
const HEADLINE = "Own a home on 30A? We'll look after it while you're away.";

export const metadata: Metadata = {
  title: HEADLINE,
  description: "What Coastal Home Management does for 30A second homes while you're away. Put in your email and see how it works.",
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: true },
  openGraph: {
    title: HEADLINE,
    description: "See what we do for 30A second homes while the owners are away.",
    url: PAGE_URL,
    images: ["/ryder-at-work.jpg"],
  },
};

export default function AwayOn30APage() {
  return (
    <main className="aw-squeeze flex flex-col overflow-hidden bg-[var(--ch-paper)]">
      {/* Thin row of the real Google reviews, now on top. Quotes come from siteData, never edit them here. Not a link. */}
      <div className="flex h-14 shrink-0 items-center border-b border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] md:h-14">
        {/* Stars stacked over the label so the reviews get most of the row */}
        <div className="flex h-full shrink-0 flex-col items-center justify-center gap-1 border-r border-[var(--ch-hairline)] px-3 md:px-6">
          <Stars />
          <span className="whitespace-nowrap text-[10.5px] font-semibold leading-none text-[var(--ch-ink)] md:text-[11.5px]">5 stars on Google</span>
        </div>
        <div className="aw-reviews ch-marquee min-w-0 flex-1" aria-label="Google reviews">
          {[0, 1].map((copy) => (
            <div key={copy} className="ch-marquee__track" aria-hidden={copy === 1 ? "true" : undefined}>
              {testimonials.map((t) => (
                <p key={t.author} className="aw-quote">
                  <span>&ldquo;{t.body}&rdquo;</span> <b>{t.author}</b>
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* The one ask, centered */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-2 pt-6 text-center md:pb-4 md:pt-10">
        <div className="mx-auto flex w-full max-w-[640px] flex-col items-center md:max-w-[980px]">
          <div className="aw-rise mb-3 flex justify-center md:mb-6">
            {/* Light version of the mark (white square, black letters), cropped tight in the file */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-light.png" alt="Coastal Home Management" draggable={false} className="h-9 w-auto md:h-12" />
          </div>

          <h1 className="aw-rise aw-rise--2 ch-display mb-3 md:mb-5">
            {/* Line 1 is the hook, bigger and in blue. Line 2 is the promise. */}
            <span className="block whitespace-nowrap !text-[clamp(26px,8.4vw,40px)] text-[var(--ch-teal)] md:!text-[clamp(40px,5.8vw,76px)]">Own a home on 30A?</span>
            <span className="mt-1 block !text-[clamp(24px,3.5vw,46px)] md:mt-2">We&apos;ll look after it while you&apos;re away.</span>
          </h1>
          <p className="aw-rise aw-rise--2 mb-5 max-w-[480px] text-[15px] leading-[1.45] text-[var(--ch-muted)] md:mb-8 md:text-[17px]">
            Put in your email to see what we do for 30A homes while their owners are away.
          </p>

          <div className="aw-rise aw-rise--3 flex w-full justify-center">
            <OptInForm id="optin-top" />
          </div>
        </div>
      </div>

      {/* Pool photo along the bottom. Its top fades up into the page so the button sits on the water's edge. */}
      <div className="relative -mt-8 h-[38svh] min-h-[180px] w-full shrink-0 overflow-hidden md:-mt-12 md:h-[48svh]">
        {/* Photo sits lower in the frame; the gap above it is page white. Its top edge fades into the page. */}
        <div className="absolute inset-x-0 top-[14%] h-full md:top-[10%]">
          <Image
            src="/ryder-at-work.jpg"
            alt="Ryder cleaning the pool at a 30A home"
            fill
            priority
            sizes="100vw"
            className="aw-photo-in object-cover object-[56%_0%] md:object-[50%_0%]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[24%]"
            style={{ background: "linear-gradient(to bottom, var(--ch-paper) 0%, color-mix(in srgb, var(--ch-paper) 55%, transparent) 45%, transparent 100%)" }}
          />
        </div>
      </div>
    </main>
  );
}

function Stars() {
  return (
    <span className="flex gap-[2px]" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={12} height={12} viewBox="0 0 12 12" fill="var(--ch-teal)" aria-hidden="true">
          <path d="M6 0l1.6 3.9L12 4.4 8.8 7.2l1 4.4L6 9.3 2.2 11.6l1-4.4L0 4.4l4.4-.5z" />
        </svg>
      ))}
    </span>
  );
}
