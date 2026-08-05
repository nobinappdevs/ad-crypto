import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AuthGuard } from "@/components/guards/AuthGuard";

export const metadata = {
  title: "Dashboard — Escroc",
  description: "Manage your escrow transactions, wallet, and transfers.",
};

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
