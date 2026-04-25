// AWS S3 client configuration for presigned URL generation
import { S3Client, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== "test") {
  console.warn(
    `Warning: Missing AWS environment variables: ${missingEnvVars.join(", ")}`,
  );
}

// Create S3 client instance (singleton pattern)
const globalForS3 = global as unknown as { s3?: S3Client };

export const s3Client =
  globalForS3.s3 ??
  new S3Client({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

// Cache the instance in development to avoid re-instantiation
if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3Client;
}

/**
 * Allowed image file types for upload
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

/**
 * Maximum file size (10MB default, can be overridden via environment)
 */
export const MAX_FILE_SIZE = Number.parseInt(
  process.env.MAX_UPLOAD_SIZE ?? "10485760",
  10,
); // 10MB

/**
 * Presigned URL expiration time (15 minutes by default)
 */
export const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

/**
 * Generate a unique file key for S3 storage
 * Format: uploads/{timestamp}-{randomString}.{extension}
 */
export function generateFileKey(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = fileName.split(".").pop() ?? "jpg";
  return `uploads/${timestamp}-${randomString}.${extension}`;
}

/**
 * Generate a presigned URL for direct upload to S3
 *
 * @param fileName - Original file name
 * @param fileType - MIME type of the file
 * @param maxFileSize - Maximum file size in bytes (optional, uses default)
 * @returns Object containing the presigned URL and the final file URL
 */
export async function generatePresignedUrl(
  fileName: string,
  fileType: string,
): Promise<{
  presignedUrl: string;
  fileUrl: string;
  fileKey: string;
}> {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  // Validate file type
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      fileType as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    throw new Error(
      `Invalid file type: ${fileType}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    );
  }

  // Generate file key
  const fileKey = generateFileKey(fileName);

  // Set up parameters for the PutObject command
  const params: PutObjectCommandInput = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    // Add metadata for tracking
    Metadata: {
      "original-name": fileName,
      "uploaded-at": new Date().toISOString(),
    },
  };

  // Generate the presigned URL
  const presignedUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand(params),
    { expiresIn: PRESIGNED_URL_EXPIRATION },
  );

  // Construct the public URL (assuming bucket is public-read or has a CDN)
  // For CloudFront, you would use your CloudFront domain
  const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION ?? "us-east-1"}.amazonaws.com/${fileKey}`;

  return {
    presignedUrl,
    fileUrl,
    fileKey,
  };
}

/**
 * Delete a file from S3
 *
 * @param fileKey - The S3 key of the file to delete
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    }),
  );
}
