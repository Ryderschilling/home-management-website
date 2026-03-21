"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { QR_COLOR_OPTIONS } from "@/lib/qr-funnel";

const TESTIMONIALS = [
  {
    quote:
      "Excellent service and communication! Very helpful and Ryder goes out of his way to help.",
    name: "Beth Tedesco",
    meta: "Google review",
  },
  {
    quote:
      "Ryder gives us peace of mind if we’re out of town and need the house checked on. Very reliable. Would highly recommend using his services!",
    name: "Barbara Reed",
    meta: "Google review",
  },
  {
    quote:
      "Ryder has helped us with our home for years and has always been reliable, professional, and great to work with. He consistently does an excellent job and is someone we truly trust.",
    name: "Scott Clark",
    meta: "Homeowner testimonial",
  },
];

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function getOrCreateBrowserSessionKey() {
  const key = "chm_campaign_session_key";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

export default function QrPage() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<(typeof QR_COLOR_OPTIONS)[number]>(
    QR_COLOR_OPTIONS[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const [campaignCode, setCampaignCode] = useState("");
  const [sessionKey, setSessionKey] = useState("");

  const [leadFirstName, setLeadFirstName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [leadSuccess, setLeadSuccess] = useState("");

  const landingPath = useMemo(() => "/qr", []);

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (error) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agree]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = safe(params.get("c"));
    const stored = safe(localStorage.getItem("chm_campaign_code"));
    const resolved = fromQuery || stored;

    if (fromQuery) {
      localStorage.setItem("chm_campaign_code", fromQuery);
    }

    setCampaignCode(resolved);
    setSessionKey(getOrCreateBrowserSessionKey());

    if (resolved) {
      fetch("/api/marketing/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "page_view",
          campaignCode: resolved,
          sessionKey: getOrCreateBrowserSessionKey(),
          pagePath: "/qr",
          metadata: {
            referrer: document.referrer || "",
          },
        }),
      }).catch(() => {});
    }
  }, []);

  const disabled = loading || !agree;

  async function startCheckout() {
    setError("");

    if (!agree) {
      setError("You must accept the Terms to continue.");
      return;
    }

    setLoading(true);

    try {
      const next = new URLSearchParams({
        color: selectedColor.id,
        campaignCode,
        sessionKey,
        landingPath,
      });

      router.push(`/qr/upgrade?${next.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to continue");
      setLoading(false);
    }
  }

  async function submitLead() {
    setLeadError("");
    setLeadSuccess("");

    if (!leadEmail.trim()) {
      setLeadError("Enter your email.");
      return;
    }

    if (!leadConsent) {
      setLeadError("You must agree to receive offers and updates.");
      return;
    }

    setLeadLoading(true);

    try {
      const res = await fetch("/api/marketing/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: leadFirstName,
          email: leadEmail,
          consent: true,
          campaignCode,
          sessionKey,
          sourcePage: "/qr",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Lead capture failed");
      }

      setLeadSuccess(
        json?.data?.alreadyExists
          ? "You’re already on the list."
          : "You’re in. We’ll send offers and updates."
      );
      setLeadFirstName("");
      setLeadEmail("");
      setLeadConsent(false);
    } catch (e) {
      setLeadError(e instanceof Error ? e.message : "Lead capture failed");
    } finally {
      setLeadLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
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
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <video
  className="h-auto w-full"
  controls
  playsInline
  preload="metadata"
  poster="/qr-poster.jpg"
>
  <source src="/videos/qr-hero.mov" type="video/quicktime" />
  Your browser does not support video playback.
</video>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              {QR_COLOR_OPTIONS.map((option) => {
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
              Selected: <span className="text-white/85">{selectedColor.label}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/60">
              Coastal Home Management 30A
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Artificial Rock Installation
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Hide exposed pipes and fixtures with a realistic, durable artificial
              rock. We’ll verify fit from your photo and schedule installation.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>• Custom fit verified from your photo</li>
              <li>• Fast, clean installation</li>
              <li>• Designed to blend into coastal landscaping</li>
            </ul>

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
                "hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60",
                !disabled ? "motion-safe:animate-[pulse_2.2s_ease-in-out_infinite]" : "",
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
          {TESTIMONIALS.map((item) => (
  <div
    key={item.name}
    className="flex min-h-[220px] flex-col rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/80"
  >
    <div>“{item.quote}”</div>
    <div className="mt-auto pt-6 text-xs uppercase tracking-[0.22em] text-white/50">
      {item.name} • {item.meta}
    </div>
  </div>
))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">
            Not ready yet?
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Get exclusive offers and updates
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Join the list for discounts, special offers, and updates from Coastal Home
            Management 30A.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/60">
                First name (optional)
              </div>
              <input
                value={leadFirstName}
                onChange={(e) => setLeadFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-white/25 focus:bg-black/55"
              />
            </div>

            <div>
              <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/60">
                Email
              </div>
              <input
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="you@email.com"
                inputMode="email"
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-white/25 focus:bg-black/55"
              />
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 text-xs text-white/70">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-black/40"
              checked={leadConsent}
              onChange={(e) => setLeadConsent(e.target.checked)}
            />
            <span>
              I agree to receive marketing emails, offers, and updates from Coastal
              Home Management 30A.
            </span>
          </label>

          <button
            onClick={submitLead}
            disabled={leadLoading}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            {leadLoading ? "Submitting…" : "Sign up"}
          </button>

          {leadError ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {leadError}
            </div>
          ) : null}

          {leadSuccess ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {leadSuccess}
            </div>
          ) : null}
        </section>

        <footer className="mt-12 pb-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Coastal Home Management • Secure payments by Stripe
        </footer>
      </div>
    </main>
  );
}
