import type { Metadata } from "next";
import RankingPage from "@/components/RankingPage";
import { getRanking } from "@/data/rankings";

const data = getRanking("best-second-home-management-30a-october-2026");
const url = `https://coastalhomemngt30a.com/${data.slug}`;

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical: url },
  openGraph: { title: data.metaTitle, description: data.metaDescription, url, type: "article", images: ["/img.png"] },
};

export default function Page() {
  return <RankingPage data={data} />;
}
