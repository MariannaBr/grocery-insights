/*
  Warnings:

  - Changed the type of `items` on the `Receipt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_userId_fkey";

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "tempSessionId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "items",
ADD COLUMN     "items" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "TempSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,

    CONSTRAINT "TempSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_tempSessionId_fkey" FOREIGN KEY ("tempSessionId") REFERENCES "TempSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update null items to empty array
UPDATE "Receipt" SET "items" = '[]'::jsonb WHERE "items" IS NULL;

-- Modify items column
ALTER TABLE "Receipt" ALTER COLUMN "items" TYPE JSONB USING items::jsonb;
