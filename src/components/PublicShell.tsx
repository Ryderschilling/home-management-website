"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

// Routes that should NOT get the public header/footer
const EXCLUDED_PREFIXES = ["/admin", "/portal"];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
