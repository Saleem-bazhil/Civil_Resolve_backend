-- CreateTable
CREATE TABLE "IssueStatusHistory" (
    "id" SERIAL NOT NULL,
    "issueId" INTEGER NOT NULL,
    "oldStatus" "IssueStatus" NOT NULL,
    "newStatus" "IssueStatus" NOT NULL,
    "changedBy" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueStatusHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IssueStatusHistory" ADD CONSTRAINT "IssueStatusHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
