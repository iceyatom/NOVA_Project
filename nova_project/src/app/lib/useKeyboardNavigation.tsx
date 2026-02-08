"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook for keyboard navigation shortcuts
 * Supports:
 * - Esc: Go back to catalog
 * - ArrowLeft: Previous page
 * - ArrowRight: Next page
 * - Ctrl+F: Focus search
 */
export function useKeyboardNavigation(options?: {
  onGoBack?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  enabled?: boolean;
}) {
  const router = useRouter();
  const { onGoBack, onPreviousPage, onNextPage, enabled = true } = options || {};

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Escape: Go back to catalog
      if (event.key === "Escape") {
        event.preventDefault();
        if (onGoBack) {
          onGoBack();
        }
        return;
      }

      // Ctrl/Cmd + F: Focus search (let browser handle it)
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        return; // Browser default behavior
      }

      // Arrow left: Previous page
      if (event.key === "ArrowLeft" && event.altKey) {
        event.preventDefault();
        if (onPreviousPage) {
          onPreviousPage();
        }
        return;
      }

      // Arrow right: Next page
      if (event.key === "ArrowRight" && event.altKey) {
        event.preventDefault();
        if (onNextPage) {
          onNextPage();
        }
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onGoBack, onPreviousPage, onNextPage]);
}

/**
 * Component to display keyboard shortcuts help
 */
export function KeyboardShortcutsInfo() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 1000 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Show keyboard shortcuts"
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#f0f0f0",
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        aria-expanded={isOpen}
      >
        ⌨️ Shortcuts
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "3rem",
            right: 0,
            backgroundColor: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "200px",
            fontSize: "0.85rem",
          }}
          role="region"
          aria-label="Keyboard shortcuts"
        >
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem" }}>Keyboard Shortcuts</h3>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                Esc
              </kbd>{" "}
              - Back to Catalog
            </li>
            <li>
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                Alt
              </kbd>
              {" + "}
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                ←
              </kbd>{" "}
              - Previous Page
            </li>
            <li>
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                Alt
              </kbd>
              {" + "}
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                →
              </kbd>{" "}
              - Next Page
            </li>
            <li>
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                Ctrl/Cmd
              </kbd>
              {" + "}
              <kbd style={{ padding: "0.2rem 0.4rem", backgroundColor: "#f5f5f5", borderRadius: "2px" }}>
                F
              </kbd>{" "}
              - Search
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
