export type RockInstallationFollowUpTemplateInput = {
  customerName?: string | null;
  upsellUrl?: string | null;
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
  const upsellUrl = opts.upsellUrl?.trim() || "";
  const subject = "Quick check-in on your rock cover";

  const upsellTextBlock = upsellUrl
    ? `If that sounds useful, you can check out what's included here: ${upsellUrl}\n\nOr just reply to this email and I'll reach out.`
    : `Or just reply to this email and I'll reach out.`;

  const text = `${greeting}

Just checking in — it's been about a week since your rock cover went in. Hoping it looks exactly how you imagined and is blending in nicely with the yard.

If anything looks off or you have any questions at all, just reply here. I'll make it right.

While I have you — if you're not already on one of our home watch or management plans, I'd love to tell you about it.

A lot of second-home owners in Watersound and Naturewalk use us to keep an eye on the place while they're out of town. I do weekly property checks, grab mail, water plants, handle contractor meetups, and prep the house before you arrive — basically make sure everything is exactly how you left it. (Or better.)

It's a small thing that takes a huge weight off when you're not here.

${upsellTextBlock}

Thanks again for trusting me with your yard,
Ryder
Coastal Home Management 30A
(309) 415-8793`;

  const upsellHtmlBlock = upsellUrl
    ? `
      <p>If that sounds useful, you can <a href="${upsellUrl}" target="_blank" rel="noreferrer" style="color: #c9b89a;">check out what's included here</a> — or just reply to this email and I'll reach out.</p>`
    : `<p>Just reply to this email if you'd like to talk about it.</p>`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.65; color: #111827; max-width: 580px;">
      <p>${greeting}</p>
      <p>Just checking in — it's been about a week since your rock cover went in. Hoping it looks exactly how you imagined and is blending in nicely with the yard.</p>
      <p>If anything looks off or you have any questions at all, just reply here. I'll make it right.</p>
      <p>While I have you — if you're not already on one of our home watch or management plans, I'd love to tell you about it.</p>
      <p>A lot of second-home owners in Watersound and Naturewalk use us to keep an eye on the place while they're out of town. I do weekly property checks, grab mail, water plants, handle contractor meetups, and prep the house before you arrive — basically make sure everything is exactly how you left it. (Or better.)</p>
      <p>It's a small thing that takes a huge weight off when you're not here.</p>
      ${upsellHtmlBlock}
      <p style="margin-top: 24px;">Thanks again for trusting me with your yard,<br /><strong>Ryder</strong><br />Coastal Home Management 30A<br /><a href="tel:+13094158793" style="color: #6b7280; text-decoration: none;">(309) 415-8793</a></p>
    </div>
  `;

  return {
    subject,
    html,
    text,
  };
}
