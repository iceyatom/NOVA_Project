import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prisma = await getPrisma();
    const rows = await prisma.$queryRaw<{ ok: number | string | bigint }[]>`
      SELECT 1 AS ok
    `;

    return NextResponse.json(
      rows.map((row) => ({
        ok: Number(row.ok),
      })),
    );
  } catch (error) {
    console.error("[db-test] database check failed", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown database error.",
        env: {
          hasDbHost: Boolean(process.env.DB_HOST),
          hasDbUser: Boolean(process.env.DB_USER),
          hasDbName: Boolean(process.env.DB_NAME),
          hasDbPort: Boolean(process.env.DB_PORT),
          hasAwsRegion: Boolean(process.env.AWS_REGION),
          hasAwsRoleArn: Boolean(process.env.AWS_ROLE_ARN),
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 },
    );
  }
}
