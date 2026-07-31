import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const verifyOtpRequestSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "Enter the 6-digit code"),
});

export type VerifyOtpRequest = z.infer<typeof verifyOtpRequestSchema>;

export const resetPasswordRequestSchema = z
  .object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
