/*
  Warnings:

  - You are about to drop the column `cratedAt` on the `MatchRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MatchRequest" DROP COLUMN "cratedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("UID");

-- DropIndex
DROP INDEX "User_UID_key";
