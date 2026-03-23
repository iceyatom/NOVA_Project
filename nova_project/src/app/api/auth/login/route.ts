import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/passwordHash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginBody = {
  email?: string;
  password?: string;
};

type ParsedLoginBody = {
  email: string;
  password: string;
};

function hasPrismaConfig(): boolean {
  return Boolean((process.env.DATABASE_URL ?? "").trim());
}

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

function errorResponse(
  error: string,
  status: number,
  extras?: Record<string, unknown>,
): NextResponse {
  return jsonResponse(
    {
      ok: false,
      error,
      ...(extras ?? {}),
    },
    status,
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function safeFailedAttempts(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function getLockoutDurationMs(failedAttempts: number): number {
  if (failedAttempts >= 4) {
    return 5 * 60 * 1000;
  }

  if (failedAttempts >= 3) {
    return 60 * 1000;
  }

  return 0;
}

async function parseLoginBody(request: Request): Promise<ParsedLoginBody> {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    throw new Error("Invalid JSON body.");
  }

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  return { email, password };
}

export async function POST(request: Request) {
  if (!hasPrismaConfig()) {
    console.error("[auth/login] DATABASE_URL is not configured");
    return errorResponse("Authentication database is not configured.", 500);
  }

  let input: ParsedLoginBody;

  try {
    input = await parseLoginBody(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request body.";
    return errorResponse(message, 400);
  }

  const { email, password } = input;

  console.log("[auth/login] request received", { email });

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
        failedLoginAttempts: true,
        lockoutUntil: true,
      },
    });

    console.log("[auth/login] account lookup", {
      email,
      found: Boolean(account),
    });

    if (
      !account ||
      account.deletedAt ||
      account.status.toLowerCase() !== "active"
    ) {
      return errorResponse("Invalid email or password.", 401);
    }

    const now = new Date();

    if (account.lockoutUntil && account.lockoutUntil > now) {
      console.warn("[auth/login] blocked by lockout", {
        accountId: account.id,
        email: account.email,
        lockoutUntil: account.lockoutUntil.toISOString(),
      });

      return errorResponse(
        "Your account is temporarily locked due to repeated failed login attempts.",
        429,
        {
          locked: true,
          lockoutUntil: account.lockoutUntil.toISOString(),
        },
      );
    }

    let passwordOk = false;

    try {
      passwordOk = await verifyPassword(password, account.passwordHash);
    } catch (error) {
      console.error("[auth/login] password verification failed unexpectedly", {
        accountId: account.id,
        email: account.email,
        error,
      });
      passwordOk = false;
    }

    if (!passwordOk) {
      const failureResult = await prisma.$transaction(async (tx) => {
        const latest = await tx.account.findUnique({
          where: { id: account.id },
          select: {
            failedLoginAttempts: true,
            lockoutUntil: true,
          },
        });

        const currentTime = new Date();

        if (latest?.lockoutUntil && latest.lockoutUntil > currentTime) {
          return {
            locked: true,
            lockoutUntil: latest.lockoutUntil,
            failedAttempts: safeFailedAttempts(latest.failedLoginAttempts),
          };
        }

        const currentFailedAttempts = safeFailedAttempts(
          latest?.failedLoginAttempts,
        );
        const nextFailedAttempts = currentFailedAttempts + 1;
        const lockoutMs = getLockoutDurationMs(nextFailedAttempts);
        const nextLockoutUntil =
          lockoutMs > 0 ? new Date(currentTime.getTime() + lockoutMs) : null;

        const updated = await tx.account.update({
          where: { id: account.id },
          data: {
            failedLoginAttempts: nextFailedAttempts,
            lockoutUntil: nextLockoutUntil,
          },
          select: {
            failedLoginAttempts: true,
            lockoutUntil: true,
          },
        });

        return {
          locked: Boolean(updated.lockoutUntil),
          lockoutUntil: updated.lockoutUntil,
          failedAttempts: safeFailedAttempts(updated.failedLoginAttempts),
        };
      });

      console.warn("[auth/login] invalid password", {
        accountId: account.id,
        email: account.email,
        failedAttempts: failureResult.failedAttempts,
        lockoutUntil: failureResult.lockoutUntil?.toISOString() ?? null,
      });

      if (failureResult.lockoutUntil) {
        return errorResponse(
          failureResult.failedAttempts >= 4
            ? "Too many failed login attempts. Your account is locked for 5 minutes."
            : "Too many failed login attempts. Your account is locked for 60 seconds.",
          429,
          {
            locked: true,
            lockoutUntil: failureResult.lockoutUntil.toISOString(),
          },
        );
      }

      return errorResponse("Invalid email or password.", 401);
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    console.log("[auth/login] login succeeded", {
      accountId: account.id,
      email: account.email,
    });

    return jsonResponse({
      ok: true,
      account: {
        email: account.email,
        displayName: account.displayName,
      },
    });
  } catch (error) {
    console.error("[auth/login] route failed", error);
    return errorResponse("Unable to process login request.", 500);
  }
}