"use client";

import Image from "next/image";
import { useState } from "react";

type CatalogImageGalleryProps = {
  images: string[];
  title: string;
};

export default function CatalogImageGallery({
  images,
  title,
}: CatalogImageGalleryProps) {
  const safeImages = images.length > 0 ? images : ["/FillerImage.webp"];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const goPrevious = () => {
    setSelectedIndex((current) =>
      current === 0 ? safeImages.length - 1 : current - 1,
    );
  };

  const goNext = () => {
    setSelectedIndex((current) =>
      current === safeImages.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <>
      <div className="product-image">
        <Image
          className="product-image-img"
          src={safeImages[selectedIndex]}
          alt={`Image of ${title}`}
          width={640}
          height={428}
          sizes="(max-width: 900px) 100vw, 320px"
          priority
        />
      </div>

      <div className="product-carousel">
        <button
          className="product-carousel-nav"
          type="button"
          aria-label="Previous images"
          onClick={goPrevious}
        >
          &lt;
        </button>

        <div className="product-carousel-track">
          {safeImages.map((img, i) => (
            <button
              key={`${img}-${i}`}
              className="product-carousel-thumb"
              type="button"
              aria-label={`View image ${i + 1}`}
              onClick={() => setSelectedIndex(i)}
              aria-pressed={selectedIndex === i}
            >
              <Image
                className="product-carousel-thumb-img"
                src={img}
                alt={`Image ${i + 1} of ${title}`}
                width={160}
                height={120}
              />
            </button>
          ))}
        </div>

        <button
          className="product-carousel-nav"
          type="button"
          aria-label="Next images"
          onClick={goNext}
        >
          &gt;
        </button>
      </div>
    </>
  );
}
