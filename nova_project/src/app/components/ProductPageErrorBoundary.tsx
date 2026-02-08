"use client";

import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import Link from "next/link";
import React, { ReactNode } from "react";

/**
 * Client-side wrapper for server components that need error boundary protection
 */
export function ProductPageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <main style={{ padding: "2rem", textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
          <h1 style={{ color: "#d32f2f" }}>⚡ Product Page Error</h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            An unexpected error occurred while loading this product. Please try again.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details
              style={{
                textAlign: "left",
                backgroundColor: "#f5f5f5",
                padding: "1rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.85rem",
                maxHeight: "250px",
                overflow: "auto",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>Error Details</summary>
              <pre style={{ margin: "0.5rem 0 0 0", fontFamily: "monospace" }}>{error.message}</pre>
            </details>
          )}
          <Link href="/catalog" style={{ color: "#005fa3", textDecoration: "underline" }}>
            ← Back to Catalog
          </Link>
        </main>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
