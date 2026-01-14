-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_departmentId_fkey";

-- AlterTable
ALTER TABLE "Issue" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
