/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Officer` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Department" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "Officer" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deletedAt";
