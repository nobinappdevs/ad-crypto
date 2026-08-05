import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { GuestGuard } from "@/components/guards/GuestGuard";

export const metadata = { title: "Forgot Password — Escroc" };

export default function ForgotPasswordPage() {
  return (
    <GuestGuard>
      <ForgotPasswordForm />
    </GuestGuard>
  );
}
