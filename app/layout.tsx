import type { Metadata } from "next";
import "./style.css";                // correct when style.css is in the same folder as layout.tsx
import Header from "./components/Header"; // correct when Header.tsx is under app/components

export const metadata: Metadata = {
  title: "Niles Biological",
  description: "Modern catalog & staff dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
