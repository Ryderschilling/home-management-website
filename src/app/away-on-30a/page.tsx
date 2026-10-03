import type { Metadata } from "next";
import Image from "next/image";
import OptInForm from "@/components/away/OptInForm";
import { testimonials } from "@/data/siteData";

// Away on 30A, page 1 of 2. One-screen squeeze page (rebuilt 10/3/26 at Ryder's
// direction): photo, headline, the email box, and a thin row of real Google
// reviews. No scrolling, no header, no footer, no links. The email box is the
// only thing to tap. Everything else (reasons, plans) lives on page 2.
// Copy rules: never promise Ryder will call. Never "inspection", "monitoring",
// "security" or "patrol". No insurance language on this page. noindex: paid traffic.

const PAGE_URL = "https://coastalhomemngt30a.com/away-on-30a";

export const metadata: Metadata = {
  title: "Own a Home on 30A? Know It's Fine Without Flying Down.",
  description: "What Coastal Home Management does for 30A second homes while you're away. Put in your email and see how it works.",
  alternates: { canonical: PAGE_URL },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Own a home on 30A? Know it's fine without flying down.",
    description: "See what we do for 30A second homes while the owners are away.",
    url: PAGE_URL,
    images: ["/ryder-at-work.jpg"],
  },
};

export default function AwayOn30APage() {
  return (
    <main className="aw-squeeze flex flex-col overflow-hidden bg-[var(--ch-paper)]">
      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[1.08fr_1fr]">
        {/* Photo: shrinks to whatever room is left on a phone, never pushes the form down */}
        <div className="relative min-h-[120px] flex-1 overflow-hidden md:order-2 md:h-full">
          <Image
            src="/ryder-at-work.jpg"
            alt="Ryder cleaning the pool at a 30A home"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aw-photo-in object-cover object-[56%_12%]"
          />
        </div>

        {/* The one ask */}
        <div className="flex shrink-0 flex-col justify-center px-5 pb-5 pt-5 md:order-1 md:px-[clamp(32px,6vw,96px)] md:py-10">
          <div className="mx-auto w-full max-w-[520px] md:mx-0">
            <div className="aw-rise mb-4 flex items-center gap-2.5 md:mb-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" draggable={false} className="h-7 w-auto md:h-9" />
              <span
                className="text-[11.5px] uppercase tracking-[0.14em] text-[var(--ch-ink)] md:text-[13px]"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 104, 'wght' 620" }}
              >
                Coastal Home Management
              </span>
            </div>

            <h1 className="aw-rise aw-rise--2 ch-display mb-3 !text-[clamp(27px,4.2vw,54px)] md:mb-5">
              Own a home on 30A? Know it&apos;s fine without flying down.
            </h1>
            <p className="aw-rise aw-rise--2 mb-4 text-[15px] leading-[1.45] text-[var(--ch-muted)] md:mb-8 md:text-[17px]">
              Put in your email to see what we do for 30A homes while their owners are away.
            </p>

            <div className="aw-rise aw-rise--3">
              <OptInForm id="optin-top" />
            </div>
          </div>
        </div>
      </div>

      {/* Thin row of the real Google reviews. Quotes come from siteData, never edit them here. Not a link. */}
      <div className="flex h-11 shrink-0 items-center border-t border-[var(--ch-hairline)] bg-[var(--ch-paper-alt)] md:h-12">
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-[var(--ch-hairline)] px-4 md:px-6">
          <Stars />
          <span className="hidden text-[12.5px] font-semibold text-[var(--ch-ink)] sm:inline">5.0 on Google</span>
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
