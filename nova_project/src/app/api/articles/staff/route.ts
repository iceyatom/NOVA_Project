import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateArticleRequestBody = {
  type?: unknown;
  title?: unknown;
  body?: unknown;
};

type ParsedArticleInput = {
  type: "INFO" | "NEWS";
  title: string;
  body: string;
};

function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function jsonResponse(body: unknown, status = 200): NextResponse {
  return withNoCache(NextResponse.json(body, { status }));
}

function errorResponse(error: string, status: number): NextResponse {
  return jsonResponse({ success: false, error }, status);
}

function parseCreateArticleBody(
  body: CreateArticleRequestBody,
): ParsedArticleInput {
  const rawType = typeof body.type === "string" ? body.type.trim() : "";
  const normalizedType = rawType.toLowerCase();

  if (normalizedType !== "info" && normalizedType !== "news") {
    throw new Error("Article type must be either info or news.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    throw new Error("Article title is required.");
  }
  if (title.length > 140) {
    throw new Error("Article title must be 140 characters or fewer.");
  }

  const articleBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!articleBody) {
    throw new Error("Article body is required.");
  }
  if (articleBody.length > 10000) {
    throw new Error("Article body must be 10000 characters or fewer.");
  }

  return {
    type: normalizedType === "info" ? "INFO" : "NEWS",
    title,
    body: articleBody,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: CreateArticleRequestBody;
  try {
    body = (await request.json()) as CreateArticleRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  let input: ParsedArticleInput;
  try {
    input = parseCreateArticleBody(body);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Invalid request body.",
      400,
    );
  }

  try {
    const authorName = auth.account.displayName?.trim() || auth.account.email;

    const created = await prisma.article.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        author: authorName,
      },
      select: {
        id: true,
        type: true,
        title: true,
        author: true,
        createdAt: true,
        modifiedAt: true,
      },
    });

    return jsonResponse(
      {
        success: true,
        data: created,
      },
      201,
    );
  } catch (error) {
    console.error("[articles/staff] create failed", error);
    return errorResponse("Failed to create article.", 500);
  }
}
