import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/passwordHash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = {
  email?: string;
  password?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 400 },
    );
  }

  try {
    const account = await prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        status: true,
        deletedAt: true,
        role: true,
      },
    });

    if (
      !account ||
      account.deletedAt ||
      account.status.toLowerCase() !== "active"
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    let passwordOk = false;

    try {
      passwordOk = await verifyPassword(password, account.passwordHash);
    } catch {
      passwordOk = false;
    }

    // Backward compatibility for legacy plaintext records in passwordHash.
    if (!passwordOk && password === account.passwordHash) {
      passwordOk = true;
      const upgradedHash = await hashPassword(password);
      await prisma.account.update({
        where: { id: account.id },
        data: { passwordHash: upgradedHash },
      });
    }

    if (!passwordOk) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      account: {
        email: account.email,
        displayName: account.displayName,
        role: account.role,
      },
      role: account.role,
    });
  } catch (error) {
    console.error("Login API failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to process login request." },
      { status: 500 },
    );
  }
}
