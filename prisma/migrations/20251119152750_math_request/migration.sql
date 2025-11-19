/*
  Warnings:

  - You are about to drop the column `analysisResutl` on the `MatchRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MatchRequest" DROP COLUMN "analysisResutl";

-- CreateTable
CREATE TABLE "MatchAnalysis" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "result" JSONB NOT NULL,

    CONSTRAINT "MatchAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchAnalysis_matchId_key" ON "MatchAnalysis"("matchId");

-- AddForeignKey
ALTER TABLE "MatchAnalysis" ADD CONSTRAINT "MatchAnalysis_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
