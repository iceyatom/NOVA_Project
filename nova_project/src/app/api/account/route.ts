import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/passwordHash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SENSITIVE_LOCK_DAYS = 30;
const SENSITIVE_LOCK_MS = SENSITIVE_LOCK_DAYS * 24 * 60 * 60 * 1000;
const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 10;

type AccountUpdateBody = {
  currentEmail?: string;
  displayName?: string;
  phone?: string;
  newEmail?: string;
  currentPassword?: string;
  newPassword?: string;
};

type AccountDeleteBody = {
  currentEmail?: string;
  password?: string;
};

function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return withNoCache(NextResponse.json(body, { status }));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.trim();
}

function isValidPhone(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, "");
  return (
    digitsOnly.length >= MIN_PHONE_DIGITS &&
    digitsOnly.length <= MAX_PHONE_DIGITS
  );
}

function getPhoneDigitsLength(value: string): number {
  return value.replace(/\D/g, "").length;
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

function getLockInfo(sensitiveUpdatedAt: Date | null) {
  if (!sensitiveUpdatedAt) {
    return {
      isLocked: false,
      remainingMs: 0,
      unlocksAt: null as string | null,
    };
  }

  const unlockTime = sensitiveUpdatedAt.getTime() + SENSITIVE_LOCK_MS;
  const remainingMs = unlockTime - Date.now();

  if (remainingMs <= 0) {
    return {
      isLocked: false,
      remainingMs: 0,
      unlocksAt: null as string | null,
    };
  }

  return {
    isLocked: true,
    remainingMs,
    unlocksAt: new Date(unlockTime).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const emailParam = request.nextUrl.searchParams.get("email") ?? "";
  const email = normalizeEmail(emailParam);

  if (!email) {
    return jsonResponse({ ok: false, error: "Email is required." }, 400);
  }

  try {
    const account = await prisma.account.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        role: true,
        status: true,
        deletedAt: true,
        sensitiveUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account || account.deletedAt) {
      return jsonResponse({ ok: false, error: "Account not found." }, 404);
    }

    const lockInfo = getLockInfo(account.sensitiveUpdatedAt);

    return jsonResponse({
      ok: true,
      account: {
        id: account.id,
        email: account.email,
        displayName: account.displayName ?? "",
        phone: account.phone ?? "",
        role: account.role,
        status: account.status,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      sensitiveLock: lockInfo,
    });
  } catch (error) {
    console.error("[account/get] failed", error);
    return jsonResponse(
      { ok: false, error: "Unable to load account details." },
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  let body: AccountUpdateBody;

  try {
    body = (await request.json()) as AccountUpdateBody;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const currentEmail =
    typeof body.currentEmail === "string"
      ? normalizeEmail(body.currentEmail)
      : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const phone =
    typeof body.phone === "string" ? normalizePhone(body.phone) : "";
  const newEmail =
    typeof body.newEmail === "string" ? normalizeEmail(body.newEmail) : "";
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentEmail) {
    return jsonResponse(
      { ok: false, error: "Current email is required." },
      400,
    );
  }

  if (!displayName) {
    return jsonResponse({ ok: false, error: "Display name is required." }, 400);
  }

  if (!phone) {
    return jsonResponse({ ok: false, error: "Phone number is required." }, 400);
  }

  if (!isValidPhone(phone)) {
    const phoneDigitsLength = getPhoneDigitsLength(phone);
    const phoneError =
      phoneDigitsLength > MAX_PHONE_DIGITS
        ? "Phone number is too long. Use exactly 10 digits."
        : "Phone number is too short. Use exactly 10 digits.";

    return jsonResponse({ ok: false, error: phoneError }, 400);
  }

  try {
    const account = await prisma.account.findUnique({
      where: { email: currentEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        passwordHash: true,
        deletedAt: true,
        status: true,
        sensitiveUpdatedAt: true,
      },
    });

    if (!account || account.deletedAt) {
      return jsonResponse({ ok: false, error: "Account not found." }, 404);
    }

    const wantsEmailChange = !!newEmail && newEmail !== account.email;
    const wantsPasswordChange = !!newPassword;
    const wantsSensitiveChange = wantsEmailChange || wantsPasswordChange;
    const lockInfo = getLockInfo(account.sensitiveUpdatedAt);

    if (wantsEmailChange && !isValidEmail(newEmail)) {
      return jsonResponse(
        { ok: false, error: "Please enter a valid email address." },
        400,
      );
    }

    if (wantsPasswordChange && !isStrongPassword(newPassword)) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
        },
        400,
      );
    }

    if (wantsSensitiveChange && lockInfo.isLocked) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Sensitive fields are locked for 30 days after an email or password change.",
          sensitiveLock: lockInfo,
        },
        403,
      );
    }

    if (wantsSensitiveChange) {
      if (!currentPassword) {
        return jsonResponse(
          {
            ok: false,
            error: "Current password is required to change email or password.",
          },
          400,
        );
      }

      const passwordOk = await verifyPassword(
        currentPassword,
        account.passwordHash,
      );

      if (!passwordOk) {
        return jsonResponse(
          { ok: false, error: "Current password is incorrect." },
          401,
        );
      }
    }

    if (wantsEmailChange) {
      const existing = await prisma.account.findUnique({
        where: { email: newEmail },
        select: { id: true },
      });

      if (existing && existing.id !== account.id) {
        return jsonResponse(
          { ok: false, error: "An account with that email already exists." },
          409,
        );
      }
    }

    const updated = await prisma.account.update({
      where: { id: account.id },
      data: {
        displayName,
        phone,
        ...(wantsEmailChange ? { email: newEmail } : {}),
        ...(wantsPasswordChange
          ? { passwordHash: await hashPassword(newPassword) }
          : {}),
        ...(wantsSensitiveChange ? { sensitiveUpdatedAt: new Date() } : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        phone: true,
        role: true,
        status: true,
        sensitiveUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonResponse({
      ok: true,
      message: "Account updated successfully.",
      account: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName ?? "",
        phone: updated.phone ?? "",
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      sensitiveLock: getLockInfo(updated.sensitiveUpdatedAt),
    });
  } catch (error) {
    console.error("[account/update] failed", error);
    return jsonResponse({ ok: false, error: "Unable to update account." }, 500);
  }
}

export async function DELETE(request: NextRequest) {
  let body: AccountDeleteBody;

  try {
    body = (await request.json()) as AccountDeleteBody;
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const currentEmail =
    typeof body.currentEmail === "string"
      ? normalizeEmail(body.currentEmail)
      : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!currentEmail || !password) {
    return jsonResponse(
      { ok: false, error: "Email and password are required." },
      400,
    );
  }

  try {
    const account = await prisma.account.findUnique({
      where: { email: currentEmail },
      select: {
        id: true,
        passwordHash: true,
        deletedAt: true,
      },
    });

    if (!account || account.deletedAt) {
      return jsonResponse({ ok: false, error: "Account not found." }, 404);
    }

    const passwordOk = await verifyPassword(password, account.passwordHash);

    if (!passwordOk) {
      return jsonResponse(
        { ok: false, error: "Password confirmation failed." },
        401,
      );
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        status: "deleted",
        deletedAt: new Date(),
      },
    });

    return jsonResponse({
      ok: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    console.error("[account/delete] failed", error);
    return jsonResponse({ ok: false, error: "Unable to delete account." }, 500);
  }
}
