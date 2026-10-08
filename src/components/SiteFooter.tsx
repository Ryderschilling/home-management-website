import Link from "next/link";
import LegalDisclaimer from "./LegalDisclaimer";
import BhwcBadge from "./BhwcBadge";
import { latestRanking } from "@/data/rankings";
import {
  siteData,
  businessContact,
  trustStats,
  contactChannels,
  primaryPhone,
  primaryPhoneDisplay,
} from "@/data/siteData";

const SERVICES: Array<[string, string]> = [
  ["/second-home-management-inlet-beach", "Second Home Management"],
  ["/home-watch", "Home Watch"],
  ["/concierge-services-inlet-beach", "Concierge Services"],
  ["/mail-package-handling-inlet-beach", "Mail & Package Handling"],
  ["/home-check-services-30a", "Home Check Services"],
  ["/claim-protection", "Claim Protection"],
  ["/artificial-rock-installation-inlet-beach", "Artificial Rock Install"],
  ["/pricing", "Pricing & Plans"],
];

const AREAS: Array<[string, string]> = [
  ["/home-watch-watersound-origins", "Home Watch · Watersound Origins"],
  ["/second-home-management-watersound-origins", "Second Homes · Watersound Origins"],
  ["/home-watch-naturewalk", "Home Watch · Naturewalk"],
  ["/home-watch-inlet-beach", "Home Watch · Inlet Beach"],
  ["/property-care-inlet-beach", "Property Care · Inlet Beach"],
  ["/vacation-home-care-30a", "Vacation Home Care · 30A"],
];

const COMPANY: Array<[string, string]> = [
  ["/about", "About Ryder"],
  ["/service-areas", "Service Areas"],
  ["/storm-check", "Storm Check"],
  ["/hurricane-isaias-updates", "Hurricane Isaias Updates"],
  ["/storm-prep-30a", "Storm Prep for 30A"],
  ["/who-to-call-storm-prep-30a", "Who to Call Before a Storm"],
  ["/blog", "Journal"],
  [`/${latestRanking.slug}`, `Best on 30A: ${latestRanking.month}`],
  ["/choosing-a-home-watch-company-30a", "How to Choose a Home Watch Company"],
  ["/home-watch-vs-property-management-30a", "Home Watch vs Property Management"],
  ["/property-managers-30a", "Property Managers on 30A"],
  ["/closing-your-30a-home-checklist", "Closing Up Your 30A Home"],
  ["/ac-humidity-settings-30a-second-home", "AC & Humidity Settings"],
  ["/storm-shutters-30a", "Storm Shutters While You're Away"],
  ["/privacy-policy", "Privacy Policy"],
];

const FIND_US: Array<[string, string]> = [
  [siteData.gbpUrl, "Google Reviews"],
  [businessContact.appleMapsUrl, "Apple Maps"],
  [businessContact.bingMapsUrl, "Bing Maps"],
  ["https://www.facebook.com/profile.php?id=61575773416368", "Facebook"],
  ["https://www.linkedin.com/company/coastal-home-management-30a/", "LinkedIn"],
  ["https://nextdoor.com/pages/coastal-home-management-30a-inlet-beach-fl", "Nextdoor"],
  ["https://www.yelp.com/biz/coastal-home-management-30a-inlet-beach", "Yelp"],
  [
    "https://www.destinflorida.com/30a/services/home-watch-concierge/coastal-home-management-30a",
    "DestinFlorida.com",
  ],
  [businessContact.bhwcUrl, "BestHomeWatchCompanies.com"],
];

function Col({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <p className="ch-label !text-white/45">{title}</p>
      <ul className="mt-5 space-y-3">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-[13.5px] leading-snug text-white/62 transition-colors duration-300 hover:text-[var(--ch-teal-bright)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const live = contactChannels.answeringService.enabled;

  return (
    <footer className="ch-deep-band relative overflow-hidden text-white">
      {/* Oversized wordmark. Costs nothing, reads expensive. */}
      <div className="pointer-events-none select-none overflow-hidden border-b border-white/8 px-4 pt-16 md:px-8">
        <p className="ch-mega ch-mega--outline mx-auto max-w-[1240px] !text-[clamp(40px,10.5vw,168px)] !leading-[0.86]">
          Coastal 30A
        </p>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-20">
        {/* Contact strip */}
        <div className="mb-16 grid gap-10 border-b border-white/10 pb-14 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="ch-label !text-white/45">Get in touch</p>
            <a
              href={`tel:${primaryPhone()}`}
              className="mt-4 flex items-center gap-3 text-[26px] leading-none tracking-[-0.02em] text-white transition-colors hover:text-[var(--ch-teal-bright)] md:text-[32px]"
              style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 108, 'wght' 640" }}
            >
              {live && <span className="ch-live" aria-hidden="true" />}
              {primaryPhoneDisplay()}
            </a>
            <a
              href={`mailto:${siteData.contactEmail}`}
              className="mt-3 inline-block text-[14px] text-white/62 transition-colors hover:text-[var(--ch-teal-bright)]"
            >
              {siteData.contactEmail}
            </a>
            {live && (
              <p className="mt-3 text-[12.5px] text-white/45">Answered 24 hours a day, 7 days a week.</p>
            )}
          </div>

          <div>
            <p className="ch-label !text-white/45">Service area</p>
            <p className="mt-4 text-[14px] leading-[1.8] text-white/62">
              Watersound Origins
              <br />
              Alys Beach
              <br />
              Rosemary Beach
              <br />
              Scenic 30A
            </p>
          </div>

          <div>
            <p className="ch-label !text-white/45">The record</p>
            <p className="mt-4 text-[14px] leading-[1.8] text-white/62">
              {trustStats.propertiesManaged} in property managed
              <br />
              {trustStats.activeHomes} active client homes
              <br />
              {trustStats.ratingValue} on Google ({trustStats.reviewCount} reviews)
              <br />
              Verified on Apple Maps
              <br />
              Insured Florida LLC, formed 2025
            </p>
            <BhwcBadge variant="dark" className="mt-5" />
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <Col title="Services" links={SERVICES} />
          <Col title="Where we work" links={AREAS} />
          <Col title="Company" links={COMPANY} />
          <div>
            <p className="ch-label !text-white/45">Find us</p>
            <ul className="mt-5 space-y-3">
              {FIND_US.map(([href, label]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13.5px] leading-snug text-white/62 transition-colors duration-300 hover:text-[var(--ch-teal-bright)]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal. Read src/data/protection.ts before touching insurance copy. */}
        <div className="mt-14 max-w-[860px] border-t border-white/10 pt-7">
          <LegalDisclaimer variant="dark" />
        </div>

        <div className="mt-8 flex flex-col gap-8 border-t border-white/10 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-[12px] text-white/40">
            <span>
              © {new Date().getFullYear()} Coastal Home Management 30A. Owner-operated in Inlet
              Beach, Florida.
            </span>
            <a
              href="https://sourceatrade.com/contractors/coastal-home-management-30a-3"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block transition-colors hover:text-[var(--ch-teal-bright)]"
            >
              sourceatrade.com
            </a>
          </div>

          {/* Site credit. Ryder built it (the focus), AI Syndicate is the GEO platform. */}
          <div className="sm:text-right">
            <a
              href="https://ryderschilling.com"
              target="_blank"
              rel="noopener"
              title="Website designed and built by Ryder Schilling"
              className="group inline-flex items-baseline gap-2.5 text-white"
            >
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/45 transition-colors group-hover:text-white/70">
                Built by
              </span>
              <span
                className="text-[22px] leading-none tracking-[-0.02em] transition-colors group-hover:text-[var(--ch-teal-bright)] md:text-[26px]"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 680" }}
              >
                Ryder Schilling
              </span>
              <span
                aria-hidden="true"
                className="text-[16px] text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--ch-teal-bright)]"
              >
                ↗
              </span>
            </a>
            <p className="mt-2.5 text-[11.5px] text-white/40">
              Powered by{" "}
              <a
                href="https://www.aisyndicate.com"
                target="_blank"
                rel="noopener"
                title="AI Syndicate, the GEO platform this site is optimized on"
                className="text-white/62 underline-offset-4 transition-colors hover:text-[var(--ch-teal-bright)] hover:underline"
              >
                AI Syndicate
              </a>
              <span className="text-white/30"> · GEO optimized for AI search</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
