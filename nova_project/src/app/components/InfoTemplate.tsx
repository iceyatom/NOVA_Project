// src/app/components/InfoTemplate.tsx

import React from "react";
import Image from "next/image";

interface InfoTemplateProps {
  title?: string;
  subtitle?: string;
  body?: string | React.ReactNode;
  images?: string[];
  isLoading?: boolean;
  error?: string;
}

const InfoTemplate: React.FC<InfoTemplateProps> = ({
  title,
  subtitle,
  body,
  images,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="info-template-loading">
        <div className="skeleton title"></div>
        <div className="skeleton subtitle"></div>
        <div className="skeleton text"></div>
        <div className="skeleton text"></div>
        <div className="skeleton image"></div>
      </div>
    );
  }

  if (error) {
    return <div className="info-template-error">Error: {error}</div>;
  }

  if (!title && !subtitle && !body && (!images || images.length === 0)) {
    return <div className="info-template-empty">No content available.</div>;
  }

  return (
    <div className="info-template">
      {title && <h1 className="info-title">{title}</h1>}
      {subtitle && <h2 className="info-subtitle">{subtitle}</h2>}
      {body && <div className="info-body">{body}</div>}
      {images && images.length > 0 && (
        <div className="info-image-gallery">
          {images.map((src, index) => (
            <div key={index} className="info-image-container">
              <Image
                src={src}
                alt={`${title || "Info"} image ${index + 1}`}
                layout="responsive"
                width={500}
                height={300}
                objectFit="cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InfoTemplate;
