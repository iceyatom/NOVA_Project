import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    category3: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category2: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category1: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import { DELETE, GET, PATCH, POST } from "./route";

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

describe("category management API route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Verifies GET only supports dependency lookups and rejects other actions.
  it("returns 405 for unsupported GET action", async () => {
    const response = await GET(
      makeRequest("http://localhost/api/catalog/staff/categories?action=list"),
    );
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body).toMatchObject({
      success: false,
      error: "Unsupported GET request.",
    });
  });

  // Verifies dependency checks for level-2 categories require a parent category.
  it("returns 400 for category2 dependency check without parent category", async () => {
    const response = await GET(
      makeRequest(
        "http://localhost/api/catalog/staff/categories?action=dependencies&level=category2&name=Microscope",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Parent Category is required.");
  });

  // Verifies level-3 dependency lookup returns both subcategory and type counts.
  it("returns category3 dependency counts", async () => {
    mockPrisma.category3.findUnique.mockResolvedValue({ id: 7 });
    mockPrisma.category2.count.mockResolvedValue(3);
    mockPrisma.category1.count.mockResolvedValue(9);

    const response = await GET(
      makeRequest(
        "http://localhost/api/catalog/staff/categories?action=dependencies&level=category3&name=Laboratory%20Supplies",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: {
        level: "category3",
        subcategoryCount: 3,
        typeCount: 9,
      },
    });
    expect(mockPrisma.category2.count).toHaveBeenCalledWith({
      where: { category3Id: 7 },
    });
  });

  // Verifies creating an existing level-3 category returns a conflict response.
  it("returns 409 when creating duplicate category3", async () => {
    mockPrisma.category3.findUnique.mockResolvedValue({ id: 1 });

    const response = await POST(
      makeRequest("http://localhost/api/catalog/staff/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "category3",
          name: "Laboratory Supplies",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe("Category already exists.");
  });

  // Verifies successful creation of a level-2 subcategory under a valid parent.
  it("creates category2 under a valid parent category", async () => {
    mockPrisma.category3.findUnique.mockResolvedValue({
      id: 10,
      name: "Laboratory Supplies",
    });
    mockPrisma.category2.findFirst.mockResolvedValue(null);
    mockPrisma.category2.create.mockResolvedValue({
      id: 20,
      name: "Microscopy Supplies",
    });

    const response = await POST(
      makeRequest("http://localhost/api/catalog/staff/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "category2",
          name: "Microscopy Supplies",
          parentCategory3: "Laboratory Supplies",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      success: true,
      data: {
        level: "category2",
        id: 20,
        name: "Microscopy Supplies",
        parentCategory3: "Laboratory Supplies",
      },
    });
  });

  // Verifies level-1 updates fail when the destination parent path does not exist.
  it("returns 404 when moving category1 to a non-existent target parent", async () => {
    mockPrisma.category1.findFirst.mockResolvedValue({
      id: 30,
      name: "Slides",
      category2: {
        id: 11,
        name: "Microscopy Supplies",
        category3: { id: 10, name: "Laboratory Supplies" },
      },
    });
    mockPrisma.category2.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      makeRequest("http://localhost/api/catalog/staff/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "category1",
          currentName: "Slides",
          newName: "Prepared Slides",
          currentParentCategory3: "Laboratory Supplies",
          currentParentCategory2: "Microscopy Supplies",
          newParentCategory3: "Live Plant Specimens",
          newParentCategory2: "Mosses",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe(
      "Target Parent Subcategory not found under selected Parent Category.",
    );
  });

  // Verifies Prisma unique-constraint failures during update map to HTTP 409.
  it("returns 409 on PATCH when a uniqueness conflict occurs", async () => {
    mockPrisma.category3.findUnique
      .mockResolvedValueOnce({ id: 1, name: "A" })
      .mockResolvedValueOnce({ id: 2, name: "B" });
    mockPrisma.category2.findFirst.mockResolvedValue({ id: 5, name: "Tools" });
    mockPrisma.category2.update.mockRejectedValue({ code: "P2002" });

    const response = await PATCH(
      makeRequest("http://localhost/api/catalog/staff/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "category2",
          currentName: "Tools",
          newName: "Common Tools",
          currentParentCategory3: "A",
          newParentCategory3: "B",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe(
      "A category with this name already exists under the selected parent.",
    );
  });

  // Verifies deleting a level-3 category returns cascade impact counts.
  it("deletes category3 and returns dependency totals", async () => {
    mockPrisma.category3.findUnique.mockResolvedValue({
      id: 44,
      name: "Microbiology",
    });
    mockPrisma.category2.count.mockResolvedValue(2);
    mockPrisma.category1.count.mockResolvedValue(6);
    mockPrisma.category3.delete.mockResolvedValue({ id: 44 });

    const response = await DELETE(
      makeRequest("http://localhost/api/catalog/staff/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "category3",
          name: "Microbiology",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: {
        level: "category3",
        name: "Microbiology",
        subcategoryCount: 2,
        typeCount: 6,
      },
    });
    expect(mockPrisma.category3.delete).toHaveBeenCalledWith({
      where: { id: 44 },
    });
  });

  // Verifies deleting a level-1 type requires both parent category and subcategory.
  it("returns 400 for category1 deletion without required parents", async () => {
    const response = await DELETE(
      makeRequest("http://localhost/api/catalog/staff/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "category1",
          name: "Prepared Slides",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      "Parent Category and Parent Subcategory are required.",
    );
  });
});
