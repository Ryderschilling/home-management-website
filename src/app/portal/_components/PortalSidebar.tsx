"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  badge?: number;
};

// PRIMARY: things you touch every day
const primaryNav: NavItem[] = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/jobs", label: "Jobs" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/clients", label: "Clients" },
];

// BUSINESS: things you manage weekly
const businessNav: NavItem[] = [
  { href: "/portal/retainers", label: "Plans" },
  { href: "/portal/orders", label: "Rock Installs" },
  { href: "/portal/campaigns", label: "Campaigns" },
];

// UTILITY: rarely used, behind gear toggle
const utilityNav: NavItem[] = [
  { href: "/portal/properties", label: "Properties" },
  { href: "/portal/services", label: "Services" },
  { href: "/portal/contacts", label: "Messages" },
  { href: "/portal/analytics", label: "Analytics" },
  { href: "/portal/templates", label: "Templates" },
  { href: "/portal/exports", label: "Exports" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/portal") return pathname === "/portal";
  return pathname.startsWith(href);
}

function NavGroup({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition ${
              active
                ? "border border-[rgba(232,224,208,0.16)] bg-[rgba(232,224,208,0.1)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "border border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className="font-medium">{item.label}</span>
            {item.badge != null && item.badge > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/80 px-1 text-[9px] font-semibold text-white">
                {item.badge}
              </span>
            ) : (
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  active
                    ? "bg-[var(--accent-warm)]"
                    : "bg-transparent group-hover:bg-[var(--border-hover)]"
                }`}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

type PortalSidebarProps = {
  isResizable?: boolean;
  isResizing?: boolean;
  onResizeStart?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function PortalSidebar({
  isResizable = false,
  isResizing = false,
  onResizeStart,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const [showUtility, setShowUtility] = useState(
    utilityNav.some((item) => isActiveRoute(pathname, item.href))
  );

  return (
    <aside className="portal-sidebar portal-safe-x">
      <div className="flex h-full min-h-0 flex-col gap-5 py-5 lg:py-6">

        {/* Logo */}
        <Link
          href="/portal"
          className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-3.5 py-3 no-underline"
        >
          <Image
            src="/chm-logo.png"
            alt="Coastal Home Management"
            width={72}
            height={72}
            priority
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
              Coastal Home
            </div>
            <div className="truncate text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Operator Portal
            </div>
          </div>
        </Link>

        {/* Nav */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">

          {/* Daily ops */}
          <div>
            <div className="mb-1.5 px-3.5 text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Daily
            </div>
            <NavGroup items={primaryNav} pathname={pathname} />
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* Business */}
          <div>
            <div className="mb-1.5 px-3.5 text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Business
            </div>
            <NavGroup items={businessNav} pathname={pathname} />
          </div>

          {/* Gear / utility toggle — pushed to bottom */}
          <div className="mt-auto">
            <button
              type="button"
              onClick={() => setShowUtility((v) => !v)}
              className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                showUtility
                  ? "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 opacity-60">
                <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M8 1a1 1 0 00-.98.804L6.8 2.8a5.014 5.014 0 00-.9.524l-.984-.328a1 1 0 00-1.166.474l-1 1.732a1 1 0 00.196 1.226l.72.648a5.05 5.05 0 000 1.048l-.72.648a1 1 0 00-.196 1.226l1 1.732a1 1 0 001.166.474l.984-.328c.286.197.588.374.9.524l.22.996A1 1 0 008 15a1 1 0 00.98-.804l.22-.996c.312-.15.614-.327.9-.524l.984.328a1 1 0 001.166-.474l1-1.732a1 1 0 00-.196-1.226l-.72-.648a5.05 5.05 0 000-1.048l.72-.648a1 1 0 00.196-1.226l-1-1.732a1 1 0 00-1.166-.474l-.984.328a5.014 5.014 0 00-.9-.524l-.22-.996A1 1 0 008 1zm0 2.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="currentColor"/>
              </svg>
              <span className="font-medium">Settings</span>
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                className={`ml-auto transition-transform duration-200 ${showUtility ? "rotate-180" : ""}`}
              >
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showUtility && (
              <div className="mt-1 space-y-1 pl-2">
                <NavGroup items={utilityNav} pathname={pathname} />
              </div>
            )}
          </div>

        </div>
      </div>

      {isResizable && onResizeStart ? (
        <button
          type="button"
          aria-label="Resize portal sidebar"
          onPointerDown={onResizeStart}
          className="absolute inset-y-0 right-0 hidden w-3 translate-x-1/2 cursor-col-resize touch-none items-center justify-center lg:flex"
        >
          <span
            className={`h-full w-px rounded-full transition ${
              isResizing
                ? "bg-[rgba(201,184,154,0.9)] shadow-[0_0_0_1px_rgba(201,184,154,0.22)]"
                : "bg-transparent hover:bg-[rgba(201,184,154,0.45)]"
            }`}
          />
        </button>
      ) : null}
    </aside>
  );
}
