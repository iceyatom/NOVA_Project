import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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
}
