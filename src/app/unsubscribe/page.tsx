import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

/**
 * Footer link target for follow-up emails. A button, not an auto-unsubscribe
 * on load, so a mail scanner opening the link can't unsubscribe anyone.
 */
async function confirm(fd: FormData) {
  "use server";
  const t = String(fd.get("t") || "");
  if (t && t.length <= 64) await prisma.client.updateMany({ where: { unsubToken: t }, data: { emailOptOut: true } });
  const { redirect } = await import("next/navigation");
  redirect(`/unsubscribe?t=${encodeURIComponent(t)}&done=1`);
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t, done } = await searchParams;
  return (
    <section className="mx-auto max-w-[560px] px-6 py-28">
      <p className="ch-label mb-3">Email preferences</p>
      {done ? (
        <>
          <h1 className="ch-display ch-display--sm mb-4">You&apos;re unsubscribed.</h1>
          <p className="text-[15px] leading-[1.75] text-[var(--ch-muted)]">No more follow-up emails. If you ever need someone to check on the house, text Ryder at (309) 415-8793.</p>
        </>
      ) : t ? (
        <>
          <h1 className="ch-display ch-display--sm mb-4">Stop the follow-up emails?</h1>
          <form action={confirm}>
            <input type="hidden" name="t" value={t} />
            <button type="submit" className="ch-btn ch-btn--solid">Unsubscribe me</button>
          </form>
        </>
      ) : (
        <h1 className="ch-display ch-display--sm">That link is missing a piece. Reply to the email and Ryder will take you off the list.</h1>
      )}
    </section>
  );
}
