import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");

  if (!category || !subcategory) {
    return NextResponse.json({ types: [] });
  }

  const items = await prisma.category1.findMany({
    where: {
      category2: {
        name: subcategory,
        category3: {
          name: category,
        },
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
    types: items.map((item) => item.name),
  });
}
