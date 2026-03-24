export type TemplateCategory = "email" | "invoice" | "contract" | "other";
export type TemplateStatus = "live" | "placeholder";

export type TemplateDefinition = {
  slug: string;
  name: string;
  category: TemplateCategory;
  description: string;
  previewRoute: string;
  status: TemplateStatus;
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
  {
    slug: "post-install-follow-up-email",
    name: "7-Day Post-Install Follow-Up",
    category: "email",
    description: "Thank-you and soft follow-up email sent after an installed artificial rock cover order.",
    previewRoute: "/portal/templates/post-install-follow-up-email",
    status: "live",
  },
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
