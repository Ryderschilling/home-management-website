// WebPage + BreadcrumbList JSON-LD for pages that do not get it from a shared
// template (TownLandingPage, ServiceLandingPage, GuidePage and RankingPage
// already print their own BreadcrumbList; do not add this to those).
// The WebPage is tied to the canonical #website and #business nodes from
// layout.tsx. Never invent a page-specific business @id (see CLAUDE.md).
// Added 10/6/26 from the AI Syndicate fix list. Created by AISyndicate.com
const SITE = "https://coastalhomemngt30a.com";

type Crumb = { name: string; path: string };

export default function PageSchema({
  path,
  name,
  description,
  crumbs,
}: {
  /** "/pricing", or "/" for the homepage */
  path: string;
  name: string;
  description?: string;
  /** Middle crumbs between Home and this page, e.g. [{ name: "Blog", path: "/blog" }] */
  crumbs?: Crumb[];
}) {
  const url = path === "/" ? SITE : `${SITE}${path}`;
  const trail: Crumb[] = [{ name: "Home", path: "/" }, ...(crumbs ?? [])];
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name,
      ...(description ? { description } : {}),
      inLanguage: "en-US",
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#business` },
      publisher: { "@id": `${SITE}/#business` },
      ...(path === "/" ? {} : { breadcrumb: { "@id": `${url}#breadcrumb` } }),
    },
  ];
  if (path !== "/") {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [...trail, { name, path }].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.path === "/" ? SITE : `${SITE}${c.path}`,
      })),
    });
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
