import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null, status: "active" },
      select: { id: true, displayName: true, email: true, role: true },
      orderBy: { displayName: "asc" },
    });

    return NextResponse.json({ success: true, accounts });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch accounts." },
      { status: 500 },
    );
  }
}
