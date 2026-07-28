"use client";

import { useEffect } from "react";

/**
 * FadeInObserver, the site's entire motion engine.
 *
 * Deliberately dependency-free. No GSAP, no Lenis, no framer-motion.
 * This site earns its living in Google and AI search, so every kilobyte
 * of JS is a direct tax on the thing that actually makes money. All the
 * animation lives in CSS (see globals.css); this file only toggles
 * classes and sets inline transforms.
 *
 * Three jobs:
 *   1. Scroll reveals, adds `.fade-in` + `.is-inview` to `.fade-section`
 *      and staggers `.reveal-item` children.
 *   2. Magnetic buttons, any element with `data-magnet` leans toward the
 *      cursor and springs back.
 *   3. Count-up stats, any element with `data-count-to` animates from
 *      zero when it scrolls into view.
 *
 * Nothing is hidden in the server-rendered HTML. Without JS (crawlers, AI
 * agents, no-JS visitors) every section renders fully visible, which is
 * exactly what GEO requires.
 */
export default function FadeInObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
    const cleanups: Array<() => void> = [];

    /* ── 1. Scroll reveals ────────────────────────────────────────── */
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".fade-section"));

    if (reduceMotion) {
      // Still add the classes so any layout depending on final state is
      // correct, we just never animate to get there.
      sections.forEach((el) => el.classList.add("fade-in", "is-inview"));
    } else {
      sections.forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(40px)";
        el.style.transition = `opacity 900ms ${EASE}, transform 900ms ${EASE}`;

        el.querySelectorAll<HTMLElement>(".reveal-item").forEach((item) => {
          item.style.opacity = "0";
          item.style.transform = "translateY(28px)";
        });
      });

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;

            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            el.classList.add("fade-in", "is-inview");

            el.querySelectorAll<HTMLElement>(".reveal-item").forEach((item, i) => {
              const delay = 180 + i * 110;
              item.style.transition = `opacity 800ms ${EASE} ${delay}ms, transform 800ms ${EASE} ${delay}ms`;
              item.style.opacity = "1";
              item.style.transform = "translateY(0)";
            });

            sectionObserver.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
      );

      sections.forEach((el) => sectionObserver.observe(el));
      cleanups.push(() => sectionObserver.disconnect());
    }

    /* ── 2. Magnetic buttons ──────────────────────────────────────── */
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (finePointer && !reduceMotion) {
      const magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnet]"));

      magnets.forEach((el) => {
        const strength = Number(el.dataset.magnet) || 0.3;

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) * strength;
          // Slightly more vertical pull reads as weight rather than drift.
          const dy = (e.clientY - (r.top + r.height / 2)) * strength * 1.25;
          el.dataset.active = "true";
          el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        };

        const onLeave = () => {
          el.dataset.active = "false";
          el.style.transform = "translate3d(0, 0, 0)";
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    /* ── 3. Count-up stats ────────────────────────────────────────── */
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count-to]"));

    if (counters.length) {
      const runCount = (el: HTMLElement) => {
        const target = Number(el.dataset.countTo);
        if (!Number.isFinite(target)) return;

        const decimals = Number(el.dataset.countDecimals) || 0;
        const prefix = el.dataset.countPrefix || "";
        const suffix = el.dataset.countSuffix || "";
        const duration = Number(el.dataset.countDuration) || 1600;

        if (reduceMotion) {
          el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
          return;
        }

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutExpo, fast out of the gate, long settle. Matches --ch-ease.
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          el.textContent = `${prefix}${(target * eased).toFixed(decimals)}${suffix}`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };

      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCount(entry.target as HTMLElement);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );

      counters.forEach((el) => counterObserver.observe(el));
      cleanups.push(() => counterObserver.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
