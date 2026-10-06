import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";
import { getGuidePage } from "@/data/guidePages";

const page = getGuidePage("property-managers-30a");
const url = `https://coastalhomemngt30a.com/${page.slug}`;

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: url },
  openGraph: { title: page.metaTitle, description: page.metaDescription, url, type: "article", images: ["/img.png"] },
};

export default function Page() {
  return <GuidePage page={page} />;
}
