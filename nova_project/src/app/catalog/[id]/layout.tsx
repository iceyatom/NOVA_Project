import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { ReactNode } from "react";

/**
 * Layout for product pages with error boundary protection
 */
export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
