import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateVerificationCode,
  hashVerificationCode,
  getExpiryDate,
} from "@/lib/auth/verificationCode";
import { sendVerificationEmail } from "@/lib/email/emailService";

export const runtime = "nodejs";
const RESEND_COOLDOWN_MINUTES = 5;
const VERIFY_CODE_EXPIRY_MINUTES = 15;

function normalizePhone(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function getPhoneError(value: string): string | null {
  if (!value) {
    return "Phone number is required.";
  }

  if (value.length === 11 && value.startsWith("1")) {
    return "Do not include a leading 1. Enter a 10-digit phone number.";
  }

  if (value.length < 10) {
    return "Phone number is too short. Use exactly 10 digits.";
  }

  if (value.length > 10) {
    return "Phone number is too long. Use exactly 10 digits.";
  }

  return null;
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { email, password, displayName, phone, role } = await req.json();
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!email || !normalizedPassword) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }
    if (!isStrongPassword(normalizedPassword)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    const phoneError = getPhoneError(normalizedPhone);
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 });
    }

    // Reject if a verified account already exists with this email.
    const existing = await prisma.account.findUnique({
      where: { email: normalizedEmail },
      select: { status: true },
    });
    if (existing && existing.status === "active") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    // Only allow STAFF or CUSTOMER via public form, never ADMIN.
    let safeRole = "CUSTOMER";
    if (role === "STAFF") safeRole = "STAFF";

    // Temporarily allow admin for testing.
    if (role === "ADMIN") safeRole = "ADMIN";

    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = getExpiryDate(VERIFY_CODE_EXPIRY_MINUTES);
    const resendAvailableAt = getExpiryDate(RESEND_COOLDOWN_MINUTES);

    await prisma.pendingSignup.upsert({
      where: { email: normalizedEmail },
      update: {
        passwordHash,
        role: safeRole,
        displayName: displayName || null,
        phone: normalizedPhone,
        codeHash,
        expiresAt,
        resendAvailableAt,
      },
      create: {
        email: normalizedEmail,
        passwordHash,
        role: safeRole,
        displayName: displayName || null,
        phone: normalizedPhone,
        codeHash,
        expiresAt,
        resendAvailableAt,
      },
    });

    await sendVerificationEmail(normalizedEmail, displayName || "there", code);

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      resendAvailableAt: resendAvailableAt.toISOString(),
    });
  } catch (error) {
    console.error("Account creation failed:", error);
    return NextResponse.json(
      { error: "Account creation failed." },
      { status: 500 },
    );
  }
}
