import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, txMock } = vi.hoisted(() => {
  const tx = {
    ticket: { create: vi.fn() },
    ticketLine: { createMany: vi.fn() },
    catalogItem: { updateMany: vi.fn() },
  };

  return {
    txMock: tx,
    mockPrisma: {
      account: { findUnique: vi.fn() },
      catalogItem: { findMany: vi.fn() },
      $transaction: vi.fn(),
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { POST } from "./route";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/tickets/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("tickets staff API route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb: typeof Function) =>
      cb(txMock),
    );
  });

  // Verifies malformed JSON bodies are rejected before request parsing.
  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest("http://localhost/api/tickets/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      error: "Invalid JSON body.",
    });
  });

  // Verifies ticket type validation blocks unsupported values.
  it("returns 400 for invalid ticket type", async () => {
    const response = await POST(
      makeRequest({
        type: "BAD_TYPE",
        note: "test",
        createdByEmail: "staff@example.com",
        lines: [{ catalogItemId: 1, countDelta: 1 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Ticket type is invalid.");
  });

  // Verifies duplicate catalog items across lines are rejected.
  it("returns 400 for duplicate catalog item lines", async () => {
    const response = await POST(
      makeRequest({
        type: "ORDER",
        note: "test",
        createdByEmail: "staff@example.com",
        lines: [
          { catalogItemId: 1, countDelta: 1 },
          { catalogItemId: 1, countDelta: 2 },
        ],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Duplicate catalog items are not allowed.");
  });

  // Verifies creator account must exist, be active, and not soft-deleted.
  it("returns 400 when creator account is invalid", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);

    const response = await POST(
      makeRequest({
        type: "ORDER",
        note: "valid note",
        createdByEmail: "missing@example.com",
        lines: [{ catalogItemId: 1, countDelta: 1 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      "Unable to resolve a valid active account for ticket creator.",
    );
  });

  // Verifies only STAFF/ADMIN roles can create tickets.
  it("returns 403 for non-staff creator role", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 10,
      role: "USER",
      status: "ACTIVE",
      deletedAt: null,
    });

    const response = await POST(
      makeRequest({
        type: "ORDER",
        note: "valid note",
        createdByEmail: "user@example.com",
        lines: [{ catalogItemId: 1, countDelta: 1 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Only staff accounts can create tickets.");
  });

  // Verifies all referenced catalog item IDs must exist.
  it("returns 400 when a catalog item does not exist", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 10,
      role: "STAFF",
      status: "ACTIVE",
      deletedAt: null,
    });
    mockPrisma.catalogItem.findMany.mockResolvedValue([]);

    const response = await POST(
      makeRequest({
        type: "ORDER",
        note: "valid note",
        createdByEmail: "staff@example.com",
        lines: [{ catalogItemId: 99, countDelta: 1 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Catalog item 99 does not exist.");
  });

  // Verifies ORDER/SPOILAGE requests are blocked when requested quantity exceeds stock.
  it("returns 400 when ORDER quantity exceeds stock", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 10,
      role: "STAFF",
      status: "ACTIVE",
      deletedAt: null,
    });
    mockPrisma.catalogItem.findMany.mockResolvedValue([
      { id: 1, itemName: "Slides", quantityInStock: 2 },
    ]);

    const response = await POST(
      makeRequest({
        type: "ORDER",
        note: "valid note",
        createdByEmail: "staff@example.com",
        lines: [{ catalogItemId: 1, countDelta: 5 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      '"Slides" only has 2 in stock, but 5 was requested.',
    );
  });

  // Verifies successful SUPPLY creation writes positive deltas and returns ticket metadata.
  it("creates SUPPLY ticket successfully", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 10,
      role: "STAFF",
      status: "ACTIVE",
      deletedAt: null,
    });
    mockPrisma.catalogItem.findMany.mockResolvedValue([
      { id: 1, itemName: "Slides", quantityInStock: 2 },
    ]);
    txMock.ticket.create.mockResolvedValue({ id: 123 });
    txMock.ticketLine.createMany.mockResolvedValue({ count: 1 });
    txMock.catalogItem.updateMany.mockResolvedValue({ count: 1 });

    const response = await POST(
      makeRequest({
        type: "SUPPLY",
        note: "restock",
        createdByEmail: "staff@example.com",
        lines: [{ catalogItemId: 1, countDelta: 3 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: {
        ticketId: 123,
        lineCount: 1,
      },
    });
    expect(txMock.ticketLine.createMany).toHaveBeenCalledWith({
      data: [{ ticketId: 123, catalogItemId: 1, countDelta: 3 }],
    });
  });

  // Verifies transactional stock failures map to user-facing insufficient-stock errors.
  it("returns 400 when stock changes fail during transaction", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({
      id: 10,
      role: "STAFF",
      status: "ACTIVE",
      deletedAt: null,
    });
    mockPrisma.catalogItem.findMany.mockResolvedValue([
      { id: 1, itemName: "Slides", quantityInStock: 100 },
    ]);
    txMock.ticket.create.mockResolvedValue({ id: 111 });
    txMock.ticketLine.createMany.mockResolvedValue({ count: 1 });
    txMock.catalogItem.updateMany.mockResolvedValue({ count: 0 });

    const response = await POST(
      makeRequest({
        type: "ORDER",
        note: "consume stock",
        createdByEmail: "staff@example.com",
        lines: [{ catalogItemId: 1, countDelta: 4 }],
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      '"Slides" does not have enough stock to apply this ticket.',
    );
  });
});
