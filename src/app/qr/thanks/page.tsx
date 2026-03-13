"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function QrThanksPage() {
  const [scrolled, setScrolled] = useState(false);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("session_id") ?? "";
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    async function run() {
      setErr("");
      setLoading(true);

      if (!sessionId) {
        setErr("Missing session_id. This page must be opened from the Stripe success redirect.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/qr/referral?session_id=${encodeURIComponent(sessionId)}`, {
          method: "GET",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) {
          throw new Error(json?.error?.message ?? "Failed to generate code");
        }
        setCode(String(json?.data?.code ?? ""));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to generate code");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [sessionId]);

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div
          className={[
            "mx-auto flex max-w-5xl items-center justify-between px-5 transition-all",
            scrolled ? "py-2" : "py-4",
          ].join(" ")}
        >
          <Link href="/qr" className="flex items-center gap-3">
            <Image
              src="/chm-logo.png"
              alt="Coastal Home Management"
              width={scrolled ? 92 : 118}
              height={32}
              className="h-auto"
              priority
            />
          </Link>

          <Link
            href="/"
            className={[
              "inline-flex items-center justify-center rounded-full border border-white/20 px-4 text-xs font-medium uppercase tracking-[0.22em] text-white/85 transition hover:bg-white/10",
              scrolled ? "py-2" : "py-2.5",
            ].join(" ")}
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl items-center justify-center px-5 py-14">
        <div className="w-full max-w-xl text-center">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <h1 className="text-3xl font-semibold tracking-tight">Thank you.</h1>

            <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-6 text-white/70">
              We received your order details and photo. If you have questions about the rock
              or want help with ongoing home services, please reach out.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
                Your one-time 20% off code
              </div>
              <div className="mt-2 text-sm text-white/70">
                Send this to a friend (best), or use it yourself. It works once.
              </div>

              {err ? (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {err}
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
                  {loading ? "Generating…" : code || "—"}
                </div>
                <button
                  onClick={copy}
                  disabled={!code}
                  className="rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="mailto:coastalhomemanagement30a@gmail.com"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/90"
              >
                Contact
              </a>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 transition hover:bg-white/10"
              >
                Back to website
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/45">
            Coastal Home Management • 30A
          </p>
        </div>
      </div>
    </main>
  );
}