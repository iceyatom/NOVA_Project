// src/app/catalog/page.tsx

// Page shows the catalog using placeholder items (for now)
// and, at the bottom, includes a diagnostics panel sourced from the API.

import ItemCard from "../components/ItemCard";
import Filters from "../components/Filters";

export const dynamic = "force-dynamic";

function getItems() {
  return [
    {
      id: 1,
      itemName: "Item 1 That has a Really Long Name",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/e/eb/Ash_Tree_-_geograph.org.uk_-_590710.jpg",
      category: "Category 1",
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
      category: "Category 2",
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
      category: "Category 3",
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
      category: "Category 4",
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
      category: "Category 5",
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
      category: "Category 6",
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
      category: "Category 7",
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
      category: "Category 8",
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
      category: "Category 9",
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
      category: "Category 10",
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
      category: "Category 11",
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
  const items = getItems();

  // --- API route test block ---
  let apiStatus = "Loading catalog via API...";
  let apiItems: DbItem[] = [];

  try {
    const baseUrl = getBaseUrl();
    const apiResponse = await fetch(`${baseUrl}/api/catalog`, {
      cache: "no-store",
    });

    if (!apiResponse.ok) {
      throw new Error(`Catalog API returned ${apiResponse.status}`);
    }

    const payload = (await apiResponse.json()) as CatalogApiResponse;

    if (!payload.success || !payload.data) {
      throw new Error(payload.error ?? "Catalog API responded without data");
    }

    apiItems = payload.data.map((item) => ({
      id: item.id,
      sku: item.sku ?? null,
      itemName: item.itemName,
      price: item.price ?? null,
      category3: item.category3 ?? null,
      description: item.description ?? null,
      quantityInStock: item.quantityInStock ?? null,
    }));

    apiStatus = `Catalog API reachable. ${
      payload.count ?? payload.data.length
    } catalog items found.`;
  } catch (err: unknown) {
    const message = getSafeErrorMessage(err, "Unknown error");
    apiStatus = `Catalog API request failed: ${message}`;
  }
  // -------------------------------------------------------------------

  const groupedApiEntries = groupItemsByCategory(apiItems);

  // Populate first card with live data using API (proof of concept)
  const CARD_ID = 1;
  const apiItem1 = apiItems.find((x) => x.id === CARD_ID) ?? null;

  const displayItems = apiItem1
    ? [
        {
          ...items[0],
          id: apiItem1.id,
          itemName: apiItem1.itemName,
          category: apiItem1.category3 ?? items[0].category ?? "Uncategorized",
          unitCost: apiItem1.price ?? items[0].unitCost ?? 0.0,
          description: apiItem1.description ?? items[0].description ?? "",
          quantity: apiItem1.quantityInStock ?? items[0].quantity ?? 0,
        },
        ...items.slice(1),
      ]
    : items;

  // Construct states (empty, error)
  let stateMsg: React.ReactNode = null;

  // Error
  if (apiStatus.startsWith("Catalog API request failed")) {
    stateMsg = (
      <div
        role="alert"
        style={{
          marginLeft: "1rem",
          marginRight: "1rem",
          marginBottom: "1rem",
          borderRadius: "0.25rem",
          border: "1px solid #fca5a5", // light red border
          backgroundColor: "#fef2f2", // soft red background
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          color: "#b91c1c", // red text
        }}
      >
        Failed to load CatalogItem {CARD_ID}. {apiStatus}
      </div>
    );
  }
  // Empty
  else if (!apiItem1) {
    // For the future: should load a page with a statement that states no catalog items found.
    // Also, change apiItem1 to length check
    console.error("Empty: defaulting to placeholders.");
  }

  if (!items.length) {
    return (
      <main className="catalog-grid">
        <p role="status">No items in stock</p>

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
        ))}
      </section>

      {/* --- API route table (same data fetched via /api/catalog) --- */}
      <DiagnosticsPanel
        title="Catalog API Status"
        status={apiStatus}
        entries={groupedApiEntries}
      />
      
      <div style={{ padding: "0 1rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,260px) 1fr", gap: "1.5rem" }}>
          <aside style={{ position: "sticky", top: "1rem", alignSelf: "start" }}>
            <Filters />
          </aside>

          <section className="catalog-grid" aria-label="Catalog items">
            {displayItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}

            <div style={{ marginTop: "1.5rem" }}>
              <DiagnosticsPanel title="Catalog API Status" status={apiStatus} entries={groupedApiEntries} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
