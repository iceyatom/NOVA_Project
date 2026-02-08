// src/app/catalog/[id]/page.tsx
// Product Card Page - displays detailed view of a single catalog item
// Preserves catalog browsing state via URL parameters

import Link from "next/link";
import Image from "next/image";
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

// Error types for better error handling
enum ProductError {
  INVALID_ID = "INVALID_ID",
  NOT_FOUND = "NOT_FOUND",
  DATABASE_ERROR = "DATABASE_ERROR",
  CORRUPTED_DATA = "CORRUPTED_DATA",
  UNKNOWN = "UNKNOWN",
}

type FetchResult = 
  | { success: true; data: CatalogItem }
  | { success: false; error: ProductError; details?: string };

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
 * Fetches a single catalog item by ID with comprehensive error handling
 */
async function fetchCatalogItem(id: string): Promise<FetchResult> {
  try {
    // Validate ID format
    const numId = parseInt(id, 10);
    if (isNaN(numId) || numId <= 0) {
      console.warn(`Invalid item ID requested: "${id}"`);
      return {
        success: false,
        error: ProductError.INVALID_ID,
        details: `Item ID must be a positive number, received: ${id}`,
      };
    }

    // Query the database
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

    // Item not found
    if (!item) {
      console.info(`Catalog item not found: ID ${numId}`);
      return {
        success: false,
        error: ProductError.NOT_FOUND,
      };
    }

    // Validate data integrity
    if (!item.itemName || !item.sku) {
      console.error(`Corrupted catalog item: ID ${numId} missing required fields`);
      return {
        success: false,
        error: ProductError.CORRUPTED_DATA,
        details: "Item data is incomplete or corrupted",
      };
    }

    return {
      success: true,
      data: item as CatalogItem,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Database error fetching catalog item ID "${id}":`, message);
    return {
      success: false,
      error: ProductError.DATABASE_ERROR,
      details: process.env.NODE_ENV === "development" ? message : undefined,
    };
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
      <div className="error-container" style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#d32f2f", marginBottom: "1rem" }}>📦 Item Not Found</h1>
        <p style={{ fontSize: "1.05rem", color: "#666", marginBottom: "1rem" }}>
          The product you&apos;re looking for (ID: <code style={{ backgroundColor: "#f5f5f5", padding: "0.2rem 0.5rem", borderRadius: "3px" }}>{id}</code>) doesn&apos;t exist in our catalog.
        </p>
        <p style={{ fontSize: "0.95rem", color: "#999", marginBottom: "1.5rem" }}>
          This item may have been removed or is no longer available.
        </p>
        <Link href={backUrl} className="button button--primary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#005fa3", color: "white", textDecoration: "none", borderRadius: "4px", marginRight: "1rem" }}>
          ← Back to Catalog
        </Link>
        <Link href="/catalog" className="button button--secondary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#f5f5f5", color: "#333", textDecoration: "none", borderRadius: "4px", border: "1px solid #ddd" }}>
          View All Products
        </Link>
      </div>
    </main>
  );
}

/**
 * Error state for invalid item ID
 */
function InvalidItemId({
  id,
  backUrl,
}: {
  id: string;
  backUrl: string;
}): React.ReactNode {
  return (
    <main className="product-page product-page--error">
      <div className="error-container" style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#f57c00", marginBottom: "1rem" }}>⚠️ Invalid Product ID</h1>
        <p style={{ fontSize: "1.05rem", color: "#666", marginBottom: "1rem" }}>
          The product ID <code style={{ backgroundColor: "#f5f5f5", padding: "0.2rem 0.5rem", borderRadius: "3px" }}>{id}</code> is not valid.
        </p>
        <p style={{ fontSize: "0.95rem", color: "#999", marginBottom: "1.5rem" }}>
          Product IDs must be numeric values. Please check the URL and try again.
        </p>
        <Link href={backUrl || "/catalog"} className="button button--primary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#005fa3", color: "white", textDecoration: "none", borderRadius: "4px" }}>
          ← Back to Catalog
        </Link>
      </div>
    </main>
  );
}

/**
 * Error state for corrupted or incomplete data
 */
function CorruptedData({
  id,
  backUrl,
}: {
  id: string;
  backUrl: string;
}): React.ReactNode {
  return (
    <main className="product-page product-page--error">
      <div className="error-container" style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#c62828", marginBottom: "1rem" }}>🔧 Data Error</h1>
        <p style={{ fontSize: "1.05rem", color: "#666", marginBottom: "1rem" }}>
          We found the product (ID: <code style={{ backgroundColor: "#f5f5f5", padding: "0.2rem 0.5rem", borderRadius: "3px" }}>{id}</code>), but its data appears to be incomplete or corrupted.
        </p>
        <p style={{ fontSize: "0.95rem", color: "#999", marginBottom: "1.5rem" }}>
          Our support team has been notified. Please try again later or contact support if the problem persists.
        </p>
        <Link href={backUrl || "/catalog"} className="button button--primary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#005fa3", color: "white", textDecoration: "none", borderRadius: "4px", marginRight: "1rem" }}>
          ← Back to Catalog
        </Link>
        <a href="mailto:support@example.com" className="button button--secondary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#f5f5f5", color: "#333", textDecoration: "none", borderRadius: "4px", border: "1px solid #ddd" }}>
          Contact Support
        </a>
      </div>
    </main>
  );
}

/**
 * Error state for database or server errors
 */
function ServerError({
  backUrl,
  details,
}: {
  backUrl: string;
  details?: string;
}): React.ReactNode {
  return (
    <main className="product-page product-page--error">
      <div className="error-container" style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ color: "#c62828", marginBottom: "1rem" }}>⚡ Server Error</h1>
        <p style={{ fontSize: "1.05rem", color: "#666", marginBottom: "1rem" }}>
          Sorry, we&apos;re having trouble loading this product right now.
        </p>
        <p style={{ fontSize: "0.95rem", color: "#999", marginBottom: "1.5rem" }}>
          This is temporary and our team is working on it. Please try again in a few moments.
        </p>
        {details && process.env.NODE_ENV === "development" && (
          <details style={{ marginBottom: "1.5rem", textAlign: "left", backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "4px", fontSize: "0.85rem", maxHeight: "200px", overflow: "auto" }}>
            <summary style={{ cursor: "pointer", color: "#999" }}>Technical Details (Dev Only)</summary>
            <p style={{ margin: "0.5rem 0 0 0", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{details}</p>
          </details>
        )}
        <Link href={backUrl || "/catalog"} className="button button--primary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", backgroundColor: "#005fa3", color: "white", textDecoration: "none", borderRadius: "4px" }}>
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

      <article className="product-detail" style={{ maxWidth: "1000px", margin: "0 auto", padding: "clamp(1rem, 5vw, 2rem)" }}>
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          <Link href="/catalog">Catalog</Link>
          <span> / </span>
          <span aria-current="page">{item.itemName}</span>
        </nav>

        {/* Product Image and Info Grid - Responsive */}
        <div style={{ display: "grid", gridTemplateColumns: "clamp(250px, 30vw, 300px) 1fr", gap: "clamp(1rem, 5vw, 2rem)", marginBottom: "2rem", alignItems: "start" }}>
          {/* Product Image */}
          <div className="product-image-container" style={{ position: "relative", minHeight: "250px", backgroundColor: "#f5f5f5", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" }}>
            {item.imageUrl ? (
              <Image
                src={item.imageUrl.startsWith("/") || item.imageUrl.startsWith("http") ? item.imageUrl : "/FillerImage.webp"}
                alt={item.itemName}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 40vw, 300px"
                priority
              />
            ) : (
              <Image
                src="/FillerImage.webp"
                alt={item.itemName}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 40vw, 300px"
              />
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
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
        </div>

        {/* Product Details Section */}
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

      {/* Responsive Media Queries */}
      <style>{`
        @media (max-width: 768px) {
          .product-detail {
            padding: 1rem !important;
          }
          .product-detail > div {
            grid-template-columns: 1fr !important;
          }
          .product-image-container {
            min-height: 300px !important;
          }
          .product-details dl {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
          .product-details dt {
            grid-column: 1 !important;
            margin-top: 0.5rem !important;
          }
          .product-details dd {
            grid-column: 1 !important;
          }
          .breadcrumb {
            font-size: 0.85rem;
          }
          h1 {
            font-size: 1.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .product-detail {
            padding: 0.75rem !important;
          }
          .product-image-container {
            min-height: 200px !important;
          }
          h1 {
            font-size: 1.25rem !important;
          }
          .price {
            font-size: 1.25rem !important;
          }
          .button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

/**
 * Main Product Page component with comprehensive error handling
 */
export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = params;
  const resolvedSearchParams = await searchParams;
  const backUrl = buildBackUrl(resolvedSearchParams);

  // Fetch the item from database
  const result = await fetchCatalogItem(id);

  // Handle different error types
  if (!result.success) {
    switch (result.error) {
      case ProductError.INVALID_ID:
        return <InvalidItemId id={id} backUrl={backUrl} />;
      case ProductError.NOT_FOUND:
        return <ItemNotFound id={id} backUrl={backUrl} />;
      case ProductError.CORRUPTED_DATA:
        return <CorruptedData id={id} backUrl={backUrl} />;
      case ProductError.DATABASE_ERROR:
      case ProductError.UNKNOWN:
      default:
        return <ServerError backUrl={backUrl} details={result.details} />;
    }
  }

  // Render product card with valid data
  return <ProductCard item={result.data} backUrl={backUrl} />;
}
