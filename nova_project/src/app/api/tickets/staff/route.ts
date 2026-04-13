import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TICKET_TYPES = new Set(["ORDER", "SUPPLY", "SPOILAGE"] as const);

type CreateTicketRequestBody = {
  type?: unknown;
  note?: unknown;
  createdByEmail?: unknown;
  lines?: unknown;
};

type ParsedLine = {
  catalogItemId: number;
  countDelta: number;
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

function parsePositiveInt(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseBody(body: CreateTicketRequestBody): {
  type: "ORDER" | "SUPPLY" | "SPOILAGE";
  note: string;
  createdByEmail: string;
  lines: ParsedLine[];
} {
  const type =
    typeof body.type === "string" ? body.type.trim().toUpperCase() : "";
  if (!VALID_TICKET_TYPES.has(type as "ORDER" | "SUPPLY" | "SPOILAGE")) {
    throw new Error("Ticket type is invalid.");
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) {
    throw new Error("Ticket note is required.");
  }

  const createdByEmail =
    typeof body.createdByEmail === "string"
      ? body.createdByEmail.trim().toLowerCase()
      : "";
  if (!createdByEmail) {
    throw new Error("Creator email is required.");
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    throw new Error("At least one ticket line is required.");
  }

  const parsedLines: ParsedLine[] = body.lines.map((line, index) => {
    if (!line || typeof line !== "object") {
      throw new Error(`Ticket line ${index + 1} is invalid.`);
    }

    const lineObj = line as Record<string, unknown>;
    const catalogItemId = parsePositiveInt(lineObj.catalogItemId);
    const countDelta = parsePositiveInt(lineObj.countDelta);

    if (!catalogItemId) {
      throw new Error(`Ticket line ${index + 1} must include a catalog item.`);
    }
    if (!countDelta) {
      throw new Error(`Ticket line ${index + 1} must include quantity.`);
    }

    return { catalogItemId, countDelta };
  });

  const seenCatalogIds = new Set<number>();
  for (const line of parsedLines) {
    if (seenCatalogIds.has(line.catalogItemId)) {
      throw new Error("Duplicate catalog items are not allowed.");
    }
    seenCatalogIds.add(line.catalogItemId);
  }

  return {
    type: type as "ORDER" | "SUPPLY" | "SPOILAGE",
    note,
    createdByEmail,
    lines: parsedLines,
  };
}

export async function POST(request: NextRequest) {
  let body: CreateTicketRequestBody;
  try {
    body = (await request.json()) as CreateTicketRequestBody;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  let input: ReturnType<typeof parseBody>;
  try {
    input = parseBody(body);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Invalid request body.",
      400,
    );
  }

  let catalogItemById = new Map<
    number,
    { id: number; itemName: string; quantityInStock: number }
  >();

  try {
    const creator = await prisma.account.findUnique({
      where: { email: input.createdByEmail },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (
      !creator ||
      creator.deletedAt ||
      creator.status.toLowerCase() !== "active"
    ) {
      return errorResponse(
        "Unable to resolve a valid active account for ticket creator.",
        400,
      );
    }

    const normalizedRole = creator.role.toUpperCase();
    if (normalizedRole !== "STAFF" && normalizedRole !== "ADMIN") {
      return errorResponse("Only staff accounts can create tickets.", 403);
    }

    const catalogIds = [
      ...new Set(input.lines.map((line) => line.catalogItemId)),
    ];
    const foundCatalogItems = await prisma.catalogItem.findMany({
      where: { id: { in: catalogIds } },
      select: { id: true, itemName: true, quantityInStock: true },
    });
    const foundCatalogIdSet = new Set(foundCatalogItems.map((item) => item.id));
    catalogItemById = new Map(foundCatalogItems.map((item) => [item.id, item]));

    const missingCatalogId = catalogIds.find(
      (id) => !foundCatalogIdSet.has(id),
    );
    if (missingCatalogId) {
      return errorResponse(
        `Catalog item ${missingCatalogId} does not exist.`,
        400,
      );
    }

    if (input.type === "ORDER" || input.type === "SPOILAGE") {
      for (const line of input.lines) {
        const catalogItem = catalogItemById.get(line.catalogItemId);
        if (!catalogItem) continue;

        if (line.countDelta > catalogItem.quantityInStock) {
          return errorResponse(
            `"${catalogItem.itemName}" only has ${catalogItem.quantityInStock} in stock, but ${line.countDelta} was requested.`,
            400,
          );
        }
      }
    }

    const deltaSign = input.type === "SUPPLY" ? 1 : -1;

    const createdTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          createdByAccountId: creator.id,
          type: input.type,
          note: input.note,
        },
        select: { id: true },
      });

      const lineWrites = input.lines.map((line) => ({
        ticketId: ticket.id,
        catalogItemId: line.catalogItemId,
        countDelta: deltaSign * line.countDelta,
      }));

      await tx.ticketLine.createMany({ data: lineWrites });

      for (const line of lineWrites) {
        if (line.countDelta < 0) {
          const result = await tx.catalogItem.updateMany({
            where: {
              id: line.catalogItemId,
              quantityInStock: { gte: Math.abs(line.countDelta) },
            },
            data: {
              quantityInStock: { increment: line.countDelta },
            },
          });

          if (result.count !== 1) {
            throw new Error(`INSUFFICIENT_STOCK:${line.catalogItemId}`);
          }
          continue;
        }

        const result = await tx.catalogItem.updateMany({
          where: { id: line.catalogItemId },
          data: {
            quantityInStock: { increment: line.countDelta },
          },
        });

        if (result.count !== 1) {
          throw new Error(`CATALOG_ITEM_NOT_FOUND:${line.catalogItemId}`);
        }
      }

      return ticket;
    });

    return jsonResponse({
      success: true,
      data: {
        ticketId: createdTicket.id,
        lineCount: input.lines.length,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        const id = Number.parseInt(error.message.split(":")[1] ?? "", 10);
        const name = Number.isFinite(id)
          ? catalogItemById.get(id)?.itemName
          : null;
        return errorResponse(
          name
            ? `"${name}" does not have enough stock to apply this ticket.`
            : "One or more items do not have enough stock to apply this ticket.",
          400,
        );
      }

      if (error.message.startsWith("CATALOG_ITEM_NOT_FOUND:")) {
        return errorResponse(
          "A selected catalog item no longer exists. Refresh and try again.",
          400,
        );
      }
    }

    console.error("[tickets/staff] create failed", error);
    return errorResponse("Failed to create ticket.", 500);
  }
}
