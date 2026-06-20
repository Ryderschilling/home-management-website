import type { Metadata } from "next";
import Link from "next/link";
import HomeWatchLeadForm from "@/components/HomeWatchLeadForm";
import HeroImage from "@/components/HeroImage";
import { siteData } from "@/data/siteData";

export const metadata: Metadata = {
  title: "30A Home Watch & Second-Home Care | Coastal Home Management",
  description:
    "Local, insured home watch for second homes in Watersound Origins, Naturewalk & 30A. Regular check-ins, photo proof, and one person who treats your home like their own. Free walkthrough.",
  alternates: { canonical: "https://coastalhomemngt30a.com/home-watch" },
  robots: { index: false, follow: false }, // paid-traffic landing page — keep out of organic index
  openGraph: {
    title: "Someone watching your 30A home while you're away.",
    description:
      "Local, insured home watch in Watersound Origins, Naturewalk & 30A. Free walkthrough, no commitment.",
    url: "https://coastalhomemngt30a.com/home-watch",
    images: ["/img.png"],
  },
};

const POINTS: { title: string; body: string }[] = [
  {
    title: "Regular check-ins",
    body: "I walk your home inside and out on a set schedule — catching leaks, pests, AC issues, and storm damage before they become expensive.",
  },
  {
    title: "Photo proof every visit",
    body: "You get pictures from each visit so you always know your home is exactly how you left it. No wondering, no guessing.",
  },
  {
    title: "One local person",
    body: "Not a call center. Me. I live here, I'm insured, and I treat every home like it's my own.",
  },
];

export default function HomeWatchPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="border-b border-black/10 px-5 py-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Coastal Home Management 30A logo"
            className="h-9 w-auto"
            draggable={false}
          />
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left: copy */}
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
              Watersound Origins · Naturewalk · 30A
            </p>
            <h1
              className="mb-5 text-4xl leading-[1.05] tracking-tight text-black md:text-5xl"
              style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
            >
              Someone&apos;s watching your home while you&apos;re away.
            </h1>
            <p className="mb-6 max-w-md text-base leading-relaxed text-black/60">
              You can&apos;t be here year-round, but your second home still needs eyes on it. I check on it, catch
              problems early, and send you proof every visit, so you can relax wherever you are.
            </p>

            {/* Photo */}
            <div className="mb-2 overflow-hidden rounded-lg border border-black/10 shadow-sm">
              {/* Photo: add the pool/mail action shot at /public/ryder-at-work.jpg. */}
              {/* Until that file exists, it falls back to the existing founder photo automatically. */}
              <HeroImage />
            </div>
            <p className="text-xs text-black/40">Ryder Schilling — owner, Coastal Home Management 30A</p>
          </div>

          {/* Right: form */}
          <div>
            <HomeWatchLeadForm source="/home-watch" />
          </div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <section className="border-y border-black/10 bg-[#fafaf8]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
          <span>Local &amp; lives on 30A</span>
          <span className="text-black/20">·</span>
          <span>Fully insured</span>
          <span className="text-black/20">·</span>
          <span>Photo proof every visit</span>
          <span className="text-black/20">·</span>
          <span>Free walkthrough</span>
        </div>
      </section>

      {/* ── What you get ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <h2
          className="mb-12 text-center text-3xl tracking-tight text-black md:text-4xl"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
        >
          Peace of mind, handled.
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.title}>
              <h3 className="mb-3 text-lg font-semibold text-black">{p.title}</h3>
              <p className="text-sm leading-relaxed text-black/60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="border-t border-black/10 bg-[#fafaf8]">
        <div className="mx-auto max-w-2xl px-5 py-16 text-center md:py-24">
          <h2
            className="mb-4 text-3xl tracking-tight text-black md:text-4xl"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif" }}
          >
            Let&apos;s take a look at your place.
          </h2>
          <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-black/60">
            Free walkthrough, no commitment. I&apos;ll tell you exactly what your home needs and how I&apos;d keep an
            eye on it.
          </p>
          <a
            href="#lead-form"
            className="inline-block bg-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
          >
            Get My Free Home Check
          </a>
        </div>
      </section>

      {/* ── Related Services ─────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-gray-500">
            Our Services
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/second-home-management-inlet-beach"
              className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
            >
              Second Home Management
            </Link>
            <Link
              href="/concierge-services-inlet-beach"
              className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
            >
              Concierge Services
            </Link>
            <Link
              href="/mail-package-handling-inlet-beach"
              className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
            >
              Mail &amp; Package Handling
            </Link>
            <Link
              href="/home-check-services-30a"
              className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
            >
              Home Check Services
            </Link>
            <Link
              href="/pricing"
              className="border border-gray-300 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gray-700 transition hover:border-black hover:text-black"
            >
              Service Plans &amp; Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Services</div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>
                  <Link href="/second-home-management-inlet-beach" className="transition hover:text-black">
                    Second Home Management
                  </Link>
                </li>
                <li>
                  <Link href="/concierge-services-inlet-beach" className="transition hover:text-black">
                    Concierge Services
                  </Link>
                </li>
                <li>
                  <Link href="/mail-package-handling-inlet-beach" className="transition hover:text-black">
                    Mail &amp; Package Handling
                  </Link>
                </li>
                <li>
                  <Link href="/home-check-services-30a" className="transition hover:text-black">
                    Home Checks
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="transition hover:text-black font-medium">
                    Pricing &amp; Plans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Company</div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>
                  <Link href="/about" className="transition hover:text-black">
                    About CHM
                  </Link>
                </li>
                <li>Local &amp; Insured</li>
                <li>Serving Inlet Beach &amp; 30A</li>
                <li>Reliable, high-trust service</li>
              </ul>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Contact</div>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div>Inlet Beach, Florida</div>
                <a
                  href={`mailto:${siteData.contactEmail}`}
                  className="inline-block transition hover:text-black"
                >
                  {siteData.contactEmail}
                </a>
                <div>
                  <a href="/admin/login" className="text-gray-500 transition hover:text-black">
                    Admin
                  </a>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Follow</div>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>
                  <a
                    href="https://www.facebook.com/profile.php?id=61575773416368"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-black"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/company/113245630/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-black"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
            <span>© {new Date().getFullYear()} Coastal Home Management 30A. All rights reserved.</span>
            <a
              href="https://sourceatrade.com/contractors/coastal-home-management-30a-3"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              sourceatrade.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
