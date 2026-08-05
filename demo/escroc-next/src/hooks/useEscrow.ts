"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { escrowService, type EscrowSubmitPayload } from "@/services/escrow.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

/** GET /user/my-escrow/index — escrow list. */
export function useEscrowIndex() {
  return useQuery({
    queryKey: ["escrow", "index"],
    queryFn: () => escrowService.index(),
  });
}

/** GET /user/my-escrow/create — categories, wallets, gateways. */
export function useEscrowCreateInfo() {
  return useQuery({
    queryKey: ["escrow", "create"],
    queryFn: () => escrowService.createInfo(),
  });
}

/** GET /user/my-escrow/user-check — validate a counterparty email on demand. */
export function useUserCheck() {
  return useMutation<{ data: { user_check: boolean } }, unknown, string>({
    mutationFn: (email) => escrowService.userCheck(email),
  });
}

/** POST /user/my-escrow/submit — create escrow. Returns the preview data. */
export function useSubmitEscrow() {
  return useMutation<any, unknown, EscrowSubmitPayload>({
    mutationFn: (payload) => escrowService.submit(payload),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/my-escrow/confirm-escrow — finalize. Component decides what's next. */
export function useConfirmEscrow() {
  const qc = useQueryClient();
  return useMutation<any, unknown, string>({
    mutationFn: (trx) => escrowService.confirmEscrow(trx),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Escrow confirmed"));
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET /user/api-escrow-action/conversation/{id} — escrow chat thread. Polls for near-realtime. */
export function useEscrowConversation(id: string | null) {
  return useQuery({
    queryKey: ["escrow", "conversation", id],
    queryFn: () => escrowService.conversation(id!),
    enabled: !!id,
    refetchInterval: 6000,        // fallback realtime — new messages appear within ~6s
    refetchOnWindowFocus: true,
  });
}

/** POST /user/api-escrow-action/message/send — send an escrow message. */
export function useSendEscrowMessage() {
  const qc = useQueryClient();
  return useMutation<any, unknown, { escrow_id: string | number; message: string; files?: File[] }>({
    mutationFn: (p) => escrowService.sendConversationMessage(p),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["escrow", "conversation", String(vars.escrow_id)] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/api-escrow-action/release-request — seller requests the buyer to release funds. */
export function useReleaseRequest() {
  const qc = useQueryClient();
  return useMutation<any, unknown, string | number>({
    mutationFn: (target) => escrowService.releaseRequest(target),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Release request sent"));
      qc.invalidateQueries({ queryKey: ["escrow"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/api-escrow-action/release-payment — release escrowed funds to the seller. */
export function useReleasePayment() {
  const qc = useQueryClient();
  return useMutation<any, unknown, string | number>({
    mutationFn: (target) => escrowService.releasePayment(target),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Release request submitted"));
      qc.invalidateQueries({ queryKey: ["escrow"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/api-escrow-action/dispute-payment — open a dispute on the escrow. */
export function useDisputePayment() {
  const qc = useQueryClient();
  return useMutation<any, unknown, string | number>({
    mutationFn: (target) => escrowService.disputePayment(target),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Dispute submitted"));
      qc.invalidateQueries({ queryKey: ["escrow"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET /user/api-escrow-action/payment/approval-pending/{id} — escrow + pay options. */
export function useApprovalPending(id: string | null) {
  return useQuery({
    queryKey: ["escrow", "approval", id],
    queryFn: () => escrowService.approvalPending(id!),
    enabled: !!id,
  });
}

/** POST /user/api-escrow-action/escrow/payment/approval-submit/{id} — pick a gateway. */
export function useApprovalSubmit() {
  return useMutation<any, unknown, { id: string; payment_gateway: string; source?: string; success_url?: string; cancel_url?: string }>({
    mutationFn: ({ id, payment_gateway, source, success_url, cancel_url }) =>
      escrowService.approvalSubmit(id, payment_gateway, { source, success_url, cancel_url }),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/api-escrow-action/approval-pending/manual/confirm — action manual proof. */
export function useApprovalManualConfirm() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation<any, unknown, { trx: string; fields: Record<string, any> }>({
    mutationFn: (p) => escrowService.approvalManualConfirm(p),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment submitted for review"));
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /api-escrow-action/authorize-payment-submit — action card payment. */
export function useApprovalAuthorize() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation<any, unknown, { trx: string; card_number: string; date: string; code: string }>({
    mutationFn: (p) => escrowService.approvalAuthorize(p),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment successful"));
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /user/my-escrow/manual/payment/confirmed — submit manual proof, then go back. */
export function useManualPaymentConfirm() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation<any, unknown, { trx: string; fields: Record<string, any> }>({
    mutationFn: (p) => escrowService.manualPaymentConfirm(p),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment submitted for review"));
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** GET the native-crypto payment address for a PAYMENT_WAITING escrow. */
export function useEscrowCryptoAddress(escrowId: string | null, mode: "my" | "action") {
  return useQuery({
    queryKey: ["escrow", "crypto-address", mode, escrowId],
    queryFn: () => escrowService.cryptoAddress(mode, escrowId!),
    enabled: !!escrowId,
  });
}

/** POST {submit_url} — confirm a native-crypto escrow payment (Tatum etc.), then go back. */
export function useEscrowCryptoConfirm() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation<any, unknown, { submitUrl: string; fields: Record<string, any> }>({
    mutationFn: (p) => escrowService.cryptoConfirm(p.submitUrl, p.fields),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment submitted for confirmation"));
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

/** POST /my-escrow/authorize-payment-submit — pay a card escrow, then go back. */
export function useAuthorizePayment() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation<any, unknown, { trx: string; card_number: string; date: string; code: string }>({
    mutationFn: (p) => escrowService.authorizePayment(p),
    onSuccess: (res) => {
      toast.success(getApiSuccessMessage(res, "Payment successful"));
      qc.invalidateQueries({ queryKey: ["escrow", "index"] });
      router.push("/dashboard/escrow");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
