"use client";

import { useEffect } from "react";

/**
 * FadeInObserver
 *
 * Progressively enhances `.fade-section` elements with scroll-triggered
 * fade-in animations. When JavaScript runs, it adds the initial hidden
 * state (opacity-0 + translate-y) and then reveals each section as it
 * enters the viewport.
 *
 * Without JavaScript (AI crawlers, disabled-JS tests), none of this runs
 * and the sections remain fully visible in the static HTML — which is
 * exactly what crawlers need to see.
 */
export default function FadeInObserver() {
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".fade-section");

    // Add the initial hidden state via JS so it only applies when JS runs
    sections.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(48px)";
      el.style.transition = "opacity 1000ms ease, transform 1000ms ease";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            el.classList.add("fade-in");
            observer.unobserve(el);
          }
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
