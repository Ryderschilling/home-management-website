"use client";

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

  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 w-full z-50 bg-transparent px-4 md:px-6 py-2 flex justify-between items-center"
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
              className={`text-[11px] uppercase tracking-widest hover:underline ${
                isActive ? "underline" : ""
              }`}
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
