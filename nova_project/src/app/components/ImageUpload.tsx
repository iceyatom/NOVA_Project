"use client";

import { useEffect, useRef, useState } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type Props = {
  label?: string;
  uploadButtonText?: string;
  onFileSelected?: (file: File, previewUrl: string) => void;
  onFileCleared?: () => void;
  onUploadSuccess?: (fileUrl: string, fileKey: string) => void;
  onUploadError?: (error: string) => void;
  maxSizeBytes?: number;
  onError?: (error: string) => void;
  autoUpload?: boolean;
};

type PresignedUrlResponse = {
  success: boolean;
  presignedUrl: string;
  fileUrl: string;
  fileKey: string;
  expiresIn: number;
  error?: string;
};

export default function ImageUpload({
  label = "Upload Image",
  uploadButtonText = "Choose Image",
  onFileSelected,
  onFileCleared,
  onUploadSuccess,
  onUploadError,
  onError,
  maxSizeBytes = 10 * 1024 * 1024,
  autoUpload = true,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadedFileKey, setUploadedFileKey] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetUploadState() {
    setError("");
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadedFileUrl("");
    setUploadedFileKey("");
  }

  function processFile(file: File | null) {
    resetUploadState();

    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      const errorMsg = "Please select a valid image file.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      const errorMsg = `File size exceeds ${maxSizeMB}MB limit.`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    onFileSelected?.(file, nextPreviewUrl);

    if (autoUpload) {
      void handleUpload(file);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    processFile(file);
  }

  function handleClear() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadedFileUrl("");
    setUploadedFileKey("");
    setIsDragging(false);
    onFileCleared?.();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload(fileOverride?: File) {
    const file = fileOverride ?? selectedFile;
    if (!file || uploadStatus === "uploading") return;

    setError("");
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      setUploadProgress(10);

      const presignedResponse = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          maxFileSize: maxSizeBytes,
        }),
      });

      const presignedData =
        (await presignedResponse.json()) as PresignedUrlResponse;

      if (!presignedResponse.ok || !presignedData.success) {
        throw new Error(
          presignedData.error || "Failed to get presigned upload URL.",
        );
      }

      const { presignedUrl, fileUrl, fileKey } = presignedData;

      setUploadProgress(35);

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3.");
      }

      setUploadProgress(100);
      setUploadStatus("success");
      setUploadedFileUrl(fileUrl);
      setUploadedFileKey(fileKey);
      setError("");
      onUploadSuccess?.(fileUrl, fileKey);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(errorMsg);
      setUploadStatus("error");
      setUploadProgress(0);
      onUploadError?.(errorMsg);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  function getUploadStatusText(): string {
    switch (uploadStatus) {
      case "uploading":
        return `Uploading... ${uploadProgress}%`;
      case "success":
        return "Upload complete";
      case "error":
        return "Upload failed";
      default:
        return "Image ready";
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    processFile(file);
  }

  const dropzoneStyle: React.CSSProperties = {
    position: "relative",
    minHeight: "280px",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "center",
    cursor: "pointer",
    borderRadius: "24px",
    background: isDragging
      ? "rgba(30, 127, 90, 0.08)"
      : isHovered
        ? "rgba(30, 127, 90, 0.04)"
        : "transparent",
    border: isDragging
      ? "1px solid rgba(111, 160, 126, 0.95)"
      : isHovered
        ? "1px solid rgba(93, 141, 108, 0.7)"
        : "1px solid rgba(103, 121, 111, 0.35)",
    boxShadow: isDragging ? "0 0 0 3px rgba(111, 160, 126, 0.12)" : "none",
    transform: isDragging ? "translateY(-1px)" : "none",
    transition:
      "border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  };

  return (
    <div
      aria-label={label}
      style={{
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        aria-label="Select image file"
        style={{ display: "none" }}
      />

      {!selectedFile ? (
        <div
          style={dropzoneStyle}
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          role="button"
          tabIndex={0}
          aria-label={uploadButtonText}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleButtonClick();
            }
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "14px",
              border: "1.5px dashed rgba(99, 129, 112, 0.5)",
              borderRadius: "18px",
              pointerEvents: "none",
            }}
          />

          <div
            aria-hidden="true"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              display: "grid",
              placeItems: "center",
              color: "#1f2937",
              background: "rgba(70, 108, 82, 0.18)",
              border: "1px solid rgba(102, 142, 116, 0.28)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="28"
              height="28"
            >
              <path
                d="M12 16V4M12 4l-4 4M12 4l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 16.5v1.5A2 2 0 0 0 6 20h12a2 2 0 0 0 2-2v-1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              Drag and drop an image here
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                color: "rgba(31, 41, 55, 0.76)",
              }}
            >
              or click to browse files
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
            style={{
              position: "relative",
              zIndex: 1,
              padding: "12px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(107, 148, 119, 0.72)",
              background: "#1e7f5a",
              color: "#ffffff",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.16)",
            }}
          >
            {uploadButtonText}
          </button>

          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              color: "rgba(31, 41, 55, 0.72)",
              position: "relative",
              zIndex: 1,
            }}
          >
            Supports JPG, PNG, GIF, WebP (Max {formatFileSize(maxSizeBytes)})
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px minmax(0, 1fr)",
            gap: "22px",
            alignItems: "start",
            padding: "20px",
            borderRadius: "24px",
            background: "transparent",
            border: "1px solid rgba(103, 121, 111, 0.35)",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              overflow: "hidden",
              borderRadius: "18px",
              border: "1px solid rgba(95, 111, 103, 0.4)",
              background: "#111314",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview of selected image"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(55, 65, 81, 0.72)",
                  }}
                >
                  Selected image
                </p>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#1f2937",
                  }}
                >
                  {getUploadStatusText()}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove image"
                disabled={uploadStatus === "uploading"}
                style={{
                  width: "42px",
                  height: "42px",
                  padding: 0,
                  borderRadius: "14px",
                  border: "1px solid rgba(108, 121, 113, 0.55)",
                  background: "transparent",
                  color: "#374151",
                  display: "grid",
                  placeItems: "center",
                  cursor:
                    uploadStatus === "uploading" ? "not-allowed" : "pointer",
                  opacity: uploadStatus === "uploading" ? 0.6 : 1,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minWidth: 0,
              }}
            >
              <p
                title={selectedFile.name}
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedFile.name}
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  color: "rgba(55, 65, 81, 0.82)",
                }}
              >
                {formatFileSize(selectedFile.size)}
              </p>

              {uploadStatus === "uploading" && (
                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    overflow: "hidden",
                    borderRadius: "999px",
                    background: "rgba(255, 255, 255, 0.07)",
                    border: "1px solid rgba(90, 104, 97, 0.45)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${uploadProgress}%`,
                      borderRadius: "999px",
                      background: "linear-gradient(90deg, #1e7f5a, #34d399)",
                      transition: "width 0.2s ease",
                    }}
                  />
                </div>
              )}

              {uploadStatus === "success" && uploadedFileUrl && (
                <p
                  title={uploadedFileKey}
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    color: "rgba(55, 65, 81, 0.82)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Uploaded key: {uploadedFileKey}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {!autoUpload && uploadStatus === "idle" && (
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "999px",
                    border: "1px solid rgba(107, 148, 119, 0.72)",
                    background: "#1e7f5a",
                    color: "#ffffff",
                    font: "inherit",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Upload to S3
                </button>
              )}

              {uploadStatus === "error" && (
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  style={{
                    padding: "12px 18px",
                    borderRadius: "999px",
                    border: "1px solid rgba(107, 148, 119, 0.72)",
                    background: "#1e7f5a",
                    color: "#ffffff",
                    font: "inherit",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Retry Upload
                </button>
              )}

              <button
                type="button"
                onClick={handleButtonClick}
                disabled={uploadStatus === "uploading"}
                style={{
                  padding: "11px 17px",
                  borderRadius: "999px",
                  border: "1px solid rgba(110, 124, 116, 0.45)",
                  background: "transparent",
                  color: "#1f2937",
                  font: "inherit",
                  fontWeight: 700,
                  cursor:
                    uploadStatus === "uploading" ? "not-allowed" : "pointer",
                  opacity: uploadStatus === "uploading" ? 0.6 : 1,
                }}
              >
                Choose Different Image
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: "12px 14px",
            borderRadius: "14px",
            background: "rgba(111, 33, 33, 0.18)",
            border: "1px solid rgba(189, 88, 88, 0.35)",
            color: "#f2bbbb",
            fontSize: "0.95rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
