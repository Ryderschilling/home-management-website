"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { PortalSidebar } from "./PortalSidebar";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const SIDEBAR_WIDTH_STORAGE_KEY = "portal-sidebar-width";
const MIN_SIDEBAR_WIDTH = 240;
const DEFAULT_SIDEBAR_WIDTH = 288;
const MAX_SIDEBAR_WIDTH = 420;

function clampSidebarWidth(width: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, Math.round(width)));
}

export function PortalShell({ children }: { children: ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [hasRestoredWidth, setHasRestoredWidth] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [activePointerId, setActivePointerId] = useState<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const syncDesktopState = () => {
      const nextIsDesktop = mediaQuery.matches;
      setIsDesktop(nextIsDesktop);

      if (!nextIsDesktop) {
        setIsResizing(false);
        setActivePointerId(null);
      }
    };

    syncDesktopState();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncDesktopState);

      return () => {
        mediaQuery.removeEventListener("change", syncDesktopState);
      };
    }

    mediaQuery.addListener(syncDesktopState);

    return () => {
      mediaQuery.removeListener(syncDesktopState);
    };
  }, []);

  useEffect(() => {
    try {
      const storedWidth = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);

      if (storedWidth) {
        const parsedWidth = Number.parseInt(storedWidth, 10);

        if (Number.isFinite(parsedWidth)) {
          setSidebarWidth(clampSidebarWidth(parsedWidth));
        }
      }
    } catch {
      // Ignore storage access errors and fall back to the default width.
    } finally {
      setHasRestoredWidth(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestoredWidth) return;

    try {
      window.localStorage.setItem(
        SIDEBAR_WIDTH_STORAGE_KEY,
        String(clampSidebarWidth(sidebarWidth)),
      );
    } catch {
      // Ignore storage write errors and keep the in-memory width.
    }
  }, [hasRestoredWidth, sidebarWidth]);

  useEffect(() => {
    if (!isDesktop || !isResizing || activePointerId === null) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return;

      const nextWidth = clampSidebarWidth(event.clientX);
      setSidebarWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    };

    const stopResizing = (event?: PointerEvent) => {
      if (event && event.pointerId !== activePointerId) return;

      setIsResizing(false);
      setActivePointerId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [activePointerId, isDesktop, isResizing]);

  const handleResizeStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDesktop) return;

    setActivePointerId(event.pointerId);
    setIsResizing(true);
    event.preventDefault();
  };

  const shellStyle = {
    "--portal-sidebar-width": `${sidebarWidth}px`,
  } as CSSProperties;

  return (
    <div className="portal-shell" style={shellStyle}>
      <PortalSidebar
        isResizable={isDesktop}
        isResizing={isResizing}
        onResizeStart={handleResizeStart}
      />
      <main className="portal-main">
        <div className="portal-content portal-safe-x">{children}</div>
      </main>
    </div>
  );
}
