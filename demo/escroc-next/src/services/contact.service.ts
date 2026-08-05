import { publicApi } from "@/lib/axios";

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
  recaptchaToken?: string;
}

export const contactService = {
  /** POST /global/contact/message — public contact form submission. */
  async sendMessage(payload: ContactMessagePayload) {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("email", payload.email);
    form.append("message", payload.message);
    if (payload.recaptchaToken) form.append("g-recaptcha-response", payload.recaptchaToken);
    const res = await publicApi.post("/global/contact/message", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};

export default contactService;
