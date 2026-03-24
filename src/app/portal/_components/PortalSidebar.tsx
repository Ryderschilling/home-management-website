"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const operationsNav: NavItem[] = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/analytics", label: "Analytics" },
  { href: "/portal/jobs", label: "Jobs" },
  { href: "/portal/retainers", label: "Plans" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/clients", label: "Clients" },
  { href: "/portal/orders", label: "Orders" },
];

const dataNav: NavItem[] = [
  { href: "/portal/properties", label: "Properties" },
  { href: "/portal/services", label: "Services" },
];

const secondaryNav: NavItem[] = [
  { href: "/portal/contacts", label: "Contacts" },
  { href: "/portal/campaigns", label: "Campaigns" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/portal") return pathname === "/portal";
  return pathname.startsWith(href);
}

function SidebarNavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
        {title}
      </div>
      <div className="space-y-1.5">
        {items.map((item) => {
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm transition ${
                active
                  ? "border border-[rgba(232,224,208,0.16)] bg-[rgba(232,224,208,0.1)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  : "border border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="font-medium">{item.label}</span>
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  active
                    ? "bg-[var(--accent-warm)]"
                    : "bg-transparent group-hover:bg-[var(--border-hover)]"
                }`}
              />
            </Link>
          );
        })}
      </div>
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

  return (
    <aside className="portal-sidebar portal-safe-x">
      <div className="flex h-full min-h-0 flex-col gap-6 py-5 lg:py-6">
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

        <div className="grid min-h-0 gap-6 overflow-y-auto pr-1 lg:flex-1 lg:content-start">
          <SidebarNavGroup title="Operations" items={operationsNav} pathname={pathname} />
          <SidebarNavGroup title="Data" items={dataNav} pathname={pathname} />
          <SidebarNavGroup title="Secondary" items={secondaryNav} pathname={pathname} />
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
