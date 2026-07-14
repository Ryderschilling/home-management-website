// src/data/siteData.ts

export type Service = {
  id: string;
  title: string;
  description: string;
  // keep optional so admin can still store it, but you won't display it on the site
  price?: string;
  image?: string;
  ctaLabel?: string;
};

// ─── Single source of truth for trust/review signals ───────────────────────
// EVERY file that emits review/rating schema (layout.tsx, page.tsx) must pull
// from here. Do NOT hardcode a reviewCount anywhere else — a mismatch between
// what's in your schema and your real Google Business Profile is a trust/spam
// signal to Google, not a harmless typo.
//
// ⚠️ VERIFY reviewCount against your live GBP listing before deploying. This
// is currently set to 5 (the higher of two conflicting values found across
// the codebase) — confirm the real number and update it here.
export const trustStats = {
  ratingValue: "5.0",
  bestRating: "5",
  reviewCount: "6",
  propertiesManaged: "$8 million+",
  activeHomes: "9",
};

export const testimonials = [
  {
    author: "Buddy Norman",
    datePublished: "2026-07-14",
    rating: "5",
    body: "Coastal Home Management is doing a really expert and professional job looking after my home. Ryder is easy to work with and has communicated with me exceptionally well (even sending pictures) on every task I have needed. They cover a wide range of services at a good price.",
  },
  {
    author: "Beth Tedesco",
    datePublished: "2025-12-01",
    rating: "5",
    body: "Excellent service and communication! Very helpful and Ryder goes out of his way to help.",
  },
  {
    author: "Barbara Reed",
    datePublished: "2025-11-01",
    rating: "5",
    body: "Ryder gives us peace of mind if we're out of town and need the house checked on. Very reliable. Would highly recommend using his services!",
  },
];

// ─── Single source of truth for business contact/identity ──────────────────
export const businessContact = {
  phone: "+13094158793",
  address: {
    locality: "Inlet Beach",
    region: "FL",
    postalCode: "32461",
    country: "US",
  },
  foundingDate: "2025-10",
  // Canonical social profiles — used for every `sameAs` block on the site.
  // NOTE: about/page.tsx previously pointed at a different (vanity) Facebook
  // URL than layout.tsx/page.tsx. Standardized on the profile.php link since
  // it's what's used in two of the three schema blocks. If the vanity URL
  // (facebook.com/CoastalHomeManagement30A) is the one you actually want
  // customers to see, tell me and I'll switch all three to match it instead.
  facebookUrl: "https://www.facebook.com/profile.php?id=61575773416368",
  linkedinUrl: "https://www.linkedin.com/company/113245630/",
};

// ─── Single source of truth for pricing / service catalog ──────────────────
// Used to build the `hasOfferCatalog` schema in layout.tsx AND the /llms.txt
// feed. Edit prices here — everywhere else should reference this array.
//
// ⚠️ PRICING FLAG: your CHM master context doc lists Premium at $300/mo and
// On-Call Tasks at $100 flat. The live site code (below, pulled from the
// original layout.tsx) has Premium at $275/mo and On-Call at $85 flat. I used
// the live code as the source of truth since that's what's actually deployed
// and quoted to customers — but confirm which numbers are current and correct
// the other doc so they don't drift again.
export const offerings: {
  name: string;
  description: string;
  price: string;
  unitText?: "month" | "day";
}[] = [
  {
    name: "Standard Home Management",
    description:
      "Weekly property inspection, photo documentation, storm watch, mail pickup, and text/email summary after each visit.",
    price: "150.00",
    unitText: "month",
  },
  {
    name: "Premium Home Management",
    description:
      "Everything in Standard plus bi-weekly photo reports, seasonal maintenance checks, one on-call task per month, and contractor coordination.",
    price: "275.00",
    unitText: "month",
  },
  {
    name: "Coastal Elite Membership",
    description:
      "Our highest tier — guaranteed 2-hour emergency response, weekly photo reports, Arrival Prep 2x/year, 3 on-call hours included, and Ryder's direct line. Limited to 8 members.",
    price: "650.00",
    unitText: "month",
  },
  {
    name: "On-Call Property Tasks",
    description:
      "One-off requests — contractor meeting, errands, random jobs. No recurring commitment required.",
    price: "85.00",
  },
  {
    name: "Mail & Trash Handling",
    description:
      "Mail collection and/or trash takeout and return while you're away from your 30A property.",
    price: "35.00",
    unitText: "day",
  },
];

export const siteData = {
  businessName: "Coastal Home Management 30A",
  serviceArea: "Watersound Origins & surrounding areas",
  startingPrice: "",

  // IMPORTANT: replace this with your real email
  contactEmail: "coastalhomemanagement30a@gmail.com",

  // Google Business Profile — update with your direct review link from GBP dashboard
  // Format: https://g.page/r/YOUR_PLACE_ID/review  (find it in Google Business Profile > Get more reviews)
  gbpUrl: "https://g.page/r/CbwjKOQ5enwWEBM/review",

  services: [
    {
      id: "second-home-management",
      title: "Second Home Management",
      description:
        "Comprehensive oversight while you’re away. Weekly or bi-weekly check-ins, full property inspections, issue coordination, and proactive care to keep your home in top condition.",
      image: "/img.png",
      ctaLabel: "Inquire Now",
    },
    {
      id: "mail-package-handling",
      title: "Mail & Package Handling",
      description:
        "Receive and manage all mail and deliveries while you’re away. Packages are collected, secured, and handled according to your preferences so nothing is missed.",
      image: "/service2.png",
      ctaLabel: "Inquire Now",
    },
    {
      id: "concierge-services",
      title: "Concierge Services",
      description:
        "Anything you may need as a homeowner. From one-off requests to ongoing assistance, we handle the details so you don’t have to.",
      image: "/service3.png",
      ctaLabel: "Inquire Now",
    },
  ],
};