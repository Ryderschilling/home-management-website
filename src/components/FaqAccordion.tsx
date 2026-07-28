"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: React.ReactNode };

/**
 * FAQ list. Every answer is open by default.
 *
 * That is a deliberate SEO and GEO decision, not a styling one. Answers stay
 * in the DOM either way, but an expanded panel is unambiguously visible
 * content: Google treats collapsed content as lower confidence for FAQ rich
 * results, and the AI crawlers that currently cite CHM for "second home
 * management Watersound Origins" read the rendered page. Open by default
 * removes any question about whether the answer counts.
 *
 * Visitors can still collapse anything they have already read.
 */
export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  // Start with every index open.
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.map((_, i) => i)));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open.has(i);
        return (
          <div key={item.q} className="ch-acc" data-open={isOpen ? "true" : "false"}>
            <h3>
              <button
                type="button"
                className="ch-acc__btn"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-btn-${i}`}
                onClick={() => toggle(i)}
              >
                <span
                  className="text-[17px] leading-[1.3] tracking-[-0.015em] md:text-[20px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontVariationSettings: "'wdth' 102, 'wght' 600",
                  }}
                >
                  {item.q}
                </span>
                <span className="ch-acc__sign" aria-hidden="true" />
              </button>
            </h3>

            <div
              className="ch-acc__panel"
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-btn-${i}`}
            >
              <div>
                <p className="ch-lede max-w-[68ch] pb-8 pr-8 !text-[14.5px]">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
