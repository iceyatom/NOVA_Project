import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyVerificationCode } from "@/lib/auth/verificationCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  let email: string;
  let code: string;

  try {
    const body = await req.json();
    email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    code = typeof body.code === "string" ? body.code.trim() : "";
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!email || !code) {
    return NextResponse.json(
      { ok: false, error: "Email and code are required." },
      { status: 400 },
    );
  }

  // Unified error message for all invalid/expired/wrong-code cases.
  const invalid = () =>
    NextResponse.json(
      { ok: false, error: "Invalid or expired verification code." },
      { status: 400 },
    );

  try {
    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email },
      select: {
        email: true,
        passwordHash: true,
        role: true,
        displayName: true,
        phone: true,
        codeHash: true,
        expiresAt: true,
      },
    });

    if (pendingSignup) {
      if (pendingSignup.expiresAt < new Date()) {
        return invalid();
      }

      const codeOk = await verifyVerificationCode(code, pendingSignup.codeHash);
      if (!codeOk) {
        return invalid();
      }

      await prisma.$transaction(async (tx) => {
        const existing = await tx.account.findUnique({
          where: { email },
          select: { id: true, status: true },
        });

        if (existing && existing.status.toLowerCase() === "active") {
          await tx.pendingSignup.delete({ where: { email } });
          return;
        }

        if (existing) {
          await tx.account.update({
            where: { id: existing.id },
            data: {
              passwordHash: pendingSignup.passwordHash,
              role: pendingSignup.role,
              displayName: pendingSignup.displayName,
              phone: pendingSignup.phone,
              status: "active",
              deletedAt: null,
            },
          });
          await tx.pendingVerification.deleteMany({
            where: { accountId: existing.id },
          });
        } else {
          await tx.account.create({
            data: {
              email: pendingSignup.email,
              passwordHash: pendingSignup.passwordHash,
              role: pendingSignup.role,
              displayName: pendingSignup.displayName,
              phone: pendingSignup.phone,
              status: "active",
            },
          });
        }

        await tx.pendingSignup.delete({ where: { email } });
      });

      return NextResponse.json({ ok: true });
    }

    // Legacy fallback for pending accounts created before PendingSignup existed.
    const account = await prisma.account.findUnique({
      where: { email },
      include: { pendingVerification: true },
    });

    if (
      !account ||
      account.status !== "pending" ||
      !account.pendingVerification
    ) {
      return invalid();
    }

    if (account.pendingVerification.expiresAt < new Date()) {
      return invalid();
    }

    const codeOk = await verifyVerificationCode(
      code,
      account.pendingVerification.codeHash,
    );
    if (!codeOk) {
      return invalid();
    }

    await prisma.$transaction([
      prisma.account.update({
        where: { id: account.id },
        data: { status: "active" },
      }),
      prisma.pendingVerification.delete({
        where: { accountId: account.id },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("verify-email API failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to verify code." },
      { status: 500 },
    );
  }
}
