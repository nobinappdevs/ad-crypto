import { GuestGuard } from "@/components/guards/GuestGuard";
import { AuthPanel } from "@/components/auth/AuthPanel";

export const metadata = {
  title: "Sign In — AdCrypto",
};

export default function LoginPage() {
  return (
    <GuestGuard>
      {/* The panel is the whole page — it carries its own background, its own
          theme toggle and both tabs, so no AuthShell around it. */}
      <AuthPanel />
    </GuestGuard>
  );
}
