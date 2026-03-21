"use client";

import { useEffect, useState, useRef } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type Props = {
  /** Optional label for the upload area */
  label?: string;
  /** Optional custom button text for initial state */
  uploadButtonText?: string;
  /** Optional handler called when a file is selected (without uploading) */
  onFileSelected?: (file: File, previewUrl: string) => void;
  /** Optional handler called when file is cleared */
  onFileCleared?: () => void;
  /** Optional handler called when upload succeeds with the file URL */
  onUploadSuccess?: (fileUrl: string, fileKey: string) => void;
  /** Optional handler called when upload fails */
  onUploadError?: (error: string) => void;
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeBytes?: number;
  /** Optional error handler for invalid files */
  onError?: (error: string) => void;
  /** Whether to enable automatic upload after file selection (default: true) */
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
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const processFile = (file: File | null) => {
    setError("");
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadedFileUrl("");

    if (!file) {
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

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    onFileSelected?.(file, url);

    if (autoUpload) {
      void handleUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    processFile(file);
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setUploadStatus("idle");
    setUploadProgress(0);
    setUploadedFileUrl("");
    setIsDragging(false);
    onFileCleared?.();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (file: File = selectedFile!) => {
    if (!file) return;

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

      if (!presignedResponse.ok) {
        const errorData: PresignedUrlResponse = await presignedResponse.json();
        throw new Error(errorData.error || "Failed to get presigned URL");
      }

      const { presignedUrl, fileUrl, fileKey }: PresignedUrlResponse =
        await presignedResponse.json();

      setUploadProgress(30);

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to S3");
      }

      setUploadProgress(100);
      setUploadStatus("success");
      setUploadedFileUrl(fileUrl);
      onUploadSuccess?.(fileUrl, fileKey);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(errorMsg);
      setUploadStatus("error");
      onUploadError?.(errorMsg);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getUploadStatusText = (): string => {
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
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    processFile(file);
  };

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
    background: isDragging ? "#1e2521" : isHovered ? "#1d2122" : "#191c1d",
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
        maxWidth: "760px",
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
              color: "#d8ded8",
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
                color: "#ebe3d5",
              }}
            >
              Drag and drop an image here
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "1rem",
                color: "rgba(231, 223, 210, 0.76)",
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
              color: "rgba(231, 223, 210, 0.65)",
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
            background: "#191c1d",
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
                    color: "rgba(195, 184, 164, 0.72)",
                  }}
                >
                  Selected image
                </p>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#ebe3d5",
                  }}
                >
                  {getUploadStatusText()}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove image"
                style={{
                  width: "42px",
                  height: "42px",
                  padding: 0,
                  borderRadius: "14px",
                  border: "1px solid rgba(108, 121, 113, 0.55)",
                  background: "transparent",
                  color: "#e7decd",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
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
                  color: "#ebe3d5",
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
                  color: "rgba(231, 223, 210, 0.68)",
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
                  title={uploadedFileUrl}
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    color: "rgba(231, 223, 210, 0.68)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Uploaded URL: {uploadedFileUrl.slice(0, 52)}...
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
                style={{
                  padding: "11px 17px",
                  borderRadius: "999px",
                  border: "1px solid rgba(110, 124, 116, 0.45)",
                  background: "transparent",
                  color: "#e8dfd0",
                  font: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
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