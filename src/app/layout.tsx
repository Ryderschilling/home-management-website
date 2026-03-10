import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coastal Home Management 30A | Second Home Care in Inlet Beach",
  description:
    "Trusted second home management in Inlet Beach, Florida. Weekly home check-ins, plant care, mail collection, filter changes, and concierge support for homeowners.",
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Coastal Home Management 30A | Second Home Care in Inlet Beach",
    description:
      "Trusted second home management in Inlet Beach, Florida. Weekly home check-ins, plant care, mail collection, filter changes, and concierge support for homeowners.",
    url: "https://www.coastalhomemngt30a.com",
    siteName: "Coastal Home Management 30A",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Coastal Home Management 30A logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Coastal Home Management 30A | Second Home Care in Inlet Beach",
    description:
      "Trusted second home management in Inlet Beach, Florida.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}