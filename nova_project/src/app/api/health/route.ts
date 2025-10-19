import { NextResponse } from "next/server";

const startTime = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const body = {
    status: "ok",
    version: process.env.APP_VERSION ?? "dev",
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  };

  const res = NextResponse.json(body, { status: 200 });

  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  return res;
}
