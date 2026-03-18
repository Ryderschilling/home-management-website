"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/portal", label: "Calendar" },
  { href: "/portal/clients", label: "Clients" },
  { href: "/portal/services", label: "Services" },
  { href: "/portal/orders", label: "Orders" },
  { href: "/portal/campaigns", label: "Campaigns" },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(14,14,15,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3.5">
          <div className="min-w-0 flex flex-col gap-0.5">
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Coastal OS
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                fontSize: "17px",
                lineHeight: 1,
                color: "var(--text-primary)",
                letterSpacing: "0.01em",
              }}
            >
              Operations Portal
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    background: isActive ? "var(--surface-3)" : "transparent",
                    transition: "all 0.15s ease",
                    textDecoration: "none",
                    letterSpacing: "0.01em",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
