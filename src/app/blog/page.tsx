// src/app/blog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { allBlogPosts } from "@/data/blogPosts";

export const metadata: Metadata = {
  title: "Home Watch & Second Home Tips for 30A Homeowners",
  description:
    "Guides and answers for second-home owners in Watersound Origins, Naturewalk, and 30A. Hurricane prep, home watch pricing, and local property care advice.",
  alternates: {
    canonical: "https://coastalhomemngt30a.com/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="border-b border-gray-200 bg-[#f8f5ef]">
        <div className="mx-auto max-w-4xl px-6 pt-32 pb-16 md:pt-40 md:pb-20 text-center">
          <div className="text-[11px] uppercase tracking-[0.24em] text-gray-500">
            Coastal Home Management 30A
          </div>
          <h1 className="mt-5 text-4xl font-serif leading-tight md:text-6xl">
            Guides for 30A Homeowners
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-700 md:text-lg">
            Straight answers on home watch, second home care, and what to know
            as a homeowner in Watersound Origins, Naturewalk, and along scenic 30A.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl space-y-6">
          {allBlogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block border border-gray-200 bg-white p-7 md:p-8 transition hover:border-black"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
                {new Date(post.datePublished).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h2 className="mt-3 text-2xl font-serif">{post.title}</h2>
              <p className="mt-3 leading-7 text-gray-700">{post.metaDescription}</p>
              <span className="mt-4 inline-block text-xs uppercase tracking-[0.18em] border-b border-gray-300">
                Read more →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
