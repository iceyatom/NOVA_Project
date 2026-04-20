import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Decimal } from "@prisma/client/runtime/library";
import CatalogImageGallery from "@/app/components/CatalogImageGallery";

type CatalogItemPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CatalogItemImage = {
  id: number | null;
  s3Key: string | null;
  url: string;
  createdAt: string | null;
};

type CatalogClassificationPath = {
  category1: string | null;
  category2: string | null;
  category3: string | null;
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
  images?: CatalogItemImage[] | null;
  classifications?: CatalogClassificationPath[] | null;
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

function getDisplayImages(images?: CatalogItemImage[] | null): string[] {
  if (!images || images.length === 0) {
    return ["/FillerImage.webp"];
  }

  const urls = images
    .map((img) => img?.url)
    .filter(
      (url): url is string => typeof url === "string" && url.trim() !== "",
    );

  return urls.length > 0 ? urls : ["/FillerImage.webp"];
}

function getDisplayClassifications(
  item: CatalogItemRecord,
): CatalogClassificationPath[] {
  const loadedClassifications = Array.isArray(item.classifications)
    ? item.classifications.filter(
        (classification) =>
          classification.category1 ||
          classification.category2 ||
          classification.category3,
      )
    : [];

  if (loadedClassifications.length > 0) {
    const seen = new Set<string>();
    return loadedClassifications.filter((classification) => {
      const key = [
        classification.category3 ?? "",
        classification.category2 ?? "",
        classification.category1 ?? "",
      ].join("::");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  if (item.category1 || item.category2 || item.category3) {
    return [
      {
        category1: item.category1,
        category2: item.category2,
        category3: item.category3,
      },
    ];
  }

  return [];
}

async function getCatalogItem(
  itemId: number,
): Promise<CatalogItemRecord | null> {
  const headerStore = await headers();
  const host = headerStore.get("host");

  if (!host) {
    throw new Error("Could not determine host for catalog lookup");
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  const url = new URL(`${protocol}://${host}/api/catalog`);
  url.searchParams.set("id", String(itemId));

  console.log("[catalog item] API route URL:", url.toString());

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(
      `Catalog request failed with status ${response.status}${bodyText ? `: ${bodyText}` : ""}`,
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

  const images = getDisplayImages(item.images);
  const classifications = getDisplayClassifications(item);

  return (
    <main style={{ padding: "2rem" }}>
      <div className="product-section">
        <div className="product-left">
          <CatalogImageGallery images={images} title={title} />
        </div>

        <div className="product-right">
          <h1 className="product-title">
            <p className="product-title-text">{title}</p>
            <p className="product-title-subtext">{subtitle}</p>
          </h1>

          <div className="product-price" aria-label="Price">
            <span className="product-price-amount">{price}</span>
          </div>

          <section className="product-classifications">
            <h2 className="product-classifications-title">Classifications</h2>
            {classifications.length > 0 ? (
              <ul className="product-classifications-list">
                {classifications.map((classification, index) => (
                  <li
                    key={`${classification.category3 ?? "uncat"}-${classification.category2 ?? "uncat"}-${classification.category1 ?? "uncat"}-${index}`}
                    className="product-classifications-item"
                  >
                    <span className="product-classifications-entry">
                      <strong>Category:</strong>{" "}
                      {classification.category3 ?? "Unassigned"}
                    </span>
                    <span className="product-classifications-entry">
                      <strong>Subcategory:</strong>{" "}
                      {classification.category2 ?? "Unassigned"}
                    </span>
                    <span className="product-classifications-entry">
                      <strong>Type:</strong>{" "}
                      {classification.category1 ?? "Unassigned"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="product-classifications-empty">
                No classifications assigned.
              </p>
            )}
          </section>

          <section className="product-description">
            <p className="product-description-text">
              {item.description || "No description available."}
            </p>
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
