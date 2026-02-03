// src/data/siteData.ts

export type Service = {
  id: string;
  title: string;
  description: string;
  // keep optional so admin can still store it, but you won't display it on the site
  price?: string;
  image?: string;
  ctaLabel?: string;
};

export const siteData = {
  businessName: "Coastal Home Management 30A",
  serviceArea: "Watersound Origins & surrounding areas",
  startingPrice: "",

  // IMPORTANT: replace this with your real email
  contactEmail: "YOUR_EMAIL_HERE",

  services: [
    {
      id: "second-home-management",
      title: "Second Home Management",
      description:
        "Comprehensive oversight while you’re away. Weekly or bi-weekly check-ins, full property inspections, issue coordination, and proactive care to keep your home in top condition.",
      image: "/img.png",
      ctaLabel: "Inquire Now",
    },
    {
      id: "mail-package-handling",
      title: "Mail & Package Handling",
      description:
        "Receive and manage all mail and deliveries while you’re away. Packages are collected, secured, and handled according to your preferences so nothing is missed.",
      image: "/service2.png",
      ctaLabel: "Inquire Now",
    },
    {
      id: "concierge-services",
      title: "Concierge Services",
      description:
        "Anything you may need as a homeowner. From one-off requests to ongoing assistance, we handle the details so you don’t have to.",
      image: "/service3.png",
      ctaLabel: "Inquire Now",
    },
  ],
};