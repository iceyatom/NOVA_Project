import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/passwordHash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterBody = {
  email?: string;
  password?: string;
  displayName?: string;
  phone?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

function isStrongPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
}

function getPhoneError(value: string): string | null {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "Phone number is required.";
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return "Do not include a leading 1. Enter a 10-digit phone number.";
  }

  if (digitsOnly.length < 10) {
    return "Phone number is too short. Use exactly 10 digits.";
  }

  if (digitsOnly.length > 10) {
    return "Phone number is too long. Use exactly 10 digits.";
  }

  return null;
}

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const phoneDigits = rawPhone.replace(/\D/g, "");

  if (!email || !password || !displayName || !rawPhone) {
    return NextResponse.json(
      { ok: false, error: "All fields are required." },
      { status: 400 },
    );
  }

  const phoneError = getPhoneError(rawPhone);
  if (phoneError) {
    return NextResponse.json({ ok: false, error: phoneError }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please enter a valid email address (e.g. user@example.com).",
      },
      { status: 400 },
    );
  }

  if (!isStrongPassword(password)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
      },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.account.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const account = await prisma.account.create({
      data: {
        email,
        passwordHash,
        displayName,
        phone: phoneDigits,
        role: "STAFF",
      },
    });

    return NextResponse.json({
      ok: true,
      account: {
        email: account.email,
        displayName: account.displayName,
      },
    });
  } catch (error) {
    console.error("Register API failed:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to create account." },
      { status: 500 },
    );
  }
}
