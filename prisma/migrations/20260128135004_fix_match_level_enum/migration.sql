/*
  Warnings:

  - The `matchLevel` column on the `Match` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "matchLevel",
ADD COLUMN     "matchLevel" "MatchLevel" NOT NULL DEFAULT 'SUNDAY_LEAGUE';
