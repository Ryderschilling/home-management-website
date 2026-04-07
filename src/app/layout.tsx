// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { PostHogProvider } from "@/providers/PostHogProvider";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Coastal Home Management 30A",
    template: "%s | Coastal Home Management 30A",
  },
  description:
    "Premium second home care, concierge support, and property services in Inlet Beach and along 30A.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
