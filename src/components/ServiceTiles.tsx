"use client";

import Link from "next/link";

/**
 * Editorial service tiles. Asymmetric on desktop, one tall tile beside two
 * stacked, because a three-up grid of equal cards is the single most
 * common tell of a template site.
 *
 * Posters sit desaturated and slightly over-scaled until hover, then warm
 * into color while cinematic bars close in and the description rises.
 * Focus-visible gets identical treatment so keyboard users see the effect.
 */

type Tile = {
  n: string;
  title: string;
  desc: string;
  img: string;
  alt: string;
  href: string;
};

const TILES: Tile[] = [
  {
    n: "01",
    title: "Second Home Management",
    desc: "Weekly or bi-weekly walkthroughs, inside and out. Full system checks, photo documentation, and a written report every single visit.",
    img: "/img.png",
    alt: "Pool and exterior care at a Watersound Origins second home",
    href: "/second-home-management-inlet-beach",
  },
  {
    n: "02",
    title: "Mail & Package Handling",
    desc: "Deliveries collected, secured, and handled the way you want them. Nothing sits on a porch on 30A announcing that nobody's home.",
    img: "/service2.png",
    alt: "Mail and package handling for 30A second homes",
    href: "/mail-package-handling-inlet-beach",
  },
  {
    n: "03",
    title: "Concierge & On-Call",
    desc: "Contractor meetings, arrival prep, the one-off jobs nobody else will take. If you'd do it yourself when you're in town, I'll do it when you're not.",
    img: "/service3.png",
    alt: "Concierge and on-call property services on 30A",
    href: "/concierge-services-inlet-beach",
  },
];

function TileCard({ t, className = "" }: { t: Tile; className?: string }) {
  return (
    <Link href={t.href} className={`ch-tile group ${className}`}>
      <img src={t.img} alt={t.alt} className="ch-tile__media" loading="lazy" decoding="async" />
      <span className="ch-tile__scrim" aria-hidden="true" />
      <div className="ch-tile__body">
        <span className="ch-tile__index">{t.n}</span>
        <h3
          className="mt-3 text-[22px] uppercase leading-[1.05] tracking-[-0.015em] text-white md:text-[26px]"
          style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 110, 'wght' 640" }}
        >
          {t.title}
        </h3>
        <div className="ch-tile__desc">
          <p className="max-w-[46ch] text-[14px] leading-[1.7] text-white/70">{t.desc}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[var(--ch-teal-bright)]">
            Learn more
            <span className="inline-block -rotate-45 transition-transform duration-500 group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ServiceTiles() {
  return (
    <>
      {/* Desktop: asymmetric editorial grid */}
      <div className="hidden gap-4 md:grid md:grid-cols-2 lg:gap-5">
        <TileCard t={TILES[0]} className="row-span-2 h-full min-h-[520px] lg:min-h-[640px]" />
        <TileCard t={TILES[1]} className="min-h-[250px] lg:min-h-[310px]" />
        <TileCard t={TILES[2]} className="min-h-[250px] lg:min-h-[310px]" />
      </div>

      {/* Mobile: full-bleed stack, descriptions always visible (there is no
          hover on a phone, hiding the copy behind an interaction that
          can't happen is how tiles like this quietly lose conversions). */}
      <div className="space-y-4 md:hidden">
        {TILES.map((t) => (
          <Link key={t.n} href={t.href} className="ch-tile block h-[330px]">
            <img src={t.img} alt={t.alt} className="ch-tile__media" loading="lazy" decoding="async" />
            <span className="ch-tile__scrim" aria-hidden="true" />
            <div className="ch-tile__body">
              <span className="ch-tile__index">{t.n}</span>
              <h3
                className="mt-2 text-[21px] uppercase leading-[1.05] tracking-[-0.015em] text-white"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 110, 'wght' 640" }}
              >
                {t.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-[1.65] text-white/70">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
