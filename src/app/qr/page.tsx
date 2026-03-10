// src/app/qr/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const COLOR_OPTIONS = [
  { id: "beige", label: "Beige", img: "/rocks/beige.JPG" },
  { id: "sand", label: "Sand", img: "/rocks/sand.jpg" },
  { id: "grey", label: "Grey", img: "/rocks/grey.jpg" },
];

export default function QrPage() {
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [agree, setAgree] = useState(false);

  // Header shrink on scroll
  const [isShrunk, setIsShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsShrunk(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function startCheckout() {
    if (!agree) {
      setError("Please agree to the Terms before ordering.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: selectedColor.id }),
      });

      const json = await res.json();
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
      {/* Header (shrinks on scroll) */}
      <header
        className={[
          "sticky top-0 z-30 border-b border-white/10 backdrop-blur transition-all duration-200",
          isShrunk ? "bg-black/85" : "bg-black/70",
        ].join(" ")}
      >
        <div
          className={[
            "mx-auto flex max-w-5xl items-center justify-between px-6 transition-all duration-200",
            isShrunk ? "py-2" : "py-4",
          ].join(" ")}
        >
          <Image
            src="/chm-logo.png"
            alt="Coastal Home Management"
            width={150}
            height={40}
            className={["w-auto transition-all duration-200", isShrunk ? "h-6" : "h-8"].join(" ")}
            priority
          />

          <Link
            href="/"
            className={[
              "rounded-full border border-white/20 text-xs uppercase tracking-[0.22em] text-white/80 transition-all duration-200 hover:bg-white/10",
              isShrunk ? "px-3 py-1.5" : "px-4 py-2",
            ].join(" ")}
          >
            Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Video (unchanged) */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          <video className="w-full h-auto" controls playsInline preload="metadata" poster="/qr-poster.jpg">
            <source src="/qr-video.mp4" type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Details */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
              Coastal Home Management 30A
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Artificial Rock Installation
            </h1>

            <p className="mt-4 text-sm text-white/70">
              Hide outdoor pipes with natural-looking artificial rocks. Durable, weather-resistant,
              and installed cleanly so it blends into your landscape.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-white/75">
              <li>• Custom measured to ensure best fit</li>
              <li>• Protects pipes all year long</li>
              <li>• Can install during same day</li>
            </ul>
          </div>

          {/* Product card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            {/* Image preview: BIG, NO CROP */}
            <Image
              src={selectedColor.img}
              alt={`Rock color: ${selectedColor.label}`}
              width={900}
              height={600}
              className="h-[420px] w-full rounded-xl border border-white/15 bg-black/30 object-contain"
              priority
            />

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                  Finish
                </div>
                <div className="mt-1 text-lg font-medium">{selectedColor.label}</div>
              </div>

              <button
                onClick={startCheckout}
                disabled={loading}
                className="rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/90 disabled:opacity-60"
              >
                {loading ? "Redirecting…" : "Order"}
              </button>
            </div>

            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
                Choose color
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedColor(option)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition",
                      option.id === selectedColor.id
                        ? "border-white bg-white/10"
                        : "border-white/15 bg-black/30 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{
                        backgroundImage: `url(${option.img})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <span className="uppercase tracking-[0.18em] text-white/80">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
              <label className="flex items-start gap-3 text-sm text-white/75">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/qr/terms" className="underline text-white">
                    Terms of Service
                  </Link>{" "}
                </span>
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-4 text-xs text-white/60">
              Secure checkout via Stripe. After payment, you’ll upload a photo + address so we can verify fit and schedule.
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-14">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
            Testimonials
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            What homeowners say
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              “Excellent service and communication! Very helpful and Ryder goes out of his way to help.”
              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                Beth Tedesco
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              “Ryder has helped us with our home for years and has always been reliable, professional, and great to work with. He consistently does an excellent job and is someone we truly trust.”
              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                Scott C.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              “Ryder is one of the most responsible and reliable young men I have worked with to date. He has helped me with my property for over two years — and he might even share a couple of his favorite fishing honey holes if you ask.”
              <div className="mt-4 text-xs uppercase tracking-[0.22em] text-white/50">
                Sandie L.
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-14 pb-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Coastal Home Management • Secure payments by Stripe
        </footer>
      </div>
    </main>
  );
}