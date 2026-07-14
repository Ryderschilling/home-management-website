// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { allBlogPosts } from "@/data/blogPosts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://coastalhomemngt30a.com";
  const lastModified = new Date("2026-06-27");

  const blogUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...allBlogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified || post.datePublished),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/second-home-management-inlet-beach`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/home-check-services-30a`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/property-care-inlet-beach`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mail-package-handling-inlet-beach`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/concierge-services-inlet-beach`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/artificial-rock-installation-inlet-beach`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/second-home-management-watersound-origins`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vacation-home-care-30a`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...blogUrls,
  ];
}
