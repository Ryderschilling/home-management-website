"use client";

import { useEffect, useState } from "react";
import { contactChannels, primaryPhone, primaryPhoneDisplay } from "@/data/siteData";
import { useBooking } from "./BookingProvider";

/**
 * Persistent call + book bar. Slides up once the visitor is past the hero
 * and hides again near the footer, where the real CTA already lives (two
 * competing calls to action in the same viewport just splits attention).
 */
export default function StickyActionBar() {
  const { open, isOpen } = useBooking();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const doc = document.documentElement;
      const nearBottom = y + window.innerHeight > doc.scrollHeight - 640;
      setShow(y > window.innerHeight * 0.85 && !nearBottom);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const alwaysOn = contactChannels.answeringService.enabled;

  return (
    <div className="ch-actionbar" data-show={show && !isOpen ? "true" : "false"} aria-hidden={!show}>
      <a
        href={`tel:${primaryPhone()}`}
        className="ch-actionbar__btn"
        tabIndex={show ? 0 : -1}
        aria-label={`Call ${primaryPhoneDisplay()}`}
      >
        {alwaysOn ? <span className="ch-live" aria-hidden="true" /> : null}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M14.5 11.3v2a1.3 1.3 0 0 1-1.5 1.3 13 13 0 0 1-5.7-2 12.8 12.8 0 0 1-4-4 13 13 0 0 1-2-5.8A1.3 1.3 0 0 1 2.6 1.3h2a1.3 1.3 0 0 1 1.3 1.2c.1.6.2 1.3.5 1.9a1.3 1.3 0 0 1-.3 1.4l-.8.9a10.7 10.7 0 0 0 4 4l.9-.9a1.3 1.3 0 0 1 1.4-.3c.6.3 1.2.4 1.9.5a1.3 1.3 0 0 1 1.1 1.3Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        <span>{alwaysOn ? "Call 24/7" : "Call"}</span>
        <span className="hidden sm:inline">{alwaysOn ? "" : "Ryder"}</span>
      </a>

      <button
        type="button"
        className="ch-actionbar__btn ch-actionbar__btn--teal"
        onClick={() => open("sticky-bar")}
        tabIndex={show ? 0 : -1}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="2.8" width="13" height="11.7" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 6.3h13M5.2 1.5v2.6M10.8 1.5v2.6" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Book a Walkthrough
      </button>
    </div>
  );
}
