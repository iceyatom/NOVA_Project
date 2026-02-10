// src/app/catalog/[id]/page.tsx

import Link from "next/link";
import Image from "next/image";

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

  // Placeholder for fetching item data by ID 
  const getItemById = (id: string) => {
    // Simulated API call
    return {
      id,
      title: `Item Title Number ${id}`,
      subtitle: `It's some item that is number ${id} in the database.`,
      category1: "Category 1",
      category2: "Category 2",
      category3: "Category 3",
      description: `Description of item ${id}`,
      price: "$0.00",
      priceNote: "NOT AVAILABLE",
      images: ["/FillerImage.png", "/FillerImage.png", "/FillerImage.png"]
    };
  };

  // Add more attributes as needed for the item's product page 
  const item = getItemById(params.id) || null;
  const title = item?.title || null;
  const subtitle = item?.subtitle || null;
  const category1 = item?.category1 || null;
  const category2 = item?.category2 || null;
  const category3 = item?.category3 || null;
  const description = item?.description || null;
  const price = item?.price || null;
  const priceNote = item?.priceNote || null;
  const images = item?.images || [];

  return (
    <main style={{ padding: "2rem" }}>
      <div className="product-section">
        <div className="product-left">
          <div className="product-image">
            <Image
              className="product-image-img"
              src={images?.[0] || "/FillerImage.png"}
              alt={`Image of ${item.title}`}
              width={640}
              height={428}
              sizes="(max-width: 900px) 100vw, 320px"
              priority
            />
          </div>

          <div className="product-carousel">
            <button className="product-carousel-nav" type="button" aria-label="Previous images">
              &lt;
            </button>

            <div className="product-carousel-track">
              {Array.from({ length: images?.length}).map((_, i) => (
                <button key={i} className="product-carousel-thumb" type="button" aria-label={`View image ${i+1}`}>
                  <Image
                    className="product-carousel-thumb-img"
                    src={images?.[i] || "/FillerImage.png"}
                    alt={`Image ${i+1} of ${item.title}`}
                    width={160}
                    height={120}
                  />
                </button>
              ))}
            </div>

            <button className="product-carousel-nav" type="button" aria-label="Next images">
              &gt;
            </button>
          </div>
        </div>
        <div className="product-right">
          <h1 className="product-title">
            <p className="product-title-text">{ title }</p>
            <p className="product-title-subtext">{ subtitle }</p>
          </h1>

          <div className="product-price" aria-label="Price">
            <span className="product-price-amount">{ price }</span>
            <span className="product-price-note">{ priceNote }</span>
          </div>

          <section className="product-category">
            <p className="product-category1-text">
              { category1 }
            </p>
            <p className="product-category2-text">
              { category2 }
            </p>
            <p className="product-category3-text">
              { category3 }
            </p>
          </section>

          <section className="product-description">
            <p className="product-description-text">
              { description }
            </p>
          </section>
        </div>
      </div>

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