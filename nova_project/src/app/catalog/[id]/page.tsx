// src/app/catalog/[id]/page.tsx
// Product Card Page - displays detailed view of a single catalog item
// Preserves catalog browsing state via URL parameters

import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: {
    id: string;
  };
  searchParams: {
    search?: string;
    category1?: string;
    category2?: string;
    category3?: string;
    page?: string;
    pageSize?: string;
  };
};

type CatalogItem = {
  id: number;
  sku: string;
  itemName: string;
  category1: string;
  category2: string;
  category3: string;
  description: string;
  price: number;
  quantityInStock: number | null;
  unitOfMeasure: string | null;
  imageUrl: string | null;
  storageLocation: string | null;
  storageConditions: string | null;
  expirationDate: Date | null;
  dateAcquired: Date | null;
  reorderLevel: number | null;
  unitCost: number | null;
};

/**
 * Builds the back-to-catalog URL with all preserved state parameters
 */
function buildBackUrl(searchParams: ProductPageProps["searchParams"]): string {
  const params = new URLSearchParams();

  if (searchParams.search) params.append("search", searchParams.search);
  if (searchParams.category1) params.append("category1", searchParams.category1);
  if (searchParams.category2) params.append("category2", searchParams.category2);
  if (searchParams.category3) params.append("category3", searchParams.category3);
  if (searchParams.page) params.append("page", searchParams.page);
  if (searchParams.pageSize) params.append("pageSize", searchParams.pageSize);

  const queryString = params.toString();
  return `/catalog${queryString ? `?${queryString}` : ""}`;
}

/**
 * Fetches a single catalog item by ID
 */
async function fetchCatalogItem(id: string): Promise<CatalogItem | null> {
  try {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return null;

    const item = await prisma.catalogItem.findUnique({
      where: { id: numId },
      select: {
        id: true,
        sku: true,
        itemName: true,
        category1: true,
        category2: true,
        category3: true,
        description: true,
        price: true,
        quantityInStock: true,
        unitOfMeasure: true,
        imageUrl: true,
        storageLocation: true,
        storageConditions: true,
        expirationDate: true,
        dateAcquired: true,
        reorderLevel: true,
        unitCost: true,
      },
    });

    return item as CatalogItem | null;
  } catch (error) {
    console.error("Error fetching catalog item:", error);
    return null;
  }
}

/**
 * Error state component for missing/invalid items
 */
function ItemNotFound({
  id,
  backUrl,
}: {
  id: string;
  backUrl: string;
}): React.ReactNode {
  return (
    <main className="product-page product-page--error">
      <div className="error-container" style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Item Not Found</h1>
        <p>
          We couldn't find the catalog item with ID <code>{id}</code>.
        </p>
        <Link href={backUrl} className="button button--primary">
          ← Back to Catalog
        </Link>
      </div>
    </main>
  );
}

/**
 * Product Card template - displays detailed item information
 */
function ProductCard({
  item,
  backUrl,
}: {
  item: CatalogItem;
  backUrl: string;
}): React.ReactNode {
  return (
    <main className="product-page" aria-label="Product details">
      <div className="product-header">
        <Link href={backUrl} className="button button--secondary">
          Back to Catalog
        </Link>
      </div>

      <article className="product-detail" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb" style={{ marginBottom: "1.5rem" }}>
          <Link href="/catalog">Catalog</Link>
          <span> / </span>
          <span aria-current="page">{item.itemName}</span>
        </nav>

        {/* Product Header */}
        <div className="product-header-info" style={{ marginBottom: "2rem" }}>
          <h1 style={{ margin: "0 0 0.5rem 0" }}>{item.itemName}</h1>
          <p className="sku" style={{ color: "#666", margin: "0 0 1rem 0" }}>
            SKU: <strong>{item.sku}</strong>
          </p>

          {/* Price */}
          <div className="price-section" style={{ marginBottom: "1rem" }}>
            <span className="price" style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              ${item.price.toFixed(2)}
            </span>
          </div>

          {/* Stock Status */}
          {item.quantityInStock !== null && (
            <div className="stock-status" style={{ marginBottom: "1rem" }}>
              <span
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: item.quantityInStock > 0 ? "#d4edda" : "#f8d7da",
                  color: item.quantityInStock > 0 ? "#155724" : "#721c24",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              >
                {item.quantityInStock > 0 ? `${item.quantityInStock} in stock` : "Out of stock"}
              </span>
            </div>
          )}
        </div>

        {/* Product Details Grid */}
        <section className="product-details" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Product Details</h2>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr",
              gap: "1rem",
              borderTop: "1px solid #eee",
              paddingTop: "1rem",
            }}
          >
            {/* Category Hierarchy */}
            <dt style={{ fontWeight: "bold" }}>Category</dt>
            <dd style={{ margin: 0 }}>
              {item.category1} {item.category2 && `/ ${item.category2}`}{" "}
              {item.category3 && `/ ${item.category3}`}
            </dd>

            {/* Description */}
            <dt style={{ fontWeight: "bold" }}>Description</dt>
            <dd style={{ margin: 0, maxWidth: "600px" }}>{item.description}</dd>

            {/* Optional Fields */}
            {item.unitOfMeasure && (
              <>
                <dt style={{ fontWeight: "bold" }}>Unit of Measure</dt>
                <dd style={{ margin: 0 }}>{item.unitOfMeasure}</dd>
              </>
            )}

            {item.reorderLevel !== null && (
              <>
                <dt style={{ fontWeight: "bold" }}>Reorder Level</dt>
                <dd style={{ margin: 0 }}>{item.reorderLevel}</dd>
              </>
            )}

            {item.unitCost !== null && (
              <>
                <dt style={{ fontWeight: "bold" }}>Unit Cost</dt>
                <dd style={{ margin: 0 }}>${item.unitCost.toFixed(2)}</dd>
              </>
            )}

            {item.storageLocation && (
              <>
                <dt style={{ fontWeight: "bold" }}>Storage Location</dt>
                <dd style={{ margin: 0 }}>{item.storageLocation}</dd>
              </>
            )}

            {item.storageConditions && (
              <>
                <dt style={{ fontWeight: "bold" }}>Storage Conditions</dt>
                <dd style={{ margin: 0 }}>{item.storageConditions}</dd>
              </>
            )}

            {item.expirationDate && (
              <>
                <dt style={{ fontWeight: "bold" }}>Expiration Date</dt>
                <dd style={{ margin: 0 }}>{new Date(item.expirationDate).toLocaleDateString()}</dd>
              </>
            )}

            {item.dateAcquired && (
              <>
                <dt style={{ fontWeight: "bold" }}>Date Acquired</dt>
                <dd style={{ margin: 0 }}>{new Date(item.dateAcquired).toLocaleDateString()}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Back Button */}
        <footer style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #eee" }}>
          <Link href={backUrl} className="button button--primary">
            ← Back to Catalog
          </Link>
        </footer>
      </article>
    </main>
  );
}

/**
 * Main Product Page component
 */
export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = params;
  const backUrl = buildBackUrl(searchParams);

  // Fetch the item from database
  const item = await fetchCatalogItem(id);

  // Handle item not found
  if (!item) {
    return <ItemNotFound id={id} backUrl={backUrl} />;
  }

  // Render product card
  return <ProductCard item={item} backUrl={backUrl} />;
}
