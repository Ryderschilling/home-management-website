"use client";

import { ReactNode, useEffect } from "react";

type PortalDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
};

export function PortalDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClassName = "max-w-2xl",
}: PortalDrawerProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/55 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        className={`relative flex h-full w-full ${widthClassName} flex-col border-l border-[var(--border)] bg-[rgba(14,14,15,0.96)] shadow-[-20px_0_80px_rgba(0,0,0,0.45)]`}
      >
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Workspace
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-serif), 'Instrument Serif', serif",
                  fontSize: 28,
                  color: "var(--text-primary)",
                  lineHeight: 1.05,
                  marginTop: 6,
                }}
              >
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="border-t border-[var(--border)] px-5 py-4 sm:px-6">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
