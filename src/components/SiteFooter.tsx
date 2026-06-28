import Link from "next/link";
import { siteData } from "@/data/siteData";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Services</div>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>
                <Link href="/second-home-management-inlet-beach" className="transition hover:text-black">
                  Second Home Management
                </Link>
              </li>
              <li>
                <Link href="/concierge-services-inlet-beach" className="transition hover:text-black">
                  Concierge Services
                </Link>
              </li>
              <li>
                <Link href="/mail-package-handling-inlet-beach" className="transition hover:text-black">
                  Mail &amp; Package Handling
                </Link>
              </li>
              <li>
                <Link href="/home-check-services-30a" className="transition hover:text-black">
                  Home Checks
                </Link>
              </li>
              <li>
                <Link href="/second-home-management-watersound-origins" className="transition hover:text-black">
                  Watersound Origins
                </Link>
              </li>
              <li>
                <Link href="/vacation-home-care-30a" className="transition hover:text-black">
                  Vacation Home Care
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition hover:text-black font-medium">
                  Pricing &amp; Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Company</div>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>
                <Link href="/about" className="transition hover:text-black">
                  About CHM
                </Link>
              </li>
              <li>Local &amp; Insured</li>
              <li>Serving Inlet Beach &amp; 30A</li>
              <li>Reliable, high-trust service</li>
            </ul>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Contact</div>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div>Inlet Beach, Florida</div>
              <a
                href={`mailto:${siteData.contactEmail}`}
                className="inline-block transition hover:text-black"
              >
                {siteData.contactEmail}
              </a>
              <div>
                <a href="/admin/login" className="text-gray-500 transition hover:text-black">
                  Admin
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Follow</div>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61575773416368"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-black"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/113245630/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-black"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href={siteData.gbpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-black"
                >
                  Google Reviews
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Coastal Home Management 30A. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="text-gray-400 hover:text-gray-600 transition-colors">
              Privacy Policy
            </Link>
            <a
              href="https://sourceatrade.com/contractors/coastal-home-management-30a-3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              sourceatrade.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
