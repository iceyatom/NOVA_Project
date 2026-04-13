import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVerificationCode } from "@/lib/auth/verificationCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  // Unified error message for all invalid/expired/wrong-code cases — prevents account enumeration
  const invalid = () =>
    NextResponse.json(
      { ok: false, error: "Invalid or expired verification code." },
      { status: 400 },
    );

  try {
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

    // Activate the account and remove the verification record atomically
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
