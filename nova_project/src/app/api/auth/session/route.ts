import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { account } = session;
    if (
      !account ||
      account.deletedAt ||
      account.status.toLowerCase() !== "active"
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
      },
    });
  } catch (error) {
    console.error("[auth/session] route failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
