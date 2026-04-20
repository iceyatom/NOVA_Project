import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import StaffShell from "./StaffShell";
import {
  getActiveSessionAccount,
  isStaffRole,
  normalizeRole,
} from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await getActiveSessionAccount();

  if (!account) {
    redirect("/login");
  }

  if (!isStaffRole(normalizeRole(account.role))) {
    redirect("/account");
  }

  return <StaffShell>{children}</StaffShell>;
}
