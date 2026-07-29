import { GuestGuard } from "@/components/guards/GuestGuard";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata = {
  title: "Sign In — AdCrypto",
};

export default function LoginPage() {
  return (
    <GuestGuard>
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </GuestGuard>
  );
}
