import ItemCard from "../components/ItemCard";

function getItems() {
  return [
    // id: number;
    // itemName: string;
    // category: string;
    // description: string;
    // unitCost: number;
    // imageUrl: string;
    // stock: number;
    // quantity: number;
    {
      id: 1,
      itemName: "Item 1",
      category: "Category 1",
      description: "desciption",
      unitCost: 10.50,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_01.jpg",
      stock: 10,
      quantity: 1,
    },
    {
      id: 2,
      itemName: "Item 2",
      category: "Category 2",
      description: "desciption",
      unitCost: 2.75,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_02.jpg",
      stock: 2,
      quantity: 5,
    },
    {
      id: 3,
      itemName: "Item 3",
      category: "Category 3",
      description: "desciption",
      unitCost: 5.05,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_03.jpg",
      stock: 0,
      quantity: 1,
    },
    {
      id: 4,
      itemName: "Item 4",
      category: "Category 4",
      description: "desciption",
      unitCost: 5.5,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_04.jpg",
      stock: 4,
      quantity: 10,
    },
    {
      id: 5,
      itemName: "Item 5",
      category: "Category 5",
      description: "desciption",
      unitCost: 10,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_05.jpg",
      stock: 7,
      quantity: 5,
    },
    {
      id: 6,
      itemName: "Item 6",
      category: "Category 6",
      description: "desciption",
      unitCost: 10,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_06.jpg",
      stock: 0,
      quantity: 7,
    },
    {
      id: 7,
      itemName: "Item 7",
      category: "Category 7",
      description: "desciption",
      unitCost: 10,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_07.jpg",
      stock: 20,
      quantity: 17,
    },
    {
      id: 8,
      itemName: "Item 8",
      category: "Category 8",
      description: "desciption",
      unitCost: 10,
      imageUrl: "https://www.nilesbio.com/images/NilesBio_08.jpg",
      stock: 15,
      quantity: 20,
    },
    {
      id: 9,
      itemName: "Item 9",
      category: "Category 9",
      description: "desciption",
      unitCost: 10,
      imageUrl: "none",
      stock: 10,
      quantity: 2,
    },
  ];
}

export default function CatalogPage() {
  const items = getItems();

  if (!items.length) {
    return (
      <main className="catalog-grid">
        <p role="status">No items in stock</p>
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
    </main>
  );
}
