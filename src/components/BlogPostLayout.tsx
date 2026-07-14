import Link from "next/link";
import { siteData } from "@/data/siteData";
import type { BlogPost } from "@/data/blogPosts";
import ServiceLeadForm from "@/components/ServiceLeadForm";

export default function BlogPostLayout({ post }: { post: BlogPost }) {
  // Article schema — tells Google/AI engines this is timely, authored content.
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    author: {
      "@type": "Person",
      name: "Ryder Schilling",
      jobTitle: "Founder & Owner",
    },
    publisher: {
      "@type": "Organization",
      name: siteData.businessName,
      logo: {
        "@type": "ImageObject",
        url: "https://coastalhomemngt30a.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://coastalhomemngt30a.com/blog/${post.slug}`,
    },
  };

  // FAQPage schema — highest-leverage tag for AI citation.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-[#f8f5ef]">
        <div className="mx-auto max-w-3xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
          <Link
            href="/blog"
            className="text-[11px] uppercase tracking-[0.24em] text-gray-500 hover:text-black transition"
          >
            ← Back to the blog
          </Link>
          <h1 className="mt-5 text-3xl font-serif leading-tight md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">
            {new Date(post.datePublished).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </section>

      {/* Direct answer — front-loaded for GEO, styled as a callout */}
      <section className="px-6 pt-14 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <div className="border-l-2 border-black bg-[#faf8f3] p-6 md:p-8">
            <p className="text-lg leading-8 text-gray-900 md:text-xl">
              {post.directAnswer}
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-14 md:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          {post.body.map((section, i) => (
            <div key={section.heading || i}>
              {section.heading && (
                <h2 className="text-2xl font-serif md:text-3xl">{section.heading}</h2>
              )}
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="leading-7 text-gray-700">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ & CTA */}
      <section className="border-t border-gray-200 bg-[#faf8f3] px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-serif md:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-6">
            {post.faqs.map((faq) => (
              <div key={faq.q} className="border border-gray-200 bg-white p-7 md:p-8">
                <h3 className="text-lg font-medium">{faq.q}</h3>
                <p className="mt-3 leading-7 text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <ServiceLeadForm />
          </div>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </main>
  );
}
