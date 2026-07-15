"use client";

import { useMemo } from "react";

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
        name: "Scott Clark",
        meta: "Homeowner testimonial",
      },
      {
        quote:
          "Coastal Home Management is doing a really expert and professional job looking after my home. Ryder is easy to work with and has communicated with me exceptionally well (even sending pictures) on every task I have needed. They cover a wide range of services at a good price.",
        name: "Buddy Norman",
        meta: "Google review",
      },
      {
        quote:
          "Excellent service and communication! Very helpful and Ryder goes out of his way to help.",
        name: "Beth Tedesco",
        meta: "Google review",
      },
      {
        quote:
          "Ryder gives us peace of mind if we’re out of town and need the house checked on. Very reliable. Would highly recommend using his services!",
        name: "Barbara Reed",
        meta: "Google review",
      },
      {
        quote:
          "Ryder is one of the most responsible and reliable young men I have worked with to date. He has helped me with my property for over two years — and he might even share a couple of his favorite fishing honey holes if you ask.",
        name: "Sandie L.",
      },
      {
        quote:
          "We have utilized Ryder Schilling's services at our homes here and highly recommend him. His communication, professionalism, and service quality is truly impressive.",
        name: "Stacy Williams",
        meta: "WSO Homeowners",
      },
      {
        quote:
          "Ryder did that for me and it looks great! He's the best and has done a great job looking after my house when I am not in town. Highly recommend!",
        name: "Becky Cowart Portera",
        meta: "Facebook",
      },
    ],
    []
  );

  return (
    <section
      className="relative w-full bg-[#f6f9fc] text-[#0f172a] px-4 md:px-6 pt-20 md:pt-28 pb-16 md:pb-24"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="ch-eyebrow ch-eyebrow--center">What Owners Say</p>
          <h2 className="ch-display ch-display--sm">
            Testimonials
          </h2>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-6 md:gap-8 px-1 pb-6">
            {testimonials.map((t, i) => (
              <article
                key={i}
                className="w-[88vw] sm:w-[70vw] md:w-[560px] shrink-0 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-8 md:p-12 text-center shadow-[0_24px_60px_-44px_rgba(15,23,42,0.35)]"
              >
                <div
                  className="mx-auto mb-6 font-serif text-5xl leading-none text-[#1d4ed8]/30 select-none"
                  aria-hidden="true"
                >
                  “
                </div>
                <div className="font-serif text-[19px] sm:text-[21px] md:text-[25px] leading-[1.5] text-[#1e293b]">
                  <span className="italic">{t.quote}</span>
                </div>

                <div className="mt-8 text-xs uppercase tracking-[0.22em] text-[#93a3b5]">
                  {t.name}
                  {t.meta ? ` • ${t.meta}` : ""}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}