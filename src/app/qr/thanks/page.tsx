"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ThanksPageInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCode() {
      if (!sessionId) {
        setError("Missing session.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/qr/referral?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.ok) {
          throw new Error(json?.error?.message ?? "Unable to load your code");
        }

        if (!cancelled) {
          setCode(String(json?.data?.code ?? ""));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unable to load your code");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCode();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function copyCode() {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // no-op
    }
  }

  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">Thank you.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75">
              We received your order details and photo. If you have questions about
              the rock, or want help with ongoing home services, please reach out.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/55">
              Your one-time code
            </div>

            <p className="mt-3 text-sm leading-6 text-white/75">
              Send this to a friend, or use it yourself.
            </p>

            {loading ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/60">
                Loading code…
              </div>
            ) : error ? (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {error}
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <div className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-lg font-semibold tracking-wide text-white">
                  {code || "—"}
                </div>

                <button
                  onClick={copyCode}
                  className={[
                    "inline-flex min-w-[140px] items-center justify-center rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] transition",
                    copied
                      ? "scale-[1.03] bg-emerald-400 text-black"
                      : "bg-white text-black hover:bg-white/90",
                  ].join(" ")}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/90"
            >
              Contact
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
            >
              Back to website
            </Link>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-white/40">
          Coastal Home Management • 30A
        </footer>
      </div>
    </main>
  );
}

function ThanksFallback() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading…</h1>
        </div>
      </div>
    </main>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={<ThanksFallback />}>
      <ThanksPageInner />
    </Suspense>
  );
}