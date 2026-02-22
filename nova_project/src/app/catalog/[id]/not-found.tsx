// src/app/catalog/[id]/not-found.tsx

import Link from "next/link";

export default function CatalogItemNotFound() {
  return (
    <main style={{ 
      padding: "4rem 2rem", 
      textAlign: "center",
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ maxWidth: "600px" }}>
        <h1 style={{ 
          fontSize: "3rem", 
          fontWeight: "bold", 
          marginBottom: "1rem",
          color: "#dc2626"
        }}>
          404
        </h1>
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "600", 
          marginBottom: "1rem" 
        }}>
          Item Not Found
        </h2>
        <p style={{ 
          fontSize: "1.125rem", 
          marginBottom: "2rem",
          color: "#6b7280"
        }}>
          The catalog item you're looking for doesn't exist or has been removed from our inventory.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link 
            href="/catalog" 
            className="chip-button"
            style={{ 
              padding: "0.75rem 1.5rem",
              fontSize: "1rem"
            }}
          >
            Back to Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}