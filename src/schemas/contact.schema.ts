import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  message: z.string().min(1, "Message is required"),
});

export type ContactRequest = z.infer<typeof contactRequestSchema>;
