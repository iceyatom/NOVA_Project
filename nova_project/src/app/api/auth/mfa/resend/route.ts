import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateMfaCode,
  hashMfaCode,
  deliverMfaCode,
  MFA_CODE_DURATION_MS,
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
  let body: { challengeId?: number };

  try {
    body = (await request.json()) as { challengeId?: number };
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const { challengeId } = body;

  if (!challengeId || typeof challengeId !== "number") {
    return errorResponse("challengeId is required.", 400);
  }

  const challenge = await prisma.mfaChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return errorResponse("Challenge not found.", 404);
  }

  if (challenge.usedAt) {
    return errorResponse("This challenge has already been used.", 400);
  }

  // Invalidate the old challenge
  await prisma.mfaChallenge.update({
    where: { id: challenge.id },
    data: { invalidatedAt: new Date() },
  });

  // Create a new challenge for the same account
  const mfaCode = generateMfaCode();
  const codeHash = hashMfaCode(mfaCode);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MFA_CODE_DURATION_MS);

  const newChallenge = await prisma.mfaChallenge.create({
    data: {
      accountId: challenge.accountId,
      codeHash,
      expiresAt,
    },
  });

  // Fetch account email for delivery
  const account = await prisma.account.findUnique({
    where: { id: challenge.accountId },
    select: { email: true },
  });

  const delivery = deliverMfaCode({
    accountId: challenge.accountId,
    email: account?.email ?? "",
    code: mfaCode,
  });

  console.log("[mfa/resend] new challenge created", {
    accountId: challenge.accountId,
    oldChallengeId: challenge.id,
    newChallengeId: newChallenge.id,
  });

  return jsonResponse({
    ok: true,
    challengeId: newChallenge.id,
    ...delivery,
  });
}
