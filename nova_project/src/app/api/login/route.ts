import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type LoginBody = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const account = await prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        displayName: true,
        status: true,
        deletedAt: true,
      },
    });

    // Generic failure message (don’t reveal which part failed)
    const invalidMsg = "Invalid email or password.";

    if (!account || account.deletedAt) {
      return NextResponse.json({ ok: false, message: invalidMsg }, { status: 401 });
    }

    if (account.status !== "active") {
      return NextResponse.json(
        { ok: false, message: "Your account is not active." },
        { status: 403 },
      );
    }

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, message: invalidMsg }, { status: 401 });
    }

    // Optional: update lastLoginAt (safe + useful)
    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    // Return safe user payload (no passwordHash)
    return NextResponse.json({
      ok: true,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        displayName: account.displayName,
      },
    });
  } catch (err) {
    console.error("POST /api/login error:", err);
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}