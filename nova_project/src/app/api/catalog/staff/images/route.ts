import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFileFromS3 } from "@/lib/s3";
import { requireStaffSession } from "@/lib/auth/staffAccess";

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

function normalizeS3Key(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/^\/+/, "");
  return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.trunc(value);
}

async function upsertImageAsset(args: {
  s3Key: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}) {
  const updateData = {
    ...(args.fileName !== undefined ? { fileName: args.fileName } : {}),
    ...(args.contentType !== undefined
      ? { contentType: args.contentType }
      : {}),
    ...(args.sizeBytes !== undefined ? { sizeBytes: args.sizeBytes } : {}),
  };

  return prisma.imageAssets.upsert({
    where: { s3Key: args.s3Key },
    create: {
      s3Key: args.s3Key,
      fileName: args.fileName,
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
    },
    update: updateData,
  });
}

async function ensureAssetsForKeys(keys: string[]) {
  const uniqueKeys = Array.from(
    new Set(keys.map((key) => key.trim()).filter(Boolean)),
  );

  if (uniqueKeys.length === 0) {
    return;
  }

  await prisma.$transaction(
    uniqueKeys.map((s3Key) =>
      prisma.imageAssets.upsert({
        where: { s3Key },
        create: { s3Key },
        update: {},
      }),
    ),
  );
}

async function buildImageLibraryEntry(
  key: string,
  options: {
    asset?: {
      id: number;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    usageCount?: number;
    lastLinkedAt?: Date | null;
    linkedToCatalogItem?: boolean;
  } = {},
) {
  const asset =
    options.asset ??
    (await prisma.imageAssets.findUnique({
      where: { s3Key: key },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    }));

  const usageCount =
    options.usageCount ??
    (await prisma.catalogItemImage.count({
      where: { s3Key: key },
    }));

  return {
    assetId: asset?.id ?? null,
    s3Key: key,
    url: getImageUrlFromKey(key),
    usageCount,
    lastLinkedAt: options.lastLinkedAt ?? null,
    linkedToCatalogItem: options.linkedToCatalogItem === true,
    canDelete: usageCount === 0 && asset != null,
    createdAt: asset?.createdAt ?? null,
    updatedAt: asset?.updatedAt ?? null,
  };
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
          sortOrder: true,
          createdAt: true,
          catalogItem: {
            select: {
              itemName: true,
              sku: true,
              updatedAt: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      });

      const linkedCatalogItemIds = new Set(
        references.map((reference) => reference.catalogItemId),
      );
      const asset = await prisma.imageAssets.findUnique({
        where: { s3Key: normalizedS3Key },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const usageCount = references.length;

      return NextResponse.json(
        {
          success: true,
          data: {
            assetId: asset?.id ?? null,
            s3Key: normalizedS3Key,
            url: getImageUrlFromKey(normalizedS3Key),
            usageCount,
            canDelete: usageCount === 0 && asset != null,
            createdAt: asset?.createdAt ?? null,
            updatedAt: asset?.updatedAt ?? null,
            references: references.map((reference) => ({
              imageId: reference.id,
              catalogItemId: reference.catalogItemId,
              itemName: reference.catalogItem.itemName,
              sku: reference.catalogItem.sku,
              sortOrder: reference.sortOrder,
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
    const normalizedQuery = itemQuery.replace(/\s+/g, " ");

    if (normalizedQuery) {
      const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
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
    }

    const groupedLinkedImages = await prisma.catalogItemImage.groupBy({
      by: ["s3Key"],
      where: {
        s3Key: { not: "" },
        ...(matchedCatalogItemIds && matchedCatalogItemIds.length > 0
          ? {
              catalogItemId: {
                in: matchedCatalogItemIds,
              },
            }
          : normalizedQuery
            ? {
                s3Key: {
                  contains: normalizedQuery,
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
      take: Math.min(300, limit * 2),
    });

    const linkedKeys = groupedLinkedImages
      .map((entry) => entry.s3Key.trim())
      .filter(Boolean);
    const assets = await prisma.imageAssets.findMany({
      where: normalizedQuery
        ? {
            OR: [
              {
                s3Key: {
                  contains: normalizedQuery,
                },
              },
              ...(linkedKeys.length > 0
                ? [
                    {
                      s3Key: {
                        in: linkedKeys,
                      },
                    },
                  ]
                : []),
            ],
          }
        : undefined,
      select: {
        id: true,
        s3Key: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: Math.min(300, limit * 2),
    });

    const keys = Array.from(
      new Set([
        ...assets.map((asset) => asset.s3Key.trim()).filter(Boolean),
        ...linkedKeys,
      ]),
    );
    const globalImageStats =
      keys.length > 0
        ? await prisma.catalogItemImage.groupBy({
            by: ["s3Key"],
            where: {
              s3Key: {
                in: keys,
              },
            },
            _count: {
              s3Key: true,
            },
            _max: {
              createdAt: true,
            },
          })
        : [];
    const globalStatsByKey = new Map(
      globalImageStats.map((entry) => [entry.s3Key, entry] as const),
    );
    const assetsByKey = new Map(
      assets.map((asset) => [asset.s3Key, asset] as const),
    );

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

    const data = keys
      .map((key) => {
        const asset = assetsByKey.get(key) ?? null;
        const globalStats = globalStatsByKey.get(key);
        const usageCount = globalStats?._count.s3Key ?? 0;

        return {
          assetId: asset?.id ?? null,
          s3Key: key,
          url: getImageUrlFromKey(key),
          usageCount,
          lastLinkedAt: globalStats?._max.createdAt ?? null,
          linkedToCatalogItem: linkedKeySet.has(key),
          canDelete: usageCount === 0 && asset != null,
          createdAt: asset?.createdAt ?? null,
          updatedAt: asset?.updatedAt ?? null,
        };
      })
      .sort((a, b) => {
        const aTime = Date.parse(
          String(a.lastLinkedAt ?? a.updatedAt ?? a.createdAt ?? ""),
        );
        const bTime = Date.parse(
          String(b.lastLinkedAt ?? b.updatedAt ?? b.createdAt ?? ""),
        );

        if ((bTime || 0) !== (aTime || 0)) {
          return (bTime || 0) - (aTime || 0);
        }

        return a.s3Key.localeCompare(b.s3Key);
      })
      .slice(0, limit);

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
    const { catalogItemId, fileKey, fileName, contentType, sizeBytes } = body;
    const normalizedFileKey = normalizeS3Key(fileKey);

    if (!normalizedFileKey) {
      return NextResponse.json(
        { success: false, error: "fileKey must be a non-empty string" },
        { status: 400 },
      );
    }

    const asset = await upsertImageAsset({
      s3Key: normalizedFileKey,
      fileName: normalizeOptionalString(fileName),
      contentType: normalizeOptionalString(contentType),
      sizeBytes: normalizeOptionalPositiveInt(sizeBytes),
    });

    if (catalogItemId == null) {
      const entry = await buildImageLibraryEntry(normalizedFileKey, {
        asset,
      });

      return NextResponse.json(
        { success: true, data: entry, alreadyLinked: false },
        { status: 201 },
      );
    }

    if (typeof catalogItemId !== "number" || !Number.isInteger(catalogItemId)) {
      return NextResponse.json(
        { success: false, error: "catalogItemId must be an integer number" },
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
      if (existingImage.imageAssetId == null) {
        await prisma.catalogItemImage.update({
          where: { id: existingImage.id },
          data: { imageAssetId: asset.id },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            ...existingImage,
            imageAssetId: asset.id,
          },
          alreadyLinked: true,
        },
        { status: 200 },
      );
    }

    const maxSortOrder = await prisma.catalogItemImage.aggregate({
      where: {
        catalogItemId,
      },
      _max: {
        sortOrder: true,
      },
    });

    const image = await prisma.catalogItemImage.create({
      data: {
        catalogItemId,
        s3Key: normalizedFileKey,
        imageAssetId: asset.id,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
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

export async function PATCH(request: NextRequest) {
  const auth = await requireStaffSession(["ADMIN", "STAFF"]);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { catalogItemId, imageIds } = body as {
      catalogItemId?: unknown;
      imageIds?: unknown;
    };

    if (typeof catalogItemId !== "number" || !Number.isInteger(catalogItemId)) {
      return NextResponse.json(
        { success: false, error: "catalogItemId must be an integer number" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(imageIds) ||
      imageIds.length === 0 ||
      !imageIds.every(
        (imageId) => typeof imageId === "number" && Number.isInteger(imageId),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "imageIds must be a non-empty array of integer numbers",
        },
        { status: 400 },
      );
    }

    const uniqueImageIds = new Set(imageIds);
    if (uniqueImageIds.size !== imageIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "imageIds must not include duplicates",
        },
        { status: 400 },
      );
    }

    const existingImages = await prisma.catalogItemImage.findMany({
      where: {
        catalogItemId,
      },
      select: {
        id: true,
      },
    });

    if (existingImages.length !== imageIds.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "imageIds must include every linked image for this catalog item exactly once",
        },
        { status: 400 },
      );
    }

    const existingImageIdSet = new Set(existingImages.map((image) => image.id));
    const allBelongToItem = imageIds.every((imageId) =>
      existingImageIdSet.has(imageId),
    );
    if (!allBelongToItem) {
      return NextResponse.json(
        {
          success: false,
          error:
            "imageIds must include every linked image for this catalog item exactly once",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      imageIds.map((imageId, index) =>
        prisma.catalogItemImage.update({
          where: {
            id: imageId,
          },
          data: {
            sortOrder: index,
          },
        }),
      ),
    );

    return NextResponse.json(
      {
        success: true,
        data: imageIds.map((imageId, index) => ({
          id: imageId,
          sortOrder: index,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error reordering images:", error);

    return NextResponse.json(
      { success: false, error: "Failed to reorder images" },
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
    const { imageId, s3Key: rawS3Key, deleteAsset } = body;

    if (deleteAsset === true) {
      const normalizedS3Key = normalizeS3Key(rawS3Key);
      if (!normalizedS3Key) {
        return NextResponse.json(
          { success: false, error: "s3Key must be a non-empty string" },
          { status: 400 },
        );
      }

      const remainingReferences = await prisma.catalogItemImage.count({
        where: { s3Key: normalizedS3Key },
      });

      if (remainingReferences > 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Image asset cannot be deleted while catalog items still link to it.",
          },
          { status: 409 },
        );
      }

      const asset = await prisma.imageAssets.findUnique({
        where: { s3Key: normalizedS3Key },
        select: { id: true },
      });

      if (!asset) {
        return NextResponse.json(
          { success: false, error: "Image asset not found" },
          { status: 404 },
        );
      }

      await deleteFileFromS3(normalizedS3Key);
      await prisma.imageAssets.delete({
        where: { s3Key: normalizedS3Key },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            s3Key: normalizedS3Key,
            deletedFromStorage: true,
            deletedAsset: true,
          },
        },
        { status: 200 },
      );
    }

    if (typeof imageId !== "number" || !Number.isInteger(imageId)) {
      return NextResponse.json(
        {
          success: false,
          error: "imageId must be an integer number for unlink requests",
        },
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

    await ensureAssetsForKeys([s3Key]);

    await prisma.catalogItemImage.delete({
      where: { id: imageId },
    });

    const remainingReferences = await prisma.catalogItemImage.count({
      where: { s3Key },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: imageId,
          s3Key,
          remainingReferences,
          deletedFromStorage: false,
          deletedAsset: false,
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
