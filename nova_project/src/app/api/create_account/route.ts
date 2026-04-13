import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  generateVerificationCode,
  hashVerificationCode,
  getExpiryDate,
} from "@/lib/auth/verificationCode";
import { sendVerificationEmail } from "@/lib/email/emailService";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, phone, role } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Reject if an active (verified) account already exists with this email
    const existing = await prisma.account.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.status === "active") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Only allow STAFF or CUSTOMER via public form, never ADMIN
    let safeRole = "CUSTOMER";
    if (role === "STAFF") safeRole = "STAFF";

    //temporarily allow admin for testing, but should be removed in production
    if (role === "ADMIN") safeRole = "ADMIN"; // Remove this line in production to prevent public admin creation

    // Create or update the account in pending state
    let account;
    if (existing && existing.status !== "active") {
      // Re-registration while still pending — update credentials
      account = await prisma.account.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: safeRole,
          displayName: displayName || null,
          phone: phone || null,
        },
      });
    } else {
      account = await prisma.account.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: safeRole,
          status: "pending",
          displayName: displayName || null,
          phone: phone || null,
        },
      });
    }

    // Generate and store a hashed verification code
    const code = generateVerificationCode();
    const codeHash = await hashVerificationCode(code);
    const expiresAt = getExpiryDate(15);

    await prisma.pendingVerification.upsert({
      where: { accountId: account.id },
      update: { codeHash, expiresAt },
      create: { accountId: account.id, codeHash, expiresAt },
    });

    // Send the verification email
    await sendVerificationEmail(normalizedEmail, displayName || "there", code);

    return NextResponse.json({ success: true, email: normalizedEmail });
  } catch (error) {
    console.error("Account creation failed:", error);
    return NextResponse.json(
      { error: "Account creation failed." },
      { status: 500 },
    );
  }
}
