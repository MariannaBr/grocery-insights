/*
  Warnings:

  - You are about to drop the column `email` on the `TempSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Insights" DROP CONSTRAINT "Insights_userId_fkey";

-- DropIndex
DROP INDEX "Insights_userId_key";

-- AlterTable
ALTER TABLE "Insights" ADD COLUMN     "tempSessionId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TempSession" DROP COLUMN "email";

-- AddForeignKey
ALTER TABLE "Insights" ADD CONSTRAINT "Insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insights" ADD CONSTRAINT "Insights_tempSessionId_fkey" FOREIGN KEY ("tempSessionId") REFERENCES "TempSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
