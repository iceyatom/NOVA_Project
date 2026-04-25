import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export async function GET(req: Request) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ subcategories: [] });
  }

  const items = await prisma.category2.findMany({
    where: {
      category3: {
        name: category,
      },
    },
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    subcategories: items.map((item) => item.name),
  });
}
