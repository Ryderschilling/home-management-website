import Link from "next/link";
import { siteData } from "@/data/siteData";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(15,23,42,0.08)] bg-[#edf3f9] text-[#334155]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#93a3b5]">Services</div>
            <ul className="mt-4 space-y-3 text-sm text-[#475569]">
              <li>
                <Link href="/second-home-management-inlet-beach" className="transition hover:text-[#1d4ed8]">
                  Second Home Management
                </Link>
              </li>
              <li>
                <Link href="/concierge-services-inlet-beach" className="transition hover:text-[#1d4ed8]">
                  Concierge Services
                </Link>
              </li>
              <li>
                <Link href="/mail-package-handling-inlet-beach" className="transition hover:text-[#1d4ed8]">
                  Mail &amp; Package Handling
                </Link>
              </li>
              <li>
                <Link href="/home-check-services-30a" className="transition hover:text-[#1d4ed8]">
                  Home Checks
                </Link>
              </li>
              <li>
                <Link href="/second-home-management-watersound-origins" className="transition hover:text-[#1d4ed8]">
                  Watersound Origins
                </Link>
              </li>
              <li>
                <Link href="/vacation-home-care-30a" className="transition hover:text-[#1d4ed8]">
                  Vacation Home Care
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition hover:text-[#1d4ed8] font-medium">
                  Pricing &amp; Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#93a3b5]">Company</div>
            <ul className="mt-4 space-y-3 text-sm text-[#475569]">
              <li>
                <Link href="/about" className="transition hover:text-[#1d4ed8]">
                  About CHM
                </Link>
              </li>
              <li>Local &amp; Insured</li>
              <li>Serving Inlet Beach &amp; 30A</li>
              <li>Reliable, high-trust service</li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#93a3b5]">Contact</div>
            <div className="mt-4 space-y-3 text-sm text-[#475569]">
              <div>Inlet Beach, Florida</div>
              <a
                href={`mailto:${siteData.contactEmail}`}
                className="inline-block transition hover:text-[#1d4ed8]"
              >
                {siteData.contactEmail}
              </a>
              <div>
                <a href="/admin/login" className="text-[#93a3b5] transition hover:text-[#1d4ed8]">
                  Admin
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[#93a3b5]">Follow</div>
            <ul className="mt-4 space-y-3 text-sm text-[#475569]">
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61575773416368"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#1d4ed8]"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/113245630/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#1d4ed8]"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={siteData.gbpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#1d4ed8]"
                >
                  Google Reviews
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[rgba(15,23,42,0.08)] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#93a3b5]">
          <span>© {new Date().getFullYear()} Coastal Home Management 30A. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-[#93a3b5] hover:text-[#1d4ed8] transition-colors">
              Privacy Policy
            </Link>
            <a
              href="https://sourceatrade.com/contractors/coastal-home-management-30a-3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#93a3b5] hover:text-[#1d4ed8] transition-colors"
            >
              sourceatrade.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
