"use client";

import type { ReactNode } from "react";
import Image from "next/image";
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
          paddingTop: "env(safe-area-inset-top)",
          borderBottom: "1px solid var(--border)",
          background: "rgba(14,14,15,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="portal-safe-x mx-auto flex max-w-7xl flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-3.5">
          <Link href="/portal" className="flex w-fit shrink-0 items-center text-decoration-none">
            <Image
              src="/chm-logo.png"
              alt="Coastal Home Management"
              width={1024}
              height={1024}
              priority
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />
          </Link>

          <div className="w-full sm:w-auto">
            <nav className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:justify-end">
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
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      background: isActive ? "var(--surface-3)" : "transparent",
                      transition: "all 0.15s ease",
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="portal-safe-x mx-auto max-w-7xl py-6 sm:py-8">{children}</main>
    </div>
  );
}
