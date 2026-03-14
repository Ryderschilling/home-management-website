"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function labelClass() {
  return "text-[11px] uppercase tracking-[0.22em] text-white/60";
}

function inputClass() {
  return "w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-white/25 focus:bg-black/55";
}

function sectionTitle() {
  return "text-xs font-medium uppercase tracking-[0.24em] text-white/55";
}

type PrefillData = {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
};

function QrSuccessPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";

  const [scrolled, setScrolled] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [file, setFile] = useState<File | null>(null);
const [pipeHeight, setPipeHeight] = useState("");
const [pipeWidth, setPipeWidth] = useState("");
const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPrefill() {
      if (!sessionId) return;

      setPrefillLoading(true);

      try {
        const res = await fetch(
          `/api/qr/prefill?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.ok) {
          throw new Error(json?.error?.message ?? "Unable to load prefill");
        }

        const data = (json.data ?? {}) as Partial<PrefillData>;

        if (cancelled) return;

        setFullName((current) => current || data.fullName || "");
        setEmail((current) => current || data.email || "");
        setPhone((current) => current || data.phone || "");
        setAddress1((current) => current || data.address1 || "");
        setAddress2((current) => current || data.address2 || "");
        setCity((current) => current || data.city || "");
        setStateRegion((current) => current || data.state || "");
        setPostalCode((current) => current || data.postalCode || "");
      } catch {
        // Silent failure is intentional here.
        // The page still works even if prefill fails.
      } finally {
        if (!cancelled) {
          setPrefillLoading(false);
        }
      }
    }

    loadPrefill();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const disabled = useMemo(() => {
    if (!sessionId) return true;
    if (!file) return true;
    if (!pipeHeight.trim()) return true;
    if (!pipeWidth.trim()) return true;
    if (!fullName.trim()) return true;
    if (!email.trim()) return true;
    if (!phone.trim()) return true;
    if (!address1.trim()) return true;
    if (!city.trim()) return true;
    if (!stateRegion.trim()) return true;
    if (!postalCode.trim()) return true;
    return status === "uploading";
  }, [
    sessionId,
    file,
    pipeHeight,
    pipeWidth,
    fullName,
    email,
    phone,
    address1,
    city,
    stateRegion,
    postalCode,
    status,
  ]);

  async function submit() {
    if (disabled) return;

    setError("");
    setStatus("uploading");


    
    try {
        const fd = new FormData();
        fd.append("sessionId", sessionId);
        fd.append("photo", file as File);
        fd.append("notes", notes);
        
        fd.append("pipeHeight", pipeHeight.trim());
        fd.append("pipeWidth", pipeWidth.trim());
        
        fd.append("fullName", fullName.trim());
        fd.append("email", email.trim());
        fd.append("phone", phone.trim());
        
        fd.append("address1", address1.trim());
        fd.append("address2", address2.trim());
        fd.append("city", city.trim());
        fd.append("state", stateRegion.trim());
        fd.append("postalCode", postalCode.trim());

      const res = await fetch("/api/qr/upload", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Upload failed");
      }

      router.replace(`/qr/thanks?session_id=${encodeURIComponent(sessionId)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 250);
    }
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
    "inline-flex items-center justify-center rounded-full border border-white/20 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/85 transition hover:bg-white/10 sm:px-4 sm:text-xs sm:tracking-[0.22em]",
    scrolled ? "py-2" : "py-2.5",
  ].join(" ")}
>
  Home
</Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-14 pt-8 sm:px-5 sm:pb-16 sm:pt-10">
      <div className="mx-auto max-w-2xl">
          <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
  Payment received
</h1>
<p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 text-white/70 sm:text-[15px]">
  Upload a photo and dimensions of your backflow pipe, then confirm your contact
  and installation details so we can verify fit and schedule installation.
</p>
            {prefillLoading ? (
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/45">
                Loading your checkout details…
              </p>
            ) : null}
          </div>

          <section className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] sm:rounded-[26px] sm:p-6">
          {!sessionId ? (
              <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Missing session_id. Please return to the checkout confirmation link.
              </div>
            ) : null}

<div className="space-y-7">
<div>
  <div className={sectionTitle()}>Required fit details</div>

  <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 sm:p-5">
    <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
      Please upload a photo and dimensions of your backflow pipe
    </h2>

    <p className="mt-2 text-sm leading-6 text-white/80">
      This is required so we can verify the correct fit and order the right rock
      size for your installation.
    </p>

    <div className="mt-5">
      <div className={labelClass()}>Upload pipe photo (required)</div>
      <input
        className={[
          inputClass(),
          "mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-white hover:file:bg-white/15",
        ].join(" ")}
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <div className={labelClass()}>Backflow pipe height (inches)</div>
        <input
          className={`${inputClass()} mt-2`}
          value={pipeHeight}
          onChange={(e) => setPipeHeight(e.target.value)}
          placeholder="Example: 12"
          inputMode="decimal"
        />
      </div>

      <div>
        <div className={labelClass()}>Backflow pipe width (inches)</div>
        <input
          className={`${inputClass()} mt-2`}
          value={pipeWidth}
          onChange={(e) => setPipeWidth(e.target.value)}
          placeholder="Example: 8"
          inputMode="decimal"
        />
      </div>
    </div>

    <p className="mt-4 text-xs leading-5 text-white/60">
      Measure the tallest point and widest point you want covered.
    </p>
  </div>
</div>

<div>
  <div className={sectionTitle()}>Contact</div>
  <div className="mt-3 grid grid-cols-1 gap-4">
    <div>
      <div className={labelClass()}>Full name</div>
      <input
        className={inputClass()}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="First and last name"
        autoComplete="name"
      />
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <div className={labelClass()}>Email</div>
        <input
          className={inputClass()}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          inputMode="email"
          autoComplete="email"
        />
      </div>

      <div>
        <div className={labelClass()}>Phone</div>
        <input
          className={inputClass()}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-5555"
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
    </div>
  </div>
</div>

  <div>
    <div className={sectionTitle()}>Installation address</div>

    <div className="mt-3 grid grid-cols-1 gap-4">
      <div>
        <div className={labelClass()}>Address line 1</div>
        <input
          className={inputClass()}
          value={address1}
          onChange={(e) => setAddress1(e.target.value)}
          placeholder="Street address"
          autoComplete="address-line1"
        />
      </div>

      <div>
        <div className={labelClass()}>Address line 2 (optional)</div>
        <input
          className={inputClass()}
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          placeholder="Unit, building, gate code, etc."
          autoComplete="address-line2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <div className={labelClass()}>City</div>
          <input
            className={inputClass()}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            autoComplete="address-level2"
          />
        </div>

        <div>
          <div className={labelClass()}>State</div>
          <input
            className={inputClass()}
            value={stateRegion}
            onChange={(e) => setStateRegion(e.target.value)}
            placeholder="State"
            autoComplete="address-level1"
          />
        </div>

        <div>
          <div className={labelClass()}>ZIP</div>
          <input
            className={inputClass()}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="ZIP"
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  </div>

  <div>
    <div className={sectionTitle()}>Notes</div>
    <div className="mt-3">
      <div className={labelClass()}>Optional</div>
      <textarea
        className={`${inputClass()} min-h-[110px] resize-none`}
        placeholder="Access notes, best time to call, anything we should know…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </div>
  </div>

  <div className="pt-1">
    <button
      onClick={submit}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-white/90 disabled:opacity-60"
    >
      {status === "uploading" ? "Sending…" : "Send & continue"}
    </button>

    {status === "error" ? (
      <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    ) : null}
  </div>
</div>
          </section>

          <p className="mx-auto mt-6 max-w-[52ch] text-center text-xs leading-5 text-white/50">
            Your details are saved securely for scheduling and follow-up.
          </p>
        </div>
      </div>
    </main>
  );
}

function SuccessFallback() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Loading confirmation…</h1>
        </div>
      </div>
    </main>
  );
}

export default function QrSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <QrSuccessPageInner />
    </Suspense>
  );
}