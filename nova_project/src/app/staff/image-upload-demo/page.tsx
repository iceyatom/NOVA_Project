"use client";

import Link from "next/link";

import ImageUpload from "@/app/components/ImageUpload";

export default function StaffImageUploadDemoPage() {
  return (
    <div className="staff-dev-page">
      <div className="staff-dev-card">
        <h1 className="staff-dev-title">Image Upload Component Demo</h1>

        <p className="staff-dev-subtitle">
          Reusable image upload UI template for staff-facing workflows.
        </p>

        <p style={{ marginBottom: "1.5rem" }}>
          This template allows users to select an image file and confirms the
          file has been received. It includes client-side validation, local
          preview, and file metadata display without backend integration.
        </p>

        <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
          Basic Usage
        </h2>

        <ImageUpload />

        <div
          style={{
            marginTop: "2rem",
            borderTop: "1px solid var(--border)",
            paddingTop: "2rem",
          }}
        >
          <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
            With Custom Label and Callbacks
          </h2>
          <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
            Open the browser console to see callback outputs:
          </p>
          <ImageUpload
            label="Product Image Upload"
            uploadButtonText="Upload Product Image"
            maxSizeBytes={5 * 1024 * 1024}
            onFileSelected={(file, previewUrl) => {
              console.log("File selected:", file.name, file.size);
              console.log("Preview URL:", previewUrl);
            }}
            onFileCleared={() => {
              console.log("File cleared");
            }}
            onError={(error) => {
              console.error("Upload error:", error);
            }}
          />
        </div>

        <div className="staff-dev-back-wrapper">
          <Link href="/staff" className="staff-dev-pill">
            {"\u2190 Back to Staff Dev Hub"}
          </Link>
        </div>
      </div>
    </div>
  );
}
