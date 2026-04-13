import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashToken,
  AUTH_COOKIE_NAME,
  clearSessionCookie,
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

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);

    await prisma.authSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const res = withNoCache(NextResponse.json({ ok: true }));
  return clearSessionCookie(res);
}
