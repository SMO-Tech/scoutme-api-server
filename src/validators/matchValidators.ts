import { z } from "zod";

// 1. Define the Match Levels
export const MatchLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "PROFESSIONAL",
  "ACADEMY",
  "SUNDAY_LEAGUE"
]);

export type MatchLevel = z.infer<typeof MatchLevelEnum>;

// 2. The Main Validation Schema
// FIX: Remove the outer `body: z.object(...)` wrapper!
export const createMatchSchema = z.object({
  // Direct properties matching req.body
  videoUrl: z
    .string({ message: "Video URL is required" })
    .url("Please provide a valid URL (e.g., YouTube Link)"),

  homeTeam: z
    .string({ message: "Home Team Name is required" })
    .min(2, "Home Team name must be at least 2 characters")
    .trim(),

  awayTeam: z
    .string({ message: "Away Team Name is required" })
    .min(2, "Away Team name must be at least 2 characters")
    .trim(),

  matchLevel: MatchLevelEnum,

  focusHint: z.string().nullish(),
});

// 3. Export the Type
// FIX: No longer need ["body"] access since we removed the wrapper
export type CreateMatchInput = z.infer<typeof createMatchSchema>;