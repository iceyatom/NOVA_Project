import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "../route";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockAccountUpdate = vi.fn();
const mockPendingDelete = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockAccountUpdate(...args),
    },
    pendingVerification: {
      delete: (...args: unknown[]) => mockPendingDelete(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

const mockVerifyCode = vi.fn();

vi.mock("@/lib/auth/verificationCode", () => ({
  verifyVerificationCode: (...args: unknown[]) => mockVerifyCode(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 60_000);
const PAST = new Date(Date.now() - 60_000);

const pendingAccount = {
  id: 1,
  email: "user@example.com",
  displayName: "Test User",
  status: "pending",
  pendingVerification: { codeHash: "hashed_code", expiresAt: FUTURE },
};

function makeRequest(body: unknown): Request {
  return { json: () => Promise.resolve(body) } as unknown as Request;
}

function makeThrowingRequest(): Request {
  return {
    json: () => Promise.reject(new SyntaxError("bad json")),
  } as unknown as Request;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue(pendingAccount);
  mockVerifyCode.mockResolvedValue(true);
  mockTransaction.mockResolvedValue([{}, {}]);
});

describe("POST /api/verify-email", () => {
  it("returns 400 on invalid JSON body", async () => {
    const res = await POST(makeThrowingRequest() as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is missing", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when account is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "nobody@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when account status is not pending", async () => {
    mockFindUnique.mockResolvedValue({ ...pendingAccount, status: "active" });
    const res = await POST(makeRequest({ email: "user@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when account has no pendingVerification record", async () => {
    mockFindUnique.mockResolvedValue({ ...pendingAccount, pendingVerification: null });
    const res = await POST(makeRequest({ email: "user@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when the code is expired", async () => {
    mockFindUnique.mockResolvedValue({
      ...pendingAccount,
      pendingVerification: { codeHash: "hashed_code", expiresAt: PAST },
    });
    const res = await POST(makeRequest({ email: "user@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when code does not match hash", async () => {
    mockVerifyCode.mockResolvedValue(false);
    const res = await POST(makeRequest({ email: "user@example.com", code: "999999" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 200 and ok:true on valid code", async () => {
    const res = await POST(makeRequest({ email: "user@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("runs account update and pendingVerification delete in a transaction", async () => {
    await POST(makeRequest({ email: "user@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const txArgs = mockTransaction.mock.calls[0][0] as unknown[];
    expect(txArgs).toHaveLength(2);
  });

  it("uses a unified error message for all invalid cases (prevents enumeration)", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res1 = await POST(makeRequest({ email: "nobody@x.com", code: "000000" }) as unknown as import("next/server").NextRequest);
    const d1 = await res1.json();

    mockFindUnique.mockResolvedValue(pendingAccount);
    mockVerifyCode.mockResolvedValue(false);
    const res2 = await POST(makeRequest({ email: "user@example.com", code: "000000" }) as unknown as import("next/server").NextRequest);
    const d2 = await res2.json();

    expect(d1.error).toBe(d2.error);
    expect(d1.error).toBe("Invalid or expired verification code.");
  });

  it("normalizes email to lowercase before lookup", async () => {
    await POST(makeRequest({ email: "  USER@EXAMPLE.COM  ", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "user@example.com" } }),
    );
  });

  it("returns 500 when the database transaction throws", async () => {
    mockTransaction.mockRejectedValue(new Error("DB connection lost"));
    const res = await POST(makeRequest({ email: "user@example.com", code: "123456" }) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Unable to verify code.");
  });
});
