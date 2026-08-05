import { RegisterForm } from "@/components/auth/RegisterForm";
import { GuestGuard } from "@/components/guards/GuestGuard";

export const metadata = { title: "Create Account — Escroc" };

export default function RegisterPage() {
  return (
    <GuestGuard>
      <RegisterForm />
    </GuestGuard>
  );
}
