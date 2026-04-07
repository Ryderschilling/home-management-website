"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  QR_MAIN_PRODUCT_NAME,
  QR_UPSELL_ADDON_NAME,
  QR_UPSELL_ADDON_PRICE_CENTS,
  formatUsd,
  getQrColorOption,
  safeString,
} from "@/lib/qr-funnel";

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
  rockColor: string;
  productName: string;
  productPriceCents: number;
  addonSelected: boolean;
  addonProductName: string;
  addonPriceCents: number;
  totalAmountCents: number;
  pipeHeight: string;
  pipeWidth: string;
  pipePhotoUrl: string;
  electricalBoxPhotoUrl: string;
  electricalBoxWidth: string;
  electricalBoxDepth: string;
  electricalBoxHeight: string;
};

type OrderSummary = {
  rockColor: string;
  productName: string;
  productPriceCents: number;
  addonSelected: boolean;
  addonProductName: string;
  addonPriceCents: number;
  totalAmountCents: number;
};

const defaultSummary: OrderSummary = {
  rockColor: "beige",
  productName: QR_MAIN_PRODUCT_NAME,
  productPriceCents: 0,
  addonSelected: false,
  addonProductName: QR_UPSELL_ADDON_NAME,
  addonPriceCents: QR_UPSELL_ADDON_PRICE_CENTS,
  totalAmountCents: 0,
};

function shouldTrackOnce(key: string) {
  if (typeof window === "undefined" || !key) return false;

  const storageKey = `chm-track:${key}`;

  if (window.sessionStorage.getItem(storageKey) === "1") {
    return false;
  }

  window.sessionStorage.setItem(storageKey, "1");
  return true;
}

function SummaryLine({
  label,
  detail,
  amount,
  strong = false,
}: {
  label: string;
  detail?: string;
  amount: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className={strong ? "text-sm font-medium text-white" : "text-sm text-white/80"}>
          {label}
        </div>
        {detail ? <div className="mt-1 text-xs text-white/50">{detail}</div> : null}
      </div>
      <div className={strong ? "text-sm font-medium text-white" : "text-sm text-white/72"}>
        {amount}
      </div>
    </div>
  );
}

function QrSuccessPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id") ?? "";
  const colorFromQuery = params.get("color") ?? "";
  const addonFromQuery = params.get("addon") === "1";
  const campaignCode = safeString(params.get("campaignCode"));
  const sessionKey = safeString(params.get("sessionKey"));

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
  const [pipePhotoUrl, setPipePhotoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [electricalBoxPhoto, setElectricalBoxPhoto] = useState<File | null>(null);
  const [electricalBoxPhotoUrl, setElectricalBoxPhotoUrl] = useState("");
  const [electricalBoxWidth, setElectricalBoxWidth] = useState("");
  const [electricalBoxDepth, setElectricalBoxDepth] = useState("");
  const [electricalBoxHeight, setElectricalBoxHeight] = useState("");

  const [summary, setSummary] = useState<OrderSummary>({
    ...defaultSummary,
    rockColor: colorFromQuery || defaultSummary.rockColor,
    addonSelected: addonFromQuery,
  });

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
        setPipeHeight((current) => current || data.pipeHeight || "");
        setPipeWidth((current) => current || data.pipeWidth || "");
        setPipePhotoUrl((current) => current || data.pipePhotoUrl || "");
        setElectricalBoxPhotoUrl(
          (current) => current || data.electricalBoxPhotoUrl || ""
        );
        setElectricalBoxWidth((current) => current || data.electricalBoxWidth || "");
        setElectricalBoxDepth((current) => current || data.electricalBoxDepth || "");
        setElectricalBoxHeight((current) => current || data.electricalBoxHeight || "");
        setSummary({
          rockColor: data.rockColor || colorFromQuery || defaultSummary.rockColor,
          productName: data.productName || QR_MAIN_PRODUCT_NAME,
          productPriceCents:
            typeof data.productPriceCents === "number" ? data.productPriceCents : 0,
          addonSelected:
            typeof data.addonSelected === "boolean"
              ? data.addonSelected
              : addonFromQuery,
          addonProductName: data.addonProductName || QR_UPSELL_ADDON_NAME,
          addonPriceCents:
            typeof data.addonPriceCents === "number"
              ? data.addonPriceCents
              : addonFromQuery
                ? QR_UPSELL_ADDON_PRICE_CENTS
                : 0,
          totalAmountCents:
            typeof data.totalAmountCents === "number" ? data.totalAmountCents : 0,
        });
      } catch {
        if (!cancelled) {
          setSummary((current) => ({
            ...current,
            rockColor: current.rockColor || colorFromQuery || defaultSummary.rockColor,
            addonSelected: current.addonSelected || addonFromQuery,
          }));
        }
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
  }, [addonFromQuery, colorFromQuery, sessionId]);

  useEffect(() => {
    if (!campaignCode || !shouldTrackOnce(`page_view:/qr/success:${campaignCode}:${sessionKey}`)) {
      return;
    }

    fetch("/api/marketing/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "page_view",
        campaignCode,
        sessionKey,
        pagePath: "/qr/success",
        metadata: {
          sessionId,
          addonSelected: addonFromQuery,
          color: colorFromQuery,
        },
      }),
    }).catch(() => {});
  }, [addonFromQuery, campaignCode, colorFromQuery, sessionId, sessionKey]);

  const hasAddon = summary.addonSelected || addonFromQuery;

  const disabled = useMemo(() => {
    if (!sessionId) return true;
    return status === "uploading";
  }, [sessionId, status]);

  const selectedColor = useMemo(
    () => getQrColorOption(summary.rockColor || colorFromQuery),
    [colorFromQuery, summary.rockColor]
  );

  async function submit() {
    setError("");

    if (!sessionId) {
      setError("Missing checkout session. Please reopen the payment confirmation page.");
      setStatus("error");
      return;
    }

    if (!file && !pipePhotoUrl) {
      setError("Please upload a photo of your backflow pipe before continuing.");
      setStatus("error");
      document.getElementById("fit-details")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    if (!pipeHeight.trim() || !pipeWidth.trim()) {
      setError("Please enter the height and width of your backflow pipe.");
      setStatus("error");
      document.getElementById("fit-details")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    if (hasAddon) {
      if (!electricalBoxPhoto && !electricalBoxPhotoUrl) {
        setError("Please upload a photo of the electrical box cover area.");
        setStatus("error");
        document.getElementById("electrical-box-details")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      if (
        !electricalBoxWidth.trim() ||
        !electricalBoxDepth.trim() ||
        !electricalBoxHeight.trim()
      ) {
        setError(
          "Please enter the width, depth, and height for the electrical box cover."
        );
        setStatus("error");
        document.getElementById("electrical-box-details")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setError("Please confirm your contact information before continuing.");
      setStatus("error");
      return;
    }

    if (!address1.trim() || !city.trim() || !stateRegion.trim() || !postalCode.trim()) {
      setError("Please confirm your installation address before continuing.");
      setStatus("error");
      return;
    }

    setStatus("uploading");

    try {
      const fd = new FormData();
      fd.append("sessionId", sessionId);
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

      if (file) {
        fd.append("photo", file);
      }

      if (hasAddon && electricalBoxPhoto) {
        fd.append("electricalBoxPhoto", electricalBoxPhoto);
      }

      if (hasAddon) {
        fd.append("electricalBoxWidth", electricalBoxWidth.trim());
        fd.append("electricalBoxDepth", electricalBoxDepth.trim());
        fd.append("electricalBoxHeight", electricalBoxHeight.trim());
      }

      const res = await fetch("/api/qr/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "Upload failed");
      }

      posthog.capture("qr_order_details_submitted", {
        session_id: sessionId,
        addon_selected: hasAddon,
        rock_color: summary.rockColor || colorFromQuery,
      });

      router.replace(`/qr/thanks?session_id=${encodeURIComponent(sessionId)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Upload failed");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 250);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div
          className={[
            "mx-auto flex max-w-5xl items-center justify-between px-4 transition-all sm:px-5",
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
              Review your order, then upload the sizing details we need to verify fit
              and schedule installation.
            </p>
            {prefillLoading ? (
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/45">
                Loading your order details…
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
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
                <div className={sectionTitle()}>Order summary</div>

                <div className="mt-4 space-y-4">
                  <SummaryLine
                    label={summary.productName || QR_MAIN_PRODUCT_NAME}
                    detail={`Color: ${selectedColor.label}`}
                    amount={formatUsd(summary.productPriceCents)}
                  />

                  {hasAddon ? (
                    <SummaryLine
                      label={summary.addonProductName || QR_UPSELL_ADDON_NAME}
                      detail="Add-on: Electrical Box Cover"
                      amount={formatUsd(
                        summary.addonPriceCents || QR_UPSELL_ADDON_PRICE_CENTS
                      )}
                    />
                  ) : null}

                  <div className="border-t border-white/10 pt-4">
                    <SummaryLine
                      label="Total"
                      amount={formatUsd(summary.totalAmountCents)}
                      strong
                    />
                  </div>
                </div>
              </div>

              <div id="fit-details">
                <div className={sectionTitle()}>Artificial rock details</div>

                <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 sm:p-5">
                  <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                    Please upload a photo and dimensions of your backflow pipe
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/80">
                    This is required so we can verify the correct fit and order the
                    right rock size for your installation.
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
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                  </div>

                  {pipePhotoUrl ? (
                    <div className="mt-4">
                      <div className={labelClass()}>Saved pipe photo</div>
                      <a
                        href={pipePhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block overflow-hidden rounded-2xl border border-white/10"
                      >
                        <img
                          src={pipePhotoUrl}
                          alt="Saved backflow pipe photo"
                          className="h-32 w-32 object-cover"
                        />
                      </a>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className={labelClass()}>Backflow pipe height (inches)</div>
                      <input
                        className={`${inputClass()} mt-2`}
                        value={pipeHeight}
                        onChange={(event) => setPipeHeight(event.target.value)}
                        placeholder="Example: 12"
                        inputMode="decimal"
                      />
                    </div>

                    <div>
                      <div className={labelClass()}>Backflow pipe width (inches)</div>
                      <input
                        className={`${inputClass()} mt-2`}
                        value={pipeWidth}
                        onChange={(event) => setPipeWidth(event.target.value)}
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

              {hasAddon ? (
                <div id="electrical-box-details">
                  <div className={sectionTitle()}>Electrical box cover details</div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                    <div className="grid gap-5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-start">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <img
                          src="/rocks/electrical-box-cover-after.jpg"
                          alt="Electrical box cover preview"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div>
                        <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                          Electrical box cover details
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-white/72">
                          Upload a photo and enter the width, depth, and height so we
                          can size the electrical box cover correctly for this same
                          order.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className={labelClass()}>
                        Upload electrical box photo (required)
                      </div>
                      <input
                        className={[
                          inputClass(),
                          "mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.2em] file:text-white hover:file:bg-white/15",
                        ].join(" ")}
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setElectricalBoxPhoto(event.target.files?.[0] ?? null)
                        }
                      />
                    </div>

                    {electricalBoxPhotoUrl ? (
                      <div className="mt-4">
                        <div className={labelClass()}>Saved electrical box photo</div>
                        <a
                          href={electricalBoxPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block overflow-hidden rounded-2xl border border-white/10"
                        >
                          <img
                            src={electricalBoxPhotoUrl}
                            alt="Saved electrical box photo"
                            className="h-32 w-32 object-cover"
                          />
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <div className={labelClass()}>
                          Electrical box cover width (inches)
                        </div>
                        <input
                          className={`${inputClass()} mt-2`}
                          value={electricalBoxWidth}
                          onChange={(event) => setElectricalBoxWidth(event.target.value)}
                          placeholder="Example: 18"
                          inputMode="decimal"
                        />
                      </div>

                      <div>
                        <div className={labelClass()}>
                          Electrical box cover depth (inches)
                        </div>
                        <input
                          className={`${inputClass()} mt-2`}
                          value={electricalBoxDepth}
                          onChange={(event) => setElectricalBoxDepth(event.target.value)}
                          placeholder="Example: 12"
                          inputMode="decimal"
                        />
                      </div>

                      <div>
                        <div className={labelClass()}>
                          Electrical box cover height (inches)
                        </div>
                        <input
                          className={`${inputClass()} mt-2`}
                          value={electricalBoxHeight}
                          onChange={(event) => setElectricalBoxHeight(event.target.value)}
                          placeholder="Example: 24"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {status === "error" && error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <details className="rounded-2xl border border-white/10 bg-white/[0.03]">
                <summary className="cursor-pointer list-none px-4 py-4 sm:px-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className={sectionTitle()}>Saved contact & address</div>
                      <p className="mt-2 text-sm text-white/65">
                        Your checkout details are already filled in. Open this section
                        only if you need to edit them.
                      </p>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                      Edit
                    </div>
                  </div>
                </summary>

                <div className="border-t border-white/10 px-4 py-5 sm:px-5">
                  <div>
                    <div className={sectionTitle()}>Contact</div>
                    <div className="mt-3 grid grid-cols-1 gap-4">
                      <div>
                        <div className={labelClass()}>Full name</div>
                        <input
                          className={inputClass()}
                          value={fullName}
                          onChange={(event) => setFullName(event.target.value)}
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
                            onChange={(event) => setEmail(event.target.value)}
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
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="(555) 555-5555"
                            inputMode="tel"
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className={sectionTitle()}>Installation address</div>

                    <div className="mt-3 grid grid-cols-1 gap-4">
                      <div>
                        <div className={labelClass()}>Address line 1</div>
                        <input
                          className={inputClass()}
                          value={address1}
                          onChange={(event) => setAddress1(event.target.value)}
                          placeholder="Street address"
                          autoComplete="address-line1"
                        />
                      </div>

                      <div>
                        <div className={labelClass()}>Address line 2 (optional)</div>
                        <input
                          className={inputClass()}
                          value={address2}
                          onChange={(event) => setAddress2(event.target.value)}
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
                            onChange={(event) => setCity(event.target.value)}
                            placeholder="City"
                            autoComplete="address-level2"
                          />
                        </div>

                        <div>
                          <div className={labelClass()}>State</div>
                          <input
                            className={inputClass()}
                            value={stateRegion}
                            onChange={(event) => setStateRegion(event.target.value)}
                            placeholder="State"
                            autoComplete="address-level1"
                          />
                        </div>

                        <div>
                          <div className={labelClass()}>ZIP</div>
                          <input
                            className={inputClass()}
                            value={postalCode}
                            onChange={(event) => setPostalCode(event.target.value)}
                            placeholder="ZIP"
                            inputMode="numeric"
                            autoComplete="postal-code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              <div>
                <div className={sectionTitle()}>Notes</div>
                <div className="mt-3">
                  <div className={labelClass()}>Optional</div>
                  <textarea
                    className={`${inputClass()} min-h-[110px] resize-none`}
                    placeholder="Access notes, best time to call, anything we should know…"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
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
