import type { Metadata } from "next";
import "./style.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Niles Biological",
  description: "Modern catalog & staff dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
