"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/hooks/useAuth";

/**
 * The API's refusal when an unverified account tries to transact: "Please verify
 * your KYC information before any transactional action".
 *
 * Matched on the words rather than a status code — every gate on these endpoints
 * answers 400, so nothing but the message distinguishes this one. Loose on purpose,
 * so a reworded refusal still routes.
 */
const KYC_REQUIRED = [/kyc/i, /verif/i];

export function isKycRequiredMessage(message: string): boolean {
  return KYC_REQUIRED.every((pattern) => pattern.test(message));
}

/**
 * The error handler every buy / sell / exchange / withdraw mutation uses.
 *
 * Toasts the server's own message, and for the KYC refusal also moves the user to
 * the page that can clear it — the toast alone left them on a form that could not
 * succeed, with no hint of where to go.
 *
 * `push`, not `replace`: the order they were part-way through is still behind them,
 * and Back should return to it once the form is submitted.
 */
export function useTransactionError() {
  const router = useRouter();

  return (err: unknown) => {
    const message = getApiErrorMessage(err);
    toast.error(message);
    if (isKycRequiredMessage(message)) router.push("/dashboard/kyc");
  };
}
