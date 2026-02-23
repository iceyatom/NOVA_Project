// src/app/catalog/[id]/page.tsx

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

type CatalogItemPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatPrice(price: number | string | Decimal | null): string {
  if (price === null || price === undefined) return "$0.00";
  
  // Handle Prisma Decimal type
  if (price instanceof Decimal) {
    return `$${price.toFixed(2)}`;
  }
  
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice)) return "$0.00";
  return `$${numPrice.toFixed(2)}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  try {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function getStockStatus(quantity: number, reorderLevel: number): string {
  if (quantity === 0) return "OUT OF STOCK";
  if (quantity <= reorderLevel) return "LOW STOCK";
  return "IN STOCK";
}

export default async function CatalogItemPage({
  params,
  searchParams,
}: CatalogItemPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  
  // Parse and validate ID
  const itemId = parseInt(resolvedParams.id, 10);
  
  if (!Number.isFinite(itemId) || itemId <= 0) {
    notFound();
  }

  // Fetch item directly from database
  let item;
  try {
    item = await prisma.catalogItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        sku: true,
        itemName: true,
        price: true,
        category1: true,
        category2: true,
        category3: true,
        description: true,
        quantityInStock: true,
        unitOfMeasure: true,
        storageLocation: true,
        storageConditions: true,
        expirationDate: true,
        dateAcquired: true,
        reorderLevel: true,
        unitCost: true,
      },
    });
  } catch (error) {
    console.error("Database error fetching catalog item:", error);
    notFound();
  }

  // If item not found, show 404
  if (!item) {
    notFound();
  }

  // Build back navigation with preserved search params
  const backParams = new URLSearchParams();
  if (resolvedSearchParams) {
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => backParams.append(key, entry));
      } else {
        backParams.set(key, value);
      }
    });
  }

  const backHref = backParams.toString()
    ? `/catalog?${backParams.toString()}`
    : "/catalog";

  // Extract and format data
  const title = item.itemName;
  const subtitle = item.sku ? `SKU: ${item.sku}` : `Item ID: ${item.id}`;
  const category1 = item.category1;
  const category2 = item.category2;
  const category3 = item.category3;
  const description = item.description;
  const price = formatPrice(item.price);
  const stockStatus = getStockStatus(item.quantityInStock, item.reorderLevel);
  
  // Use placeholder images for now
  const images = ["/FillerImage.webp", "/FillerImage.webp", "/FillerImage.webp"];

  return (
    <main style={{ padding: "2rem" }}>
      <div className="product-section">
        <div className="product-left">
          <div className="product-image">
            <Image
              className="product-image-img"
              src={images[0]}
              alt={`Image of ${title}`}
              width={640}
              height={428}
              sizes="(max-width: 900px) 100vw, 320px"
              priority
            />
          </div>

          <div className="product-carousel">
            <button
              className="product-carousel-nav"
              type="button"
              aria-label="Previous images"
            >
              &lt;
            </button>

            <div className="product-carousel-track">
              {images.map((img, i) => (
                <button key={i} className="product-carousel-thumb" type="button" aria-label={`View image ${i+1}`}>
                  <Image
                    className="product-carousel-thumb-img"
                    src={img}
                    alt={`Image ${i+1} of ${title}`}
                    width={160}
                    height={120}
                  />
                </button>
              ))}
            </div>

            <button
              className="product-carousel-nav"
              type="button"
              aria-label="Next images"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="product-right">
          <h1 className="product-title">
            <p className="product-title-text">{title}</p>
            <p className="product-title-subtext">{subtitle}</p>
          </h1>

          <div className="product-price" aria-label="Price">
            <span className="product-price-amount">{price}</span>
            <span className="product-price-note">{stockStatus}</span>
          </div>

          <section className="product-category">
            {category1 && (
              <p className="product-category1-text">{category1}</p>
            )}
            {category2 && (
              <p className="product-category2-text">{category2}</p>
            )}
            {category3 && (
              <p className="product-category3-text">{category3}</p>
            )}
          </section>

          <section className="product-description">
            <p className="product-description-text">
              {description || "No description available."}
            </p>
          </section>

          {/* Additional product details */}
          <section className="product-details" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>
              Product Details
            </h2>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <div>
                <strong>Quantity in Stock:</strong> {item.quantityInStock}
                {item.unitOfMeasure && ` ${item.unitOfMeasure}`}
              </div>
              {item.unitCost && (
                <div>
                  <strong>Unit Cost:</strong> {formatPrice(item.unitCost)}
                </div>
              )}
              {item.reorderLevel > 0 && (
                <div>
                  <strong>Reorder Level:</strong> {item.reorderLevel}
                </div>
              )}
              {item.storageLocation && (
                <div>
                  <strong>Storage Location:</strong> {item.storageLocation}
                </div>
              )}
              {item.storageConditions && (
                <div>
                  <strong>Storage Conditions:</strong> {item.storageConditions}
                </div>
              )}
              {item.expirationDate && (
                <div>
                  <strong>Expiration Date:</strong> {formatDate(item.expirationDate)}
                </div>
              )}
              {item.dateAcquired && (
                <div>
                  <strong>Date Acquired:</strong> {formatDate(item.dateAcquired)}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <Link
        href={backHref}
        className="chip-button"
        style={{ marginTop: "1rem" }}
      >
        Back to catalog
      </Link>
    </main>
  );
}
