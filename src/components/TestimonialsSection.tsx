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
    ],
    []
  );

  return (
    <section
      className="relative w-full bg-black text-white px-4 md:px-6 pt-0 pb-16 md:pb-24"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Testimonials
          </h2>
          <div className="mt-6 mx-auto h-px w-20 bg-white/20" />
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-6 md:gap-8 px-1">
            {testimonials.map((t, i) => (
              <article
                key={i}
                className="w-[88vw] sm:w-[70vw] md:w-[560px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10 text-center"
              >
                <div className="text-[18px] sm:text-[20px] md:text-[24px] leading-[1.55] text-white/90">
                  <span className="italic">“{t.quote}”</span>
                </div>

                <div className="mt-6 text-sm uppercase tracking-[0.18em] text-white/55">
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