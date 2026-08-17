import { z } from "zod";

/**
 * Field names here are the API's, not prettier local ones (`first_name`, not
 * `firstName`; `credentials`, not `email`; `code`, not `otp`). The forms bind
 * straight to these objects and the services post them untouched, so a rename
 * would only add a mapping layer for every field to get lost in.
 */

/* -------------------------------------------------------------------------- */
/* Register — POST /register                                                   */
/* -------------------------------------------------------------------------- */

export const registerRequestSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Sent as the literal "on" the backend's `accepted` rule expects; a checkbox
  // is the only honest control for it, hence boolean here.
  policy: z.boolean().refine((v) => v === true, "Please accept the terms to continue"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Login — POST /login                                                         */
/* -------------------------------------------------------------------------- */

export const loginRequestSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Verification code — POST /user/verify/code, /password/forgot/verify/code    */
/* -------------------------------------------------------------------------- */

export const verifyCodeRequestSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});

export type VerifyCodeRequest = z.infer<typeof verifyCodeRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Forgot password — POST /password/forgot/find/user                           */
/* -------------------------------------------------------------------------- */

/** `credentials` takes an email or a username; the form asks for an email. */
export const forgotPasswordRequestSchema = z.object({
  credentials: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

/* -------------------------------------------------------------------------- */
/* Reset password — POST /password/forgot/reset                                */
/* -------------------------------------------------------------------------- */

export const resetPasswordRequestSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    password_confirmation: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
