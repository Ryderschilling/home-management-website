import { siteData } from "@/data/siteData";

export type ServicePageData = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  image: string;
  highlights: string[];
  idealFor: string[];
  process: string[];
  faqs: { q: string; a: string }[];
};

export const servicePages: Record<string, ServicePageData> = {
  "second-home-management-inlet-beach": {
    slug: "second-home-management-inlet-beach",
    title: "Second Home Management in Inlet Beach",
    metaTitle: "Second Home Management in Inlet Beach, Florida",
    metaDescription:
      "Reliable second home management in Inlet Beach and along 30A. Home checks, issue coordination, updates, and trusted local oversight while you're away.",
    intro:
      "Coastal Home Management 30A provides second home management for homeowners in Inlet Beach and surrounding 30A communities. We help keep your property protected, checked, and cared for while you are away.",
    image: "/img.png",
    highlights: [
      "Weekly or bi-weekly home checks",
      "Detailed updates and issue reporting",
      "Coordination for maintenance and vendors",
      "Trusted local oversight while you are away",
    ],
    idealFor: [
      "Second-home owners who live out of town",
      "Owners who want consistent property visibility",
      "Homeowners who need a trusted local point of contact",
    ],
    process: [
      "We learn the property, your priorities, and your preferred check cadence.",
      "We perform regular visits and document anything that needs attention.",
      "We coordinate the next step quickly so small issues do not become expensive problems.",
    ],
    faqs: [
      {
        q: "How often can you check on my home?",
        a: "Most homeowners choose weekly or bi-weekly visits, but frequency can be adjusted based on the property and season.",
      },
      {
        q: "Do you provide updates after visits?",
        a: "Yes. Clear communication and issue reporting are part of the service.",
      },
    ],
  },

  "concierge-services-inlet-beach": {
    slug: "concierge-services-inlet-beach",
    title: "Concierge Services in Inlet Beach",
    metaTitle: "Concierge Services in Inlet Beach for Homeowners",
    metaDescription:
      "Home concierge services in Inlet Beach and 30A. Reliable help for homeowner requests, coordination, errands, and one-off property needs.",
    intro:
      "Our concierge services are built for homeowners who need responsive local help without managing every detail themselves. From simple requests to recurring support, we handle the execution.",
    image: "/service3.png",
    highlights: [
      "One-off homeowner requests",
      "Local coordination and scheduling",
      "On-property assistance when needed",
      "Reliable help without adding management overhead",
    ],
    idealFor: [
      "Owners who are away from the area",
      "Busy families with second homes on 30A",
      "Homeowners who want a local operator they can trust",
    ],
    process: [
      "You send the request and desired outcome.",
      "We confirm the scope, timing, and next step.",
      "We execute and keep you updated until it is complete.",
    ],
    faqs: [
      {
        q: "What kinds of concierge requests do you handle?",
        a: "Requests vary by homeowner, but typically include coordination, property-related errands, and support tasks that need a trusted local contact.",
      },
      {
        q: "Is this only for recurring clients?",
        a: "No. Some homeowners use concierge support occasionally, while others use it as part of ongoing home management.",
      },
    ],
  },

  "mail-package-handling-inlet-beach": {
    slug: "mail-package-handling-inlet-beach",
    title: "Mail & Package Handling in Inlet Beach",
    metaTitle: "Mail and Package Handling in Inlet Beach",
    metaDescription:
      "Secure mail and package handling for second homeowners in Inlet Beach and along 30A. Trusted local support while you're away.",
    intro:
      "Mail and package handling helps second homeowners avoid missed deliveries, overflow, and uncertainty while they are out of town. We collect, manage, and coordinate based on your preferences.",
    image: "/service2.png",
    highlights: [
      "Mail collection while you are away",
      "Package monitoring and handling",
      "Communication around important deliveries",
      "Reliable local support for occupied or vacant periods",
    ],
    idealFor: [
      "Seasonal homeowners",
      "Owners who receive deliveries during vacant periods",
      "Homeowners who want less friction and fewer missed items",
    ],
    process: [
      "We understand your delivery habits and preferences.",
      "We monitor and handle mail and packages as agreed.",
      "We update you when anything important needs attention.",
    ],
    faqs: [
      {
        q: "Can this be combined with home checks?",
        a: "Yes. Mail and package handling pairs naturally with second home management visits.",
      },
      {
        q: "Do you handle both short-term and ongoing needs?",
        a: "Yes. Some homeowners need this seasonally, while others need ongoing support.",
      },
    ],
  },

  "home-check-services-30a": {
    slug: "home-check-services-30a",
    title: "Home Check Services on 30A",
    metaTitle: "Home Check Services for 30A Homeowners",
    metaDescription:
      "Professional home check services for second-home owners on 30A. Routine visits, issue detection, and trusted local oversight.",
    intro:
      "Home check services are designed to catch issues early, maintain visibility, and reduce risk while your home is vacant. We provide consistent checks for second homeowners across the 30A area.",
    image: "/img.png",
    highlights: [
      "Routine home visits",
      "Early issue detection",
      "Clear communication",
      "Support for vacant-home peace of mind",
    ],
    idealFor: [
      "Owners who are away for extended periods",
      "Homes that need regular vacant-property oversight",
      "Homeowners who want local visibility without constant travel",
    ],
    process: [
      "We set your home check schedule.",
      "We inspect key areas and identify anything abnormal.",
      "We report findings and coordinate follow-up when needed.",
    ],
    faqs: [
      {
        q: "Why are routine home checks important?",
        a: "Regular checks help catch issues sooner and reduce the chance of a problem sitting unnoticed for weeks.",
      },
      {
        q: "Do you serve only Inlet Beach?",
        a: `We serve ${siteData.serviceArea} and nearby 30A areas based on fit and logistics.`,
      },
    ],
  },

  "property-care-inlet-beach": {
    slug: "property-care-inlet-beach",
    title: "Property Care in Inlet Beach",
    metaTitle: "Property Care Services in Inlet Beach",
    metaDescription:
      "Property care services for second-home owners in Inlet Beach. Ongoing oversight, support, and trusted local management for your home.",
    intro:
      "Property care means more than reacting to issues. It means having a trusted local operator who helps keep your home looked after, monitored, and ready when you need it.",
    image: "/img.png",
    highlights: [
      "Ongoing property oversight",
      "Support for homeowner requests",
      "Fast local communication",
      "Reliable care for second homes",
    ],
    idealFor: [
      "Second-home owners who want a single trusted local contact",
      "Owners who value responsiveness and consistency",
      "Homeowners who want less operational friction",
    ],
    process: [
      "We understand the property and your expectations.",
      "We provide the agreed oversight and support.",
      "We communicate clearly and help keep the property in order.",
    ],
    faqs: [
      {
        q: "What is the difference between property care and home checks?",
        a: "Home checks are one part of property care. Property care is broader and can include oversight, coordination, and concierge support.",
      },
      {
        q: "Is this service customized?",
        a: "Yes. The exact service mix depends on the property, owner needs, and visit frequency.",
      },
    ],
  },

  "artificial-rock-installation-inlet-beach": {
    slug: "artificial-rock-installation-inlet-beach",
    title: "Artificial Rock Installation in Inlet Beach",
    metaTitle: "Artificial Rock Installation in Inlet Beach and 30A",
    metaDescription:
      "Artificial rock installation in Inlet Beach and along 30A to cover exposed pipes and fixtures with a clean, finished look.",
    intro:
      "Artificial rock installation is a clean way to cover exposed pipes and fixtures while improving curb appeal. Coastal Home Management 30A offers local installation support for homeowners in Inlet Beach and nearby 30A communities.",
    image: "/img.png",
    highlights: [
      "Cover exposed pipes and fixtures",
      "Improve curb appeal and visual finish",
      "Local installation support",
      "Simple upgrade for second homeowners",
    ],
    idealFor: [
      "Homeowners with exposed backflow pipes",
      "Owners who want a cleaner exterior appearance",
      "Second-home owners who want a done-for-you exterior fix",
    ],
    process: [
      "We review the setup and confirm fit.",
      "We coordinate the selected rock and installation.",
      "We complete the installation and leave the area clean.",
    ],
    faqs: [
      {
        q: "What does artificial rock installation help with?",
        a: "It helps cover exposed utility areas and gives the home a cleaner, more finished exterior look.",
      },
      {
        q: "Can this be combined with other exterior upkeep services?",
        a: "Yes. It can pair well with broader property care and second-home oversight.",
      },
    ],
  },
};

export const allServicePages = Object.values(servicePages);