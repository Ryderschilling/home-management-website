// src/app/qr/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const COLOR_OPTIONS = [
  { id: "beige", label: "Beige", img: "/rocks/beige.JPG" },
  { id: "sand", label: "Sand", img: "/rocks/sand.JPG" },
  { id: "grey", label: "Grey", img: "/rocks/grey.JPG" },
];

export default function QrPage() {
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [agree, setAgree] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clear the error when user changes checkbox (prevents “stuck” error UX)
  useEffect(() => {
    if (error) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agree]);

  const disabled = loading || !agree;

  async function startCheckout() {
    setError("");

    // UI guard
    if (!agree) {
      setError("You must accept the Terms to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ THIS is the missing piece (your curl proved it)
        body: JSON.stringify({
          color: selectedColor.id,
          tosAccepted: true, // or: tosAccepted: agree
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Checkout failed");
      }

      window.location.href = json.data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Smaller header + shrinks further on scroll */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div
          className={[
            "mx-auto flex max-w-6xl items-center justify-between px-5 transition-all duration-200",
            compactHeader ? "py-1.5" : "py-2.5",
          ].join(" ")}
        >
          <Link href="/qr" className="flex items-center gap-3">
            <Image
              src="/chm-logo.png"
              alt="Coastal Home Management"
              width={compactHeader ? 58 : 72}
              height={22}
              priority
            />
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/80 transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Video */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <video
            className="h-auto w-full"
            controls
            playsInline
            preload="metadata"
            poster="/qr-poster.jpg"
          >
            <source src="/qr-video.mp4" type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </section>

        {/* Product layout: image LEFT, details RIGHT */}
        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: preview + color selector */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              Preview
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-[520px] overflow-hidden rounded-xl bg-white">
                <Image
                  src={selectedColor.img}
                  alt={`Rock color: ${selectedColor.label}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/60">
              Choose color
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => {
                const active = option.id === selectedColor.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedColor(option)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] transition",
                      active
                        ? "border-white bg-white/10 text-white"
                        : "border-white/20 bg-black/30 text-white/80 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20"
                      style={{
                        backgroundImage: `url(${option.img})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-xs text-white/60">
              Selected:{" "}
              <span className="text-white/85">{selectedColor.label}</span>
            </div>
          </div>

          {/* RIGHT: details + order */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              Coastal Home Management 30A
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Artificial Rock Installation
            </h1>

            <p className="mt-3 text-sm text-white/70 leading-6">
              Hide exposed pipes and fixtures with a realistic, durable artificial
              rock. We’ll verify fit from your photo and schedule installation.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>• Custom fit verified from your photo</li>
              <li>• Fast, clean installation</li>
              <li>• Designed to blend into coastal landscaping</li>
            </ul>

            {/* Required TOS checkbox */}
            <label className="mt-5 flex items-start gap-3 text-xs text-white/70">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-black/40"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                By ordering you agree to the{" "}
                <Link
                  href="/qr/terms"
                  className="underline underline-offset-4 text-white/80 hover:text-white"
                >
                  Terms of Service
                </Link>
                .
              </span>
            </label>

            <button
              onClick={startCheckout}
              disabled={disabled}
              className={[
                "mt-5 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition",
                "hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed",
                !disabled
                  ? "motion-safe:animate-[pulse_2.2s_ease-in-out_infinite]"
                  : "",
              ].join(" ")}
            >
              {loading ? "Redirecting…" : "Order"}
            </button>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-12">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
            Testimonials
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            What homeowners say
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              “Fast, professional, and the process was simple.”
              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                30A homeowner
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              “Clear communication and high-quality work.”
              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                Inlet Beach
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              “The rock looks great and blends perfectly.”
              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                Watersound
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 pb-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Coastal Home Management • Secure payments by
          Stripe
        </footer>
      </div>
    </main>
  );
}