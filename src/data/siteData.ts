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
// from here. Do NOT hardcode a reviewCount anywhere else, a mismatch between
// what's in your schema and your real Google Business Profile is a trust/spam
// signal to Google, not a harmless typo.
//
// reviewCount = live Google reviews ONLY (confirmed 4 as of 2026-07-14 after
// Buddy Norman's review). Testimonials sent privately (text/email/Facebook)
// do NOT count here, only what shows on the GBP listing.
export const trustStats = {
  ratingValue: "5.0",
  bestRating: "5",
  reviewCount: "4",
  propertiesManaged: "$10 million+",
  activeHomes: "15+",
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
  // Canonical social profiles, used for every `sameAs` block on the site.
  // NOTE: about/page.tsx previously pointed at a different (vanity) Facebook
  // URL than layout.tsx/page.tsx. Standardized on the profile.php link since
  // it's what's used in two of the three schema blocks. If the vanity URL
  // (facebook.com/CoastalHomeManagement30A) is the one you actually want
  // customers to see, tell me and I'll switch all three to match it instead.
  facebookUrl: "https://www.facebook.com/profile.php?id=61575773416368",
  linkedinUrl: "https://www.linkedin.com/company/113245630/",
};

// ─── Phone / booking configuration ─────────────────────────────────────────
// One switch controls every "answered 24/7" claim on the site. Until a real
// always-on number exists, the site says "Ryder answers personally" instead.
// A homeowner who calls at 2am after reading "24/7" and gets voicemail
// is a worse first impression than never having made the claim.
//
// TO GO LIVE once Reece has the agent provisioned:
//   1. set enabled: true
//   2. paste the number in E.164 (+1XXXXXXXXXX) and its display form
// Nothing else needs to change. Every component reads from here.
export const contactChannels = {
  /** Ryder's direct line. Shown publicly today. */
  directPhone: "+13094158793",
  directPhoneDisplay: "(309) 415-8793",

  answeringService: {
    enabled: false,
    phone: "",
    phoneDisplay: "",
  },
};

/** The number the site should actually dial, given what's live. */
export function primaryPhone() {
  return contactChannels.answeringService.enabled
    ? contactChannels.answeringService.phone
    : contactChannels.directPhone;
}

export function primaryPhoneDisplay() {
  return contactChannels.answeringService.enabled
    ? contactChannels.answeringService.phoneDisplay
    : contactChannels.directPhoneDisplay;
}

// ─── Booking ───────────────────────────────────────────────────────────────
export const bookingConfig = {
  /** Neighborhoods offered in the booking flow. */
  neighborhoods: [
    "Watersound Origins",
    "Naturewalk",
    "Inlet Beach",
    "Rosemary Beach",
    "Alys Beach",
    "Seacrest",
    "Somewhere else on 30A",
  ],
  /** Arrival windows Ryder actually works. */
  windows: [
    { id: "morning", label: "Morning", detail: "8am – 11am" },
    { id: "midday", label: "Midday", detail: "11am – 2pm" },
    { id: "afternoon", label: "Afternoon", detail: "2pm – 5pm" },
    { id: "flexible", label: "Flexible", detail: "Whatever works" },
  ],
  plans: ["Essential ($200/mo)", "Home Watch ($350/mo)", "Coastal Elite ($600/mo)", "Not sure yet"],
};

// ─── Single source of truth for pricing / service catalog ──────────────────
// Used to build the `hasOfferCatalog` schema in layout.tsx AND the /llms.txt
// feed. Edit prices here, everywhere else should reference this array.
//
// Tier names are canonical here and must match /pricing exactly:
// Essential ($200) · Home Watch ($350) · Coastal Elite ($600).
// Rate locks (billed monthly, no upfront payment): 6-month saves 5%,
// 12-month saves 10%: Essential $190/$180 · Home Watch $330/$315 · Elite $570/$540.
// If you rename a tier, update src/app/pricing/page.tsx and src/app/about/page.tsx
// in the same commit or the site drifts out of sync again.
export const offerings: {
  name: string;
  description: string;
  price: string;
  unitText?: "month" | "day";
}[] = [
  {
    name: "Essential",
    description:
      "Essential home watch plan for 30A second homes: weekly property inspection, photo documentation, storm watch, mail pickup, and a text or email summary after each visit. $200/month month-to-month, $190/month on a 6-month rate lock, or $180/month on a 12-month rate lock (billed monthly).",
    price: "200.00",
    unitText: "month",
  },
  {
    name: "Home Watch",
    description:
      "Home Watch plan: everything in Essential plus bi-weekly photo reports, seasonal maintenance checks, one on-call task per month, and contractor coordination. $350/month month-to-month, $330/month on a 6-month rate lock, or $315/month on a 12-month rate lock (billed monthly).",
    price: "350.00",
    unitText: "month",
  },
  {
    name: "Coastal Elite",
    description:
      "Our highest tier, guaranteed 2-hour emergency response, weekly photo reports, Arrival Prep 2x/year, 3 on-call hours included, and Ryder's direct line. Limited to 8 members. $600/month month-to-month, $570/month on a 6-month rate lock, or $540/month on a 12-month rate lock (billed monthly).",
    price: "600.00",
    unitText: "month",
  },
  {
    name: "On-Call Property Tasks",
    description:
      "One-off requests, contractor meeting, errands, random jobs. No recurring commitment required.",
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

  // Google Business Profile, update with your direct review link from GBP dashboard
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