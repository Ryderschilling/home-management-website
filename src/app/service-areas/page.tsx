import type { Metadata } from "next";
import Link from "next/link";
import { allTownPages } from "@/data/townPages";

const SITE = "https://coastalhomemngt30a.com";
const SERIF = {
  fontFamily: "ui-serif, Georgia, 'Times New Roman', Times, serif",
} as const;

export const metadata: Metadata = {
  title: "Home Watch Service Areas on 30A | Coastal Home Management 30A",
  description:
    "Every town Coastal Home Management 30A serves, from Dune Allen Beach to west Panama City Beach, with drive times from the owner's home in Watersound Origins. Home watch from $200/mo.",
  keywords:
    "30A home watch service area, home watch towns 30A, Walton County home watch, Rosemary Beach Alys Beach Seaside home watch, second home management 30A Florida",
  alternates: { canonical: `${SITE}/service-areas` },
  openGraph: {
    title: "Home Watch Service Areas on 30A",
    description:
      "Every beach town Coastal Home Management 30A serves, with honest drive times from Watersound Origins.",
    url: `${SITE}/service-areas`,
    type: "website",
    images: ["/img.png"],
  },
};

// The three neighborhood pages that predate the town build, kept in the same
// list so the hub links every location page on the site.
const EXISTING = [
  {
    slug: "home-watch-watersound-origins",
    town: "Watersound Origins",
    driveMinutes: 0,
    county: "Walton County",
    blurb: "The owner's own neighborhood. Home watch from a resident, not a vendor.",
  },
  {
    slug: "home-watch-inlet-beach",
    town: "Inlet Beach",
    driveMinutes: 3,
    county: "Walton County",
    blurb: "The east end of 30A, from the county line to Rosemary Beach.",
  },
  {
    slug: "home-watch-naturewalk",
    town: "Naturewalk",
    driveMinutes: 2,
    county: "Walton County",
    blurb: "Naturewalk at Watersound Origins, minutes from the owner's front door.",
  },
];

export default function Page() {
  const towns = [
    ...EXISTING,
    ...allTownPages.map((t) => ({
      slug: t.slug,
      town: t.town,
      driveMinutes: t.driveMinutes,
      county: t.county,
      blurb: t.metaDescription.split(".")[0] + ".",
    })),
  ].sort((a, b) => a.driveMinutes - b.driveMinutes);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Coastal Home Management 30A service areas",
    itemListElement: towns.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Home Watch in ${t.town}`,
      url: `${SITE}/${t.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-white font-sans text-black">
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-12 md:pt-20">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/40">
          Service areas · Walton and Bay County, FL
        </p>
        <h1
          className="mb-6 max-w-3xl text-4xl leading-[1.05] tracking-tight text-black md:text-5xl"
          style={SERIF}
        >
          Every town we watch homes in, and how far it actually is
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-black/60">
          Coastal Home Management 30A is run by one person who lives in Watersound Origins. That
          means the honest answer to <em>how fast can you get here</em> is different in every town,
          so here it is in minutes rather than in marketing language. Every page below is written for
          that specific town: what the homes are like there, and what actually goes wrong in them.
        </p>
      </section>

      <section className="border-t border-black/10 px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-3">
          {towns.map((t) => (
            <Link
              key={t.slug}
              href={`/${t.slug}`}
              className="group bg-white p-7 transition hover:bg-[#fafaf8]"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">
                {t.driveMinutes === 0 ? "Home base" : `${t.driveMinutes} min away`}
              </p>
              <h2 className="mb-3 text-xl text-black" style={SERIF}>
                {t.town}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-black/55">{t.blurb}</p>
              <span className="text-[11px] uppercase tracking-[0.16em] text-black/40 transition group-hover:text-black">
                View {t.town} page
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-black/10 bg-[#fafaf8] px-5 py-16 text-center md:py-20">
        <h2 className="mb-4 text-3xl tracking-tight text-black md:text-4xl" style={SERIF}>
          Not sure your town is on the list?
        </h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-black/60">
          Call and ask. If a property is far enough out that we cannot promise a genuinely fast
          response, we will say so instead of taking the money.
        </p>
        <a
          href="tel:3094158793"
          className="inline-block bg-black px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800"
        >
          Call (309) 415-8793
        </a>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
    </main>
  );
}
