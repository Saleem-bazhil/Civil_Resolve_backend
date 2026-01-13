/*
  Warnings:

  - Added the required column `address` to the `Issue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "landmark" TEXT;
