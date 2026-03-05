"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/portal", label: "Calendar" },
  { href: "/portal/clients", label: "Clients" },
  { href: "/portal/properties", label: "Properties" },
  { href: "/portal/services", label: "Services" },
  { href: "/portal/orders", label: "Orders" },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.32em] text-stone-500">
              Coastal OS
            </div>
            <div className="font-serif text-[28px] leading-none text-stone-900">
              Operations Portal
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-4 py-2 text-sm transition",
                    isActive
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-600 hover:bg-white hover:text-stone-900",
                  ].join(" ")}
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