/*
  Warnings:

  - You are about to drop the column `level` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Match` table. All the data in the column will be lost.
  - Added the required column `matchLevel` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Made the column `homeTeam` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `awayTeam` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Match_level_gender_location_idx";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "level",
DROP COLUMN "progress",
DROP COLUMN "thumbnailUrl",
ADD COLUMN     "focusHint" TEXT,
ADD COLUMN     "matchLevel" TEXT NOT NULL,
ALTER COLUMN "homeTeam" SET NOT NULL,
ALTER COLUMN "awayTeam" SET NOT NULL;
