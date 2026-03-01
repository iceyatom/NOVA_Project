"use server";

import { hashPassword, verifyPassword } from "@/lib/auth/passwordHash";

export async function hashAction(
  formData: FormData,
): Promise<{ hash?: string; error?: string }> {
  const plaintext = formData.get("plaintext");
  if (typeof plaintext !== "string" || plaintext.trim() === "") {
    return { error: "Plaintext password is required." };
  }
  const hash = await hashPassword(plaintext);
  return { hash };
}

export async function verifyAction(
  formData: FormData,
): Promise<{ match?: boolean; error?: string }> {
  const plaintext = formData.get("plaintext");
  const hash = formData.get("hash");
  if (typeof plaintext !== "string" || plaintext.trim() === "") {
    return { error: "Plaintext password is required." };
  }
  if (typeof hash !== "string" || hash.trim() === "") {
    return { error: "Hash is required." };
  }
  const match = await verifyPassword(plaintext, hash);
  return { match };
}
