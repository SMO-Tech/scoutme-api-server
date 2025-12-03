/*
  Warnings:

  - Added the required column `matchClubId` to the `match_players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "match_players" ADD COLUMN     "matchClubId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchClubId_fkey" FOREIGN KEY ("matchClubId") REFERENCES "match_clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
