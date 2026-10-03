"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import FadeInObserver from "./FadeInObserver";
import StickyActionBar from "./StickyActionBar";
import FunnelHeader from "./away/FunnelHeader";
import { BookingProvider } from "./BookingProvider";

// Routes that should NOT get the public header/footer
const EXCLUDED_PREFIXES = ["/admin", "/portal"];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // The Meta ad funnel: logo-only header, footer stays, no floating CTA.
  const isFunnel = pathname.startsWith("/away-on-30a");
  // Page 1 of the funnel is a one-screen squeeze page (10/3/26): it carries its
  // own logo, and no header, footer or links at all. The email box is the only tap.
  const isSqueeze = pathname === "/away-on-30a";

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <BookingProvider>
      {/* Motion engine + persistent CTA live at the shell level so every
          public page gets them without repeating imports per page. */}
      <FadeInObserver key={pathname} />
      {isSqueeze ? null : isFunnel ? <FunnelHeader /> : <SiteHeader />}
      {children}
      {!isSqueeze && <SiteFooter />}
      {/* The ad funnel has exactly one ask per page. A second floating CTA there splits it. */}
      {!isFunnel && <StickyActionBar />}
    </BookingProvider>
  );
}
