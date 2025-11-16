// src/app/catalog/page.tsx

// Page shows the catalog using placeholder items (for now)
// and, at the bottom, includes a diagnostics panel sourced from the API.

import ItemCard from "../components/ItemCard";
import ItemCardSkeleton from "../components/ItemCardSkeleton";
import APIError from "./APIError";
import { prisma } from "@/lib/db"; // direct Prisma test

export const dynamic = "force-dynamic";

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

  // --- API route test block ---
  let apiStatus = "Loading catalog via API...";
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
    if (apiStatus.startsWith("Catalog API request failed")) {
      stateMsg = <APIError title="Failed to load CatalogItem data." message="The Catalog API is not reachable." apiStatus={apiStatus} />;
    }

  if (!apiItems.length) {
    return (
      <main className="catalog-grid">
        <p role="status">No items available.</p>

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
          <ItemCard key={item.id} item={item}/>
        ))}
      </section>

      {/* --- API route table (same data fetched via /api/catalog) --- */}
      <DiagnosticsPanel
        title="Catalog API Status"
        status={apiStatus}
        entries={groupedApiEntries}
      />
    </main>
  );
}