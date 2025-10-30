-- CreateTable
CREATE TABLE `CatalogItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `price` DOUBLE NULL DEFAULT 0.0,
    `quantityInStock` INTEGER NULL DEFAULT 0,
    `unitOfMeasure` VARCHAR(191) NULL,
    `storageLocation` VARCHAR(191) NULL,
    `storageConditions` VARCHAR(191) NULL,
    `expirationDate` DATETIME(3) NULL,
    `dateAcquired` DATETIME(3) NULL,
    `reorderLevel` INTEGER NULL DEFAULT 0,
    `unitCost` DOUBLE NULL DEFAULT 0.0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
