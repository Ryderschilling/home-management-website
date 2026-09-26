"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/portal", label: "Calendar" },
  { href: "/portal/home", label: "My Home" },
  { href: "/portal/account", label: "Account" },
  { href: "/portal/history", label: "History" },
];

export default function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="pt-nav" aria-label="Portal">
      {LINKS.map((l) => {
        const active = l.href === "/portal" ? pathname === "/portal" || pathname.startsWith("/portal/checkout") || pathname.startsWith("/portal/orders") : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
