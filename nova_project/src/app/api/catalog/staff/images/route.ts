import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { catalogItemId, fileKey } = body;

    if (typeof catalogItemId !== "number") {
      return NextResponse.json(
        { success: false, error: "catalogItemId must be a number" },
        { status: 400 },
      );
    }

    if (!fileKey || typeof fileKey !== "string") {
      return NextResponse.json(
        { success: false, error: "fileKey must be a string" },
        { status: 400 },
      );
    }

    const item = await prisma.catalogItem.findUnique({
      where: { id: catalogItemId },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Catalog item not found" },
        { status: 404 },
      );
    }

    const image = await prisma.catalogItemImage.create({
      data: {
        catalogItemId,
        s3Key: fileKey,
      },
    });

    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error) {
    console.error("Error linking image:", error);

    return NextResponse.json(
      { success: false, error: "Failed to link image" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageId, deleteFromStorage } = body;

    if (typeof imageId !== "number") {
      return NextResponse.json(
        { success: false, error: "imageId must be a number" },
        { status: 400 },
      );
    }

    const imageRecord = await prisma.catalogItemImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        s3Key: true,
      },
    });

    if (!imageRecord) {
      return NextResponse.json(
        { success: false, error: "Image record not found" },
        { status: 404 },
      );
    }

    const s3Key = imageRecord.s3Key;

    await prisma.catalogItemImage.delete({
      where: { id: imageId },
    });

    let deletedFromStorage = false;

    if (deleteFromStorage && s3Key) {
      const remainingReferences = await prisma.catalogItemImage.count({
        where: { s3Key },
      });

      if (remainingReferences === 0) {
        const bucket = process.env.S3_BUCKET_NAME;
        if (!bucket) {
          return NextResponse.json(
            {
              success: false,
              error: "Image unlinked, but S3 bucket is not configured.",
            },
            { status: 500 },
          );
        }

        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: s3Key,
          }),
        );

        deletedFromStorage = true;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: imageId,
          deletedFromStorage,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error unlinking image:", error);

    return NextResponse.json(
      { success: false, error: "Failed to unlink image" },
      { status: 500 },
    );
  }
}
