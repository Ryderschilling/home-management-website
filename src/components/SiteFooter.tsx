import Link from "next/link";
import {
  siteData,
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
  ["/blog", "Journal"],
  ["/choosing-a-home-watch-company-30a", "How to Choose a Home Watch Company"],
  ["/privacy-policy", "Privacy Policy"],
];

const FIND_US: Array<[string, string]> = [
  [siteData.gbpUrl, "Google Reviews"],
  ["https://www.facebook.com/profile.php?id=61575773416368", "Facebook"],
  ["https://www.linkedin.com/company/113245630/", "LinkedIn"],
  ["https://nextdoor.com/pages/coastal-home-management-30a-inlet-beach-fl", "Nextdoor"],
  ["https://www.yelp.com/biz/coastal-home-management-30a-inlet-beach", "Yelp"],
  [
    "https://www.destinflorida.com/30a/services/home-watch-concierge/coastal-home-management-30a",
    "DestinFlorida.com",
  ],
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
              Naturewalk at Watersound
              <br />
              Inlet Beach &amp; Scenic 30A
              <br />
              Rosemary Beach · Alys Beach
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
              Insured Florida LLC, formed 2025
            </p>
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

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Coastal Home Management 30A. Owner-operated in Inlet
            Beach, Florida.
          </span>
          <div className="flex items-center gap-5">
            <a
              href="https://sourceatrade.com/contractors/coastal-home-management-30a-3"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--ch-teal-bright)]"
            >
              sourceatrade.com
            </a>
            <Link href="/admin/login" className="transition-colors hover:text-[var(--ch-teal-bright)]">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
