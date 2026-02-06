"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Testimonial = {
  quote: string;
  name: string;
  meta?: string;
};

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = useMemo(
    () => [
      {
        quote:
          "Ryder has helped us with our home for years and has always been reliable, professional, and great to work with. He consistently does an excellent job and is someone we truly trust.",
        name: "Scott C.",
      },
      {
        quote:
          "Ryder is one of the most responsible and reliable young men I have worked with to date. He has helped me with my property for over two years — and he might even share a couple of his favorite fishing honey holes if you ask.",
        name: "Sandie L.",
      },
    ],
    []
  );

  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [x, setX] = useState(0);
  const [maxShift, setMaxShift] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile breakpoint
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setX(0); // ensure no translated position on mobile
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Measure how far we can slide (track overflow) - only relevant on desktop
  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const overflow = track.scrollWidth - viewport.clientWidth;
      setMaxShift(Math.max(0, overflow));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // In-view detector (only animate while visible)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => setIsInView(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.35 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Timed auto-drift (desktop only)
  useEffect(() => {
    if (!isInView) return;
    if (isMobile) return;
    if (maxShift <= 0) return;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;

    let raf = 0;
    let start = performance.now();

    const DURATION_MS = 14000; // drift across
    const HOLD_MS = 1200; // pause at end
    const RESET_MS = 600; // reset window

    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      const elapsed = now - start;

      if (elapsed <= DURATION_MS) {
        const p = elapsed / DURATION_MS;
        setX(-maxShift * easeInOut(p));
        raf = requestAnimationFrame(tick);
        return;
      }

      if (elapsed <= DURATION_MS + HOLD_MS) {
        setX(-maxShift);
        raf = requestAnimationFrame(tick);
        return;
      }

      if (elapsed <= DURATION_MS + HOLD_MS + RESET_MS) {
        setX(0);
        raf = requestAnimationFrame(tick);
        return;
      }

      start = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, isMobile, maxShift]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-black text-white px-4 md:px-6 py-16 md:py-24"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-6xl h-full flex flex-col justify-center">
        <div className="mb-10">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            Testimonials
          </h2>
          <div className="mt-6 h-px w-20 bg-white/20" />
        </div>

        {/* viewport */}
        <div
          ref={viewportRef}
          className="relative overflow-x-auto md:overflow-x-hidden"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          <div
            ref={trackRef}
            className="flex gap-10 will-change-transform"
            style={{
              transform: isMobile ? "none" : `translate3d(${x}px, 0, 0)`,
              transition: isMobile ? undefined : "transform 120ms linear",
            }}
          >
            {testimonials.map((t, i) => (
              <article
                key={i}
                className="min-w-[92%] sm:min-w-[70%] md:min-w-[60%] lg:min-w-[50%] px-2 text-center flex flex-col items-center"
              >
                <div className="text-[16px] sm:text-[20px] md:text-[28px] leading-[1.5] text-white/90">
                  <span className="text-white/50 mr-3">—</span>
                  <span className="italic">“{t.quote}”</span>
                </div>

<div className="mt-5 flex items-center justify-center gap-2 text-white/70 text-base">
  <span className="text-white/40">—</span>
  <span className="tracking-wide whitespace-nowrap">{t.name}</span>
  {t.meta ? <span className="text-white/40">· {t.meta}</span> : null}
</div>
              </article>
            ))}

            {/* small spacer at end */}
            <div className="min-w-[8%]" />
          </div>
        </div>
      </div>
    </section>
  );
}
