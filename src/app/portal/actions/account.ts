"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { writeSecret } from "@/lib/secrets";
import { SERVICE_NOTE_FIELDS, type ServiceNotes } from "@/lib/portal/serviceNotes";
import type { ActionState } from "./auth";

const s = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string).trim() : "");
const opt = (fd: FormData, k: string) => s(fd, k) || null;

async function viewerOrLogin() {
  const v = await getViewer();
  if (!v) redirect("/portal/login");
  return v;
}

export async function updateContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const v = await viewerOrLogin();
  const name = s(fd, "name");
  if (!name) return { error: "Please enter your name." };
  await prisma.client.update({
    where: { id: v.client.id },
    data: { name, phone: opt(fd, "phone"), altContact: opt(fd, "altContact") },
  });
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Saved." };
}

function propertyData(fd: FormData) {
  const notes: ServiceNotes = {};
  for (const f of SERVICE_NOTE_FIELDS) {
    const val = s(fd, `sn_${f.key}`);
    if (val) notes[f.key] = val;
  }
  return {
    label: opt(fd, "label"),
    address: s(fd, "address"),
    gateCode: writeSecret(opt(fd, "gateCode")),
    doorCode: writeSecret(opt(fd, "doorCode")),
    alarmCode: writeSecret(opt(fd, "alarmCode")),
    wifiName: opt(fd, "wifiName"),
    wifiPassword: writeSecret(opt(fd, "wifiPassword")),
    keyLocation: opt(fd, "keyLocation"),
    trashDay: opt(fd, "trashDay"),
    hvacNotes: opt(fd, "hvacNotes"),
    notes: opt(fd, "notes"),
    serviceNotes: notes,
  };
}

export async function saveProperty(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const v = await viewerOrLogin();
  const id = s(fd, "id");
  const data = propertyData(fd);
  if (!data.address) return { error: "Please enter the home's address." };

  if (id) {
    const owned = await prisma.property.findFirst({ where: { id, clientId: v.client.id }, select: { id: true } });
    if (!owned) return { error: "That home is not on your account." };
    await prisma.property.update({ where: { id }, data });
  } else {
    await prisma.property.create({ data: { ...data, clientId: v.client.id } });
  }
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Home details saved." };
}

/** Called from the order popup: save the codes and the one answer without leaving the flow. */
export async function quickSaveAccess(input: {
  propertyId: string;
  gateCode?: string;
  doorCode?: string;
  alarmCode?: string;
  keyLocation?: string;
  serviceNotes?: ServiceNotes;
}): Promise<{ ok: boolean }> {
  const v = await viewerOrLogin();
  const p = await prisma.property.findFirst({ where: { id: input.propertyId, clientId: v.client.id } });
  if (!p) return { ok: false };
  const existing = (p.serviceNotes && typeof p.serviceNotes === "object" ? (p.serviceNotes as ServiceNotes) : {}) ?? {};
  const merged: ServiceNotes = { ...existing };
  for (const f of SERVICE_NOTE_FIELDS) {
    const val = input.serviceNotes?.[f.key];
    if (typeof val === "string" && val.trim()) merged[f.key] = val.trim();
  }
  await prisma.property.update({
    where: { id: p.id },
    data: {
      ...(input.gateCode !== undefined ? { gateCode: writeSecret(input.gateCode || null) } : {}),
      ...(input.doorCode !== undefined ? { doorCode: writeSecret(input.doorCode || null) } : {}),
      ...(input.alarmCode !== undefined ? { alarmCode: writeSecret(input.alarmCode || null) } : {}),
      ...(input.keyLocation !== undefined ? { keyLocation: input.keyLocation || null } : {}),
      serviceNotes: merged,
    },
  });
  revalidatePath("/portal", "layout");
  return { ok: true };
}

export async function addPropertyQuick(input: { address: string; label?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const v = await viewerOrLogin();
  const address = input.address.trim();
  if (!address) return { ok: false, error: "Please enter the address." };
  const p = await prisma.property.create({
    data: { clientId: v.client.id, address, label: input.label?.trim() || null },
    select: { id: true },
  });
  revalidatePath("/portal", "layout");
  return { ok: true, id: p.id };
}

/* ------------------------------------------------------------- billing */

/**
 * Swap the card on file: save the new one to the client's Square customer,
 * move every live subscription onto it, disable the old ones. The card
 * number itself never reaches us; Square's form hands back a token.
 */
export async function updateCard(input: { token: string; verificationToken?: string }): Promise<{ ok: true; last4: string; brand: string } | { ok: false; error: string }> {
  const square = await import("@/lib/portal/square");
  const v = await getViewer();
  if (!v) return { ok: false, error: "Please log in again." };
  if (!square.squareConfigured()) return { ok: false, error: "Card payments are not switched on yet. Text Ryder." };
  if (!input.token) return { ok: false, error: "Enter your card details first." };
  try {
    const subs = await prisma.planSubscription.findMany({ where: { clientId: v.client.id, status: { in: ["ACTIVE", "PAUSED"] } } });
    const link = await prisma.squareLink.findFirst({ where: { clientId: v.client.id } });
    const customerId = await square.ensureCustomer({
      existingId: subs.find((s) => s.squareCustomerId)?.squareCustomerId ?? link?.squareCustomerId ?? null,
      name: v.client.name,
      email: v.user.email,
      phone: v.client.phone,
    });
    const before = await square.listCards(customerId);
    const card = await square.saveCard({ customerId, sourceId: input.token, cardholderName: v.client.name, verificationToken: input.verificationToken });
    for (const s of subs) {
      if (s.squareSubscriptionId) await square.updateSubscriptionCard(s.squareSubscriptionId, card.id);
      await prisma.planSubscription.update({ where: { id: s.id }, data: { squareCustomerId: customerId, squareCardId: card.id, lastPaymentFailedAt: null } });
    }
    for (const old of before) {
      if (old.id !== card.id) await square.disableCard(old.id).catch(() => {});
    }
    if (!link) await prisma.squareLink.create({ data: { squareCustomerId: customerId, clientId: v.client.id } }).catch(() => {});
    revalidatePath("/portal", "layout");
    return { ok: true, last4: card.last_4 ?? "", brand: card.card_brand ?? "Card" };
  } catch (e) {
    return { ok: false, error: square.friendlySquareMessage(e) };
  }
}
