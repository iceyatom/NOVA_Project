// src/lib/s3.ts
// AWS S3 client for presigned URL generation.
//
// Production (Vercel): uses OIDC via AWS_ROLE_ARN — no static keys needed.
// Development:         falls back to AWS_ACCESS_KEY_ID/SECRET if present,
//                      otherwise uses the default AWS credential chain
//                      (local ~/.aws profile, etc.).

import { S3Client, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

function getS3Credentials() {
  // Production on Vercel: use OIDC — same role as the DB connection.
  if (process.env.AWS_ROLE_ARN) {
    return awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN });
  }
  // Development fallback: static keys if present.
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  // Let the SDK use its default chain (~/.aws/credentials, EC2 role, etc.)
  return undefined;
}

// Singleton S3 client — hot-reload safe in dev.
const globalForS3 = global as unknown as { s3?: S3Client };

export const s3Client =
  globalForS3.s3 ??
  new S3Client({
    region: process.env.AWS_REGION ?? "us-east-2",
    credentials: getS3Credentials(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3Client;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = Number.parseInt(
  process.env.MAX_UPLOAD_SIZE ?? "10485760",
  10,
); // 10 MB

export const PRESIGNED_URL_EXPIRATION = 900; // 15 minutes

export function generateFileKey(fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = fileName.split(".").pop() ?? "jpg";
  return `uploads/${timestamp}-${randomString}.${extension}`;
}

export async function generatePresignedUrl(
  fileName: string,
  fileType: string,
): Promise<{ presignedUrl: string; fileUrl: string; fileKey: string }> {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(fileType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error(
      `Invalid file type: ${fileType}. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    );
  }

  const fileKey = generateFileKey(fileName);

  const params: PutObjectCommandInput = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    Metadata: {
      "original-name": fileName,
      "uploaded-at": new Date().toISOString(),
    },
  };

  const presignedUrl = await getSignedUrl(s3Client, new PutObjectCommand(params), {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });

  const region = process.env.AWS_REGION ?? "us-east-2";
  const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${fileKey}`;

  return { presignedUrl, fileUrl, fileKey };
}

export async function deleteFileFromS3(fileKey: string): Promise<void> {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set.");
  }

  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
    }),
  );
}
