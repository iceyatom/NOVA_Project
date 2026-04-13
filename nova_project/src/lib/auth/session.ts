import crypto from "crypto";
import { NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "nova_session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const MFA_CODE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_MFA_ATTEMPTS = 5;

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set.");
  }
  return secret;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret() + "-session")
    .update(token)
    .digest("hex");
}

export function generateMfaCode(): string {
  const digits = crypto.randomInt(0, 1_000_000);
  return digits.toString().padStart(6, "0");
}

export function hashMfaCode(code: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret() + "-mfa")
    .update(code)
    .digest("hex");
}

export function deliverMfaCode(params: {
  accountId: number;
  email: string;
  code: string;
}): { debugCode?: string } {
  console.log("[mfa] delivery code", {
    accountId: params.accountId,
    email: params.email,
    code: params.code,
  });

  if (process.env.NODE_ENV !== "production") {
    return { debugCode: params.code };
  }
  return {};
}

export function setSessionCookie<T>(
  response: NextResponse<T>,
  token: string,
): NextResponse<T> {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
  return response;
}

export function clearSessionCookie<T>(
  response: NextResponse<T>,
): NextResponse<T> {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
