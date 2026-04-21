// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Coastal Home Management 30A",
  description:
    "Meet Ryder Schilling, founder of Coastal Home Management 30A. Local, insured, and owner-operated second home management serving Watersound Origins, Naturewalk, and Inlet Beach.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com/about",
  },
  openGraph: {
    title: "About — Coastal Home Management 30A",
    description:
      "Meet Ryder Schilling, founder of Coastal Home Management 30A. Local, insured, and owner-operated second home management serving Watersound Origins, Naturewalk, and Inlet Beach.",
    url: "https://coastalhomemngt30a.com/about",
    images: [
      {
        url: "https://coastalhomemngt30a.com/profile-web.jpg",
        width: 1200,
        height: 630,
        alt: "Ryder Schilling, founder of Coastal Home Management 30A",
      },
    ],
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <img
            src="/logo.png"
            alt="Coastal Home Management 30A logo"
            className="h-10 w-auto"
          />
          <span className="hidden md:inline text-base font-serif">
            Coastal Home Management 30A
          </span>
        </Link>
        <div className="space-x-6">
          <Link
            href="/#services"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Services
          </Link>
          <Link
            href="/pricing"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-[11px] uppercase tracking-widest underline"
          >
            About
          </Link>
          <Link
            href="/#contact"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Contact
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
            About
          </p>
          <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-8">
            Local care for second&#8209;home owners on 30A.
          </h1>
          <p className="text-xl md:text-2xl font-serif text-gray-700 leading-relaxed max-w-2xl">
            Coastal Home Management 30A is a one-person operation built on trust,
            consistency, and being exactly where you need us when you can&apos;t be there.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="/profile-web.jpg"
              alt="Ryder Schilling, founder of Coastal Home Management 30A, at a Watersound Origins property"
              className="w-full rounded-lg shadow-lg"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <h2 className="text-3xl font-serif mb-6">The Story</h2>
            <p className="text-gray-700 leading-relaxed mb-5">
              I&apos;m Ryder Schilling. I started doing property care for neighbors
              in Watersound Origins about three years ago — just helping out, keeping
              an eye on things, handling what came up. People kept asking, so I kept showing up.
            </p>
            <p className="text-gray-700 leading-relaxed mb-5">
              In October 2025, I officially formed Coastal Home Management 30A as a licensed,
              insured LLC. The business is still the same thing it always was: one person,
              doing it right, for homeowners who deserve better than a generic property
              management company.
            </p>
            <p className="text-gray-700 leading-relaxed">
              I serve Watersound Origins, Naturewalk, and properties along scenic 30A. If
              you own a second home here and you want someone you can actually call — that&apos;s what I do.
            </p>
          </div>
        </div>
      </section>

      {/* What makes CHM different */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif mb-10">
            Why Homeowners Choose CHM
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-lg font-serif mb-3">You Get Me Directly</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                No call centers. No rotating staff. When you reach out, you reach
                Ryder. When something needs attention at your property, it gets handled
                by someone who knows your home personally.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-serif mb-3">Documented Every Visit</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every property visit is photographed and reported. You get a written
                summary after each check-in so you always know exactly what&apos;s
                going on — even when you&apos;re in Chicago or Indianapolis.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-serif mb-3">Local &amp; Insured</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                CHM is a fully insured Florida LLC operating in the communities I serve.
                I live and work here — this isn&apos;t a side business run remotely. Your
                property is covered and your care is consistent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-20 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif mb-6">Service Area</h2>
          <p className="text-gray-300 max-w-xl mx-auto mb-8 leading-relaxed">
            We currently serve Watersound Origins, Naturewalk at Seagrove,
            Inlet Beach, and surrounding communities along scenic 30A in the
            Florida Panhandle. Not sure if your property qualifies? Just ask.
          </p>
          <a
            href="mailto:coastalhomemanagement30a@gmail.com"
            className="inline-flex border border-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-black transition"
          >
            Inquire About Your Property
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="text-sm text-gray-600">
            <div className="font-serif text-black mb-2">Coastal Home Management 30A</div>
            <div>Inlet Beach, FL 32461</div>
            <a
              href="mailto:coastalhomemanagement30a@gmail.com"
              className="hover:text-black transition"
            >
              coastalhomemanagement30a@gmail.com
            </a>
          </div>
          <div className="flex gap-8 text-sm text-gray-600">
            <Link href="/" className="hover:text-black transition">Home</Link>
            <Link href="/pricing" className="hover:text-black transition">Pricing</Link>
            <Link href="/about" className="hover:text-black transition">About</Link>
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-400 max-w-6xl mx-auto">
          © {new Date().getFullYear()} Coastal Home Management 30A. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
