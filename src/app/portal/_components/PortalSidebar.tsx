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
  { href: "/portal/clients", label: "Clients" },
  { href: "/portal/invoices", label: "Invoices" },
];

// OPERATIONS: recurring work and fulfillment
const operationsNav: NavItem[] = [
  { href: "/portal/orders", label: "Rock Orders" },
  { href: "/portal/retainers", label: "Plans" },
];

// GROWTH: analytics and marketing — visible, not hidden
const growthNav: NavItem[] = [
  { href: "/portal/leads", label: "Leads" },
  { href: "/portal/analytics", label: "Analytics" },
  { href: "/portal/analytics/visitors", label: "Visitors" },
  { href: "/portal/campaigns", label: "Campaigns" },
];

// SETTINGS: rarely used, behind gear toggle
const utilityNav: NavItem[] = [
  { href: "/portal/properties", label: "Properties" },
  { href: "/portal/services", label: "Services" },
  { href: "/portal/contacts", label: "Messages" },
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
  onItemClick,
}: {
  items: NavItem[];
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
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

// Shared nav content — rendered in both the desktop sidebar and the mobile drawer
function NavContent({
  pathname,
  onItemClick,
}: {
  pathname: string;
  onItemClick?: () => void;
}) {
  const [showUtility, setShowUtility] = useState(
    () => utilityNav.some((item) => isActiveRoute(pathname, item.href))
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">

      {/* Daily ops */}
      <div>
        <div className="mb-1.5 px-3.5 text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Daily
        </div>
        <NavGroup items={primaryNav} pathname={pathname} onItemClick={onItemClick} />
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border)]" />

      {/* Operations */}
      <div>
        <div className="mb-1.5 px-3.5 text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Operations
        </div>
        <NavGroup items={operationsNav} pathname={pathname} onItemClick={onItemClick} />
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border)]" />

      {/* Growth */}
      <div>
        <div className="mb-1.5 px-3.5 text-[9px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
          Growth
        </div>
        <NavGroup items={growthNav} pathname={pathname} onItemClick={onItemClick} />
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
            <NavGroup items={utilityNav} pathname={pathname} onItemClick={onItemClick} />
          </div>
        )}
      </div>

    </div>
  );
}

// Shared logo block
function SidebarLogo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/portal"
      onClick={onClick}
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
  );
}

type PortalSidebarProps = {
  isDesktop?: boolean;
  isResizable?: boolean;
  isResizing?: boolean;
  onResizeStart?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  isMobileNavOpen?: boolean;
  onMobileNavToggle?: () => void;
  onMobileNavClose?: () => void;
};

export function PortalSidebar({
  isDesktop = false,
  isResizable = false,
  isResizing = false,
  onResizeStart,
  isMobileNavOpen = false,
  onMobileNavToggle,
  onMobileNavClose,
}: PortalSidebarProps) {
  const pathname = usePathname();

  // ── Desktop sidebar ──────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <aside className="portal-sidebar portal-safe-x">
        <div className="flex h-full min-h-0 flex-col gap-5 py-5 lg:py-6">
          <SidebarLogo />
          <NavContent pathname={pathname} />
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

  // ── Mobile: compact top bar + slide-in drawer ────────────────────────────────
  return (
    <aside className="portal-sidebar portal-safe-x">
      {/* Mobile top bar — always visible */}
      <div className="flex items-center justify-between py-3">
        <Link
          href="/portal"
          className="flex items-center gap-2.5 no-underline"
        >
          <Image
            src="/chm-logo.png"
            alt="Coastal Home Management"
            width={72}
            height={72}
            priority
            className="h-9 w-9 rounded-xl object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
              Coastal Home
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Operator Portal
            </div>
          </div>
        </Link>

        {/* Hamburger / close button */}
        <button
          type="button"
          aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
          onClick={onMobileNavToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] active:scale-95"
        >
          {isMobileNavOpen ? (
            // X icon
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          ) : (
            // Hamburger icon
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer — fixed overlay, z-index above backdrop (z-40) */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[var(--surface)] shadow-[4px_0_32px_rgba(0,0,0,0.5)]"
          style={{ borderRight: "1px solid var(--border)" }}
        >
          {/* Drawer header */}
          <div
            className="flex items-center justify-between px-4 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <SidebarLogo onClick={onMobileNavClose} />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onMobileNavClose}
              className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Drawer nav */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-6 pt-4">
            <NavContent pathname={pathname} onItemClick={onMobileNavClose} />
          </div>
        </div>
      )}
    </aside>
  );
}
