import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "../route";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    pendingVerification: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

const mockGenerateCode = vi.fn();
const mockHashCode = vi.fn();
const mockGetExpiry = vi.fn();

vi.mock("@/lib/auth/verificationCode", () => ({
  generateVerificationCode: () => mockGenerateCode(),
  hashVerificationCode: (...args: unknown[]) => mockHashCode(...args),
  getExpiryDate: (...args: unknown[]) => mockGetExpiry(...args),
}));

const mockSendEmail = vi.fn();

vi.mock("@/lib/email/emailService", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const pendingAccount = {
  id: 1,
  email: "user@example.com",
  displayName: "Test User",
  status: "pending",
};

const FIXED_EXPIRY = new Date("2030-01-01");

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
  mockGenerateCode.mockReturnValue("654321");
  mockHashCode.mockResolvedValue("hashed_654321");
  mockGetExpiry.mockReturnValue(FIXED_EXPIRY);
  mockUpsert.mockResolvedValue({});
  mockSendEmail.mockResolvedValue(undefined);
});

describe("POST /api/resend-verification", () => {
  it("returns 400 on invalid JSON body", async () => {
    const res = await POST(makeThrowingRequest() as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({}) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 200 even when account is not found (prevents enumeration)", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeRequest({ email: "nobody@example.com" }) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns 200 even when account is already active (prevents enumeration)", async () => {
    mockFindUnique.mockResolvedValue({ ...pendingAccount, status: "active" });
    const res = await POST(makeRequest({ email: "user@example.com" }) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("upserts a new verification code, invalidating the previous one", async () => {
    await POST(makeRequest({ email: "user@example.com" }) as unknown as import("next/server").NextRequest);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: 1 },
        update: expect.objectContaining({ codeHash: "hashed_654321", expiresAt: FIXED_EXPIRY }),
        create: expect.objectContaining({ accountId: 1, codeHash: "hashed_654321", expiresAt: FIXED_EXPIRY }),
      }),
    );
  });

  it("sends the new verification email", async () => {
    await POST(makeRequest({ email: "user@example.com" }) as unknown as import("next/server").NextRequest);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Test User",
      "654321",
    );
  });

  it("returns 200 and ok:true on successful resend", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("normalizes email to lowercase before lookup", async () => {
    await POST(makeRequest({ email: "  USER@EXAMPLE.COM  " }) as unknown as import("next/server").NextRequest);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "user@example.com" } }),
    );
  });
});
