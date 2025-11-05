/*
  Warnings:

  - You are about to drop the column `firebaseUID` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[UID]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `UID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MatchRequest" DROP CONSTRAINT "MatchRequest_userId_fkey";

-- DropIndex
DROP INDEX "User_firebaseUID_key";

-- AlterTable
ALTER TABLE "MatchRequest" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firebaseUID",
ADD COLUMN     "UID" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_UID_key" ON "User"("UID");

-- AddForeignKey
ALTER TABLE "MatchRequest" ADD CONSTRAINT "MatchRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("UID") ON DELETE RESTRICT ON UPDATE CASCADE;
