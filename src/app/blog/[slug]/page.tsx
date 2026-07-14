// src/app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts } from "@/data/blogPosts";
import BlogPostLayout from "@/components/BlogPostLayout";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: {
      canonical: `https://coastalhomemngt30a.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `https://coastalhomemngt30a.com/blog/${post.slug}`,
      type: "article",
      publishedTime: post.datePublished,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return <BlogPostLayout post={post} />;
}
