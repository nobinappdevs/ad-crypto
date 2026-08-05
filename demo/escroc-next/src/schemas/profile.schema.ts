import { z } from "zod";

/* ─────────────────────────── Profile update ───────────────────────────
 * POST /user/profile/update (form-data). Field names mirror the Laravel API.
 */
export const updateProfileRequestSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  country: z.string().optional(),
  phone_code: z.string().optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
  address: z.string().optional(),
  // Optional avatar upload. Kept outside Zod validation (it's a File) and
  // appended to the form-data separately in the service.
  image: z.instanceof(File).optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

/* ─────────────────────────── Password update ───────────────────────────
 * POST /user/profile/password/update (form-data).
 */
export const updatePasswordRequestSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

export type UpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;
