import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStaffSession } from "@/lib/auth/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TicketType = "ORDER" | "SUPPLY" | "SPOILAGE";

const VALID_TICKET_TYPES = new Set(["ORDER", "SUPPLY", "SPOILAGE"] as const);

type CreateTicketRequestBody = {
  type?: unknown;
  notes?: unknown;
  createdByEmail?: unknown;
  lines?: unknown;
};

type ParsedLine = {
  catalogItemId: number;
  countDelta: number;
};
type TicketSummary = {
  totalTickets: number;
  supplyTickets: number;
  orderTickets: number;
  spoilageTickets: number;
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

function normalizeTicketType(type: string): TicketType {
  const normalizedType = type.trim().toUpperCase();

  if (VALID_TICKET_TYPES.has(normalizedType as TicketType)) {
    return normalizedType as TicketType;
  }

  return "ORDER";
}

function formatCardDate(date: Date): string {
  return date
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/,([^,]*)$/, " -$1");
}

function parseBody(body: CreateTicketRequestBody): {
  type: TicketType;
  notes: string;
  createdByEmail: string;
  lines: ParsedLine[];
} {
  const type =
    typeof body.type === "string" ? body.type.trim().toUpperCase() : "";
  if (!VALID_TICKET_TYPES.has(type as TicketType)) {
    throw new Error("Ticket type is invalid.");
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (!notes) {
    throw new Error("Ticket notes are required.");
  }
  if (notes.length > 500) {
    throw new Error("Ticket notes must be 500 characters or fewer.");
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
    type: type as TicketType,
    notes,
    createdByEmail,
    lines: parsedLines,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const limitRaw = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitRaw ? Number.parseInt(limitRaw, 10) : 80;
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 300)
      : 80;
  const typeRaw = request.nextUrl.searchParams.get("type");
  const normalizedType = typeRaw?.trim().toUpperCase() ?? "";
  const typeFilter =
    normalizedType.length > 0 &&
    VALID_TICKET_TYPES.has(normalizedType as TicketType)
      ? (normalizedType as TicketType)
      : null;

  if (typeRaw && !typeFilter) {
    return errorResponse("Ticket type filter is invalid.", 400);
  }

  try {
    const [
      tickets,
      totalTickets,
      supplyTickets,
      orderTickets,
      spoilageTickets,
    ] = await prisma.$transaction([
      prisma.ticket.findMany({
        where: typeFilter ? { type: typeFilter } : undefined,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit,
        select: {
          id: true,
          type: true,
          notes: true,
          createdAt: true,
          createdByAccountId: true,
          ticketLines: {
            select: {
              id: true,
              catalogItemId: true,
              countDelta: true,
              catalogItem: {
                select: {
                  itemName: true,
                  sku: true,
                  price: true,
                },
              },
            },
          },
        },
      }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { type: "SUPPLY" } }),
      prisma.ticket.count({ where: { type: "ORDER" } }),
      prisma.ticket.count({ where: { type: "SPOILAGE" } }),
    ]);

    const creatorIds = [
      ...new Set(tickets.map((ticket) => ticket.createdByAccountId)),
    ];
    const creators =
      creatorIds.length > 0
        ? await prisma.account.findMany({
            where: {
              id: {
                in: creatorIds,
              },
            },
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          })
        : [];

    const creatorById = new Map(
      creators.map((creator) => [creator.id, creator]),
    );

    const mappedTickets = tickets.map((ticket) => {
      const creator = creatorById.get(ticket.createdByAccountId);
      const authorName =
        creator?.displayName?.trim() || creator?.email || "Unknown author";
      const itemCount = new Set(
        ticket.ticketLines.map((line) => line.catalogItemId),
      ).size;
      const netQuantityDelta = ticket.ticketLines.reduce(
        (sum, line) => sum + line.countDelta,
        0,
      );

      return {
        id: ticket.id,
        type: normalizeTicketType(ticket.type),
        notes: ticket.notes,
        createdAt: formatCardDate(ticket.createdAt),
        createdAtIso: ticket.createdAt.toISOString(),
        createdByAccountId: ticket.createdByAccountId,
        authorName,
        authorEmail: creator?.email ?? null,
        lineCount: ticket.ticketLines.length,
        itemCount,
        netQuantityDelta,
        lines: ticket.ticketLines.map((line) => ({
          id: line.id,
          catalogItemId: line.catalogItemId,
          itemName: line.catalogItem.itemName,
          sku: line.catalogItem.sku,
          countDelta: line.countDelta,
          priceRate: line.catalogItem.price,
        })),
      };
    });

    const summary: TicketSummary = {
      totalTickets,
      supplyTickets,
      orderTickets,
      spoilageTickets,
    };

    return jsonResponse({
      success: true,
      tickets: mappedTickets,
      summary,
    });
  } catch (error) {
    console.error("[tickets/staff] fetch failed", error);
    return errorResponse("Failed to fetch tickets.", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

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
          notes: input.notes,
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
