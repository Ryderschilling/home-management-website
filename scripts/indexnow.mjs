/**
 * IndexNow auto-ping, runs as `postbuild` after every production build.
 * ─────────────────────────────────────────────────────────────────────────────
 * IndexNow is a shared protocol: one POST notifies Bing, Yandex, Seznam and
 * Naver at once that URLs changed. Bing is the one that matters here, because
 * ChatGPT and Copilot search read Bing's index, not Google's. Without this,
 * Bing rediscovers changes on its own crawl schedule, which can be weeks.
 * Google does not participate in IndexNow, it uses the sitemap and Search
 * Console instead.
 *
 * The URL list is parsed straight out of the sitemap Next just prerendered, so
 * it can never drift from src/app/sitemap.ts. If that file cannot be found the
 * script falls back to fetching the live sitemap.
 *
 * The key must be reachable at https://<host>/<key>.txt and contain exactly the
 * key. That file is public/6dafbf031c2c24f480568204ecb5aaa5.txt. If the key
 * ever changes, change it in BOTH places.
 *
 * This must never break a deploy. Every failure path logs and exits 0.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const HOST = "coastalhomemngt30a.com";
const KEY = "6dafbf031c2c24f480568204ecb5aaa5";
const ORIGIN = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

function log(msg) {
  console.log(`[indexnow] ${msg}`);
}

/** Walk .next looking for the prerendered sitemap body Next writes at build. */
async function findSitemapBody(dir, depth = 0) {
  if (depth > 6) return null;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isFile() && entry.name === "sitemap.xml.body") return full;
    if (entry.isDirectory() && entry.name !== "node_modules") {
      const found = await findSitemapBody(full, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function parseLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(ORIGIN));
}

async function collectUrls() {
  const local = await findSitemapBody(path.join(process.cwd(), ".next"));
  if (local) {
    const urls = parseLocs(await readFile(local, "utf8"));
    if (urls.length) {
      log(`read ${urls.length} urls from ${path.relative(process.cwd(), local)}`);
      return urls;
    }
  }
  log("no prerendered sitemap found, falling back to the live one");
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`live sitemap returned ${res.status}`);
  const urls = parseLocs(await res.text());
  log(`read ${urls.length} urls from the live sitemap`);
  return urls;
}

async function main() {
  // Preview and local builds must not tell search engines anything.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    log(`skipped, VERCEL_ENV is "${process.env.VERCEL_ENV}"`);
    return;
  }
  if (!process.env.VERCEL_ENV && !process.env.INDEXNOW_FORCE) {
    log("skipped, not a Vercel build (set INDEXNOW_FORCE=1 to run anyway)");
    return;
  }

  const urlList = await collectUrls();
  if (!urlList.length) {
    log("no urls to submit, nothing to do");
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${ORIGIN}/${KEY}.txt`,
      urlList,
    }),
  });

  // 200 and 202 both mean accepted. 422 usually means the key file is
  // unreachable, which is worth shouting about but still not worth failing on.
  if (res.status === 200 || res.status === 202) {
    log(`submitted ${urlList.length} urls, HTTP ${res.status}`);
  } else {
    log(`WARNING: endpoint returned HTTP ${res.status}. ${await res.text()}`);
  }
}

main().catch((err) => {
  log(`WARNING: ${err.message}. Deploy continues, nothing was submitted.`);
});
