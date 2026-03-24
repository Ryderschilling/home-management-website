import { getOrderById } from "@/lib/server/services/orders";
import { renderRockInstallationFollowUpEmail } from "@/lib/server/templates/rock-installation-follow-up";
import { getTemplateBySlug, type TemplateDefinition } from "@/lib/templates/registry";

type PreviewField = {
  label: string;
  value: string;
};

export type TemplatePreviewModel = {
  template: TemplateDefinition;
  subject: string | null;
  html: string | null;
  text: string | null;
  sourceLabel: string;
  sourceDescription: string;
  note?: string;
  fields: PreviewField[];
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDefaultOrganizationId() {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID?.trim();
  return organizationId || null;
}

async function buildPostInstallFollowUpPreview(
  template: TemplateDefinition,
  orderId?: string
): Promise<TemplatePreviewModel> {
  const sample = {
    customerName: "Sarah Mitchell",
    recipient: "sarah.mitchell@example.com",
  };

  let customerName = sample.customerName;
  let recipient = sample.recipient;
  let sourceLabel = "Sample data";
  let sourceDescription =
    "Rendering with realistic fallback data so the template can be reviewed without depending on a live order record.";
  let note: string | undefined;
  const fields: PreviewField[] = [];

  const normalizedOrderId = orderId?.trim();

  if (normalizedOrderId) {
    const organizationId = getDefaultOrganizationId();

    if (!organizationId) {
      note =
        "DEFAULT_ORGANIZATION_ID is not configured, so the preview could not load a live order and is using sample data instead.";
    } else {
      try {
        const order = await getOrderById(organizationId, normalizedOrderId);

        if (order) {
          customerName =
            String(order.customer_name || order.client_name || "").trim() || sample.customerName;
          recipient =
            String(order.customer_email || order.client_email || "").trim() || sample.recipient;
          sourceLabel = "Live order";
          sourceDescription =
            "Rendering from the current portal order record so the preview matches the data available to the production send flow.";

          fields.push({ label: "Order ID", value: order.id });

          const installedAt = formatDateTime(order.installed_at);
          if (installedAt) {
            fields.push({ label: "Installed At", value: installedAt });
          }
        } else {
          note = `Order ${normalizedOrderId} was not found. Showing the sample preview instead.`;
        }
      } catch (error) {
        note =
          error instanceof Error
            ? `Could not load order ${normalizedOrderId}. ${error.message}`
            : `Could not load order ${normalizedOrderId}. Showing the sample preview instead.`;
      }
    }
  }

  const rendered = renderRockInstallationFollowUpEmail({ customerName });

  fields.unshift(
    { label: "Customer", value: customerName },
    { label: "Recipient", value: recipient }
  );

  return {
    template,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    sourceLabel,
    sourceDescription,
    note,
    fields,
  };
}

function buildPlaceholderPreview(template: TemplateDefinition): TemplatePreviewModel {
  return {
    template,
    subject: null,
    html: null,
    text: null,
    sourceLabel: "Placeholder preview",
    sourceDescription:
      "This template slot is registered in the library and ready for a dedicated renderer when the underlying template is built.",
    fields: [
      { label: "Category", value: template.category },
      { label: "Status", value: template.status },
    ],
  };
}

export async function getTemplatePreviewBySlug(slug: string, opts?: { orderId?: string }) {
  const template = getTemplateBySlug(slug);
  if (!template) return null;

  if (template.slug === "post-install-follow-up-email") {
    return buildPostInstallFollowUpPreview(template, opts?.orderId);
  }

  return buildPlaceholderPreview(template);
}
