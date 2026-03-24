export type RockInstallationFollowUpTemplateInput = {
  customerName?: string | null;
};

export type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function renderRockInstallationFollowUpEmail(
  opts: RockInstallationFollowUpTemplateInput = {}
): RenderedEmailTemplate {
  const customerName = String(opts.customerName ?? "").trim();
  const greeting = customerName ? `Hi ${customerName},` : "Hi there,";
  const subject = "Thank you again from Coastal Home Management 30A";

  const text = `${greeting}

I just wanted to follow up and thank you again for trusting Coastal Home Management 30A.

I truly appreciate your business. It means a lot to be able to help homeowners keep their property protected and looking its best.

In addition to installations like your artificial rock cover, I also help with ongoing home management needs such as home checkups, plant care, mail retrieval, filter changes, and other second-home support services.

If you ever need an extra set of eyes on your home or help with anything at all, just reply to this email. I'd be glad to help.

Thank you again,
Ryder
Coastal Home Management 30A`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
      <p>${greeting}</p>
      <p>I just wanted to follow up and thank you again for trusting Coastal Home Management 30A.</p>
      <p>I truly appreciate your business. It means a lot to be able to help homeowners keep their property protected and looking its best.</p>
      <p>In addition to installations like your artificial rock cover, I also help with ongoing home management needs such as home checkups, plant care, mail retrieval, filter changes, and other second-home support services.</p>
      <p>If you ever need an extra set of eyes on your home or help with anything at all, just reply to this email. I'd be glad to help.</p>
      <p style="margin-top: 20px;">Thank you again,<br />Ryder<br />Coastal Home Management 30A</p>
    </div>
  `;

  return {
    subject,
    html,
    text,
  };
}
