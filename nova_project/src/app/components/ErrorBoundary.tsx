"use client";

import React, { ReactNode } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch client-side errors
 * Displays a user-friendly error message and recovery options
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught:", error, errorInfo);
    }

    // Could also log to an error tracking service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }

      // Default error UI
      return (
        <div
          style={{
            padding: "2rem",
            maxWidth: "600px",
            margin: "2rem auto",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            textAlign: "center",
          }}
          role="alert"
          aria-live="assertive"
        >
          <h2 style={{ color: "#856404", marginTop: 0 }}>⚠️ Something Went Wrong</h2>
          <p style={{ color: "#856404", marginBottom: "1rem" }}>
            We encountered an unexpected error. Please try refreshing the page or go back to the catalog.
          </p>

          {process.env.NODE_ENV === "development" && (
            <details
              style={{
                textAlign: "left",
                backgroundColor: "#fff",
                padding: "1rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                fontSize: "0.85rem",
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#856404" }}>
                Technical Details (Dev Only)
              </summary>
              <pre
                style={{
                  margin: "0.5rem 0 0 0",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error?.message}
                {"\n\n"}
                {this.state.error?.stack}
              </pre>
            </details>
          )}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#ffc107",
                color: "#000",
                border: "1px solid #ffc107",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Try Again
            </button>
            <Link
              href="/catalog"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#005fa3",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                display: "inline-block",
              }}
            >
              Back to Catalog
            </Link>
            <Link
              href="/"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6c757d",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                display: "inline-block",
              }}
            >
              Back Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
