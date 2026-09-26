/**
 * The structured "helpful things about your home" a client tells us once and
 * every order reuses. Stored as JSON on Property.serviceNotes. Every field is
 * optional, and adding one here never needs a migration.
 */
export type ServiceNotes = {
  mailLocation?: string;
  plants?: string;
  thermostat?: string;
  pets?: string;
  pool?: string;
  trash?: string;
  waterShutoff?: string;
  other?: string;
};

export const SERVICE_NOTE_FIELDS: Array<{ key: keyof ServiceNotes; label: string; hint: string }> = [
  { key: "mailLocation", label: "Where should mail and packages go?", hint: "Kitchen counter, the office desk, inside the garage door." },
  { key: "waterShutoff", label: "Where is the main water shutoff?", hint: "Garage wall by the water heater, utility closet, outside by the meter." },
  { key: "thermostat", label: "Thermostat preference while you are away", hint: "Keep it at 78, or leave it as we find it." },
  { key: "plants", label: "Plants to water", hint: "Two ferns on the back porch, once a week." },
  { key: "pets", label: "Pets or animals we might meet", hint: "None, or a cat who hides under the bed." },
  { key: "pool", label: "Pool or spa notes", hint: "Pool company comes Thursdays, cover stays on." },
  { key: "trash", label: "Trash and recycling", hint: "Bins go out Monday night, back in Tuesday." },
  { key: "other", label: "Anything else we should know", hint: "A sticky door, a light that stays on, a neighbor who has a key." },
];

export function parseServiceNotes(v: unknown): ServiceNotes {
  if (!v || typeof v !== "object") return {};
  const out: ServiceNotes = {};
  for (const f of SERVICE_NOTE_FIELDS) {
    const val = (v as Record<string, unknown>)[f.key];
    if (typeof val === "string" && val.trim()) out[f.key] = val.trim();
  }
  return out;
}

/** One readable block for a Job's notes, so the crew sees it on the phone. */
export function serviceNotesText(n: ServiceNotes): string {
  return SERVICE_NOTE_FIELDS.filter((f) => n[f.key])
    .map((f) => `${f.label.replace(/\?$/, "")}: ${n[f.key]}`)
    .join("\n");
}
