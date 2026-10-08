// Live storm feeds for /hurricane-isaias-updates (added 10/8/26).
//
// Three public sources, all fetched server side and cached by Next for
// FEED_REVALIDATE seconds, so the page rebuilds itself every few minutes with
// no cron and no database:
//   1. NHC Atlantic RSS: the latest summary for every active storm, plus links
//      to the advisory, graphics and surge map.
//   2. NWS alerts API: every active alert for two points on 30A (Watersound
//      Origins and Grayton), de-duplicated.
//   3. Google News RSS: the newest headlines about the storm and our area.
// Every fetch has a timeout and fails soft to an empty list, so one dead feed
// never takes the page down. No library: the RSS is small and regular enough
// to read with plain string matching.

export const FEED_REVALIDATE = 300; // seconds

const UA = "coastalhomemngt30a.com storm page (coastalhomemanagement30a@gmail.com)";

// Points on 30A the NWS alert lookup checks. Alerts are zone based, so two
// points cover South Walton and the Bay County line.
const ALERT_POINTS = [
  { lat: 30.2967, lon: -85.9655 }, // Watersound Origins / Inlet Beach
  { lat: 30.3297, lon: -86.1647 }, // Grayton Beach
];

const NEWS_QUERY =
  '"Hurricane Isaias" (Walton OR 30A OR "Santa Rosa Beach" OR "Panama City Beach" OR "Inlet Beach" OR Destin OR Panhandle)';

async function getText(url: string, accept = "*/*"): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: accept },
      next: { revalidate: FEED_REVALIDATE },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
}

function items(xml: string): string[] {
  return xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
}

// ── NHC ──────────────────────────────────────────────────────────────────────

export type NhcLink = { title: string; url: string };
export type NhcStorm = {
  name: string;
  type: string;
  headline: string;
  summary: string;
  issued: string | null;
  summaryUrl: string;
  links: NhcLink[];
};

export async function getNhcStorms(): Promise<NhcStorm[]> {
  const xml = await getText("https://www.nhc.noaa.gov/index-at.xml", "application/rss+xml, text/xml");
  if (!xml) return [];
  const all = items(xml).map((b) => ({
    title: tag(b, "title"),
    url: tag(b, "link"),
    pubDate: tag(b, "pubDate"),
    description: tag(b, "description"),
    block: b,
  }));

  const storms: NhcStorm[] = [];
  for (const it of all.filter((i) => i.title.startsWith("Summary for"))) {
    const name = tag(it.block, "nhc:name") || it.title.replace(/^Summary for\s+/, "").replace(/\s*\(.*$/, "");
    const type = tag(it.block, "nhc:type");
    const desc = it.description.replace(/\s+/g, " ").trim();
    // NHC puts the headline in "...LIKE THIS..." blocks at the top of the summary.
    const heads = desc.match(/\.\.\.[^.][\s\S]*?\.\.\./g) ?? [];
    // NHC writes these in all caps; sentence case reads far better on a phone.
    const sentence = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();
    const headline = heads.map((h) => sentence(h.replace(/^\.\.\.|\.\.\.$/g, "").trim())).join(". ").replace(/\bisaias\b/gi, "Isaias");
    const summary = desc.replace(/\.\.\.[^.][\s\S]*?\.\.\./g, "").trim();
    const short = name.toLowerCase();
    const links = all
      .filter((i) => i !== it && i.title.toLowerCase().includes(short) && i.url)
      .slice(0, 8)
      .map((i) => ({ title: i.title, url: i.url }));
    const tallahassee = all.find((i) => i.title === "Local Statement for Tallahassee, FL");
    const mobile = all.find((i) => i.title.startsWith("Local Statement for Mobile"));
    for (const l of [tallahassee, mobile]) if (l?.url) links.push({ title: l.title, url: l.url });
    storms.push({
      name,
      type,
      headline,
      summary,
      issued: it.pubDate ? new Date(it.pubDate).toISOString() : null,
      summaryUrl: it.url,
      links,
    });
  }
  return storms;
}

// ── NWS alerts ───────────────────────────────────────────────────────────────

export type NwsAlert = {
  id: string;
  event: string;
  headline: string;
  severity: string;
  areas: string;
  sent: string | null;
  ends: string | null;
  description: string;
  instruction: string;
};

const SEVERITY_RANK: Record<string, number> = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };

type NwsFeature = {
  properties: {
    id: string;
    event: string;
    headline: string | null;
    severity: string;
    areaDesc: string;
    sent: string | null;
    ends: string | null;
    expires: string | null;
    description: string | null;
    instruction: string | null;
  };
};

export async function getNwsAlerts(): Promise<NwsAlert[] | null> {
  const seen = new Map<string, NwsAlert>();
  let anyOk = false;
  for (const p of ALERT_POINTS) {
    const body = await getText(`https://api.weather.gov/alerts/active?point=${p.lat},${p.lon}`, "application/geo+json");
    if (!body) continue;
    try {
      const json = JSON.parse(body) as { features?: NwsFeature[] };
      anyOk = true;
      for (const f of json.features ?? []) {
        const a = f.properties;
        if (seen.has(a.id)) continue;
        seen.set(a.id, {
          id: a.id,
          event: a.event,
          headline: a.headline ?? a.event,
          severity: a.severity,
          areas: a.areaDesc,
          sent: a.sent,
          // Only "ends" is the hazard end time. "expires" is just when NWS will
          // reissue the product, so showing it as "until" would mislead.
          ends: a.ends,
          description: (a.description ?? "").trim(),
          instruction: (a.instruction ?? "").trim(),
        });
      }
    } catch {
      /* bad JSON, treat as a dead feed */
    }
  }
  if (!anyOk) return null; // null = feed unreachable, [] = no active alerts
  // NWS keeps superseded copies active for a while (two Local Statements, say).
  // Keep the newest per event and area.
  const latest = new Map<string, NwsAlert>();
  for (const a of seen.values()) {
    const key = `${a.event}|${a.areas}`;
    const prev = latest.get(key);
    if (!prev || (a.sent ?? "") > (prev.sent ?? "")) latest.set(key, a);
  }
  return [...latest.values()].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 5) - (SEVERITY_RANK[b.severity] ?? 5) || (b.sent ?? "").localeCompare(a.sent ?? ""),
  );
}

// ── News ─────────────────────────────────────────────────────────────────────

export type NewsItem = { title: string; source: string; url: string; published: string | null };

export async function getNews(limit = 12): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(NEWS_QUERY)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await getText(url, "application/rss+xml, text/xml");
  if (!xml) return [];
  const out: NewsItem[] = [];
  const seenTitles = new Set<string>();
  for (const b of items(xml)) {
    const source = tag(b, "source");
    let title = tag(b, "title");
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const key = title.toLowerCase();
    if (!title || seenTitles.has(key)) continue;
    seenTitles.add(key);
    const pub = tag(b, "pubDate");
    out.push({ title, source, url: tag(b, "link"), published: pub ? new Date(pub).toISOString() : null });
  }
  return out
    .sort((a, b) => (b.published ?? "").localeCompare(a.published ?? ""))
    .slice(0, limit);
}
