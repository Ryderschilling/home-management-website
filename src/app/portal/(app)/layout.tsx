import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer } from "@/lib/portal/session";
import { CHM } from "@/lib/portal/email";
import PortalNav from "@/components/portal/PortalNav";
import { logout } from "@/app/portal/actions/auth";

export const metadata: Metadata = {
  title: "Homeowner Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  if (!viewer.user.emailVerifiedAt) redirect("/portal/verify");

  return (
    <div className="pt-shell">
      <header className="pt-header">
        <div className="pt-container pt-header-row">
          <Link href="/portal" className="pt-brand" aria-label="Homeowner portal home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" style={{ height: 34, width: "auto" }} />
            <span className="hidden sm:inline">Coastal Home Management</span>
          </Link>
          <PortalNav />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href={`sms:${CHM.phoneTel}`} className="pt-phone hidden md:inline-flex" title="Text Ryder">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v6a1.5 1.5 0 0 1-1.5 1.5H6l-3.2 2.6a.5.5 0 0 1-.8-.4V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Text Ryder {CHM.phone}
            </a>
            <form action={logout}>
              <button type="submit" className="pt-btn pt-btn--sm" style={{ minHeight: 40, padding: "0 14px" }}>
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="pt-main">
        <div className="pt-container">{children}</div>
      </main>
      <footer style={{ borderTop: "1px solid var(--ch-hairline)", padding: "22px 0 40px" }}>
        <div className="pt-container pt-small" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          <span>
            Need a hand? Text or call {CHM.owner} at{" "}
            <a href={`tel:${CHM.phoneTel}`} style={{ color: "var(--ch-teal)", fontWeight: 600 }}>{CHM.phone}</a>.
          </span>
          <span>Signed in as {viewer.user.email}</span>
        </div>
      </footer>
    </div>
  );
}
