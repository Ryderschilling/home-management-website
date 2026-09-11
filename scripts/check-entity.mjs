// Build guard: keeps Google tied to the RIGHT business listing.
//
// Why this exists: on 9/10/26 Google AI Mode showed "Coastal Home Management 30A"
// with Coast Property Management's photo, 87 reviews, and listing. Our schema
// pointed sameAs at the review link (not a listing) and several pages declared
// a LocalBusiness with no shared @id, so Google had nothing solid to match.
//
// Rules (the build fails if any is broken):
//   1. Every LocalBusiness uses @id https://coastalhomemngt30a.com/#business
//   2. No other "#business" @id anywhere
//   3. sameAs / hasMap never use the g.page review link (use siteData.gbpMapsUrl)
//   4. No google.com/maps/place/<name> URLs (they resolve to nothing)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CANON = "https://coastalhomemngt30a.com/#business";
const errors = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) check(p);
  }
}

function lineOf(src, idx) {
  return src.slice(0, idx).split("\n").length;
}

function check(file) {
  const src = readFileSync(file, "utf8");
  let m;

  const lb = /"@type":\s*"LocalBusiness"/g;
  while ((m = lb.exec(src))) {
    const near = src.slice(m.index, m.index + 400);
    const ok =
      near.includes(`"@id": "${CANON}"`) || near.includes('"@id": `${SITE}/#business`');
    if (!ok) errors.push(`${file}:${lineOf(src, m.index)} LocalBusiness is missing "@id": "${CANON}"`);
  }

  const ids = /"@id":\s*"([^"]*#business)"/g;
  while ((m = ids.exec(src))) {
    if (m[1] !== CANON) errors.push(`${file}:${lineOf(src, m.index)} wrong business @id ${m[1]}`);
  }

  const same = /(sameAs|hasMap):\s*(\[[^\]]*\]|[^,\n]+)/g;
  while ((m = same.exec(src))) {
    if (/g\.page\/r\/|gbpUrl\b/.test(m[2]))
      errors.push(`${file}:${lineOf(src, m.index)} ${m[1]} uses the review link, use siteData.gbpMapsUrl`);
  }

  const place = /google\.com\/maps\/place\//g;
  while ((m = place.exec(src))) {
    errors.push(`${file}:${lineOf(src, m.index)} google.com/maps/place URL, use siteData.gbpMapsUrl`);
  }
}

walk("src");

if (errors.length) {
  console.error("\nGoogle entity check FAILED:\n" + errors.map((e) => "  " + e).join("\n") + "\n");
  process.exit(1);
}
console.log("Google entity check passed");
