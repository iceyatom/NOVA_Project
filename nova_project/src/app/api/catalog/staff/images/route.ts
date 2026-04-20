import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { requireStaffSession } from "@/lib/auth/staffAccess";

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

function getImageUrlFromKey(key: string) {
  if (/^https?:\/\//i.test(key)) {
    return key;
  }

  const normalizedKey = key.replace(/^\/+/, "");
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;

  if (!bucket) {
    throw new Error("S3_BUCKET_NAME is required to build catalog image URLs.");
  }

  if (!region || region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${normalizedKey}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const catalogItemIdParam = searchParams.get("catalogItemId");
  const s3KeyParam = (searchParams.get("s3Key") ?? "").trim();
  const itemQuery = (searchParams.get("query") ?? "").trim();
  const limitParam = searchParams.get("limit");

  const limit = limitParam
    ? Math.min(300, Math.max(1, Number.parseInt(limitParam, 10) || 120))
    : 120;
  const catalogItemId =
    catalogItemIdParam == null
      ? null
      : Number.parseInt(catalogItemIdParam, 10) || 0;

  if (
    catalogItemIdParam != null &&
    (catalogItemId == null || catalogItemId <= 0)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "catalogItemId must be a positive integer when provided.",
      },
      { status: 400 },
    );
  }

  try {
    if (s3KeyParam) {
      const normalizedS3Key = s3KeyParam.replace(/^\/+/, "");
      const references = await prisma.catalogItemImage.findMany({
        where: {
          s3Key: normalizedS3Key,
        },
        select: {
          id: true,
          catalogItemId: true,
          createdAt: true,
          catalogItem: {
            select: {
              itemName: true,
              sku: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });

      const linkedCatalogItemIds = new Set(
        references.map((reference) => reference.catalogItemId),
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            s3Key: normalizedS3Key,
            url: getImageUrlFromKey(normalizedS3Key),
            references: references.map((reference) => ({
              imageId: reference.id,
              catalogItemId: reference.catalogItemId,
              itemName: reference.catalogItem.itemName,
              sku: reference.catalogItem.sku,
              linkedAt: reference.createdAt,
              itemUpdatedAt: reference.catalogItem.updatedAt,
              linkedToCatalogItem:
                catalogItemId != null &&
                linkedCatalogItemIds.has(catalogItemId),
            })),
          },
        },
        { status: 200 },
      );
    }

    let matchedCatalogItemIds: number[] | null = null;

    if (itemQuery) {
      const queryTokens = itemQuery.split(/\s+/).filter(Boolean);
      const andWhere =
        queryTokens.length > 0
          ? queryTokens.map((token) => ({
              OR: [
                {
                  itemName: {
                    contains: token,
                  },
                },
                {
                  sku: {
                    contains: token,
                  },
                },
              ],
            }))
          : [];

      const matchedItems = await prisma.catalogItem.findMany({
        where: andWhere.length > 0 ? { AND: andWhere } : undefined,
        select: { id: true },
        orderBy: { id: "asc" },
        take: 100,
      });

      matchedCatalogItemIds = matchedItems.map((item) => item.id);
      if (matchedCatalogItemIds.length === 0) {
        return NextResponse.json(
          {
            success: true,
            data: [],
          },
          { status: 200 },
        );
      }
    }

    const groupedImages = await prisma.catalogItemImage.groupBy({
      by: ["s3Key"],
      where: {
        s3Key: { not: "" },
        ...(matchedCatalogItemIds
          ? {
              catalogItemId: {
                in: matchedCatalogItemIds,
              },
            }
          : {}),
      },
      _count: {
        s3Key: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        _max: {
          createdAt: "desc",
        },
      },
      take: limit,
    });

    const keys = groupedImages.map((entry) => entry.s3Key);

    let linkedKeySet = new Set<string>();
    if (catalogItemId && keys.length > 0) {
      const existingLinks = await prisma.catalogItemImage.findMany({
        where: {
          catalogItemId,
          s3Key: {
            in: keys,
          },
        },
        select: {
          s3Key: true,
        },
        distinct: ["s3Key"],
      });

      linkedKeySet = new Set(
        existingLinks
          .map((entry) => entry.s3Key.trim())
          .filter((key) => key.length > 0),
      );
    }

    const data = groupedImages
      .map((entry) => {
        const key = entry.s3Key.trim();
        if (!key) return null;

        return {
          s3Key: key,
          url: getImageUrlFromKey(key),
          usageCount: entry._count.s3Key,
          lastLinkedAt: entry._max.createdAt,
          linkedToCatalogItem: linkedKeySet.has(key),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error loading image library:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load image library" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { catalogItemId, fileKey } = body;
    const normalizedFileKey =
      typeof fileKey === "string" ? fileKey.trim() : null;

    if (typeof catalogItemId !== "number") {
      return NextResponse.json(
        { success: false, error: "catalogItemId must be a number" },
        { status: 400 },
      );
    }

    if (!normalizedFileKey) {
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

    const existingImage = await prisma.catalogItemImage.findFirst({
      where: {
        catalogItemId,
        s3Key: normalizedFileKey,
      },
    });

    if (existingImage) {
      return NextResponse.json(
        { success: true, data: existingImage, alreadyLinked: true },
        { status: 200 },
      );
    }

    const image = await prisma.catalogItemImage.create({
      data: {
        catalogItemId,
        s3Key: normalizedFileKey,
      },
    });

    return NextResponse.json(
      { success: true, data: image, alreadyLinked: false },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error linking image:", error);

    return NextResponse.json(
      { success: false, error: "Failed to link image" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

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
