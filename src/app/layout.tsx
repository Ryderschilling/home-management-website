// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { PostHogProvider } from "@/providers/PostHogProvider";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://coastalhomemngt30a.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),

  title: {
    default: "Second Home Management in Inlet Beach, 30A | CHM",
    template: "%s | Coastal Home Management 30A",
  },

  description:
    "Second home management and property care in Watersound Origins & Inlet Beach, 30A. Weekly check-ins, photo reports, and peace of mind. Inquire today.",

  alternates: {
    canonical: "https://coastalhomemngt30a.com",
  },

  openGraph: {
    title: "Second Home Management in Inlet Beach, 30A | CHM",
    description:
      "Second home management and property care in Watersound Origins & Inlet Beach, 30A. Weekly check-ins, photo reports, and peace of mind. Inquire today.",
    url: "https://coastalhomemngt30a.com",
    siteName: "Coastal Home Management 30A",
    images: [
      {
        url: "https://coastalhomemngt30a.com/img.png",
        width: 1200,
        height: 630,
        alt: "Coastal Home Management 30A — Second home management in Watersound Origins and Inlet Beach, Florida",
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
        "Local, owner-operated second home management and property care for vacation homeowners in Watersound Origins, Naturewalk, and Inlet Beach along scenic 30A in Florida.",
      url: "https://coastalhomemngt30a.com",
      telephone: "+13094158793",
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
        addressLocality: "Inlet Beach",
        addressRegion: "FL",
        postalCode: "32461",
        addressCountry: "US",
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
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Standard Home Management",
              description:
                "Weekly property inspection, photo documentation, storm watch, mail pickup, and text/email summary after each visit.",
            },
            price: "150.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "150.00",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Premium Home Management",
              description:
                "Everything in Standard plus bi-weekly photo reports, seasonal maintenance checks, one on-call task per month, and contractor coordination.",
            },
            price: "275.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "275.00",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Coastal Elite Membership",
              description:
                "Our highest tier — guaranteed 2-hour emergency response, weekly photo reports, Arrival Prep 2x/year, 3 on-call hours included, and Ryder's direct line.",
            },
            price: "650.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "650.00",
              priceCurrency: "USD",
              unitText: "month",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "On-Call Property Tasks",
              description:
                "One-off requests — contractor meeting, errands, random jobs. No recurring commitment required.",
            },
            price: "85.00",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Mail & Trash Handling",
              description:
                "Mail collection and/or trash takeout and return while you're away from your 30A property.",
            },
            price: "35.00",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "35.00",
              priceCurrency: "USD",
              unitText: "day",
            },
          },
        ],
      },
      founder: {
        "@type": "Person",
        name: "Ryder Schilling",
        jobTitle: "Founder & Owner",
      },
      foundingDate: "2025-10",
      sameAs: [
        "https://www.facebook.com/CoastalHomeManagement30A",
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
        telephone: "+13094158793",
        contactType: "customer service",
        email: "coastalhomemanagement30a@gmail.com",
        areaServed: "US",
        availableLanguage: "English",
      },
      sameAs: [
        "https://www.facebook.com/CoastalHomeManagement30A",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
      </head>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
