import { describe, it, expect } from "vitest";
import {
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
  getExpiryDate,
} from "../verificationCode";

describe("generateVerificationCode", () => {
  it("returns a 6-character string", () => {
    expect(generateVerificationCode()).toHaveLength(6);
  });

  it("returns only digit characters", () => {
    expect(generateVerificationCode()).toMatch(/^[0-9]{6}$/);
  });

  it("always produces a 6-digit string across many calls", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateVerificationCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[0-9]{6}$/);
    }
  });
});

describe("hashVerificationCode / verifyVerificationCode", () => {
  it("produces a hash that is not the plain code", async () => {
    const hash = await hashVerificationCode("123456");
    expect(hash).not.toBe("123456");
  });

  it("verifies correctly when the code matches", async () => {
    const hash = await hashVerificationCode("123456");
    await expect(verifyVerificationCode("123456", hash)).resolves.toBe(true);
  });

  it("returns false when the code does not match", async () => {
    const hash = await hashVerificationCode("123456");
    await expect(verifyVerificationCode("654321", hash)).resolves.toBe(false);
  });

  it("two hashes of the same code are not equal (bcrypt salting)", async () => {
    const h1 = await hashVerificationCode("111111");
    const h2 = await hashVerificationCode("111111");
    expect(h1).not.toBe(h2);
  });
});

describe("getExpiryDate", () => {
  it("defaults to 15 minutes from now", () => {
    const before = Date.now();
    const expiry = getExpiryDate();
    const after = Date.now();
    const ms = expiry.getTime();
    expect(ms).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
    expect(ms).toBeLessThanOrEqual(after + 15 * 60 * 1000);
  });

  it("respects a custom minute value", () => {
    const before = Date.now();
    const expiry = getExpiryDate(30);
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 30 * 60 * 1000);
  });

  it("returns a Date instance", () => {
    expect(getExpiryDate()).toBeInstanceOf(Date);
  });
});
