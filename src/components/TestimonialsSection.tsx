"use client";

/**
 * Testimonials as an editorial wall rather than a carousel of quote cards.
 *
 * Two columns of asymmetric cards on desktop with the strongest quote given
 * real scale. A carousel hides most of your social proof behind an
 * interaction nobody performs; a wall lets someone absorb four names in one
 * scroll without touching anything.
 */

type Testimonial = { quote: string; name: string; meta?: string; feature?: boolean };

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Coastal Home Management is doing a really expert and professional job looking after my home. Ryder is easy to work with and has communicated with me exceptionally well (even sending pictures) on every task I have needed. They cover a wide range of services at a good price.",
    name: "Buddy Norman",
    meta: "Google review",
    feature: true,
  },
  {
    quote:
      "Ryder has helped us with our home for years and has always been reliable, professional, and great to work with. He consistently does an excellent job and is someone we truly trust.",
    name: "Scott Clark",
    meta: "Homeowner",
  },
  {
    quote:
      "Ryder gives us peace of mind if we're out of town and need the house checked on. Very reliable. Would highly recommend using his services!",
    name: "Barbara Reed",
    meta: "Google review",
  },
  {
    quote:
      "We have utilized Ryder Schilling's services at our homes here and highly recommend him. His communication, professionalism, and service quality is truly impressive.",
    name: "Stacy Williams",
    meta: "Watersound Origins homeowner",
  },
  {
    quote: "Excellent service and communication! Very helpful and Ryder goes out of his way to help.",
    name: "Beth Tedesco",
    meta: "Google review",
  },
  {
    quote:
      "Ryder is one of the most responsible and reliable young men I have worked with to date. He has helped me with my property for over two years, and he might even share a couple of his favorite fishing honey holes if you ask.",
    name: "Sandie L.",
    meta: "Homeowner",
  },
  {
    quote:
      "He's the best and has done a great job looking after my house when I am not in town. Highly recommend!",
    name: "Becky Cowart Portera",
    meta: "Facebook",
  },
];

function Stars() {
  return (
    <span className="flex gap-[3px]" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="var(--ch-teal)" aria-hidden="true">
          <path d="M6 0l1.6 3.9L12 4.4 8.8 7.2l1 4.4L6 9.3 2.2 11.6l1-4.4L0 4.4l4.4-.5z" />
        </svg>
      ))}
    </span>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="ch-card break-inside-avoid p-7 md:p-9">
      <Stars />
      <blockquote
        className={`mt-5 tracking-[-0.01em] text-[var(--ch-ink)] ${
          // Only a modest step up. Masonry columns decide where this card
          // lands, and a 24px quote dropped into a narrow column reads as a
          // layout accident rather than emphasis.
          t.feature ? "text-[16.5px] leading-[1.55] md:text-[18px]" : "text-[15px] leading-[1.6]"
        }`}
        style={
          t.feature
            ? { fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 100, 'wght' 500" }
            : undefined
        }
      >
        {t.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--ch-hairline)] pt-5">
        <span className="ch-label !text-[var(--ch-ink)]">{t.name}</span>
        {t.meta ? <span className="text-[11px] text-[var(--ch-soft)]">{t.meta}</span> : null}
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection() {
  return (
    <section
      className="fade-section relative w-full bg-[var(--ch-paper)] px-4 py-24 md:px-8 md:py-32"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-14 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ch-eyebrow reveal-item">What owners say</p>
            <h2 className="ch-display max-w-[16ch]">
              <span className="ch-mask">
                <span>Fifteen homes.</span>
              </span>
              <span className="ch-mask">
                <span>Zero surprises.</span>
              </span>
            </h2>
          </div>

          <a
            href="https://www.google.com/search?q=Coastal+Home+Management+30A"
            target="_blank"
            rel="noopener noreferrer"
            className="reveal-item flex shrink-0 items-center gap-4 border border-[var(--ch-hairline)] px-6 py-4 transition-colors hover:border-[var(--ch-ink)]"
          >
            <span
              className="text-[34px] leading-none tracking-[-0.03em] text-[var(--ch-ink)]"
              style={{ fontFamily: "var(--font-display)", fontVariationSettings: "'wdth' 112, 'wght' 700" }}
            >
              5.0
            </span>
            <span>
              <Stars />
              <span className="ch-label mt-1.5 block">on Google</span>
            </span>
          </a>
        </div>

        <div className="columns-1 gap-5 md:columns-2 lg:columns-3 [&>figure]:mb-5">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
