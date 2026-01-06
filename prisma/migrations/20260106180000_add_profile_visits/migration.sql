-- CreateTable: Profile visits tracking (LinkedIn-style)
CREATE TABLE IF NOT EXISTS "profile_visits" (
    "id" TEXT NOT NULL,
    "visitedProfileId" TEXT NOT NULL,
    "visitorUserId" TEXT NOT NULL,
    "visitorProfileId" TEXT,
    "visitorProfileType" VARCHAR(50),
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "profile_visits_visitedProfileId_visitedAt_idx" ON "profile_visits"("visitedProfileId", "visitedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "profile_visits_visitorUserId_idx" ON "profile_visits"("visitorUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "profile_visits_visitedAt_idx" ON "profile_visits"("visitedAt");

-- AddForeignKey
ALTER TABLE "profile_visits" ADD CONSTRAINT "profile_visits_visitedProfileId_fkey" FOREIGN KEY ("visitedProfileId") REFERENCES "player_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_visits" ADD CONSTRAINT "profile_visits_visitorUserId_fkey" FOREIGN KEY ("visitorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_visits" ADD CONSTRAINT "profile_visits_visitorProfileId_fkey" FOREIGN KEY ("visitorProfileId") REFERENCES "player_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

