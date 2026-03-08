import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

type CatalogItemPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CatalogItemRecord = {
  id: number;
  sku: string | null;
  itemName: string;
  price: number | string | Decimal | null;
  category1: string | null;
  category2: string | null;
  category3: string | null;
  description: string | null;
  quantityInStock: number;
  unitOfMeasure: string | null;
  storageLocation: string | null;
  storageConditions: string | null;
  expirationDate: Date | string | null;
  dateAcquired: Date | string | null;
  reorderLevel: number;
  unitCost: number | string | Decimal | null;
};

function formatPrice(price: number | string | Decimal | null): string {
  if (price === null || price === undefined) return "$0.00";

  if (price instanceof Decimal) {
    return `$${price.toFixed(2)}`;
  }

  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice)) return "$0.00";
  return `$${numPrice.toFixed(2)}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";

  const parsedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "N/A";

  try {
    return parsedDate.toLocaleDateString("en-US", {
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

function isPrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  return (
    name.includes("prismaclientinitializationerror") ||
    name.includes("prismaclientknownrequesterror") ||
    name.includes("prismaclientunknownrequesterror") ||
    message.includes("authentication failed against database server") ||
    message.includes("provided database credentials") ||
    message.includes("can't reach database server") ||
    message.includes("cant reach database server") ||
    message.includes("invalid `") ||
    message.includes("prisma")
  );
}

async function getCatalogItemFromPrisma(
  itemId: number
): Promise<CatalogItemRecord | null> {
  return prisma.catalogItem.findUnique({
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
}

async function getCatalogItemFromLambda(
  itemId: number
): Promise<CatalogItemRecord | null> {
  const headerStore = await headers();
  const host = headerStore.get("host");

  if (!host) {
    throw new Error("Could not determine host for catalog fallback");
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  const url = new URL(`${protocol}://${host}/api/catalog`);
  url.searchParams.set("id", String(itemId));

  console.log("[catalog item] API fallback URL:", url.toString());

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(
      `Catalog fallback failed with status ${response.status}${bodyText ? `: ${bodyText}` : ""}`
    );
  }

  const payload = await response.json();

  if (!payload?.success) {
    return null;
  }

  if (Array.isArray(payload.data)) {
    return payload.data[0] ?? null;
  }

  return payload.data ?? null;
}

async function getCatalogItem(itemId: number): Promise<CatalogItemRecord | null> {
  try {
    console.log("[catalog item] trying Prisma first:", itemId);
    const item = await getCatalogItemFromPrisma(itemId);
    console.log("[catalog item] Prisma succeeded");
    return item;
  } catch (error) {
    console.error("[catalog item] Prisma failed:", error);

    if (!isPrismaConnectionError(error)) {
      throw error;
    }

    console.log("[catalog item] falling back to API route");
    return await getCatalogItemFromLambda(itemId);
  }
}

export default async function CatalogItemPage({
  params,
  searchParams,
}: CatalogItemPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const itemId = parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(itemId) || itemId <= 0) {
    notFound();
  }

  let item: CatalogItemRecord | null = null;

  try {
    item = await getCatalogItem(itemId);
  } catch (error) {
    console.error("Error fetching catalog item:", error);
    throw error;
  }

  if (!item) {
    notFound();
  }

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

  const title = item.itemName;
  const subtitle = item.sku ? `SKU: ${item.sku}` : `Item ID: ${item.id}`;
  const price = formatPrice(item.price);
  const stockStatus = getStockStatus(item.quantityInStock, item.reorderLevel);

  const images = [
    "/FillerImage.webp",
    "/FillerImage.webp",
    "/FillerImage.webp",
  ];

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
                <button
                  key={i}
                  className="product-carousel-thumb"
                  type="button"
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    className="product-carousel-thumb-img"
                    src={img}
                    alt={`Image ${i + 1} of ${title}`}
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
            {item.category1 && <p className="product-category1-text">{item.category1}</p>}
            {item.category2 && <p className="product-category2-text">{item.category2}</p>}
            {item.category3 && <p className="product-category3-text">{item.category3}</p>}
          </section>

          <section className="product-description">
            <p className="product-description-text">
              {item.description || "No description available."}
            </p>
          </section>

          <section className="product-details" style={{ marginTop: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "0.75rem",
              }}
            >
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