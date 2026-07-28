"use client";

import { useEffect, useRef } from "react";
import { useBooking } from "./BookingProvider";

/**
 * The process section, rebuilt as a journey.
 *
 * A teal line draws itself as you scroll, weaving from step to step and
 * waking each card as it arrives, then loops once and points at the CTA.
 * The line has a destination, that is the whole reason it works. A line
 * that just decorates is noise; a line that escorts you to a button is
 * navigation.
 *
 * Everything lives in one abstract coordinate space (SPACE below). Cards
 * are positioned as percentages of it and the SVG stretches over it with
 * preserveAspectRatio="none", so the line lands on the same spots at every
 * viewport width without a single media query.
 *
 * Desktop only. At 375px a weaving line has nowhere to go, so mobile gets
 * a clean stacked list with the same content and the same CTA.
 */

const SPACE = { w: 1440, h: 3320 };

type Step = {
  n: string;
  title: string;
  body: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Tell me about your property",
    body: "Call or book a walkthrough. We talk through your home, your schedule, and what level of care actually makes sense. No sales call, no pressure. Most owners are set up within a few days.",
    x: 110,
    y: 250,
    w: 600,
    h: 320,
  },
  {
    n: "02",
    title: "I document everything, once",
    body: "Key access, gate codes, HVAC preferences, emergency contacts, the quirks only an owner knows. It gets logged so nothing is ever missed, and so you never have to explain it twice.",
    x: 730,
    y: 990,
    w: 600,
    h: 320,
  },
  {
    n: "03",
    title: "Visits begin on your schedule",
    body: "Weekly or bi-weekly, inside and out. HVAC, plumbing, irrigation, entry points, exterior condition, any sign of water. Storms trigger an unscheduled visit at no extra charge on Elite.",
    x: 110,
    y: 1730,
    w: 600,
    h: 320,
  },
  {
    n: "04",
    title: "You get a report every single time",
    body: "Photos and a written summary by text or email after every visit. If something needs attention I handle it or bring in the right contractor. You stay in the loop without being here.",
    x: 730,
    y: 2470,
    w: 600,
    h: 320,
  },
];

/* ── Path authoring ─────────────────────────────────────────────────────
   Hand-written `d` strings are unmaintainable. Define journey points and
   convert Catmull-Rom to cubic bezier.

   One continuous sweep, no loops. The earlier version had decorative
   circular flourishes and they read as a rendering glitch rather than a
   flourish, which is the worst outcome for a signature effect: anything a
   visitor might mistake for broken costs more trust than the effect wins.
   Removing them also shortens the path, so the line no longer races ahead
   of the scroll.                                                        */

const JOURNEY: Array<[number, number]> = [
  [980, -60],
  [830, 70],
  [660, 210],
  [520, 380],   // dives behind card 01
  [468, 570],
  [520, 760],
  [660, 890],
  [840, 1000],
  [1000, 1130], // dives behind card 02
  [1078, 1310],
  [1040, 1500],
  [900, 1630],
  [720, 1720],
  [540, 1810],
  [410, 1960],  // dives behind card 03
  [386, 2150],
  [460, 2320],
  [610, 2450],
  [790, 2560],  // dives behind card 04
  [950, 2680],
  [1036, 2820],
  [980, 2960],
  [850, 3020],
  [724, 3040],  // lands above the CTA block, never through it
];

function catmullRomPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const PATH_D = catmullRomPath(JOURNEY);

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

export default function ScrollJourney() {
  const { open } = useBooking();
  const sectionRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const tipRef = useRef<SVGGElement>(null);
  // Card lighting is driven by writing data-lit straight onto the nodes
  // rather than through React state. The scroll loop runs every frame, so
  // routing that through setState would re-render the whole section 60
  // times a second for an attribute change CSS can handle on its own.
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  const litRef = useRef(-1);

  const setLit = (upTo: number) => {
    cardRefs.current.forEach((el, i) => {
      if (el) el.dataset.lit = i <= upTo ? "true" : "false";
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    const path = pathRef.current;
    if (!section || !path) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      setLit(STEPS.length);
      if (tipRef.current) tipRef.current.style.opacity = "0";
      return;
    }

    const total = path.getTotalLength();
    let target = 0;
    let current = 0;
    let raf = 0;

    const measure = () => {
      const r = section.getBoundingClientRect();
      // Start drawing only once the section is past the middle of the
      // viewport, and spread the draw across its full height. The line
      // should feel like it is being pulled along by the scroll, not
      // sprinting ahead of it.
      const travelled = window.innerHeight * 0.55 - r.top;
      target = Math.max(0, Math.min(1, travelled / (r.height * 1.02)));
    };

    const loop = () => {
      // Lerp toward the scroll target. Gentle enough that the line settles
      // rather than snaps, without lagging far enough behind to feel broken.
      current += (target - current) * 0.075;

      path.style.strokeDashoffset = String(1 - current);

      if (tipRef.current) {
        const p = path.getPointAtLength(total * current);
        tipRef.current.setAttribute("transform", `translate(${p.x} ${p.y})`);
        tipRef.current.style.opacity = current > 0.01 && current < 0.995 ? "1" : "0";
      }

      // Light each card as the line reaches its vertical position.
      let next = -1;
      STEPS.forEach((s, i) => {
        if (current >= (s.y + s.h * 0.45) / SPACE.h) next = i;
      });
      if (next !== litRef.current) {
        litRef.current = next;
        setLit(next);
      }

      raf = requestAnimationFrame(loop);
    };

    measure();
    current = target;
    loop();

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section
      id="how-it-works"
      className="ch-deep-band ch-grid-tex relative overflow-hidden px-4 py-24 text-white md:px-8 md:py-32"
    >
      <div className="relative mx-auto max-w-[1240px]">
        <div className="mb-16 max-w-2xl md:mb-24">
          <p className="ch-eyebrow ch-eyebrow--light">02 · The Process</p>
          <h2 className="ch-display ch-display--light">
            How second home management actually works on 30A.
          </h2>
          <p className="ch-lede ch-lede--light mt-6">
            Four steps, one person, no call center in between. Follow the line.
          </p>
        </div>

        {/* ── Desktop: the drawn journey ─────────────────────────── */}
        <div
          ref={sectionRef}
          className="relative hidden md:block"
          style={{ aspectRatio: `${SPACE.w} / ${SPACE.h}` }}
        >
          <svg
            className="absolute inset-0 z-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${SPACE.w} ${SPACE.h}`}
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            {/* Ghost of the full route, so the journey is sensed before
                it's scrolled. */}
            <path
              d={PATH_D}
              className="ch-journey__ghost"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* The drawn line. pathLength="1" normalises the dash units so
                the dash math is viewport-independent under the stretched
                preserveAspectRatio. */}
            <path
              ref={pathRef}
              d={PATH_D}
              className="ch-journey__line"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              vectorEffect="non-scaling-stroke"
            />
            <g ref={tipRef} style={{ opacity: 0, transition: "opacity 400ms var(--ch-ease)" }}>
              <circle r="18" fill="var(--ch-teal-bright)" opacity="0.16" />
              <circle r="5.5" fill="var(--ch-teal-bright)" />
            </g>
          </svg>

          {STEPS.map((s, i) => (
            <article
              key={s.n}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="ch-journey__card absolute z-10"
              data-lit="false"
              style={{
                left: pct(s.x, SPACE.w),
                top: pct(s.y, SPACE.h),
                width: pct(s.w, SPACE.w),
              }}
            >
              <div className="border border-white/10 bg-[rgba(10,10,10,0.72)] p-8 backdrop-blur-md lg:p-10">
                <div className="mb-5 flex items-center gap-4">
                  <span className="ch-numeral ch-numeral--light !w-auto !text-[54px]">{s.n}</span>
                  <span className="h-px flex-1 bg-white/12" />
                </div>
                <h3 className="ch-h3 !text-white">{s.title}</h3>
                <p className="ch-lede ch-lede--light mt-4 !text-[15px]">{s.body}</p>
              </div>
            </article>
          ))}

          {/* The line lands just above this block, never through it. */}
          <div
            className="absolute left-1/2 z-10 -translate-x-1/2 text-center"
            style={{ top: pct(3090, SPACE.h), width: pct(720, SPACE.w) }}
          >
            <p className="ch-label !text-[var(--ch-teal-bright)]">And that&apos;s it</p>
            <p className="mt-4 text-[26px] leading-tight tracking-[-0.02em] text-white" style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 108, 'wght' 620" }}>
              The first walkthrough is free.
            </p>
            <span className="ch-magnet mt-7 inline-block" data-magnet="0.3">
              <button type="button" className="ch-btn ch-btn--light" onClick={() => open("journey")}>
                Book a Free Walkthrough
              </button>
            </span>
          </div>
        </div>

        {/* ── Mobile: same content, stacked ──────────────────────── */}
        <ol className="space-y-10 md:hidden">
          {STEPS.map((s) => (
            <li key={s.n} className="border-l border-white/12 pl-6">
              <span className="ch-numeral ch-numeral--light !w-auto !text-[40px]">{s.n}</span>
              <h3 className="ch-h3 !text-white mt-3">{s.title}</h3>
              <p className="ch-lede ch-lede--light mt-3 !text-[14px]">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center md:hidden">
          <button type="button" className="ch-btn ch-btn--light w-full" onClick={() => open("journey-mobile")}>
            Book a Free Walkthrough
          </button>
        </div>
      </div>
    </section>
  );
}
