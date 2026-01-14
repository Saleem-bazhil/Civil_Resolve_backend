/*
  Warnings:

  - Added the required column `area` to the `Officer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "area" TEXT,
ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "Officer" ADD COLUMN     "area" TEXT NOT NULL;
