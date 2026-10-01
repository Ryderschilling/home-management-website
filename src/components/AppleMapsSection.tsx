"use client";

import { useEffect, useState } from "react";
import { businessContact, contactChannels } from "@/data/siteData";

/**
 * "Verified on Apple Maps" proof section, added 10/1/26 after Apple Business
 * verified Coastal Home Management 30A, LLC.
 *
 * The phone is our own drawing of the listing in an iOS style. It is NOT
 * Apple's artwork: no Apple logo, no Apple map tiles, and no star rating,
 * because Apple Maps has no rating for us yet and Google reviews cannot be
 * moved onto Apple. Every fact on the card matches the live listing
 * (businessContact.appleMapsUrl). If hours change there, change HOURS here.
 */

// Mon to Sat, 9 to 5, Central. Same as GBP, Yelp and Apple.
const HOURS = { days: [1, 2, 3, 4, 5, 6], open: 9, close: 17 };

function openNow(): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hr = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  return HOURS.days.includes(day) && hr >= HOURS.open && hr < HOURS.close;
}

function Seal() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0a84ff"
        d="M12 1.5l2.4 1.8 3-.2 1 2.8 2.5 1.7-.7 2.9 1.3 2.7-2.2 2 -.2 3-2.9.7-1.6 2.5-2.9-.9L12 22.5l-2.3-1.9-2.9.9-1.6-2.5-2.9-.7-.2-3-2.2-2 1.3-2.7-.7-2.9L3.6 6.1l1-2.8 3 .2z"
      />
      <path d="M7.6 12.3l3 3 5.8-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionIcon({ kind }: { kind: "call" | "web" | "maps" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "call")
    return (
      <svg {...common}>
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
      </svg>
    );
  if (kind === "web")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M3 11l18-8-8 18-2-8z" />
    </svg>
  );
}

function MapArt() {
  // Abstract coastline: lake, Hwy 98, 30A and the Gulf. Not a real tile.
  return (
    <svg viewBox="0 0 360 220" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="360" height="220" fill="#eef1e8" />
      <path d="M0 170 C80 150 160 175 240 160 S340 150 360 156 V220 H0z" fill="#a9d6f5" />
      <path d="M0 176 C80 156 160 181 240 166 S340 156 360 162" fill="none" stroke="#f3e7c9" strokeWidth="6" />
      <path d="M210 40 c30-14 70-6 86 14 c14 18-6 38-34 40 c-34 2-66-8-70-26 c-2-12 6-22 18-28z" fill="#bfe0f7" />
      <g fill="#dbe8cc">
        <rect x="30" y="40" width="70" height="44" rx="10" />
        <rect x="120" y="90" width="80" height="38" rx="10" />
        <rect x="250" y="104" width="70" height="30" rx="8" />
      </g>
      <path d="M-10 66 L370 118" stroke="#f7c873" strokeWidth="7" strokeLinecap="round" />
      <path d="M-10 66 L370 118" stroke="#fde3a7" strokeWidth="3" strokeLinecap="round" />
      <path d="M-10 142 C90 128 200 150 370 136" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M150 0 C156 40 168 80 178 150" stroke="#fff" strokeWidth="4" fill="none" />
      <path d="M60 0 C70 30 64 60 80 76" stroke="#fff" strokeWidth="3" fill="none" />
    </svg>
  );
}

export default function AppleMapsSection() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(openNow());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const site = "https://coastalhomemngt30a.com";
  const actions: Array<{ label: string; href: string; kind: "call" | "web" | "maps"; ext?: boolean }> = [
    { label: "Call", href: `tel:${contactChannels.directPhone}`, kind: "call" },
    { label: "Website", href: site, kind: "web" },
    { label: "Maps", href: businessContact.appleMapsUrl, kind: "maps", ext: true },
  ];

  return (
    <section
      className="fade-section relative w-full overflow-hidden bg-[var(--ch-paper-alt)] px-4 py-24 md:px-8 md:py-32"
      aria-label="Verified on Apple Maps"
    >
      <div className="mx-auto grid max-w-[1240px] items-center gap-16 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-24">
        <div>
          <p className="ch-eyebrow reveal-item">Verified on Apple Maps</p>
          <h2 className="ch-display max-w-[14ch]">
            <span className="ch-mask">
              <span>Look us up.</span>
            </span>
            <span className="ch-mask">
              <span>We&rsquo;re the real one.</span>
            </span>
          </h2>
          <p className="reveal-item mt-8 max-w-[46ch] text-[16.5px] leading-[1.7] text-[var(--ch-muted)]">
            Coastal Home Management 30A, LLC is a verified business on Apple Business. Search
            Apple Maps or ask Siri from your iPhone and you land on our listing, with our number,
            our hours and our website, confirmed by Apple.
          </p>
          <ul className="reveal-item mt-8 grid max-w-[460px] gap-3 text-[14.5px] text-[var(--ch-ink)]">
            {[
              "Verified on Apple Maps and Apple Business",
              "5.0 on Google, ranked " + businessContact.bhwcRanking,
              "Owner-operated, insured Florida LLC",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--ch-teal)]" />
                {t}
              </li>
            ))}
          </ul>
          <a
            href={businessContact.appleMapsUrl}
            target="_blank"
            rel="noopener"
            className="ch-link reveal-item mt-10 inline-block"
          >
            Open our listing in Apple Maps &rarr;
          </a>
        </div>

        {/* Phone */}
        <div className="am-stage reveal-item relative mx-auto w-full max-w-[330px]">
          <div className="am-glow" aria-hidden="true" />
          <div className="am-phone relative rounded-[46px] bg-[#0b0b0d] p-[10px] shadow-[var(--ch-shadow-lg)]">
            <div className="am-screen relative overflow-hidden rounded-[37px] bg-white">
              <div className="relative h-[270px]">
                <MapArt />
                <div className="absolute left-1/2 top-[18px] h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-[#0b0b0d]" />
                <div className="am-pin absolute left-[49%] top-[104px] -translate-x-1/2">
                  <span className="am-pulse" aria-hidden="true" />
                  <svg width="38" height="46" viewBox="0 0 38 46" aria-hidden="true">
                    <path d="M19 45s15-14 15-26A15 15 0 0 0 4 19c0 12 15 26 15 26z" fill="#0d7f79" stroke="#fff" strokeWidth="2.5" />
                    <path d="M12 21l7-6 7 6v6h-14z" fill="#fff" />
                  </svg>
                </div>
              </div>

              <div className="am-sheet relative -mt-6 rounded-t-[22px] bg-white px-5 pb-6 pt-2 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
                <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-[#d1d1d6]" />
                <div className="am-sys">
                  <p className="text-[21px] font-bold leading-tight tracking-[-0.02em] text-black">
                    Coastal Home Management 30A
                  </p>
                  <p className="mt-1 text-[13.5px] text-[#8e8e93]">House Sitting Service &middot; Inlet Beach, FL</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[#0a84ff]">
                    <Seal /> Verified business
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {actions.map((a) => (
                      <a
                        key={a.label}
                        href={a.href}
                        {...(a.ext ? { target: "_blank", rel: "noopener" } : {})}
                        className="flex flex-col items-center gap-1 rounded-[12px] bg-[#f2f2f7] py-2.5 text-[12px] font-semibold text-[#0a84ff] transition-colors hover:bg-[#e5e5ea]"
                      >
                        <ActionIcon kind={a.kind} />
                        {a.label}
                      </a>
                    ))}
                  </div>

                  <div className="mt-4 divide-y divide-[#e5e5ea] rounded-[12px] bg-[#f2f2f7] px-4 text-[13.5px]">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[#8e8e93]">Hours</span>
                      <span className="text-right">
                        {open === null ? null : (
                          <span className={`mr-1.5 font-semibold ${open ? "text-[#248a3d]" : "text-[#d70015]"}`}>
                            {open ? "Open" : "Closed"}
                          </span>
                        )}
                        <span className="text-black">Mon to Sat, 9 to 5</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[#8e8e93]">Phone</span>
                      <span className="text-[#0a84ff]">{contactChannels.directPhoneDisplay}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-[#8e8e93]">Serves</span>
                      <span className="text-black">Inlet Beach, Alys, Rosemary</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
