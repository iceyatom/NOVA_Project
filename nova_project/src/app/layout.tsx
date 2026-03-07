import type { Metadata } from "next";
import "./style.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./components/AuthProvider";

export const metadata: Metadata = {
  title: "Niles Biological Inc.",
  description: "Educational biological specimens and supplies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="container">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}