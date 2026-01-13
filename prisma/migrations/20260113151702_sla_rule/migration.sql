-- CreateTable
CREATE TABLE "SlaRule" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "hours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlaRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SlaRule" ADD CONSTRAINT "SlaRule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
