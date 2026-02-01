"use client";

import { siteData } from "@/data/siteData";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document
      .querySelectorAll(".fade-section")
      .forEach((el) => observer.observe(el));
  }, []);

  return (
    <main className="min-h-screen font-sans bg-white text-black">
      {/* Sticky nav */}
      <nav className="fixed top-0 w-full z-50 bg-transparent backdrop-blur-[2px] px-6 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Smaller logo */}
          <img
            src="/logo.png"
            alt="Coastal Home Management 30A Logo"
            className="h-10 w-auto"
          />

          {/* Smaller brand text */}
          <span className="hidden md:inline text-base font-serif">
            {siteData.businessName}
          </span>
        </div>

        <div className="space-x-6">
          <a
            href="#services"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Services
          </a>
          <a
            href="#contact"
            className="text-[11px] uppercase tracking-widest hover:underline"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero relative h-screen overflow-hidden text-white">
        {/* Background image */}
        <img
          src="/img.png"
          alt="Hero Background"
          className="hero-bg absolute inset-0 h-full w-full object-cover"
        />

        {/* Cinematic overlay (delayed dim + vignette) */}
        <div className="hero-overlay absolute inset-0" />

        {/* Hero content */}
        <div className="hero-content relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <h1 className="hero-title">COASTAL HOME MANAGEMENT 30A</h1>

          <div className="hero-divider" aria-hidden="true" />

          <p className="hero-sub">INLET BEACH, 30A FLORIDA</p>

          <a href="#contact" className="hero-cta">
            Contact
          </a>
        </div>

        {/* Bottom row */}
        <div className="hero-bottom relative z-10">
          <div className="hero-bottom-inner">
            <span>ESTATE CARE</span>
            <span className="pipe">|</span>
            <span>LUXURY RENTALS</span>
            <span className="pipe">|</span>
            <span>CONCIERGE</span>
            <span className="pipe">|</span>
            <span>MAINTENANCE</span>
          </div>
        </div>

        {/* Scroll cue (bottom-center, subtle, looping) */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          aria-hidden="true"
        >
          <div className="scroll-cue">
            <span className="scroll-cue-line" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="px-6 py-28 fade-section opacity-0 translate-y-12 transition-all duration-1000"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-12">
          {/* Service card 1 */}
          <div className="relative group overflow-hidden border border-gray-200 p-6">
            <div className="h-60 w-full mb-4 overflow-hidden">
              <img
                src="/img.png"
                alt="Second Home Care"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h3 className="text-xl font-serif mb-2">Second Home Care</h3>
            <p className="text-sm text-gray-700 mb-2">
              Weekly or monthly check-ins with full property oversight.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {siteData.startingPrice}
            </p>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white transition"
            >
              Message Me
            </a>
          </div>

          {/* Service card 2 */}
          <div className="relative group overflow-hidden border border-gray-200 p-6">
            <div className="h-60 w-full mb-4 overflow-hidden">
              <img
                src="/service2.png"
                alt="Mail & Package Handling"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h3 className="text-xl font-serif mb-2">Mail & Package Handling</h3>
            <p className="text-sm text-gray-700 mb-2">
              Receive and manage all mail and deliveries while you're away.
            </p>
            <p className="text-sm text-gray-500 mb-4">Included in care plans</p>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white transition"
            >
              Message Me
            </a>
          </div>

          {/* Service card 3 */}
          <div className="relative group overflow-hidden border border-gray-200 p-6">
            <div className="h-60 w-full mb-4 overflow-hidden">
              <img
                src="/service3.png"
                alt="Contractor Coordination"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h3 className="text-xl font-serif mb-2">Contractor Coordination</h3>
            <p className="text-sm text-gray-700 mb-2">
              Schedule and supervise repairs or maintenance with trusted
              professionals.
            </p>
            <p className="text-sm text-gray-500 mb-4">Included in care plans</p>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white transition"
            >
              Message Me
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="px-6 py-32 bg-gray-900 text-white fade-section opacity-0 translate-y-12 transition-all duration-1000"
      >
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 className="text-3xl font-serif tracking-tight mb-2">
            Get in Touch
          </h2>
          <p className="text-gray-300">
            Reach out for availability and customized service plans.
          </p>
          <a
            href={`mailto:${siteData.contactEmail}`}
            className="border border-white px-8 py-3 text-sm uppercase tracking-wide hover:bg-white hover:text-black transition"
          >
            Contact
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 text-center text-xs uppercase tracking-widest text-gray-400">
        <a href="/admin/login" className="hover:text-white transition">
          Admin
        </a>
      </footer>

      <style jsx>{`
        .fade-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        /* =========================
           MERCEDES-LIKE HERO MOTION
           ========================= */

        /* Subtle “settle” zoom: start slightly closer, ease out */
        .hero-bg {
          transform: scale(1.08);
          filter: brightness(1);
          will-change: transform, filter;
          animation: heroBgSettle 3200ms cubic-bezier(0.18, 0.82, 0.16, 1) 0ms
            forwards;
        }

        /* Delayed dim + vignette (Mercedes-style) */
        .hero-overlay {
          opacity: 0;
          will-change: opacity;
          background: radial-gradient(
              1200px 600px at 50% 35%,
              rgba(0, 0, 0, 0) 0%,
              rgba(0, 0, 0, 0.18) 45%,
              rgba(0, 0, 0, 0.45) 100%
            ),
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.15),
              rgba(0, 0, 0, 0.55)
            );
          animation: heroOverlayIn 2400ms cubic-bezier(0.18, 0.82, 0.16, 1)
            500ms forwards;
        }

        .hero-title {
          margin: 0;
          opacity: 0;
          transform: translateY(18px);
          will-change: opacity, transform;

          text-transform: uppercase;
          letter-spacing: 12px;
          font-family: ui-serif, Georgia, "Times New Roman", Times, serif;
          font-weight: 600;
          line-height: 1.06;
          font-size: clamp(26px, 4.2vw, 56px);

          animation: heroTextIn 1100ms cubic-bezier(0.18, 0.82, 0.16, 1) 720ms
            forwards;
        }

        .hero-divider {
          width: min(440px, 74vw);
          height: 1px;
          margin: 18px 0 14px 0;
          opacity: 0;
          transform: translateY(10px);
          will-change: opacity, transform;
          background: rgba(255, 255, 255, 0.32);

          animation: heroDividerIn 1100ms cubic-bezier(0.18, 0.82, 0.16, 1)
            860ms forwards;
        }

        .hero-sub {
          margin: 0;
          opacity: 0;
          transform: translateY(14px);
          will-change: opacity, transform;

          text-transform: uppercase;
          letter-spacing: 4px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
            Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          font-weight: 400;
          color: rgba(255, 255, 255, 0.78);
          font-size: clamp(12px, 1.2vw, 16px);

          animation: heroTextIn 1100ms cubic-bezier(0.18, 0.82, 0.16, 1) 1020ms
            forwards;
        }

        .hero-cta {
          margin-top: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;

          height: 44px;
          padding: 0 28px;

          border: 1px solid rgba(255, 255, 255, 0.55);
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(8px);

          text-transform: uppercase;
          letter-spacing: 3px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.92);
          text-decoration: none;

          opacity: 0;
          transform: translateY(12px);
          will-change: opacity, transform;

          animation: heroTextIn 1100ms cubic-bezier(0.18, 0.82, 0.16, 1) 1240ms
            forwards;

          transition: background 250ms ease, border-color 250ms ease,
            transform 250ms ease;
        }

        .hero-cta:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.75);
          transform: translateY(-1px);
        }

        /* Bottom row */
        .hero-bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 22px;
          padding: 0 20px;
        }

        .hero-bottom-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          gap: 18px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;

          text-transform: uppercase;
          letter-spacing: 5px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.72);

          opacity: 0;
          transform: translateY(12px);
          will-change: opacity, transform;

          animation: heroBottomIn 1100ms cubic-bezier(0.18, 0.82, 0.16, 1)
            1500ms forwards;
        }

        .pipe {
          opacity: 0.55;
          letter-spacing: 0;
        }

        /* Keyframes */
        @keyframes heroOverlayIn {
          to {
            opacity: 1;
          }
        }

        @keyframes heroTextIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroDividerIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroBottomIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroBgSettle {
          0% {
            transform: scale(1.08);
            filter: brightness(1);
          }
          100% {
            transform: scale(1.02);
            filter: brightness(0.98);
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-bg,
          .hero-overlay,
          .hero-title,
          .hero-divider,
          .hero-sub,
          .hero-cta,
          .hero-bottom-inner {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .hero-overlay {
            opacity: 1;
          }
          .hero-bg {
            transform: scale(1.02);
            filter: brightness(0.98);
          }
        }

        /* =========================
           Scroll cue: thin line + subtle down motion
           ========================= */
        .scroll-cue {
          width: 1px;
          height: 44px;
          opacity: 0.55;
          overflow: hidden;
        }

        .scroll-cue-line {
          display: block;
          width: 1px;
          height: 100%;
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-60%);
          animation: scrollCueDown 2.2s ease-in-out infinite;
        }

        @keyframes scrollCueDown {
          0% {
            transform: translateY(-70%);
            opacity: 0.35;
          }
          40% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(110%);
            opacity: 0.35;
          }
        }
      `}</style>
    </main>
  );
}
