"use client";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { contactService, type ContactMessagePayload } from "@/services/contact.service";
import { getApiErrorMessage, getApiSuccessMessage } from "@/hooks/useAuth";

/** POST /global/contact/message — public contact form submission. */
export function useSendContactMessage() {
  return useMutation<any, unknown, ContactMessagePayload>({
    mutationFn: (payload) => contactService.sendMessage(payload),
    onSuccess: (res) => toast.success(getApiSuccessMessage(res, "Message sent successfully")),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
