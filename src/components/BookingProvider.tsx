"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import BookingModal from "./BookingModal";

type BookingContextValue = {
  open: (source?: string) => void;
  close: () => void;
  isOpen: boolean;
};

const BookingContext = createContext<BookingContextValue | null>(null);

/**
 * Wraps the public site so any button anywhere can open the booking flow
 * with `useBooking().open("some-source")`. The source string is passed
 * through to the lead record so Ryder can see which section of the site
 * actually converts.
 */
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState("site");

  const open = useCallback((src = "site") => {
    setSource(src);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingModal open={isOpen} source={source} onClose={close} />
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used inside <BookingProvider>");
  }
  return ctx;
}

/**
 * Drop-in button that opens the booking flow. Keeps every CTA on the site
 * consistent instead of each page wiring its own onClick.
 */
export function BookButton({
  children = "Book a Free Walkthrough",
  source = "site",
  className = "ch-btn ch-btn--solid",
  magnet = true,
}: {
  children?: React.ReactNode;
  source?: string;
  className?: string;
  magnet?: boolean;
}) {
  const { open } = useBooking();

  const button = (
    <button type="button" className={className} onClick={() => open(source)}>
      {children}
    </button>
  );

  if (!magnet) return button;

  return (
    <span className="ch-magnet" data-magnet="0.28">
      {button}
    </span>
  );
}
