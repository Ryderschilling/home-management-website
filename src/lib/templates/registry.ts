export type TemplateCategory = "email" | "invoice" | "contract" | "other";
export type TemplateStatus = "live" | "placeholder";

export type TemplateDefinition = {
  slug: string;
  name: string;
  category: TemplateCategory;
  description: string;
  previewRoute: string;
  status: TemplateStatus;
  /** Email subject line — only for email templates */
  subject?: string;
  /** When the email fires relative to signup or trigger event */
  trigger?: string;
};

export type TemplateCategoryDefinition = {
  slug: TemplateCategory;
  name: string;
  description: string;
};

export const templateCategories: TemplateCategoryDefinition[] = [
  {
    slug: "email",
    name: "Email Templates",
    description: "Customer-facing follow-ups, service communication, and reusable outbound messages.",
  },
  {
    slug: "invoice",
    name: "Invoice Templates",
    description: "Billing layouts and invoice presentation patterns tied to portal financial workflows.",
  },
  {
    slug: "contract",
    name: "Contract Templates",
    description: "Service agreements, scopes, and recurring care documents that will expand over time.",
  },
  {
    slug: "other",
    name: "Other Templates",
    description: "Future reusable documents, owner handoffs, and operational template slots.",
  },
];

export const templateRegistry: TemplateDefinition[] = [
  // ─── Lead drip sequence ──────────────────────────────────────────────────────
  {
    slug: "drip-welcome",
    name: "Welcome Email",
    category: "email",
    description: "Immediate welcome sent when a lead opts in via the QR page or lead capture form.",
    subject: "You're on the list — here's what's next",
    trigger: "Immediate on opt-in",
    previewRoute: "/portal/templates/drip-welcome",
    status: "live",
  },
  {
    slug: "drip-day1-education",
    name: "5 Things That Go Wrong",
    category: "email",
    description: "Education email covering 5 common problems in 30A homes while owners are away: storm damage, HVAC failure, package theft, contractor no-shows, slow leaks.",
    subject: "5 things that go wrong in 30A homes while owners are away.",
    trigger: "Day 1 after opt-in",
    previewRoute: "/portal/templates/drip-day1-education",
    status: "live",
  },
  {
    slug: "drip-day3-proof",
    name: "The Furnace Was Out",
    category: "email",
    description: "Real story social proof — caught a heating failure at a Watersound property two days before a hard freeze. Includes client testimonial from Scott Clark.",
    subject: "The furnace was out. The freeze was two days away.",
    trigger: "Day 3 after opt-in",
    previewRoute: "/portal/templates/drip-day3-proof",
    status: "live",
  },
  {
    slug: "drip-day5-soft-close",
    name: "Here's What a Plan Looks Like",
    category: "email",
    description: "Soft close email showing exact service tiers and pricing: Basic Watch ($100–150/mo), Full Management ($200–300/mo), On-Call Only ($75+$45/hr).",
    subject: "Here's exactly what a plan looks like.",
    trigger: "Day 5 after opt-in",
    previewRoute: "/portal/templates/drip-day5-soft-close",
    status: "live",
  },
  {
    slug: "drip-day7-rock",
    name: "Backflow Pipe Install",
    category: "email",
    description: "Final drip email — shows the rock installation product, photo, and links to the QR order page for backflow pipe cover installations.",
    subject: "Your backflow pipes may be exposed.",
    trigger: "Day 7 after opt-in",
    previewRoute: "/portal/templates/drip-day7-rock",
    status: "live",
  },

  // ─── Rock order emails ───────────────────────────────────────────────────────
  {
    slug: "rock-order-thank-you",
    name: "Rock Order Thank You",
    category: "email",
    description: "Sent immediately after a rock installation order is marked complete. Includes Google review link and upsell to ongoing home management services.",
    subject: "Thank you — your installation is complete",
    trigger: "Immediate after order marked Installed",
    previewRoute: "/portal/templates/rock-order-thank-you",
    status: "live",
  },
  {
    slug: "post-install-follow-up-email",
    name: "7-Day Post-Install Follow-Up",
    category: "email",
    description: "Personal check-in sent 7 days after a rock installation. Asks how the rock looks, pitches ongoing home watch and management services with Ryder's direct contact info.",
    subject: "Quick check-in on your rock cover",
    trigger: "7 days after order marked Installed",
    previewRoute: "/portal/templates/post-install-follow-up-email",
    status: "live",
  },

  // ─── Placeholders ────────────────────────────────────────────────────────────
  {
    slug: "monthly-service-invoice",
    name: "Monthly Service Invoice",
    category: "invoice",
    description: "Placeholder for recurring service invoice previews generated from portal billing data.",
    previewRoute: "/portal/templates/monthly-service-invoice",
    status: "placeholder",
  },
  {
    slug: "property-care-agreement",
    name: "Property Care Agreement",
    category: "contract",
    description: "Placeholder for a reusable property care or home watch agreement template preview.",
    previewRoute: "/portal/templates/property-care-agreement",
    status: "placeholder",
  },
  {
    slug: "owner-welcome-packet",
    name: "Owner Welcome Packet",
    category: "other",
    description: "Placeholder for future onboarding, handoff, or branded document templates.",
    previewRoute: "/portal/templates/owner-welcome-packet",
    status: "placeholder",
  },
];

export function getTemplateBySlug(slug: string) {
  return templateRegistry.find((template) => template.slug === slug) ?? null;
}

export function getTemplatesByCategory(category: TemplateCategory) {
  return templateRegistry.filter((template) => template.category === category);
}
