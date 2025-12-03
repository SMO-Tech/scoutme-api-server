import { z } from "zod";
import { playerPostition } from "../utils/constant";

export const createMatchSchema = z.object({
  videoUrl: z.string().url(),
  lineUpImage: z.string().url().optional(),

  matchLevel: z.enum([
    "PROFESSIONAL",
    "SEMI_PROFESSIONAL",
    "ACADEMIC_TOP_TIER",
    "ACADEMIC_AMATEUR",
    "SUNDAY_LEAGUE",
  ]),

  clubs: z.array(
    z.object({
      name: z.string(),
      country: z.string(),
      jerseyColor: z.string().optional(),
      logoUrl: z.string().optional(),
      teamType: z.enum(["yourTeam", "opponentTeam"]),
    })
  ),

  players: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      jerseyNumber: z.number().int().min(1),
      dateOfBirth: z.string().nullable().optional(),
      position: z.enum(playerPostition as [string, ...string[]]),
      country: z.string(),
      teamType: z.enum(["yourTeam", "opponentTeam"]),
    })
  ),
});
