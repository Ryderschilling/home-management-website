"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryPhone, primaryPhoneDisplay } from "@/data/siteData";
import { useBooking } from "./BookingProvider";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/home-watch", label: "Home Watch" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { open } = useBooking();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Only the homepage has a full-screen dark hero behind the header.
  // Everywhere else the header is solid from the start.
  const hasHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const solid = scrolled || !hasHero || menuOpen;

  return (
    <>
      <header
        className={`fixed top-0 z-50 flex w-full items-center justify-between px-4 transition-all duration-500 md:px-8 ${
          solid
            ? "border-b border-[var(--ch-hairline)] bg-[rgba(255,255,255,0.9)] py-3 text-[var(--ch-ink)] backdrop-blur-xl"
            : "bg-transparent py-5 text-white"
        }`}
        style={{ transitionTimingFunction: "var(--ch-ease)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Coastal Home Management 30A, home"
        >
          <img
            src="/logo.png"
            alt=""
            draggable={false}
            className="h-9 w-auto"
          />
          <span
            className="hidden text-[13px] uppercase tracking-[0.14em] sm:inline"
            style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 104, 'wght' 620" }}
          >
            Coastal Home Management
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          {navLinks.map(({ href, label }) => {
            const isActive = href.startsWith("/") && !href.includes("#") && pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative text-[11px] uppercase tracking-[0.18em] transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-[var(--ch-teal)] after:transition-all after:duration-500 hover:after:w-full ${
                  isActive ? "after:w-full" : "after:w-0"
                } ${solid ? "hover:text-[var(--ch-teal)]" : "hover:text-white/70"}`}
                style={{
                  fontFamily: "var(--font-display)",
                  fontVariationSettings: "'wdth' 96, 'wght' 560",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${primaryPhone()}`}
            className={`hidden items-center gap-2 text-[11px] uppercase tracking-[0.16em] transition-colors md:inline-flex ${
              solid ? "text-[var(--ch-muted)] hover:text-[var(--ch-teal)]" : "text-white/75 hover:text-white"
            }`}
            style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 92, 'wght' 560" }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M14.5 11.3v2a1.3 1.3 0 0 1-1.5 1.3 13 13 0 0 1-5.7-2 12.8 12.8 0 0 1-4-4 13 13 0 0 1-2-5.8A1.3 1.3 0 0 1 2.6 1.3h2a1.3 1.3 0 0 1 1.3 1.2c.1.6.2 1.3.5 1.9a1.3 1.3 0 0 1-.3 1.4l-.8.9a10.7 10.7 0 0 0 4 4l.9-.9a1.3 1.3 0 0 1 1.4-.3c.6.3 1.2.4 1.9.5a1.3 1.3 0 0 1 1.1 1.3Z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
            {primaryPhoneDisplay()}
          </a>

          <button
            type="button"
            onClick={() => open("header")}
            className="ch-btn ch-btn--teal ch-btn--sm hidden sm:inline-flex"
          >
            Book a Walkthrough
          </button>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="relative grid h-11 w-11 place-items-center lg:hidden"
          >
            <span className="relative block h-[9px] w-[22px]">
              <span
                className="absolute left-0 block h-[1.5px] w-full bg-current transition-transform duration-500"
                style={{
                  transitionTimingFunction: "var(--ch-ease)",
                  transform: menuOpen ? "translateY(4px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="absolute bottom-0 left-0 block h-[1.5px] w-full bg-current transition-transform duration-500"
                style={{
                  transitionTimingFunction: "var(--ch-ease)",
                  transform: menuOpen ? "translateY(-4px) rotate(-45deg)" : "none",
                }}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu, full-bleed, big type, one clear action */}
      <div
        id="mobile-menu"
        className="fixed inset-0 z-40 flex flex-col justify-between bg-[var(--ch-paper)] px-6 pb-10 pt-28 transition-[opacity,transform] duration-500 lg:hidden"
        style={{
          transitionTimingFunction: "var(--ch-ease)",
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? "translateY(0)" : "translateY(-14px)",
          pointerEvents: menuOpen ? "auto" : "none",
        }}
        aria-hidden={!menuOpen}
      >
        <nav className="flex flex-col" aria-label="Mobile navigation">
          {navLinks.map(({ href, label }, i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-[var(--ch-hairline)] py-5 text-[28px] uppercase leading-none tracking-[-0.02em] text-[var(--ch-ink)] transition-[transform,opacity] duration-500"
              style={{
                fontFamily: "var(--font-display)",
                fontVariationSettings: "'wdth' 112, 'wght' 620",
                transitionDelay: menuOpen ? `${80 + i * 60}ms` : "0ms",
                transitionTimingFunction: "var(--ch-ease)",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(16px)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3">
          <button
            type="button"
            className="ch-btn ch-btn--teal w-full"
            onClick={() => {
              setMenuOpen(false);
              open("mobile-menu");
            }}
          >
            Book a Free Walkthrough
          </button>
          <a href={`tel:${primaryPhone()}`} className="ch-btn w-full">
            Call {primaryPhoneDisplay()}
          </a>
        </div>
      </div>
    </>
  );
}
