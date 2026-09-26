/**
 * Access codes at rest.
 *
 * Gate, door and alarm codes (and wifi passwords) are encrypted in the database
 * with AES-256-GCM. The key is CODES_KEY in .env: 32 bytes as 64 hex characters.
 * Make one with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * The same file lives in the public website repo (src/lib/secrets.ts) and both
 * apps must carry the SAME CODES_KEY, because they share the database.
 *
 * Stored form: "enc:v1:<iv b64>:<tag b64>:<ciphertext b64>". A value without the
 * prefix is read as plain text, so rows written before encryption still display
 * and scripts/encrypt-codes.ts can migrate them at any time.
 *
 * With no CODES_KEY set, writes stay plain (with one console warning) and
 * reads of encrypted values come back as "(locked)". Nothing throws.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const PREFIX = "enc:v1:";
let warned = false;

function key(): Buffer | null {
  const hex = process.env.CODES_KEY?.trim();
  if (!hex) return null;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    if (!warned) {
      warned = true;
      console.error("[secrets] CODES_KEY must be 64 hex characters (32 bytes). Codes are NOT being encrypted.");
    }
    return null;
  }
  return Buffer.from(hex, "hex");
}

export function isEncrypted(v: string | null | undefined): boolean {
  return typeof v === "string" && v.startsWith(PREFIX);
}

/** Encrypt for storage. Empty and null pass through untouched. */
export function writeSecret(v: string | null | undefined): string | null {
  if (v == null) return null;
  const plain = String(v);
  if (!plain.trim()) return null;
  if (isEncrypted(plain)) return plain;
  const k = key();
  if (!k) {
    if (!warned) {
      warned = true;
      console.warn("[secrets] CODES_KEY is not set. Access codes are being stored in plain text.");
    }
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

/** Decrypt for display. Plain legacy values pass straight through. */
export function readSecret(v: string | null | undefined): string | null {
  if (v == null) return null;
  if (!isEncrypted(v)) return v;
  const k = key();
  if (!k) return "(locked)";
  try {
    const [ivB64, tagB64, ctB64] = v.slice(PREFIX.length).split(":");
    const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const out = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
    return out.toString("utf8");
  } catch {
    return "(locked)";
  }
}

/** Convenience for a Property row: returns a copy with the four secret fields readable. */
export function readPropertySecrets<
  T extends { gateCode?: string | null; doorCode?: string | null; alarmCode?: string | null; wifiPassword?: string | null }
>(p: T): T {
  return {
    ...p,
    gateCode: readSecret(p.gateCode),
    doorCode: readSecret(p.doorCode),
    alarmCode: readSecret(p.alarmCode),
    wifiPassword: readSecret(p.wifiPassword),
  };
}
