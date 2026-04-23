"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const backdropCloseHandlers =
    useBackdropPointerClose<HTMLDivElement>(closePreview);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const originalOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isPreviewOpen]);

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
      <button
        className="product-image product-image-button"
        type="button"
        onClick={() => setIsPreviewOpen(true)}
        aria-label={`View full image of ${title}`}
      >
        <Image
          className="product-image-img"
          src={safeImages[selectedIndex]}
          alt={`Image of ${title}`}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          quality={100}
          unoptimized
          priority
        />
      </button>

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
                fill
                sizes="72px"
                quality={100}
                unoptimized
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

      {isPreviewOpen ? (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged image of ${title}`}
          {...backdropCloseHandlers}
        >
          <button
            type="button"
            className="product-image-lightbox-close"
            onClick={closePreview}
            aria-label="Close image preview"
          >
            &times;
          </button>
          <div className="product-image-lightbox-content">
            <Image
              className="product-image-lightbox-img"
              src={safeImages[selectedIndex]}
              alt={`Image of ${title}`}
              width={1600}
              height={1200}
              sizes="100vw"
              quality={100}
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
