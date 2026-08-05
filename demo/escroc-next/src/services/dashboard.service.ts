import { privateApi } from "@/lib/axios";

export const dashboardService = {
  /** GET /user/dashboard — escrow stats, user, wallets + recent transactions. */
  async getDashboard() {
    const res = await privateApi.get("/user/dashboard");
    return res.data;
  },
};

export default dashboardService;
