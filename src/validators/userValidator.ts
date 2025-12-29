import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  UID: z.string().min(1, "FirebaseUID is required!"),
});
