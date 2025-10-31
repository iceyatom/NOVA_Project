import ItemCard from "../components/ItemCard";

function getItems() {
  return [
    {
      id: "1",
      name: "Fillerilleriller",
      imageUrl: "/FillerImage.png",
      description: "desciption",
    },
    {
      id: "2",
      name: "Filler",
      imageUrl: "/FillerImage.png",
      description: "desciption",
    },
    {
      id: "3",
      name: "Filler",
      imageUrl: "/FillerImage.png",
      description: "desciption",
    },
    {
      id: "4",
      name: "Filler",
      imageUrl: "/FillerImage.png",
      description: "desciption",
    },
    {
      id: "5",
      name: "Filler",
      imageUrl: "/FillerImage.png",
      description: "desciption",
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
