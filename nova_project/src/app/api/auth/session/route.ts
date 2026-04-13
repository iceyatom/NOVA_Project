import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashToken,
  AUTH_COOKIE_NAME,
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

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return withNoCache(NextResponse.json({ authenticated: false }));
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { account: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt < now ||
    session.account.deletedAt ||
    session.account.status.toLowerCase() !== "active"
  ) {
    return withNoCache(NextResponse.json({ authenticated: false }));
  }

  // Roll forward lastUsedAt and expiresAt (inactivity timeout)
  const newExpiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  await prisma.authSession.update({
    where: { id: session.id },
    data: { lastUsedAt: now, expiresAt: newExpiresAt },
  });

  return withNoCache(
    NextResponse.json({
      authenticated: true,
      account: {
        email: session.account.email,
        displayName: session.account.displayName,
        role: session.account.role,
      },
    }),
  );
}
