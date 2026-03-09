import type { Metadata } from "next";
import "./style.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LoginStatusProvider } from "./LoginStatusContext";

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
        <LoginStatusProvider>
          <Header />
          <main className="container">{children}</main>
          <Footer />
        </LoginStatusProvider>
      </body>
    </html>
  );
}
