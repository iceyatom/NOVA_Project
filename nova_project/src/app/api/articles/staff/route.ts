import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ArticleRequestBody = {
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

function parsePositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseArticleTypeFilter(value: string | null): "INFO" | "NEWS" | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "info") {
    return "INFO";
  }
  if (normalized === "news") {
    return "NEWS";
  }

  throw new Error("Article filter type must be info or news.");
}

function parseArticleBody(body: ArticleRequestBody): ParsedArticleInput {
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

export async function GET(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const articleIdParam = searchParams.get("id");
  const articleId = parsePositiveInt(articleIdParam);
  const query = (searchParams.get("query") ?? "").trim();
  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(200, Math.max(1, Number.parseInt(limitParam, 10) || 120))
    : 120;

  if (articleIdParam != null && articleId == null) {
    return errorResponse("id must be a positive integer when provided.", 400);
  }

  let typeFilter: "INFO" | "NEWS" | null;
  try {
    typeFilter = parseArticleTypeFilter(searchParams.get("type"));
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Invalid article type filter.",
      400,
    );
  }

  try {
    if (articleId != null) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          author: true,
          createdAt: true,
          modifiedAt: true,
        },
      });

      if (!article) {
        return errorResponse("Article not found.", 404);
      }

      return jsonResponse({
        success: true,
        data: article,
      });
    }

    const queryTokens = query.split(/\s+/).filter(Boolean);
    const titleAndFilters =
      queryTokens.length > 0
        ? queryTokens.map((token) => ({
            title: {
              contains: token,
            },
          }))
        : [];

    const articles = await prisma.article.findMany({
      where: {
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(titleAndFilters.length > 0 ? { AND: titleAndFilters } : {}),
      },
      orderBy: [{ modifiedAt: "desc" }, { id: "desc" }],
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        author: true,
        createdAt: true,
        modifiedAt: true,
      },
    });

    return jsonResponse({
      success: true,
      data: articles,
    });
  } catch (error) {
    console.error("[articles/staff] load failed", error);
    return errorResponse("Failed to load articles.", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: ArticleRequestBody;
  try {
    body = (await request.json()) as ArticleRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  let input: ParsedArticleInput;
  try {
    input = parseArticleBody(body);
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

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const articleId = parsePositiveInt(searchParams.get("id"));
  if (!articleId) {
    return errorResponse("A valid id query parameter is required.", 400);
  }

  let body: ArticleRequestBody;
  try {
    body = (await request.json()) as ArticleRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  let input: ParsedArticleInput;
  try {
    input = parseArticleBody(body);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Invalid request body.",
      400,
    );
  }

  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
      },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        author: true,
        createdAt: true,
        modifiedAt: true,
      },
    });

    return jsonResponse({
      success: true,
      data: updated,
    });
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code: string }).code ?? "")
        : "";
    if (code === "P2025") {
      return errorResponse("Article not found.", 404);
    }

    console.error("[articles/staff] update failed", error);
    return errorResponse("Failed to save article changes.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const articleId = parsePositiveInt(searchParams.get("id"));
  if (!articleId) {
    return errorResponse("A valid id query parameter is required.", 400);
  }

  try {
    const deleted = await prisma.article.delete({
      where: { id: articleId },
      select: {
        id: true,
        title: true,
      },
    });

    return jsonResponse({
      success: true,
      data: deleted,
    });
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? ((error as { code: string }).code ?? "")
        : "";
    if (code === "P2025") {
      return errorResponse("Article not found.", 404);
    }

    console.error("[articles/staff] delete failed", error);
    return errorResponse("Failed to delete article.", 500);
  }
}
