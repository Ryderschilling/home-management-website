"use client";

/**
 * Hero photo for the home-watch landing page.
 * Shows /ryder-at-work.jpg (the pool/mail action shot) once it's added to /public.
 * Until then it falls back to the existing founder photo so the page never breaks.
 */
export default function HeroImage() {
  return (
    <img
      src="/ryder-at-work.jpg"
      alt="Ryder Schilling checking on a 30A home — Coastal Home Management"
      className="h-full w-full object-cover"
      style={{ maxHeight: "360px" }}
      loading="eager"
      decoding="async"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src.indexOf("profile-web.jpg") === -1) {
          el.src = "/profile-web.jpg";
        }
      }}
    />
  );
}
