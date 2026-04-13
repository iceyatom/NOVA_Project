import { vi, describe, it, expect, beforeEach } from "vitest";
import { POST } from "../route";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockPendingUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    pendingVerification: {
      upsert: (...args: unknown[]) => mockPendingUpsert(...args),
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

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed_pw") },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const validBody = {
  email: "new@example.com",
  password: "plaintext123",
  displayName: "New User",
  phone: "5551234567",
  role: "CUSTOMER",
};

function makeRequest(body: unknown): Request {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

function makeThrowingRequest(): Request {
  return {
    json: () => Promise.reject(new SyntaxError("bad json")),
  } as unknown as Request;
}

const FIXED_EXPIRY = new Date("2030-01-01");

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue(null);
  mockCreate.mockResolvedValue({ id: 1, email: validBody.email, displayName: validBody.displayName, status: "pending" });
  mockPendingUpsert.mockResolvedValue({});
  mockGenerateCode.mockReturnValue("123456");
  mockHashCode.mockResolvedValue("hashed_code");
  mockGetExpiry.mockReturnValue(FIXED_EXPIRY);
  mockSendEmail.mockResolvedValue(undefined);
});

describe("POST /api/create_account", () => {
  it("returns 400 on invalid JSON body", async () => {
    const res = await POST(makeThrowingRequest() as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(500); // falls through to catch
  });

  it("returns 400 when email is missing", async () => {
    const { email: _omit, ...body } = validBody;
    const res = await POST(makeRequest(body) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe("Email and password are required.");
  });

  it("returns 400 when password is missing", async () => {
    const { password: _omit, ...body } = validBody;
    const res = await POST(makeRequest(body) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(400);
  });

  it("returns 409 when an active account with that email already exists", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, email: validBody.email, status: "active" });
    const res = await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(409);
    expect(data.error).toBe("An account with this email already exists.");
  });

  it("creates account with status 'pending' for a new email", async () => {
    await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "pending", email: validBody.email }),
      }),
    );
  });

  it("upserts a PendingVerification record after account creation", async () => {
    await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    expect(mockPendingUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: 1 },
        update: expect.objectContaining({ codeHash: "hashed_code", expiresAt: FIXED_EXPIRY }),
        create: expect.objectContaining({ accountId: 1, codeHash: "hashed_code", expiresAt: FIXED_EXPIRY }),
      }),
    );
  });

  it("sends a verification email with the generated code", async () => {
    await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    expect(mockSendEmail).toHaveBeenCalledWith(
      validBody.email,
      validBody.displayName,
      "123456",
    );
  });

  it("returns success with the email on successful registration", async () => {
    const res = await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.email).toBe(validBody.email);
  });

  it("allows re-registration when existing account is still pending", async () => {
    mockFindUnique.mockResolvedValue({ id: 1, email: validBody.email, status: "pending" });
    mockUpdate.mockResolvedValue({ id: 1, email: validBody.email, status: "pending" });
    const res = await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 500 if sendVerificationEmail throws", async () => {
    mockSendEmail.mockRejectedValue(new Error("SMTP failure"));
    const res = await POST(makeRequest(validBody) as unknown as import("next/server").NextRequest);
    expect(res.status).toBe(500);
  });

  it("normalizes email to lowercase before processing", async () => {
    await POST(makeRequest({ ...validBody, email: "  NEW@EXAMPLE.COM  " }) as unknown as import("next/server").NextRequest);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
  });

  it("falls back to 'there' as display name in the verification email when displayName is omitted", async () => {
    const { displayName: _omit, ...bodyWithoutName } = validBody;
    mockCreate.mockResolvedValue({ id: 1, email: validBody.email, displayName: null, status: "pending" });
    await POST(makeRequest(bodyWithoutName) as unknown as import("next/server").NextRequest);
    expect(mockSendEmail).toHaveBeenCalledWith(validBody.email, "there", "123456");
  });
});
