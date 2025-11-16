// src/app/catalog/page.tsx

// Page shows the catalog using placeholder items (for now)
// and, at the bottom, includes a simple Prisma connectivity test
// that lists all CatalogItem ids and itemNames from the DB.

import { Console } from "console";
import ItemCard from "../components/ItemCard";
import ItemCardSkeleton from "../components/ItemCardSkeleton";
import APIError from "./APIError";
import { prisma } from "@/lib/db"; // direct Prisma test

export const dynamic = "force-dynamic";

function getItems() {
  return [
    {
      id: 1,
      itemName: "Item 1 That has a Really Long Name",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/e/eb/Ash_Tree_-_geograph.org.uk_-_590710.jpg",
      category3: "Category 1.3",
      category2: "Category 1.2",
      category1: "Category 1.1",
      description: "This is a description for Item 1.",
      unitCost: 10.5,
      unitType: "each",
      quantity: 1,
      stock: 10,
    },
    {
      id: 2,
      itemName: "Item 2",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_02.jpg",
      category3: "Category 2.3",
      category2: "Category 2.2",
      category1: "Category 2.1",
      description: "This is a description for Item 2.",
      unitCost: 2.75,
      unitType: "per box",
      quantity: 5,
      stock: 2,
    },
    {
      id: 3,
      itemName: "Item 3",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_03.jpg",
      category3: "Category 3.3",
      category2: "Category 3.2",
      category1: "Category 3.1",
      description: "This is a description for Item 3.",
      unitCost: 5.05,
      unitType: "each",
      quantity: 1,
      stock: 0,
    },
    {
      id: 4,
      itemName: "Item 4",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_04.jpg",
      category3: "Category 4.3",
      category2: "Category 4.2",
      category1: "Category 4.1",
      description: "This is a description for Item 4.",
      unitCost: 5.5,
      unitType: "per crate",
      quantity: 10,
      stock: 4,
    },
    {
      id: 5,
      itemName: "Item 5",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_05.jpg",
      category3: "Category 5.3",
      category2: "Category 5.2",
      category1: "Category 5.1",
      description: "This is a description for Item 5.",
      unitCost: 10,
      unitType: "each",
      quantity: 5,
      stock: 7,
    },
    {
      id: 6,
      itemName: "Item 6",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_06.jpg",
      category3: "Category 6.3",
      category2: "Category 6.2",
      category1: "Category 6.1",
      description: "This is a description for Item 6.",
      unitCost: 10,
      unitType: "each",
      quantity: 7,
      stock: 0,
    },
    {
      id: 7,
      itemName: "Item 7",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_07.jpg",
      category3: "Category 7.3",
      category2: "Category 7.2",
      category1: "Category 7.1",
      description: "This is a description for Item 7.",
      unitCost: 10,
      unitType: "each",
      quantity: 17,
      stock: 20,
    },
    {
      id: 8,
      itemName: "Item 8",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_08.jpg",
      category3: "Category 8.3",
      category2: "Category 8.2",
      category1: "Category 8.1",
      description: "This is a description for Item 8.",
      unitCost: 10,
      unitType: "each",
      quantity: 20,
      stock: 15,
    },
    {
      id: 9,
      itemName: "Item 9",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_09.jpg",
      category3: "Category 9.3",
      category2: "Category 9.2",
      category1: "Category 9.1",
      description: "This is a description for Item 9.",
      unitCost: 10,
      unitType: "each",
      quantity: 2,
      stock: 10,
    },
    {
      id: 10,
      itemName: "Item 10",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_10.jpg",
      category3: "Category 10.3",
      category2: "Category 10.2",
      category1: "Category 10.1",
      description: "This is a description for Item 10.",
      unitCost: 10,
      unitType: "each",
      quantity: 2,
      stock: 10,
    },
    {
      id: 11,
      itemName: "Item 11",
      imageUrl: "none",
      category3: "Category 11.3",
      category2: "Category 11.2",
      category1: "Category 11.1",
      description: "description",
      unitCost: 10,
      unitType: "each",
      quantity: 2,
      stock: 10,
    },
  ];
}

type DbItem = {
  id: number;
  sku: string | null;
  itemName: string;
  price: number | null;
  category3: string | null;
  category2: string | null;
  category1: string | null;
  description: string | null;
  quantityInStock: number | null;
};

type CatalogApiResponse = {
  success: boolean;
  data?: {
    id: number;
    sku: string | null;
    itemName: string;
    price: number | null;
    category3: string | null;
    category2: string | null;
    category1: string | null;
    description: string | null;
    quantityInStock: number | null;
  }[];
  count?: number;
  error?: string;
};

function groupItemsByCategory(items: DbItem[]) {
  return Object.entries(
    items.reduce<Record<string, DbItem[]>>((acc, item) => {
      const key = item.category3?.trim() || "Uncategorized";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {}),
  ).sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB));
}

function renderGroupedTable(entries: [string, DbItem[]][]) {
  if (!entries.length) {
    return null;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border-b border-gray-200 px-3 py-2">ID</th>
            <th className="border-b border-gray-200 px-3 py-2">SKU</th>
            <th className="border-b border-gray-200 px-3 py-2">Item Name</th>
            <th className="border-b border-gray-200 px-3 py-2 text-right">
              Price
            </th>
          </tr>
        </thead>
        {entries.map(([category, itemsInCategory]) => (
          <tbody key={category}>
            <tr>
              <th
                scope="colgroup"
                colSpan={4}
                className="bg-gray-200 border-t border-gray-300 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide"
              >
                {category}
              </th>
            </tr>
            {itemsInCategory.map((it) => (
              <tr key={it.id}>
                <td className="border-t border-gray-200 px-3 py-2">{it.id}</td>
                <td className="border-t border-gray-200 px-3 py-2">
                  {it.sku ?? "N/A"}
                </td>
                <td className="border-t border-gray-200 px-3 py-2">
                  {it.itemName}
                </td>
                <td className="border-t border-gray-200 px-3 py-2 text-right">
                  {it.price !== null ? `$${it.price.toFixed(2)}` : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function DiagnosticsPanel({
  title,
  status,
  entries,
}: {
  title: string;
  status: string;
  entries: [string, DbItem[]][];
}) {
  return (
    <section className="diagnostics-panel">
      <details className="diagnostics-panel__details">
        <summary className="diagnostics-panel__summary">
          <span className="diagnostics-panel__title">{title}</span>
          <span className="diagnostics-panel__status">{status}</span>
        </summary>
        <div className="diagnostics-panel__content">
          {renderGroupedTable(entries) ?? (
            <p className="text-sm text-gray-600">No items to display.</p>
          )}
        </div>
      </details>
    </section>
  );
}

function getBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  try {
    return new URL(envUrl).toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

function getSafeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const firstLine = error.message.split("\n")[0]?.trim();
    if (firstLine) {
      return firstLine;
    }
  }
  return fallback;
}

// made async so we can await Prisma queries below
export default async function CatalogPage() {

  // --- Direct Prisma test block ---
  let dbStatus: string;
  let dbItems: DbItem[] = [];

  try {
    dbItems = await prisma.catalogItem.findMany({
      select: {
        id: true,
        sku: true,
        itemName: true,
        price: true,
        category3: true,
        category2: true,
        category1: true,
        description: true,
        quantityInStock: true,
      }, // matches your schema
      orderBy: [{ category3: "asc" }, { id: "asc" }],
    });
    dbStatus = `Connected to database. ${dbItems.length} catalog items found.`;
  } catch (err: unknown) {
    const message = getSafeErrorMessage(err, "Unknown error");
    dbStatus = `Database request failed: ${message}`;
  }
  // -------------------------------------------------------------------

  // --- API route test block ---
  let apiStatus = "Loading catalog via API…";
  let apiItems: DbItem[] = [];

  // Page filters 
  let page: number | null = null;
  let itemsPerPage: number | null = null;
  let skip = page !== null && itemsPerPage !== null ? (page - 1) * itemsPerPage : null;
  let take = itemsPerPage !== null ? itemsPerPage : null;

  // Where filters 
  let itemName: string | null = null;

  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  let category: string | null = null; // Used as a generic category 
  let category3: string | null = null;
  let category2: string | null = null;
  let category1: string | null = null;

  let description: string | null = null;

  let inStock: boolean | null = null;

  // Order by fields 
  let idOrder: "asc" | "desc" | null = null;
  let skuOrder: "asc" | "desc" | null = null;
  let itemNameOrder: "asc" | "desc" | null = null;
  let priceOrder: "asc" | "desc" | null = null;
  let category3Order: "asc" | "desc" | null = null;
  let category2Order: "asc" | "desc" | null = null;
  let category1Order: "asc" | "desc" | null = null;
  let descriptionOrder: "asc" | "desc" | null = null;
  let quantityInStockOrder: "asc" | "desc" | null = null;

  try {
    const result = await prisma.catalogItem.findMany(
      {
        select: {
          id: true,
          sku: true,
          itemName: true,
          price: true,
          category3: true,
          category2: true,
          category1: true,
          description: true,
          quantityInStock: true,
        },
        where: {
          AND: [
            itemName !== null
              ? { itemName: { contains: itemName } }
              : {},
            minPrice !== null
              ? { price: { gte: minPrice } }
              : {},
            maxPrice !== null
              ? { price: { lte: maxPrice } }
              : {},
            category !== null
              ? {
                  OR: [
                    { category3: category },
                    { category2: category },
                    { category1: category },
                  ],
                }
              : {
                  category3: category3 ?? undefined,
                  category2: category2 ?? undefined,
                  category1: category1 ?? undefined,
                },
            description !== null
              ? { description: { contains: description } }
              : {},
            inStock === null
              ? {}
              : inStock
              ? { quantityInStock: { gt: 0 } }
              : { quantityInStock: { lt: 1 } },
          ],
        },
        orderBy: [
          { id: idOrder ?? undefined },
          { sku: skuOrder ?? undefined },
          { itemName: itemNameOrder ?? undefined },
          { price: priceOrder ?? undefined },
          { category3: category3Order ?? undefined },
          { category2: category2Order ?? undefined },
          { category1: category1Order ?? undefined },
          { description: descriptionOrder ?? undefined },
          { quantityInStock: quantityInStockOrder ?? undefined },
        ],
        skip: skip ?? undefined,
        take: take ?? undefined,
      }
    );

    apiItems = result.map((item) => ({
      id: item.id,
      sku: item.sku ?? "N/A",
      itemName: item.itemName ?? "N/A",
      price: item.price ?? null,
      category3: item.category3 ?? "N/A",
      category2: item.category2 ?? "N/A",
      category1: item.category1 ?? "N/A",
      description: item.description ?? "N/A",
      quantityInStock: item.quantityInStock ?? null,
    }));

    apiStatus = `Catalog API reachable. ${result.length} catalog items found.`;
  } catch (err: unknown) {
    const message = getSafeErrorMessage(err, "Unknown error");
    apiStatus = `Catalog API request failed: ${message}`;
  }
  // -------------------------------------------------------------------

  const groupedDbEntries = groupItemsByCategory(dbItems);
  const groupedApiEntries = groupItemsByCategory(apiItems);

  console.log(apiItems);

  // Populate all cards with live data using API 
  const displayItems = apiItems.map(apiItem => ({
        id: apiItem.id,
        itemName: apiItem.itemName,
        category3: apiItem.category3 ?? "Uncategorized",
        category2: apiItem.category2 ?? "Uncategorized",
        category1: apiItem.category1 ?? "Uncategorized",
        description: apiItem.description ?? "",
        unitCost: apiItem.price ?? 0.0,
        unitType: "",
        quantity: apiItem.quantityInStock ?? 0,
        imageUrl: "",
        stock: apiItem.quantityInStock ?? 0,
      }));

    // Construct states (empty, error)
    let stateMsg: React.ReactNode = null;

    // Error
    if (true/*apiStatus.startsWith("Catalog API request failed")*/) {
      stateMsg = <APIError title="Failed to load CatalogItem data." message="The Catalog API is not reachable." apiStatus={apiStatus} />;
    }

  if (!apiItems.length) {
    return (
      <main className="catalog-grid">
        <p role="status">No items available.</p>

        {/* Direct Prisma table still renders below, even if placeholder list is empty */}
        <DiagnosticsPanel
          title="Database Status (Prisma)"
          status={dbStatus}
          entries={groupedDbEntries}
        />

        {/* API route table mirrors the Prisma data but through /api/catalog */}
        <DiagnosticsPanel
          title="Catalog API Status"
          status={apiStatus}
          entries={groupedApiEntries}
        />
      </main>
    );
  }

  return (
    <main>
      <h1 style={{ padding: "1rem", margin: 0 }}>Catalog</h1>

      {stateMsg}

      <section className="catalog-grid" aria-label="Catalog items">
        {displayItems.map((item) => (
          <ItemCard key={item.id} item={item} />
          //<ItemCardSkeleton/>
        ))}
      </section>

      {/* --- Direct Prisma table (shows raw DB query results) --- */}
      <DiagnosticsPanel
        title="Database Status (Prisma)"
        status={dbStatus}
        entries={groupedDbEntries}
      />

      {/* --- API route table (same data fetched via /api/catalog) --- */}
      <DiagnosticsPanel
        title="Catalog API Status"
        status={apiStatus}
        entries={groupedApiEntries}
      />
    </main>
  );
}
