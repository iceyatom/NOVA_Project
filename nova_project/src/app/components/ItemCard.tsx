"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { buildProductUrl } from "@/lib/catalogUrl";

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

export default function ItemCard({ item }: { item: Item }) {
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
    quantityInStock,
  } = item;

  const safeSrc =
    imageUrl && (imageUrl.startsWith("/") || imageUrl.startsWith("http"))
      ? imageUrl
      : "/FillerImage.webp";

  // Build product URL with preserved catalog state
  const productUrl = id !== null
    ? buildProductUrl(id, {
        search: searchParams.get("search"),
        category1: searchParams.get("category1"),
        category2: searchParams.get("category2"),
        category3: searchParams.get("category3"),
        page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
        pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : undefined,
      })
    : "/catalog";

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
    fontSize: "12px",
    color: "#555555",
    marginTop: "4px",
  };

  const unitStyle = {
    fontSize: "12px",
    color: "#aaaaaa",
    marginTop: "4px",
  };

  const stockStyle = quantityInStock
    ? {
        fontSize: "12px",
        color: "#008000",
        marginTop: "4px",
      }
    : {
        fontSize: "12px",
        color: "#FF0000",
        marginTop: "4px",
      };

  // HTML
  return (
    <Link href={productUrl}>
      <div
        className="item-card"
        style={itemCardStyle}
        tabIndex={0}
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
          Description: {description === null ? "N/A" : description}
        </p>
        <p className="item-card-category3" style={category3Style}>
          Category 3: {category3 === null ? "N/A" : category3}
        </p>
        <p className="item-card-category2" style={category2Style}>
          Category 2: {category2 === null ? "N/A" : category2}
        </p>
        <p className="item-card-category1" style={category1Style}>
          Category 1: {category1 === null ? "N/A" : category1}
        </p>
        <p className="item-card-cost" style={costStyle}>
          Cost: {price === null ? "N/A" : `$${price.toFixed(2)}`}
        </p>
        <p className="item-card-stock" style={stockStyle}>
          {quantityInStock === null
            ? "N/A"
            : quantityInStock > 0
              ? quantityInStock + " available"
              : "Out of Stock"}
        </p>
      </div>
    </Link>
  );
}
