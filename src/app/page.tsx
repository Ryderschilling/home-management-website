"use client";

import { siteData } from "@/data/siteData";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
  }, []);

  return (
    <main className="min-h-screen font-sans bg-white text-black">

      {/* Sticky nav */}
      <nav className="fixed top-0 w-full z-50 transition-colors duration-300 bg-transparent backdrop-blur-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
  <img src="/logo.png" alt="Logo" className="h-40 w-auto"/>
  <span className="hidden md:inline text-xl font-serif">{siteData.businessName}</span>
</div>
        <div className="space-x-4">
          <a href="#services" className="text-sm uppercase tracking-wide hover:underline">Services</a>
          <a href="#contact" className="text-sm uppercase tracking-wide hover:underline">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative h-screen flex flex-col justify-center items-center bg-black text-white">
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative text-center space-y-6 fade-section opacity-0 translate-y-12 transition-all duration-1000">
          <h1 className="text-5xl font-serif tracking-tight">{siteData.businessName}</h1>
          <p className="text-lg uppercase tracking-widest text-gray-300">{siteData.serviceArea}</p>
          <a
            href="#contact"
            className="border border-white px-8 py-3 text-sm uppercase tracking-wide hover:bg-white hover:text-black transition"
          >
            Contact
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-6 py-28 fade-section opacity-0 translate-y-12 transition-all duration-1000">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-12">
          {/* Service card 1 */}
          <div className="relative group overflow-hidden border border-gray-200 p-6">
            <div className="bg-gray-300 h-60 w-full mb-4 transition-transform duration-500 group-hover:scale-105"></div>
            <h3 className="text-xl font-serif mb-2">Second Home Care</h3>
            <p className="text-sm text-gray-700 mb-2">Weekly or monthly check-ins with full property oversight.</p>
            <p className="text-sm text-gray-500 mb-4">{siteData.startingPrice}</p>
            <a href={`mailto:${siteData.contactEmail}`} className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white transition">Message Me</a>
          </div>

          {/* Service card 2 */}
          <div className="relative group overflow-hidden border border-gray-200 p-6">
            <div className="bg-gray-300 h-60 w-full mb-4 transition-transform duration-500 group-hover:scale-105"></div>
            <h3 className="text-xl font-serif mb-2">Mail & Package Handling</h3>
            <p className="text-sm text-gray-700 mb-2">Receive and manage all mail and deliveries while you're away.</p>
            <p className="text-sm text-gray-500 mb-4">Included in care plans</p>
            <a href={`mailto:${siteData.contactEmail}`} className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white transition">Message Me</a>
          </div>

          {/* Service card 3 */}
          <div className="relative group overflow-hidden border border-gray-200 p-6">
            <div className="bg-gray-300 h-60 w-full mb-4 transition-transform duration-500 group-hover:scale-105"></div>
            <h3 className="text-xl font-serif mb-2">Contractor Coordination</h3>
            <p className="text-sm text-gray-700 mb-2">Schedule and supervise repairs or maintenance with trusted professionals.</p>
            <p className="text-sm text-gray-500 mb-4">Included in care plans</p>
            <a href={`mailto:${siteData.contactEmail}`} className="border border-black px-4 py-2 text-xs uppercase hover:bg-black hover:text-white transition">Message Me</a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-6 py-32 bg-gray-900 text-white fade-section opacity-0 translate-y-12 transition-all duration-1000">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 className="text-3xl font-serif tracking-tight mb-2">Get in Touch</h2>
          <p className="text-gray-300">Reach out for availability and customized service plans.</p>
          <a
            href={`mailto:${siteData.contactEmail}`}
            className="border border-white px-8 py-3 text-sm uppercase tracking-wide hover:bg-white hover:text-black transition"
          >
            Contact
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 text-center text-xs uppercase tracking-widest text-gray-400">
        <a href="/admin/login" className="hover:text-white transition">Admin</a>
      </footer>

      <style jsx>{`
        .fade-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </main>
  );
}