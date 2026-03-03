"use client";

import { useState, useRef } from "react";

type Props = {
  /** Optional label for the upload area */
  label?: string;
  /** Optional custom button text for initial state */
  uploadButtonText?: string;
  /** Optional handler called when a file is selected (without uploading) */
  onFileSelected?: (file: File, previewUrl: string) => void;
  /** Optional handler called when file is cleared */
  onFileCleared?: () => void;
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeBytes?: number;
  /** Optional error handler for invalid files */
  onError?: (error: string) => void;
};

export default function ImageUpload({
  label = "Upload Image",
  uploadButtonText = "Choose Image",
  onFileSelected,
  onFileCleared,
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  onError,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset error state
    setError("");

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const errorMsg = "Please select a valid image file.";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      const errorMsg = `File size exceeds ${maxSizeMB}MB limit.`;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    onFileSelected?.(file, url);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    onFileCleared?.();

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  return (
    <div className="image-upload-container" aria-label={label}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="image-upload-input"
        aria-label="Select image file"
      />

      {!selectedFile ? (
        // Default state - upload button/drop zone
        <div className="image-upload-default">
          <button
            type="button"
            onClick={handleButtonClick}
            className="image-upload-button"
            aria-label={uploadButtonText}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              aria-hidden="true"
              className="image-upload-icon"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>{uploadButtonText}</span>
          </button>
          <p className="image-upload-hint">
            Supports JPG, PNG, GIF, WebP (Max {formatFileSize(maxSizeBytes)})
          </p>
        </div>
      ) : (
        // Selected state - preview and file info
        <div className="image-upload-selected">
          <div className="image-upload-preview-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview of selected image"
              className="image-upload-preview"
            />
          </div>

          <div className="image-upload-info">
            <div className="image-upload-header">
              <h3 className="image-upload-status">✓ Image received</h3>
              <button
                type="button"
                onClick={handleClear}
                className="image-upload-clear"
                aria-label="Remove image"
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

            <div className="image-upload-metadata">
              <p className="image-upload-name" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="image-upload-size">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="image-upload-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
