import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  hashToken,
  AUTH_COOKIE_NAME,
  clearSessionCookie,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    try {
      // deleteMany avoids a 404 if the session is already expired or removed
      await prisma.session.deleteMany({ where: { token } });
    } catch (error) {
      console.error("[auth/logout] failed to delete session", error);
    }
  }

  const response = NextResponse.json({ ok: true });

  // Clear the cookie by setting maxAge to 0
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
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
