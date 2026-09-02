// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, Instrument_Sans } from "next/font/google";
import { PostHogProvider } from "@/providers/PostHogProvider";
import PublicShell from "@/components/PublicShell";
import { trustStats, testimonials, businessContact, siteData, offerings } from "@/data/siteData";

/**
 * ── Typefaces ────────────────────────────────────────────────────────────────
 * Archivo is a variable font with a real width axis (62–125), which is what
 * lets the display type sit wide and heavy like NORD without paying for a
 * licence. If you buy NORD later this is a two-line swap: drop the .woff2 in
 * /public/fonts, add an @font-face, and point --font-display at it in
 * globals.css. Nothing else changes.
 *
 * next/font downloads both faces at build time and serves them from our own
 * origin. That kills a third-party round trip and removes layout shift, both
 * of which feed Core Web Vitals, and Core Web Vitals feed rankings, which is
 * where this business actually gets its leads.
 * ────────────────────────────────────────────────────────────────────────────
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

/**
 * Google Ads Conversion Tracking
 * ─────────────────────────────────────────────────────────────────────────────
 * After creating your Google Ads account and setting up a conversion action:
 *   1. Go to ads.google.com → Tools → Measurement → Conversions
 *   2. Create a conversion action → "Website" → fill out the form
 *   3. Click "Use Google Tag", copy the two values:
 *        • GOOGLE_ADS_ID     = AW-XXXXXXXXXX   (your account tag)
 *        • CONVERSION_LABEL  = the label string from the conversion snippet
 *   4. Replace the placeholders below AND in HomeWatchLeadForm.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 */
const GOOGLE_ADS_ID = "AW-18257719328";
const GA4_ID = "G-6DV3V7B7RR";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://coastalhomemngt30a.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),

  title: {
    default: "Home Watch & Second Home Management, Scenic 30A",
    template: "%s | Coastal Home Management 30A",
  },

  description:
    "Second home management and property care in Watersound Origins, Alys, Rosemary and scenic 30A. Insured Florida LLC. Weekly check-ins, photo reports, and peace of mind. Inquire today.",

  openGraph: {
    title: "Home Watch & Second Home Management, Scenic 30A",
    description:
      "Second home management and property care in Watersound Origins, Alys, Rosemary and scenic 30A. Insured Florida LLC. Weekly check-ins, photo reports, and peace of mind. Inquire today.",
    url: "https://coastalhomemngt30a.com",
    siteName: "Coastal Home Management 30A",
    images: [
      {
        url: "https://coastalhomemngt30a.com/img.png",
        width: 1200,
        height: 630,
        alt: "Coastal Home Management 30A, second home management in Watersound Origins, Alys, Rosemary and scenic 30A, Florida",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  icons: {
    icon: [
      { url: "/icon.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/icon.png?v=3", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png?v=3", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon.png?v=3"],
  },

  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://coastalhomemngt30a.com/#business",
      name: "Coastal Home Management 30A",
      alternateName: "CHM 30A",
      description:
        "Local, owner-operated, insured second home management and property care for vacation homeowners in Watersound Origins, Alys, Rosemary, and scenic 30A in Florida.",
      url: "https://coastalhomemngt30a.com",
      telephone: businessContact.phone,
      email: "coastalhomemanagement30a@gmail.com",
      logo: {
        "@type": "ImageObject",
        url: "https://coastalhomemngt30a.com/logo.png",
      },
      image: "https://coastalhomemngt30a.com/img.png",
      priceRange: "$$",
      currenciesAccepted: "USD",
      paymentAccepted: "Credit Card, Stripe",
      address: {
        "@type": "PostalAddress",
        addressLocality: businessContact.address.locality,
        addressRegion: businessContact.address.region,
        postalCode: businessContact.address.postalCode,
        addressCountry: businessContact.address.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 30.2754,
        longitude: -86.0116,
      },
      areaServed: [
        {
          "@type": "Place",
          name: "Watersound Origins",
        },
        {
          "@type": "Place",
          name: "Naturewalk at Seagrove",
        },
        {
          "@type": "Place",
          name: "Inlet Beach",
        },
        {
          "@type": "Place",
          name: "Scenic 30A",
        },
        {
          "@type": "Place",
          name: "Santa Rosa Beach",
        },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "18:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Saturday",
          opens: "08:00",
          closes: "16:00",
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Second Home Management Services",
        itemListElement: offerings.map((offer) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: offer.name,
            description: offer.description,
          },
          price: offer.price,
          priceCurrency: "USD",
          ...(offer.unitText
            ? {
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: offer.price,
                  priceCurrency: "USD",
                  unitText: offer.unitText,
                },
              }
            : {}),
        })),
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: trustStats.ratingValue,
        bestRating: trustStats.bestRating,
        worstRating: "1",
        reviewCount: trustStats.reviewCount,
      },
      review: testimonials.map((t) => ({
        "@type": "Review",
        datePublished: t.datePublished,
        author: { "@type": "Person", name: t.author },
        reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: "5" },
        reviewBody: t.body,
      })),
      founder: {
        "@type": "Person",
        name: "Ryder Schilling",
        jobTitle: "Founder & Owner",
      },
      foundingDate: businessContact.foundingDate,
      sameAs: [
        businessContact.facebookUrl,
        businessContact.linkedinUrl,
        siteData.gbpUrl,
      ],
    },
    {
      "@type": "Organization",
      "@id": "https://coastalhomemngt30a.com/#organization",
      name: "Coastal Home Management 30A",
      url: "https://coastalhomemngt30a.com",
      logo: {
        "@type": "ImageObject",
        url: "https://coastalhomemngt30a.com/logo.png",
        width: 400,
        height: 120,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: businessContact.phone,
        contactType: "customer service",
        email: "coastalhomemanagement30a@gmail.com",
        areaServed: "US",
        availableLanguage: "English",
      },
      sameAs: [
        businessContact.facebookUrl,
        businessContact.linkedinUrl,
        siteData.gbpUrl,
      ],
    },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://coastalhomemngt30a.com/#org",
  name: "Coastal Home Management 30A",
  alternateName: "CHM 30A",
  url: "https://coastalhomemngt30a.com",
  logo: {
    "@type": "ImageObject",
    url: "https://coastalhomemngt30a.com/logo.png",
    width: 400,
    height: 120,
  },
  image: "https://coastalhomemngt30a.com/img.png",
  description:
    "Local, owner-operated, insured second home management and property care for vacation homeowners in Watersound Origins, Alys, Rosemary, and scenic 30A in Florida.",
  telephone: businessContact.phone,
  email: "coastalhomemanagement30a@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: businessContact.address.locality,
    addressRegion: businessContact.address.region,
    postalCode: businessContact.address.postalCode,
    addressCountry: businessContact.address.country,
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: businessContact.phone,
    contactType: "customer service",
    email: "coastalhomemanagement30a@gmail.com",
    areaServed: "US",
    availableLanguage: "English",
  },
  founder: {
    "@type": "Person",
    name: "Ryder Schilling",
  },
  foundingDate: businessContact.foundingDate,
  sameAs: [
    businessContact.facebookUrl,
    businessContact.linkedinUrl,
    siteData.gbpUrl,
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${instrumentSans.variable}`}>
      <head>
        {/* Google Ads global site tag */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
          gtag('config', '${GA4_ID}');
        `}</Script>

        {/* LocalBusiness + Organization graph schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        {/* Standalone Organization schema, required by GEO scanners */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {/* rel="author", signals About page to GEO crawlers */}
        <link rel="author" href="https://coastalhomemngt30a.com/about" />
      </head>
      <body>
        <PostHogProvider>
          <PublicShell>{children}</PublicShell>
        </PostHogProvider>
      </body>
    </html>
  );
}
