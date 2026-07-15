"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteData } from "@/data/siteData";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Only the homepage has a full-screen dark hero behind the header.
  // Everywhere else the header should be solid from the start.
  const hasHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || !hasHero;

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 w-full z-50 px-4 md:px-6 flex justify-between items-center transition-all duration-500 ${
        solid
          ? "py-2 bg-[rgba(246,249,252,0.88)] backdrop-blur-md border-b border-[rgba(15,23,42,0.08)] text-[#0f172a] shadow-[0_8px_30px_-20px_rgba(15,23,42,0.25)]"
          : "py-3 bg-transparent text-white"
      }`}
    >
      <Link
        href="/"
        className="flex items-center space-x-3"
        aria-label="Coastal Home Management 30A — Home"
      >
        <img
          src="/logo.png"
          alt="Coastal Home Management 30A logo"
          draggable={false}
          loading="eager"
          className="h-10 w-auto"
        />
        <span className="hidden md:inline text-base font-serif">
          {siteData.businessName}
        </span>
      </Link>

      <div className="space-x-6">
        {navLinks.map(({ href, label }) => {
          const isActive =
            (href === "/about" && pathname === "/about") ||
            (href === "/pricing" && pathname === "/pricing");
          return (
            <Link
              key={href}
              href={href}
              className={`text-[11px] uppercase tracking-widest transition-colors ${
                solid ? "hover:text-[#1d4ed8]" : "hover:text-white/70"
              } ${isActive ? "underline underline-offset-4" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
