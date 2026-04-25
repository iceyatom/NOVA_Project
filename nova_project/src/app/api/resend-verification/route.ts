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
const RESEND_COOLDOWN_MINUTES = 5;
const VERIFY_CODE_EXPIRY_MINUTES = 15;

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
    const pendingSignup = await prisma.pendingSignup.findUnique({
      where: { email },
      select: {
        email: true,
        displayName: true,
        resendAvailableAt: true,
      },
    });

    if (pendingSignup) {
      const now = new Date();

      if (pendingSignup.resendAvailableAt > now) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(
            (pendingSignup.resendAvailableAt.getTime() - now.getTime()) / 1000,
          ),
        );

        return NextResponse.json(
          {
            ok: false,
            error: "Please wait before requesting another verification code.",
            resendAvailableAt: pendingSignup.resendAvailableAt.toISOString(),
            retryAfterSeconds,
          },
          { status: 429 },
        );
      }

      const code = generateVerificationCode();
      const codeHash = await hashVerificationCode(code);
      const expiresAt = getExpiryDate(VERIFY_CODE_EXPIRY_MINUTES);
      const resendAvailableAt = getExpiryDate(RESEND_COOLDOWN_MINUTES);

      await prisma.pendingSignup.update({
        where: { email },
        data: { codeHash, expiresAt, resendAvailableAt },
      });

      await sendVerificationEmail(
        email,
        pendingSignup.displayName ?? "there",
        code,
      );

      return NextResponse.json({
        ok: true,
        resendAvailableAt: resendAvailableAt.toISOString(),
      });
    }

    // Legacy fallback for pending accounts created before PendingSignup existed.
    const account = await prisma.account.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, status: true },
    });

    // Always return 200 for unknown/already-active accounts to reduce enumeration risk.
    if (!account || account.status !== "pending") {
      return NextResponse.json({ ok: true });
    }

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = getExpiryDate(VERIFY_CODE_EXPIRY_MINUTES);

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
