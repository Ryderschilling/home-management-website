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
    title: "Home Watch & Second Home Management in Inlet Beach",
    metaTitle: "Home Watch & Second Home Management in Inlet Beach, Florida",
    metaDescription:
      "Local home watch and second home management in Inlet Beach and along 30A. Weekly home watch checks with photo proof, issue coordination, and trusted oversight while you're away.",
    intro:
      "Coastal Home Management 30A provides home watch and second home management for homeowners in Inlet Beach and surrounding 30A communities. Our home watch service puts a trusted local person at your property on a set schedule, checking it inside and out and sending photo proof after every visit, so your second home stays protected while you are away.",
    image: "/img.png",
    highlights: [
      "Weekly or bi-weekly home watch checks in Inlet Beach",
      "Detailed updates, photo proof, and issue reporting",
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
        q: "Do you provide home watch services in Inlet Beach?",
        a: "Yes. Home watch is exactly what we do in Inlet Beach. On a weekly or bi-weekly schedule we check your home inside and out, watch for leaks, pests, AC issues, and storm damage, and send a photo report after every visit. Because the owner lives here on 30A, the same local person who checks your home is the one you talk to, not a call center.",
      },
      {
        q: "How often can you check on my home?",
        a: "Most homeowners choose weekly or bi-weekly visits, but frequency can be adjusted based on the property and season.",
      },
      {
        q: "Do you provide updates after visits?",
        a: "Yes. Clear communication and issue reporting are part of every visit, with a text or email summary and photos after each check.",
      },
      {
        q: "Who actually checks on my house in Inlet Beach when I'm not there?",
        a: "Coastal Home Management 30A does. It's a local, owner-operated service, not a call center, so the same person who checks your property is the one you talk to on the phone.",
      },
      {
        q: "What does second home management cost in Inlet Beach?",
        a: "Plans start at $150/month for weekly checks with photo reports. Pricing depends on visit frequency and what's included; see our pricing page for the full breakdown.",
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
        a: "Requests vary by homeowner, but typically include coordination, property-related errands, meeting contractors on-site, and support tasks that need a trusted local contact.",
      },
      {
        q: "Is this only for recurring clients?",
        a: "No. Some homeowners use concierge support occasionally, while others use it as part of ongoing home management.",
      },
      {
        q: "How much does a one-off concierge task cost?",
        a: "On-call property tasks, like meeting a contractor or handling an errand, are $85 flat with no recurring commitment required.",
      },
      {
        q: "Can I request concierge help the same week I need it?",
        a: "In most cases, yes. Because we're locally based in Inlet Beach, we can usually accommodate requests within a few days depending on the task.",
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
        q: "How much does mail and trash handling cost on 30A?",
        a: "Mail and trash handling is $35/day, and it's often bundled into a recurring home management plan for homeowners who want it every visit.",
      },
      {
        q: "Can this be combined with home checks?",
        a: "Yes. Mail and package handling pairs naturally with second home management visits, so it's checked at the same time as the rest of the property.",
      },
      {
        q: "Do you handle both short-term and ongoing needs?",
        a: "Yes. Some homeowners need this seasonally, while others need ongoing support for as long as the property sits vacant.",
      },
      {
        q: "What happens to packages if no one is home for weeks?",
        a: "We collect and secure mail and packages according to your preferences so nothing sits exposed on a porch or overflows a mailbox while you're away.",
      },
    ],
  },

  "home-check-services-30a": {
    slug: "home-check-services-30a",
    title: "Home Watch & Home Check Services on 30A",
    metaTitle: "Home Watch & Home Check Services on 30A",
    metaDescription:
      "Home watch and home check services for second-home owners on 30A. Routine visits with photo proof, early issue detection, and trusted local oversight while you're away.",
    intro:
      "Home watch, sometimes called a home check, means having someone local visit your vacant home on a set schedule to catch issues early and reduce risk. Coastal Home Management 30A provides consistent home watch visits with photo proof for second homeowners across the 30A area.",
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
        q: "How much does home watch cost on 30A?",
        a: "Home watch plans with Coastal Home Management 30A start at $150/month for weekly visits with photo reports. The exact price depends on visit frequency and add-ons like mail handling; see our pricing page for the full breakdown.",
      },
      {
        q: "How often should someone check on a vacation home in Florida?",
        a: "Most second homeowners on 30A choose weekly checks, especially during hurricane season and after storms. Bi-weekly works for homes with fewer systems to monitor, like a house without a pool.",
      },
      {
        q: "Why are routine home checks important?",
        a: "Regular checks help catch issues sooner and reduce the chance of a problem sitting unnoticed for weeks, which is what turns a small repair into an expensive one.",
      },
      {
        q: "Do you serve only Inlet Beach?",
        a: `We serve ${siteData.serviceArea} and nearby 30A areas based on fit and logistics.`,
      },
      {
        q: "What's included in a standard home check?",
        a: "A walk-through of the interior and exterior, a check of major systems, storm and weather-related inspection, and a photo report sent to you after each visit.",
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
        a: "Home checks are one part of property care. Property care is broader and can include oversight, coordination, maintenance scheduling, and concierge support.",
      },
      {
        q: "Is this service customized?",
        a: "Yes. The exact service mix depends on the property, owner needs, and visit frequency, and can be adjusted as your needs change.",
      },
      {
        q: "Do I need a full-time property manager or just property care?",
        a: "Most second-home owners on 30A don't need full-time management. Property care gives you consistent local oversight and a trusted point of contact without the cost of a full-time manager.",
      },
      {
        q: "How do you communicate what's happening at my property?",
        a: "You get a text or email summary and photos after every visit, plus a direct call if anything needs your immediate attention.",
      },
    ],
  },

  "second-home-management-watersound-origins": {
    slug: "second-home-management-watersound-origins",
    title: "Home Watch & Second Home Management in Watersound Origins",
    metaTitle: "Home Watch & Second Home Management in Watersound Origins, FL",
    metaDescription:
      "Local home watch and second home management in Watersound Origins and Naturewalk. Weekly property checks with photo proof, issue coordination, and trusted oversight while you're away.",
    intro:
      "Coastal Home Management 30A provides home watch and second home management for homeowners in Watersound Origins, Naturewalk, and surrounding Inlet Beach communities. Our home watch service means someone local checks on your property on a set schedule, sends photo proof every visit, and catches small problems before they turn expensive, so your home stays protected while you're not there.",
    image: "/img.png",
    highlights: [
      "Weekly or bi-weekly home watch visits in Watersound Origins",
      "Detailed visit reports with photos and issue notes",
      "Vendor and maintenance coordination",
      "Trusted local presence in Watersound and Naturewalk",
    ],
    idealFor: [
      "Watersound Origins homeowners who live out of state",
      "Second-home owners in Naturewalk who want consistent oversight",
      "Homeowners who want a reliable local contact in the community",
    ],
    process: [
      "We walk the property, learn your priorities, and set your check schedule.",
      "We perform regular visits, document the condition, and flag anything that needs attention.",
      "We coordinate follow-up quickly so small issues don't become expensive problems.",
    ],
    faqs: [
      {
        q: "Do you provide home watch services in Watersound Origins?",
        a: "Yes. Home watch is the core of what we do in Watersound Origins. On a weekly or bi-weekly schedule we walk your home inside and out, check systems and storm exposure, and send a photo report after every visit, so an empty second home always has a trusted local set of eyes on it.",
      },
      {
        q: "Do you serve Watersound Origins and Naturewalk specifically?",
        a: "Yes. Watersound Origins and Naturewalk are our primary service areas. We know these communities well and can get to your property quickly.",
      },
      {
        q: "What happens when you find an issue at my property?",
        a: "We contact you immediately, document it clearly, and coordinate the next step — whether that's a vendor, a repair, or just a watchful eye until you return.",
      },
      {
        q: "How often can you check on my home?",
        a: "Most homeowners in Watersound choose weekly visits. We can also do bi-weekly or adjust based on season and vacancy.",
      },
    ],
  },

  "vacation-home-care-30a": {
    slug: "vacation-home-care-30a",
    title: "Vacation Home Care on 30A",
    metaTitle: "Vacation Home Care Services on Scenic 30A, Florida",
    metaDescription:
      "Vacation home care on scenic 30A and Inlet Beach. Property checks, pre-arrival prep, issue response, and trusted local management for second homeowners.",
    intro:
      "Vacation home care on 30A means having someone local who knows your property and can respond fast. Coastal Home Management 30A provides reliable, personal care for second homes and vacation properties across Inlet Beach, Watersound Origins, and Naturewalk.",
    image: "/img.png",
    highlights: [
      "Pre-arrival property preparation",
      "Routine property checks between visits",
      "Fast issue response and vendor coordination",
      "Ongoing communication and photo updates",
    ],
    idealFor: [
      "Vacation homeowners who visit 30A seasonally",
      "Second-home owners who want their property guest-ready on arrival",
      "Owners who want a local operator they can text when something comes up",
    ],
    process: [
      "We learn the property, your visit schedule, and what matters most to you.",
      "We check in regularly and prepare the home ahead of your arrivals.",
      "We handle any issues that come up so you arrive to a property that's ready.",
    ],
    faqs: [
      {
        q: "What does pre-arrival prep include?",
        a: "We walk the property before you arrive, confirm everything is in order, check systems, and make sure the home is ready for your stay.",
      },
      {
        q: "What areas of 30A do you cover?",
        a: "We primarily serve Inlet Beach, Watersound Origins, and Naturewalk. Contact us to confirm availability for your specific address.",
      },
      {
        q: "Can you respond if something goes wrong while I'm away?",
        a: "Yes. That's the core of what we do. You call or text, we're on it — whether it's a vendor coordination, a check-in, or something more urgent.",
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
        a: "It helps cover exposed utility areas, like backflow preventers and irrigation valves, and gives the home a cleaner, more finished exterior look.",
      },
      {
        q: "Can this be combined with other exterior upkeep services?",
        a: "Yes. It can pair well with broader property care and second-home oversight, and is often added as a one-time upgrade alongside a recurring plan.",
      },
      {
        q: "Is artificial rock installation a one-time service or ongoing?",
        a: "It's a one-time installation. Once it's placed, it requires no ongoing maintenance beyond occasional cleaning.",
      },
    ],
  },
};

export const allServicePages = Object.values(servicePages);