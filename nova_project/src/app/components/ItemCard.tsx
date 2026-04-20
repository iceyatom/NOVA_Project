"use client";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type Item = {
  id: number | null;
  sku: string | null;
  itemName: string | null;
  imageUrl: string | null;
  category3: string | null;
  category2: string | null;
  category1: string | null;
  description: string | null;
  price: number | null;
  unitOfMeasure: string | null;
  quantity: number | null;
  quantityInStock: number | null;
};

function formatDescriptionPreview(value: string | null): string {
  if (value === null) return "N/A";

  const cleaned = value.trim().replace(/^description\s*[:\-]?\s*/i, "");

  if (cleaned.length <= 200) return cleaned || "N/A";
  return `${cleaned.slice(0, 200).trimEnd()}...`;
}

export default function ItemCard({ item }: { item: Item }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Destructure data
  const {
    id,
    sku,
    itemName,
    imageUrl,
    category3,
    category2,
    category1,
    description,
    price,
    unitOfMeasure,
    quantity,
  } = item;

  const safeSrc =
    imageUrl && (imageUrl.startsWith("/") || imageUrl.startsWith("http"))
      ? imageUrl
      : "/FillerImage.webp";

  // Function
  const handleClick = (
    event:
      | React.KeyboardEvent<HTMLDivElement>
      | React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.type === "keydown" && "key" in event && event.key !== "Enter")
      return;
    if (event.type === "click") event.preventDefault();

    event.preventDefault();
    if (id === null) return;
    const query = searchParams.toString();
    const href = query ? `/catalog/${id}?${query}` : `/catalog/${id}`;
    router.push(href);
  };

  // Styles
  const itemCardStyle = {
    cursor: "pointer",
    border: "1px solid #cccccc",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "2px 2px 12px rgba(0, 0, 0, 0.1)",
    width: "100%",
    height: "auto",
    minHeight: "fit-content",
    display: "flex",
    flexDirection: "column" as const,
  };

  const titleStyle = {
    color: "#000000",
    fontSize: "18px",
  };

  const imageStyle: React.CSSProperties = {
    objectFit: "cover",
    width: "100%",
    height: "auto",
    minHeight: "200px",
    maxHeight: "200px",
    display: "block",
    marginTop: "auto",
    marginBottom: "auto",
    borderRadius: "8px",
    border: "1px solid #7F7F7F",
  };

  const descriptionStyle = {
    fontSize: "14px",
    color: "#555555",
    marginTop: "8px",
  };

  const category3Style = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
  };

  const category2Style = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
  };

  const category1Style = {
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
  };

  const costStyle = {
    fontSize: "20px",
    fontWeight: 700,
    color: "#222222",
    marginTop: "auto",
    alignSelf: "flex-end",
  };

  const unitStyle = {
    fontSize: "12px",
    color: "#aaaaaa",
    marginTop: "4px",
  };

  // HTML
  return (
    <div
      className="item-card"
      style={itemCardStyle}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e)}
    >
      <h2 className="item-card-title" style={titleStyle}>
        {itemName === null ? "N/A" : itemName}
      </h2>
      <Image
        className="item-card-image"
        src={safeSrc}
        alt={itemName === null ? "N/A" : itemName}
        width={512}
        height={512}
        style={imageStyle}
      />
      <p className="item-card-description" style={descriptionStyle}>
        {formatDescriptionPreview(description)}
      </p>
      <p className="item-card-category3" style={category3Style}>
        Category: {category3 === null ? "N/A" : category3}
      </p>
      <p className="item-card-category2" style={category2Style}>
        Subcategory: {category2 === null ? "N/A" : category2}
      </p>
      <p className="item-card-category1" style={category1Style}>
        Type: {category1 === null ? "N/A" : category1}
      </p>
      <p className="item-card-cost" style={costStyle}>
        {price === null ? "N/A" : `$${price.toFixed(2)}`}
      </p>
    </div>
  );
}
