import { LoginForm } from "@/components/forms/LoginForm";
import { GuestGuard } from "@/components/guards/GuestGuard";

export const metadata = { title: "Sign In — Escroc" };

export default function LoginPage() {
  return (
    <GuestGuard>
      <LoginForm />
    </GuestGuard>
  );
}
