import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getActiveSessionAccount, normalizeRole } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TicketCreateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await getActiveSessionAccount();

  if (!account) {
    redirect("/login");
  }

  const normalizedRole = normalizeRole(account.role);
  if (normalizedRole === "ADMIN") {
    return children;
  }

  if (normalizedRole === "STAFF") {
    redirect("/staff/dashboard");
  }

  redirect("/account");
}
