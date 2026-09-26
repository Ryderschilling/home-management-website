"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, passwordProblem, sixDigitCode, opaqueToken } from "@/lib/portal/password";
import { createSession, destroySession, destroyAllSessions, getViewer } from "@/lib/portal/session";
import { hit, clear } from "@/lib/portal/rateLimit";
import { sendPortalEmail, appUrl, notifyRyder } from "@/lib/portal/email";

export type ActionState = { error?: string; ok?: boolean; message?: string };

const s = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string).trim() : "");
const emailOf = (fd: FormData) => s(fd, "email").toLowerCase();

function safeNext(v: string): string {
  return v.startsWith("/portal") && !v.startsWith("//") ? v : "/portal";
}

const VERIFY_MINUTES = 30;

async function sendVerifyCode(email: string, name: string, code: string) {
  await sendPortalEmail({
    to: email,
    subject: `Your Coastal Home Management code: ${code}`,
    heading: `Hi ${name.split(" ")[0] || "there"}, here is your code`,
    preheader: `Your code is ${code}`,
    blocks: [
      { p: "Type this code on the page you have open to confirm your email address." },
      { code },
      { p: `It works for ${VERIFY_MINUTES} minutes. If you did not create a Coastal Home Management account, you can ignore this email.` },
    ],
  });
}

/* ------------------------------------------------------------------ signup */

export async function signup(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = s(fd, "name");
  const email = emailOf(fd);
  const phone = s(fd, "phone");
  const password = s(fd, "password");

  if (!name) return { error: "Please tell us your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address does not look right." };
  const pwProblem = passwordProblem(password);
  if (pwProblem) return { error: pwProblem };

  const limit = await hit(`signup:${email}`, 5, 60);
  if (!limit.ok) return { error: `Too many tries. Please wait ${limit.retryMinutes} minutes.` };

  const existingUser = await prisma.portalUser.findUnique({ where: { email } });
  if (existingUser) return { error: "That email already has a login. Use Log in instead, or reset your password." };

  // Match the client record CHM already has for this person, never clone it.
  const existingClient = await prisma.client.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, portalUser: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, name: true },
  });

  const clientId = existingClient
    ? existingClient.id
    : (
        await prisma.client.create({
          data: {
            name,
            email,
            phone: phone || null,
            status: "LEAD",
            leadStage: "NEW",
            cadence: "AD_HOC",
            source: "Portal signup",
            notes: `[Portal ${new Date().toISOString().slice(0, 10)}] Created an account on the homeowner portal.`,
          },
          select: { id: true },
        })
      ).id;

  if (existingClient && phone) {
    await prisma.client.update({ where: { id: clientId }, data: { phone } }).catch(() => undefined);
  }

  const code = sixDigitCode();
  const user = await prisma.portalUser.create({
    data: {
      clientId,
      email,
      passwordHash: await hashPassword(password),
      verifyCode: code,
      verifyExpires: new Date(Date.now() + VERIFY_MINUTES * 60_000),
    },
  });

  await sendVerifyCode(email, name, code);
  await notifyRyder(
    `New portal account: ${name}`,
    `${name} just created a portal account`,
    [{ rows: [["Name", name], ["Email", email], ["Phone", phone || "not given"], ["Matched", existingClient ? `existing client (${existingClient.status})` : "new client record"]] }]
  );
  await createSession(user.id);
  redirect("/portal/verify");
}

/* ------------------------------------------------------------------ verify */

export async function verifyEmail(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const code = s(fd, "code").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Enter the 6-digit code from your email." };

  const limit = await hit(`verify:${viewer.user.id}`, 6, 15);
  if (!limit.ok) return { error: `Too many tries. Please wait ${limit.retryMinutes} minutes, then ask for a new code.` };

  const u = await prisma.portalUser.findUnique({ where: { id: viewer.user.id } });
  if (!u) redirect("/portal/login");
  if (u.emailVerifiedAt) redirect("/portal");
  if (!u.verifyCode || !u.verifyExpires || u.verifyExpires < new Date()) {
    return { error: "That code has expired. Ask for a new one below." };
  }
  if (u.verifyCode !== code) return { error: "That code does not match. Check the email and try again." };

  await prisma.portalUser.update({
    where: { id: u.id },
    data: { emailVerifiedAt: new Date(), verifyCode: null, verifyExpires: null },
  });
  await clear(`verify:${viewer.user.id}`);
  redirect("/portal");
}

export async function resendCode(): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const limit = await hit(`resend:${viewer.user.id}`, 3, 15);
  if (!limit.ok) return { error: `We just sent one. Please wait ${limit.retryMinutes} minutes.` };
  const code = sixDigitCode();
  await prisma.portalUser.update({
    where: { id: viewer.user.id },
    data: { verifyCode: code, verifyExpires: new Date(Date.now() + VERIFY_MINUTES * 60_000) },
  });
  await sendVerifyCode(viewer.user.email, viewer.client.name, code);
  return { ok: true, message: "A new code is on its way. Give it a minute and check spam if you do not see it." };
}

/* ------------------------------------------------------------------- login */

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = emailOf(fd);
  const password = s(fd, "password");
  const next = safeNext(s(fd, "next") || "/portal");
  if (!email || !password) return { error: "Enter your email and password." };

  const limit = await hit(`login:${email}`, 8, 15);
  if (!limit.ok) return { error: `Too many tries. Please wait ${limit.retryMinutes} minutes or reset your password.` };

  const u = await prisma.portalUser.findUnique({ where: { email } });
  const good = u ? await verifyPassword(password, u.passwordHash) : false;
  if (!u || !good) return { error: "That email and password do not match." };

  await prisma.portalUser.update({ where: { id: u.id }, data: { lastLoginAt: new Date(), failedLogins: 0 } });
  await clear(`login:${email}`);
  await createSession(u.id);
  redirect(u.emailVerifiedAt ? next : "/portal/verify");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/portal/login");
}

/* ------------------------------------------------------------ forgot / reset */

export async function forgotPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = emailOf(fd);
  if (!email) return { error: "Enter the email you signed up with." };
  const done = { ok: true, message: "If that email has an account, a reset link is on its way. It works for one hour." };

  const limit = await hit(`forgot:${email}`, 3, 60);
  if (!limit.ok) return done;

  const u = await prisma.portalUser.findUnique({ where: { email }, include: { client: { select: { name: true } } } });
  if (!u) return done;

  const token = opaqueToken(32);
  await prisma.portalUser.update({
    where: { id: u.id },
    data: { resetToken: token, resetExpires: new Date(Date.now() + 60 * 60_000) },
  });
  const link = `${appUrl()}/portal/reset?token=${token}`;
  await sendPortalEmail({
    to: email,
    subject: "Reset your Coastal Home Management password",
    heading: `Hi ${u.client.name.split(" ")[0]}, let's get you back in`,
    blocks: [
      { p: "Tap the button to choose a new password. The link works for one hour." },
      { button: { label: "Choose a new password", href: link } },
      { p: "If you did not ask for this, you can ignore it. Your password has not changed." },
    ],
  });
  return done;
}

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const token = s(fd, "token");
  const password = s(fd, "password");
  if (!token) return { error: "This reset link is missing its code. Open the link from your email again." };
  const pwProblem = passwordProblem(password);
  if (pwProblem) return { error: pwProblem };

  const u = await prisma.portalUser.findUnique({ where: { resetToken: token } });
  if (!u || !u.resetExpires || u.resetExpires < new Date()) {
    return { error: "This reset link has expired. Ask for a new one from the login page." };
  }
  await prisma.portalUser.update({
    where: { id: u.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetExpires: null,
      emailVerifiedAt: u.emailVerifiedAt ?? new Date(), // they proved they own the inbox
      failedLogins: 0,
    },
  });
  await destroyAllSessions(u.id);
  await createSession(u.id);
  redirect("/portal");
}

/* ----------------------------------------------------------- change password */

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  const current = s(fd, "current");
  const password = s(fd, "password");
  const pwProblem = passwordProblem(password);
  if (pwProblem) return { error: pwProblem };
  const u = await prisma.portalUser.findUnique({ where: { id: viewer.user.id } });
  if (!u || !(await verifyPassword(current, u.passwordHash))) return { error: "Your current password is not right." };
  await prisma.portalUser.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(password) } });
  return { ok: true, message: "Password changed." };
}
