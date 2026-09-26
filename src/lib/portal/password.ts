/**
 * Password hashing with Node's built-in scrypt. No bcrypt dependency.
 * Stored form: "scrypt:<salt hex>:<hash hex>".
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const hash = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}

/** Plain, readable rules. Older clients, so length only, no symbol theater. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (pw.length > 200) return "That password is too long.";
  return null;
}

export function sixDigitCode(): string {
  return String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function opaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
