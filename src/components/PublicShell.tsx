"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import FadeInObserver from "./FadeInObserver";
import StickyActionBar from "./StickyActionBar";
import { BookingProvider } from "./BookingProvider";

// Routes that should NOT get the public header/footer
const EXCLUDED_PREFIXES = ["/admin", "/portal"];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <BookingProvider>
      {/* Motion engine + persistent CTA live at the shell level so every
          public page gets them without repeating imports per page. */}
      <FadeInObserver key={pathname} />
      <SiteHeader />
      {children}
      <SiteFooter />
      <StickyActionBar />
    </BookingProvider>
  );
}
