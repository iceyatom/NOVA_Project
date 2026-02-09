// src/app/catalog/[id]/page.tsx

import Link from "next/link";

type CatalogItemPageProps = {
  params: {
    id: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function CatalogItemPage({
  params,
  searchParams,
}: CatalogItemPageProps) {
  const backParams = new URLSearchParams();

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => backParams.append(key, entry));
      } else {
        backParams.set(key, value);
      }
    });
  }

  const backHref = backParams.toString()
    ? `/catalog?${backParams.toString()}`
    : "/catalog";
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Catalog Item</h1>
      <p>Selected item id: {params.id}</p>
      <Link
        href={backHref}
        className="chip-button"
        style={{ marginTop: "1rem" }}
      >
        Back to catalog
      </Link>
    </main>
  );
}