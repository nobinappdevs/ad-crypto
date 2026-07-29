"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { TOKEN_KEY } from "@/lib/axios";
import type { LoginRequest } from "@/schemas/auth.schema";

/** Pull a human message out of any error shape (string | {success:[]} | errors{}). */
export function getApiErrorMessage(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (err as any)?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data.message === "string") return data.message;
  if (data.message?.error?.[0]) return data.message.error[0];
  if (data.errors) {
    const firstField = Object.keys(data.errors)[0];
    if (firstField) return data.errors[firstField]?.[0] ?? "Validation failed";
  }
  return "Something went wrong. Please try again.";
}

/** message.success[0] with a fallback. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getApiSuccessMessage(res: any, fallback: string): string {
  return res?.message?.success?.[0] ?? fallback;
}

/** Tokens land in different places per endpoint: data.user.token ?? data.token ?? token */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractToken(res: any): string | undefined {
  return res?.data?.user?.token ?? res?.data?.token ?? res?.token;
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (res) => {
      const token = extractToken(res);
      if (token && typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      toast.success(getApiSuccessMessage(res, "Login successful"));
      router.push("/dashboard");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
