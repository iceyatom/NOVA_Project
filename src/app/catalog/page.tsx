// src/app/catalog/page.tsx

// Page shows the catalog using placeholder items (for now)
// and, at the bottom, includes a simple Prisma connectivity test
// that lists all CatalogItem ids and itemNames from the DB.
// The SearchBar is rendered as a full-width hero banner under the header.

import ItemCard from "../components/ItemCard";
import SearchBar from "../components/SearchBar";
import { prisma } from "@/lib/db"; // shared Prisma client

function getItems() {
  return [
    { id: "1", name: "Fillerilleriller", imageUrl: "/FillerImage.png", description: "desciption" },
    { id: "2", name: "Filler",            imageUrl: "/FillerImage.png", description: "desciption" },
    { id: "3", name: "Filler",            imageUrl: "/FillerImage.png", description: "desciption" },
    { id: "4", name: "Filler",            imageUrl: "/FillerImage.png", description: "desciption" },
    { id: "5", name: "Filler",            imageUrl: "/FillerImage.png", description: "desciption" },
  ];
}

// made async so we can await Prisma queries below
export default async function CatalogPage() {
  const items = getItems();

  // --- DB test variables (simple connectivity + list of ids/names) ---
  let dbStatus: string;
  let dbItems: { id: number; itemName: string }[] = [];

  try {
    dbItems = await prisma.catalogItem.findMany({
      select: { id: true, itemName: true },
      orderBy: { id: "asc" },
    });
    dbStatus = `Connected to database. ${dbItems.length} catalog items found.`;
  } catch (err: unknown) {
    if (err instanceof Error) {
      dbStatus = `Database connection failed: ${err.message}`;
    } else {
      dbStatus = "Database connection failed: Unknown error";
    }
  }
  // -------------------------------------------------------------------

  if (!items.length) {
    return (
      <main>
        {/* HERO search banner directly under the ribbon */}
        <SearchBar bgImage="/hero-lab.jpg" />

        <p role="status" style={{ padding: "0 1rem" }}>No items in stock</p>

        {/* DB test block */}
        <section className="bg-gray-50 border rounded-lg p-4" style={{ margin: "1rem" }}>
          <h2 className="font-medium mb-2">Database Status</h2>
          <p>{dbStatus}</p>
          {dbItems.length > 0 && (
            <ul className="mt-4 list-disc list-inside">
              {dbItems.map((it) => (
                <li key={it.id}>
                  <strong>ID:</strong> {it.id} — <strong>Item Name:</strong> {it.itemName}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    );
  }

  return (
    <main>
      {/* HERO search banner directly under the ribbon */}
      <SearchBar bgImage="/hero-lab.jpg" />

      {/* Catalog grid (unchanged) */}
      <section className="catalog-grid" aria-label="Catalog items">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </section>

      {/* --- DB TESTS BELOW EXISTING CONTENT --- */}
      <section className="bg-gray-50 border rounded-lg p-4" style={{ margin: "1rem" }}>
        <h2 className="font-medium mb-2">Database Status</h2>
        <p>{dbStatus}</p>
        {dbItems.length > 0 && (
          <ul className="mt-4 list-disc list-inside">
            {dbItems.map((it) => (
              <li key={it.id}>
                <strong>ID:</strong> {it.id} — <strong>Item Name:</strong> {it.itemName}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
