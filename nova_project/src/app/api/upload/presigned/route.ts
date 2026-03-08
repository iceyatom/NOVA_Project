import { NextRequest, NextResponse } from "next/server";
import {
  generatePresignedUrl,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Request body for generating a presigned URL
 */
type PresignedUrlRequest = {
  fileName: string;
  fileType: string;
  maxFileSize?: number;
};

/**
 * Response containing the presigned URL and file metadata
 */
type PresignedUrlResponse = {
  success: boolean;
  presignedUrl: string;
  fileUrl: string;
  fileKey: string;
  expiresIn: number;
  error?: string;
};

/**
 * Generate a presigned URL for direct upload to S3
 *
 * POST /api/upload/presigned
 *
 * Request body:
 * {
 *   "fileName": "example.jpg",
 *   "fileType": "image/jpeg",
 *   "maxFileSize": 10485760  // optional
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "presignedUrl": "https://...",
 *   "fileUrl": "https://...",
 *   "fileKey": "uploads/1234567890-abc123.jpg",
 *   "expiresIn": 900
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: PresignedUrlRequest = await request.json();

    // Validate required fields
    if (!body.fileName || typeof body.fileName !== "string") {
      return NextResponse.json(
        { success: false, error: "fileName is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.fileType || typeof body.fileType !== "string") {
      return NextResponse.json(
        { success: false, error: "fileType is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(body.fileType as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate and use custom max file size if provided
    const customMaxSize = body.maxFileSize;
    if (customMaxSize !== undefined) {
      if (typeof customMaxSize !== "number" || customMaxSize <= 0) {
        return NextResponse.json(
          { success: false, error: "maxFileSize must be a positive number" },
          { status: 400 }
        );
      }
      if (customMaxSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `maxFileSize cannot exceed ${MAX_FILE_SIZE} bytes (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB)`,
          },
          { status: 400 }
        );
      }
    }

    // Generate presigned URL
    const { presignedUrl, fileUrl, fileKey } = await generatePresignedUrl(
      body.fileName,
      body.fileType,
      customMaxSize, // Server-side validation placeholder (S3 doesn't enforce size)
    );

    // Return success response
    const response: PresignedUrlResponse = {
      success: true,
      presignedUrl,
      fileUrl,
      fileKey,
      expiresIn: 900, // 15 minutes
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("Error generating presigned URL:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("S3_BUCKET_NAME")) {
        return NextResponse.json(
          { success: false, error: "Server configuration error: S3 bucket not configured" },
          { status: 500 }
        );
      }
      if (error.message.includes("Invalid file type")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST to generate a presigned URL." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST to generate a presigned URL." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST to generate a presigned URL." },
    { status: 405 }
  );
}
