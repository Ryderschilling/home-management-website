import { NextResponse } from "next/server";
import { sendThankYouEmail } from "@/lib/server/email-thankyou";

export const runtime = "nodejs";

export async function GET() {
  await sendThankYouEmail({
    to: "YOUR_EMAIL_HERE@gmail.com",
    customerName: "Ryder",
    productLabel: "Artificial Rock Installation",
  });

  return NextResponse.json({ ok: true });
}