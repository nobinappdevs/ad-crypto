import { z } from "zod";

/* ─────────────────────────── Login ─────────────────────────── */
export const loginRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/* Real login response: { message: { success: [...] }, data: { token, user } } */
export const loginUserSchema = z.object({
  id: z.number(),
  email: z.string().optional(),
  email_verified: z.number().optional(),
  sms_verified: z.number().optional(),
  kyc_verified: z.number().optional(),
  two_factor_verified: z.number().optional(),
  two_factor_status: z.number().optional(),
});

export const loginResponseSchema = z.object({
  message: z.object({ success: z.array(z.string()).optional() }).optional(),
  data: z.object({
    token: z.string(),
    user: loginUserSchema,
  }),
});

/* ─────────────────────────── Register ─────────────────────────── */
export const registerRequestSchema = z
  .object({
    type: z.enum(["buyer", "seller"]),
    name: z.string().min(2, "Please enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
    policy: z.boolean().refine((v) => v === true, "You must accept the terms"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

/* ─────────────────────────── Forgot password ─────────────────────────── */
export const forgotRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

/* ─────────────────────────── OTP ─────────────────────────── */
export const otpSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
});

/* ─────────────────────────── Reset password ─────────────────────────── */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

/* ─────────────────────────── Types ─────────────────────────── */
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type ForgotRequest = z.infer<typeof forgotRequestSchema>;
export type OtpRequest = z.infer<typeof otpSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
