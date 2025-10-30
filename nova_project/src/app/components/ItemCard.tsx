"use client";

type Item = {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
};

export default function ItemCard({ item }: { item: Item }) {
  return (
    <article className="card">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} loading="lazy" />
      ) : null}

      <div className="card-body">
        <h3 id={`item-${item.id}-title`}>{item.name}</h3>
        {item.description ? <p>{item.description}</p> : null}
      </div>
    </article>
  );
}