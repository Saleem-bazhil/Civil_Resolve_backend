-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "escalationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slaBreached" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Issue_slaDeadline_idx" ON "Issue"("slaDeadline");
