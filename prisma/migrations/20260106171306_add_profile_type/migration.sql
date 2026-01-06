-- AlterTable: Add profileType column to player_profiles table
-- This column maps profile_type from players_info table
ALTER TABLE "player_profiles" ADD COLUMN IF NOT EXISTS "profileType" VARCHAR(50);

