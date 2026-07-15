"use client";

import { useEffect } from "react";

/**
 * FadeInObserver
 *
 * Progressively enhances `.fade-section` elements with scroll-triggered
 * fade-in animations, and staggers any `.reveal-item` children inside
 * each section for a premium cascading reveal.
 *
 * All hidden states are applied via JS only — without JavaScript
 * (AI crawlers, disabled-JS tests) nothing runs and every section
 * remains fully visible in the static HTML, which is exactly what
 * crawlers need to see.
 */
export default function FadeInObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const sections = document.querySelectorAll<HTMLElement>(".fade-section");
    const EASE = "cubic-bezier(0.18, 0.82, 0.16, 1)";

    // Initial hidden state — applied via JS so it only exists when JS runs
    sections.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      el.style.transition = `opacity 900ms ${EASE}, transform 900ms ${EASE}`;

      el.querySelectorAll<HTMLElement>(".reveal-item").forEach((item) => {
        item.style.opacity = "0";
        item.style.transform = "translateY(28px)";
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;

          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.classList.add("fade-in");

          // Cascade child items with a stagger
          el.querySelectorAll<HTMLElement>(".reveal-item").forEach(
            (item, i) => {
              item.style.transition = `opacity 800ms ${EASE} ${
                180 + i * 110
              }ms, transform 800ms ${EASE} ${180 + i * 110}ms`;
              item.style.opacity = "1";
              item.style.transform = "translateY(0)";
            }
          );

          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Renders nothing — pure side-effect component
  return null;
}
