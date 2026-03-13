// src/lib/server/email-thankyou.ts
import fs from "fs";
import path from "path";
import { Resend } from "resend";
import { env } from "@/lib/server/env";

function requireEnv(name: string, value: string | undefined) {
  if (!value || !String(value).trim()) throw new Error(`Missing ${name}`);
  return String(value).trim();
}

function absolutizeEmailHtml(html: string, appUrlRaw: string) {
  const appUrl = appUrlRaw.replace(/\/$/, ""); // no trailing slash

  // Replace src/href="images/..." with absolute public URLs
  // Works for:
  // - <img src="images/...">
  // - <link href="images/..."> (preload)
  // - CSS url(images/...)
  return html
    .replace(/(\s(?:src|href)=["'])images\//gi, `$1${appUrl}/email/thank-you/images/`)
    .replace(/url\((["']?)images\//gi, `url($1${appUrl}/email/thank-you/images/`);
}

function loadThankYouTemplateHtml() {
  const templatePath = path.join(
    process.cwd(),
    "public",
    "email",
    "thank-you",
    "email.html"
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Thank-you template not found at: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, "utf8");
}

export async function sendThankYouEmail(opts: {
  to: string;
  customerName: string;
  productLabel?: string;
}) {
  const key = requireEnv("RESEND_API_KEY", env.RESEND_API_KEY);
  const from = requireEnv("FROM_EMAIL", env.FROM_EMAIL);
  const appUrl = requireEnv("APP_URL", env.APP_URL);

  const resend = new Resend(key);

  // Load Canva HTML and make image paths absolute
  let html = loadThankYouTemplateHtml();
  html = absolutizeEmailHtml(html, appUrl);

  // Optional personalization (only if you want it)
  // If your template doesn't include these tokens, nothing changes.
  html = html
    .replaceAll("{{CUSTOMER_NAME}}", opts.customerName || "there")
    .replaceAll("{{PRODUCT_LABEL}}", opts.productLabel || "your service");

  const subject = "Thank you — your installation is complete";

  const result = await resend.emails.send({
    from,
    to: opts.to,
    subject,
    html,
  });

  return result;
}