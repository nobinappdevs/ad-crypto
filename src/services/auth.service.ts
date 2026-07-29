import { publicApi } from "@/lib/axios";
import type { LoginRequest } from "@/schemas/auth.schema";

export const authService = {
  /** POST /user/login - public. Backend not connected yet; endpoint is a placeholder. */
  async login(payload: LoginRequest) {
    const res = await publicApi.post("/user/login", payload);
    return res.data;
  },
};

export default authService;
