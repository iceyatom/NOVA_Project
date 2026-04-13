import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationCode,
  hashVerificationCode,
  getExpiryDate,
} from "@/lib/auth/verificationCode";
import { sendVerificationEmail } from "@/lib/email/emailService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email: string;

  try {
    const body = await req.json();
    email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required." },
      { status: 400 },
    );
  }

  try {
    const account = await prisma.account.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, status: true },
    });

    // Always return 200 for unknown/already-active accounts — prevents enumeration
    if (!account || account.status !== "pending") {
      return NextResponse.json({ ok: true });
    }

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = getExpiryDate(15);

    // Upsert replaces the old code hash — previous code is immediately invalidated
    await prisma.pendingVerification.upsert({
      where: { accountId: account.id },
      update: { codeHash, expiresAt },
      create: { accountId: account.id, codeHash, expiresAt },
    });

    await sendVerificationEmail(email, account.displayName ?? "there", code);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("resend-verification API failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to resend verification email." },
      { status: 500 },
    );
  }
}
