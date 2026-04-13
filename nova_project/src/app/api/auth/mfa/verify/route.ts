import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashMfaCode,
  generateToken,
  hashToken,
  setSessionCookie,
  MAX_MFA_ATTEMPTS,
  SESSION_DURATION_MS,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return withNoCache(NextResponse.json(body, { status }));
}

function errorResponse(error: string, status: number): NextResponse {
  return jsonResponse({ ok: false, error }, status);
}

export async function POST(request: Request) {
  let body: { challengeId?: number; code?: string };

  try {
    body = (await request.json()) as { challengeId?: number; code?: string };
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const { challengeId, code } = body;

  if (!challengeId || typeof challengeId !== "number") {
    return errorResponse("challengeId is required.", 400);
  }

  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return errorResponse("A 6-digit code is required.", 400);
  }

  const challenge = await prisma.mfaChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return errorResponse("Challenge not found.", 404);
  }

  const now = new Date();

  if (challenge.usedAt) {
    return errorResponse("This challenge has already been used.", 400);
  }

  if (challenge.invalidatedAt) {
    return errorResponse("This challenge has been invalidated.", 400);
  }

  if (challenge.expiresAt < now) {
    return errorResponse("This challenge has expired.", 400);
  }

  // Increment attempt count
  const updated = await prisma.mfaChallenge.update({
    where: { id: challenge.id },
    data: { attemptCount: { increment: 1 } },
  });

  if (updated.attemptCount > MAX_MFA_ATTEMPTS) {
    return errorResponse("Too many attempts. Please request a new code.", 429);
  }

  const submittedHash = hashMfaCode(code);

  if (submittedHash !== challenge.codeHash) {
    return errorResponse("Invalid code. Please try again.", 401);
  }

  // Mark challenge as used
  await prisma.mfaChallenge.update({
    where: { id: challenge.id },
    data: { usedAt: now },
  });

  // Create session
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await prisma.authSession.create({
    data: {
      accountId: challenge.accountId,
      tokenHash,
      expiresAt,
    },
  });

  // Update account lastLoginAt
  const account = await prisma.account.update({
    where: { id: challenge.accountId },
    data: { lastLoginAt: now },
    select: { email: true, displayName: true, role: true },
  });

  console.log("[mfa/verify] session created", {
    accountId: challenge.accountId,
    email: account.email,
  });

  const res = jsonResponse({
    ok: true,
    account: {
      email: account.email,
      displayName: account.displayName,
      role: account.role,
    },
  });

  return setSessionCookie(res, token);
}
