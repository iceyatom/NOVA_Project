"use client";

import ImageUpload from "@/app/components/ImageUpload";
import { useState } from "react";

export default function ImageUploadDemoPage() {
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ name: string; url: string; key: string }>
  >([]);

  const handleUploadSuccess = (fileUrl: string, fileKey: string) => {
    setUploadedImages((prev) => [
      ...prev,
      { name: fileKey, url: fileUrl, key: fileKey },
    ]);
  };

  const clearImages = () => {
    setUploadedImages([]);
  };

  return (
    <div className="container">
      <main>
        <div className="pane">
          <h1 className="pane-title">Image Upload to S3 Demo</h1>

          <p style={{ marginBottom: "1.5rem" }}>
            This component uploads images directly to AWS S3 using presigned
            URLs. The backend generates a presigned URL, and the file is
            uploaded directly from the browser to S3 without passing through the
            server.
          </p>

          <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
            Auto Upload (Default)
          </h2>
          <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
            Image uploads automatically after selection:
          </p>

          <ImageUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={(error) => {
              console.error("Upload error:", error);
            }}
          />

          {uploadedImages.length > 0 && (
            <div
              style={{
                marginTop: "2rem",
                borderTop: "1px solid var(--border)",
                paddingTop: "2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2 style={{ fontSize: "1.25rem" }}>
                  Uploaded Images ({uploadedImages.length})
                </h2>
                <button
                  type="button"
                  onClick={clearImages}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "var(--border)",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Clear All
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                {uploadedImages.map((img, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: "100%",
                        height: "150px",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ padding: "0.75rem" }}>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginBottom: "0.25rem",
                        }}
                        title={img.key}
                      >
                        {img.key}
                      </p>
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--primary)",
                        }}
                      >
                        View in S3
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "2rem",
              borderTop: "1px solid var(--border)",
              paddingTop: "2rem",
            }}
          >
            <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
              Manual Upload Mode
            </h2>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
              Requires clicking the upload button after selection:
            </p>

            <ImageUpload
              autoUpload={false}
              label="Product Image Upload"
              uploadButtonText="Choose Product Image"
              maxSizeBytes={5 * 1024 * 1024} // 5MB
              onFileSelected={(file, previewUrl) => {
                console.log("File selected:", file.name, file.size);
                console.log("Preview URL:", previewUrl);
              }}
              onUploadSuccess={(fileUrl, fileKey) => {
                console.log("Upload successful:", fileUrl, fileKey);
                alert(`Upload successful! Key: ${fileKey}`);
              }}
              onUploadError={(error) => {
                console.error("Upload error:", error);
                alert(`Upload failed: ${error}`);
              }}
            />
          </div>

          <div
            style={{
              marginTop: "2rem",
              borderTop: "1px solid var(--border)",
              paddingTop: "2rem",
            }}
          >
            <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
              Configuration Required
            </h2>

            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
              To use this component, ensure the following environment variables
              are set in your{" "}
              <code
                style={{
                  background: "var(--border)",
                  padding: "0.25rem 0.5rem",
                }}
              >
                .env
              </code>{" "}
              file:
            </p>

            <code
              style={{
                display: "block",
                background: "var(--bg)",
                padding: "1rem",
                borderRadius: "4px",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              <pre>
                {`AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
MAX_UPLOAD_SIZE=10485760  # 10MB (optional)`}
              </pre>
            </code>

            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              Your S3 bucket must be configured with CORS to allow PUT requests
              from your domain.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
