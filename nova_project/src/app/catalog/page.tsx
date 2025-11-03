// src/app/catalog/page.tsx

// Page shows the catalog using placeholder items (for now)
// and, at the bottom, includes a simple Prisma connectivity test
// that lists all CatalogItem ids and itemNames from the DB.

import ItemCard from "../components/ItemCard";
import { prisma } from "@/lib/db"; // added: shared Prisma client

function getItems() {
  return [
    {
      id: 1,
      itemName: "Item 1 That has a Really Long Name",
      imageUrl: "https://www.nilesbio.com/images/NilesBio_01.jpg",
      category: "Category 1",
      description: "This is a description for Item 1.",
      unitCost: 10.50,
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

// made async so we can await Prisma queries below
export default async function CatalogPage() {
  const items = getItems();

  // --- DB test variables (simple connectivity + list of ids/names) ---
  let dbStatus: string;
  let dbItems: { id: number; itemName: string }[] = [];

  try {
    dbItems = await prisma.catalogItem.findMany({
      select: { id: true, itemName: true }, // matches your schema
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
      <main className="catalog-grid">
        <p role="status">No items in stock</p>

        {/* DB test block still renders below, even if placeholder list is empty */}
        <section
          className="bg-gray-50 border rounded-lg p-4"
          style={{ marginTop: "1rem" }}
        >
          <h2 className="font-medium mb-2">Database Status</h2>
          <p>{dbStatus}</p>
          {dbItems.length > 0 && (
            <ul className="mt-4 list-disc list-inside">
              {dbItems.map((it) => (
                <li key={it.id}>
                  <strong>ID:</strong> {it.id} — <strong>Item Name:</strong>{" "}
                  {it.itemName}
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
      <h1 style={{ padding: "1rem", margin: 0 }}>Catalog</h1>

      <section className="catalog-grid" aria-label="Catalog items">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </section>

      {/* --- DB TESTS BELOW EXISTING CONTENT --- */}
      <section
        className="bg-gray-50 border rounded-lg p-4"
        style={{ margin: "1rem" }}
      >
        <h2 className="font-medium mb-2">Database Status</h2>
        <p>{dbStatus}</p>

        {dbItems.length > 0 && (
          <ul className="mt-4 list-disc list-inside">
            {dbItems.map((it) => (
              <li key={it.id}>
                <strong>ID:</strong> {it.id} — <strong>Item Name:</strong>{" "}
                {it.itemName}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
