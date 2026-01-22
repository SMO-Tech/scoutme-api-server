// schemas/createMatchSchema.ts
import { z } from "zod";

export const createMatchSchema = z.object({
  videoUrl: z.string().url("Please provide a valid YouTube URL"),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;