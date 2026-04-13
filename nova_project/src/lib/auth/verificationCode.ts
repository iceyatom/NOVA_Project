import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

/** Generate a cryptographically random 6-digit numeric code, e.g. "047291". */
export function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash a verification code with bcrypt (10 rounds). */
export async function hashVerificationCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/** Compare a plain code against its stored bcrypt hash. */
export async function verifyVerificationCode(
  code: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/** Return a Date that is `minutes` from now (default 15). */
export function getExpiryDate(minutes = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
