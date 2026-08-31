import type { Metadata } from "next";
import TownLandingPage from "@/components/TownLandingPage";
import { townPages } from "@/data/townPages";

const town = townPages["home-watch-watersound-beach"];

export const metadata: Metadata = {
  title: town.metaTitle,
  description: town.metaDescription,
  keywords: town.keywords,
  alternates: { canonical: `https://coastalhomemngt30a.com/${town.slug}` },
  openGraph: {
    title: town.metaTitle,
    description: town.metaDescription,
    url: `https://coastalhomemngt30a.com/${town.slug}`,
    type: "website",
    images: ["/img.png"],
  },
};

export default function Page() {
  return <TownLandingPage town={town} />;
}
